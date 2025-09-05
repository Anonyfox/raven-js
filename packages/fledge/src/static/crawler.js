/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Static site crawler with server orchestration.
 *
 * Orchestrates Config, Server, Frontier, and Resource components to perform
 * comprehensive website crawling with URL discovery and content extraction.
 */

import { Config } from "./config/config.js";
import { Discover } from "./config/discover.js";
import { Frontier } from "./frontier.js";
import { Resource } from "./resource/resource.js";
import { Server } from "./server.js";

/**
 * Website crawler with integrated server management and URL discovery
 */
export class Crawler {
	/** @type {Config} Validated configuration */
	#config;

	/** @type {Server | null} Server instance for function-based configs */
	#server = null;

	/** @type {Frontier} URL state management */
	#frontier;

	/** @type {Resource[]} Successfully crawled resources */
	#resources = [];

	/** @type {URL | null} Base URL for crawling scope */
	#baseUrl = null;

	/** @type {boolean} Track crawler state */
	#isStarted = false;

	/** @type {boolean} Track crawling state */
	#isCrawling = false;

	/** @type {{startTime: number, endTime: number, totalTime: number, resourcesCount: number, errorsCount: number}} Crawl statistics */
	#statistics = {
		startTime: 0,
		endTime: 0,
		totalTime: 0,
		resourcesCount: 0,
		errorsCount: 0,
	};

	/**
	 * Create crawler instance
	 * @param {Config} config - Validated configuration instance
	 * @throws {Error} If config is invalid or missing
	 */
	constructor(config) {
		if (!(config instanceof Config)) {
			throw new Error("Crawler requires a valid Config instance");
		}

		this.#config = config;

		// Initialize frontier without base URL (set during start)
		this.#frontier = new Frontier();

		// Create server if config uses function-based server (not resolver)
		const resolver = this.#config.getResolver();
		if (!resolver) {
			const serverConfig = this.#config.getServer();
			if (typeof serverConfig === "function") {
				this.#server = new Server(serverConfig);
			}
		}
	}

	/**
	 * Start crawler - boot server if needed and seed frontier
	 * @param {object} [options] - Start options
	 * @param {number} [options.serverTimeout=30000] - Server boot timeout
	 * @returns {Promise<void>} Resolves when crawler is ready
	 * @throws {Error} If server boot fails or initialization fails
	 */
	async start(options = {}) {
		if (this.#isStarted) {
			throw new Error("Crawler is already started");
		}

		const { serverTimeout = 30000 } = options;

		try {
			// Set up base URL based on configuration type
			const resolver = this.#config.getResolver();
			if (resolver) {
				// For resolver mode, use a dummy base URL (not used for actual requests)
				this.#baseUrl = new URL("http://localhost:0");
			} else if (this.#server) {
				// Boot function-based server
				await this.#server.boot({ timeout: serverTimeout });
				this.#baseUrl = new URL(
					/** @type {string} */ (this.#server.getOrigin()),
				);
			} else {
				// Use string origin directly
				this.#baseUrl = new URL(
					/** @type {string} */ (this.#config.getServer()),
				);
			}

			// Initialize frontier with base URL
			this.#frontier = new Frontier(this.#baseUrl);

			// Seed frontier with initial routes
			const routes = this.#config.getRoutes();
			if (Array.isArray(routes)) {
				for (const route of routes) {
					this.#frontier.discover(route);
				}
			} else if (typeof routes === "function") {
				// Handle route generator function
				const generatedRoutes = await routes();
				for (const route of generatedRoutes) {
					this.#frontier.discover(route);
				}
			}

			this.#isStarted = true;
			this.#statistics.startTime = Date.now();
		} catch (error) {
			const err = /** @type {any} */ (error);
			// Clean up on failure
			if (this.#server) {
				await this.#server.kill();
			}
			throw new Error(`Failed to start crawler: ${err.message}`);
		}
	}

	/**
	 * Perform crawling of all discovered URLs
	 * @param {object} [options] - Crawl options
	 * @param {number} [options.maxResources=1000] - Maximum resources to crawl
	 * @param {number} [options.requestTimeout=10000] - Timeout per request
	 * @returns {Promise<void>} Resolves when crawling is complete
	 * @throws {Error} If crawler not started or crawling fails
	 */
	async crawl(options = {}) {
		if (!this.#isStarted) {
			throw new Error("Crawler must be started before crawling");
		}

		if (this.#isCrawling) {
			throw new Error("Crawling is already in progress");
		}

		const { maxResources = 1000, requestTimeout = 10000 } = options;
		this.#isCrawling = true;

		try {
			while (
				this.#frontier.hasPending() &&
				this.#resources.length < maxResources
			) {
				const url = this.#frontier.getNextPending();
				if (!url) break; // Safety check

				try {
					// Get resource via resolver or HTTP fetch
					const resolver = this.#config.getResolver();
					const resource = resolver
						? await Resource.fromResolver(
								url,
								/** @type {string | URL} */ (this.#baseUrl),
								resolver,
							)
						: await Resource.fetch(
								url,
								/** @type {string | URL} */ (this.#baseUrl),
								{
									timeout: requestTimeout,
								},
							);

					// Mark as successfully crawled
					this.#frontier.markCrawled(url);
					this.#resources.push(resource);
					this.#statistics.resourcesCount++;

					// Process HTML resources for URL discovery
					if (resource.isHtml()) {
						await this.#processHtmlResource(resource);
					}
				} catch (error) {
					// Mark as failed but continue crawling - only if URL is still pending
					if (this.#frontier.isPending(url)) {
						this.#frontier.markFailed(url);
					}
					this.#statistics.errorsCount++;

					const err = /** @type {any} */ (error);
					// Log error but don't throw - continue with other URLs
					console.warn(`Failed to crawl ${url.href}: ${err.message}`);
				}

				// Check if server is still alive (for function-based servers)
				if (this.#server && !(await this.#server.isAlive())) {
					throw new Error("Server died during crawling");
				}
			}

			this.#statistics.endTime = Date.now();
			this.#statistics.totalTime =
				this.#statistics.endTime - this.#statistics.startTime;
		} finally {
			this.#isCrawling = false;
		}
	}

	/**
	 * Process HTML resource for URL discovery
	 * @param {Resource} resource - HTML resource to process
	 * @returns {Promise<void>} Resolves when processing is complete
	 */
	async #processHtmlResource(resource) {
		const discover = this.#config.getDiscover();

		// Skip discovery if disabled
		if (discover === false) {
			return;
		}

		// Get bundle paths to exclude from discovery
		const bundlePaths = new Set(Object.keys(this.#config.getBundles()));

		// Get relative (same-origin) URLs only
		const relativeUrls = resource.getRelativeUrls();

		for (const url of relativeUrls) {
			// Skip bundle paths - they're pre-built, never discovered
			if (bundlePaths.has(url.pathname)) {
				continue;
			}

			// Apply discovery rules if Discover instance is configured
			if (discover instanceof Discover) {
				if (discover.shouldIgnore(url.pathname)) {
					continue; // Skip this URL based on discovery rules
				}
			}

			// Add to frontier if not already known
			if (
				!this.#frontier.isPending(url) &&
				!this.#frontier.isCrawled(url) &&
				!this.#frontier.isFailed(url)
			) {
				this.#frontier.discover(url);
			}
		}
	}

	/**
	 * Stop crawler and cleanup resources
	 * @returns {Promise<void>} Resolves when cleanup is complete
	 */
	async stop() {
		if (!this.#isStarted) {
			return; // Already stopped or never started
		}

		try {
			// Kill server if running
			if (this.#server) {
				await this.#server.kill();
			}
		} finally {
			this.#isStarted = false;
			this.#isCrawling = false;

			// Finalize statistics if not already done
			if (this.#statistics.endTime === 0) {
				this.#statistics.endTime = Date.now();
				this.#statistics.totalTime =
					this.#statistics.endTime - this.#statistics.startTime;
			}
		}
	}

	/**
	 * Get all successfully crawled resources
	 * @returns {Resource[]} Array of crawled resources
	 */
	getResources() {
		return [...this.#resources];
	}

	/**
	 * Get crawl frontier statistics
	 * @returns {object} Frontier statistics
	 */
	getFrontierStats() {
		return this.#frontier.getStats();
	}

	/**
	 * Get server information
	 * @returns {object | null} Server info or null if no server
	 */
	getServerInfo() {
		if (!this.#server) {
			return null;
		}

		return {
			isBooted: this.#server.isBooted(),
			origin: this.#server.getOrigin(),
			port: this.#server.getPort(),
			pid: this.#server.getPid(),
		};
	}

	/**
	 * Get crawl statistics
	 * @returns {object} Crawl statistics
	 */
	getStatistics() {
		return { ...this.#statistics };
	}

	/**
	 * Get base URL used for crawling
	 * @returns {URL | null} Base URL or null if not started
	 */
	getBaseUrl() {
		return this.#baseUrl;
	}

	/**
	 * Check if crawler is started
	 * @returns {boolean} True if started
	 */
	isStarted() {
		return this.#isStarted;
	}

	/**
	 * Check if crawler is currently crawling
	 * @returns {boolean} True if crawling in progress
	 */
	isCrawling() {
		return this.#isCrawling;
	}

	/**
	 * Get HTML resources only
	 * @returns {Resource[]} Array of HTML resources
	 */
	getHtmlResources() {
		return this.#resources.filter((resource) => resource.isHtml());
	}

	/**
	 * Get asset resources only
	 * @returns {Resource[]} Array of asset resources
	 */
	getAssetResources() {
		return this.#resources.filter((resource) => resource.isAsset());
	}

	/**
	 * Get all discovered URLs (crawled + pending + failed)
	 * @returns {URL[]} Array of all discovered URLs
	 */
	getAllDiscoveredUrls() {
		return this.#frontier.getAllUrls();
	}

	/**
	 * Add pre-built resource as visited (for bundles and other pre-generated content)
	 * @param {string} urlPath - URL path to mark as visited
	 * @param {Resource} resource - Pre-built resource instance
	 * @throws {Error} If crawler is already started or resource is invalid
	 */
	addVisitedResource(urlPath, resource) {
		if (this.#isStarted) {
			throw new Error("Cannot add visited resources after crawler is started");
		}

		// Create URL from path for frontier tracking - use same base URL logic as start()
		const resolver = this.#config.getResolver();
		const baseUrl = resolver
			? new URL("http://localhost:0") // Match the dummy URL used in start()
			: (() => {
					const serverConfig = this.#config.getServer();
					return new URL(
						typeof serverConfig === "string"
							? serverConfig
							: "http://localhost:3000",
					);
				})();
		const url = new URL(urlPath, baseUrl);

		// Add to frontier as discovered then mark as crawled
		this.#frontier.discover(url);
		this.#frontier.markCrawled(url);

		// Add to resources collection
		this.#resources.push(resource);
	}

	/**
	 * Convert crawler state to JSON representation
	 * @returns {object} JSON representation
	 */
	toJSON() {
		return {
			isStarted: this.#isStarted,
			isCrawling: this.#isCrawling,
			baseUrl: this.#baseUrl?.href ?? null,
			statistics: this.getStatistics(),
			frontierStats: this.getFrontierStats(),
			serverInfo: this.getServerInfo(),
			resourcesCount: this.#resources.length,
		};
	}
}
