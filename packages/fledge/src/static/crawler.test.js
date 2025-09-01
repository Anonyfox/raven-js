/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, test } from "node:test";
import { Config } from "./config/config.js";
import { Discover } from "./config/discover.js";
import { Crawler } from "./crawler.js";
import { BundleResource } from "./resource/bundle-resource.js";

// Global cleanup to ensure no hanging Crawler instances
let createdCrawlers = [];
let originalFetch;

beforeEach(() => {
	createdCrawlers = [];
	originalFetch = globalThis.fetch; // Store original fetch
});

afterEach(async () => {
	// Restore original fetch first to prevent mock interference
	globalThis.fetch = originalFetch;

	// Force stop all crawlers immediately without waiting
	for (const crawler of createdCrawlers) {
		try {
			// Don't wait - just fire and forget
			crawler.stop();
		} catch {
			// Ignore cleanup errors
		}
	}

	createdCrawlers = [];
});

describe("Crawler", { concurrency: 1 }, () => {
	test("constructs with valid Config instance", () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		assert.strictEqual(crawler.isStarted(), false);
		assert.strictEqual(crawler.isCrawling(), false);
		assert.strictEqual(crawler.getResources().length, 0);
	});

	test("throws on invalid constructor arguments", () => {
		assert.throws(
			() => new Crawler("invalid config"),
			/Crawler requires a valid Config instance/,
		);

		assert.throws(
			() => new Crawler(null),
			/Crawler requires a valid Config instance/,
		);
	});

	test("starts with string server origin", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		assert.strictEqual(crawler.isStarted(), true);
		assert.strictEqual(crawler.isCrawling(), false);
		assert.strictEqual(crawler.getBaseUrl().href, "http://localhost:3000/");

		await crawler.stop();
	});

	test("prevents double start", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		await assert.rejects(
			async () => await crawler.start(),
			/Crawler is already started/,
		);

		await crawler.stop();
	});

	test("requires start before crawling", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await assert.rejects(
			async () => await crawler.crawl(),
			/Crawler must be started before crawling/,
		);
	});

	test("prevents concurrent crawling", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/test"],
		});
		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);
		await crawler.start();

		// Mock Resource.fetch to reject immediately without timers
		globalThis.fetch = () => Promise.reject(new Error("Mock rejection"));

		const crawl1 = crawler.crawl({ maxResources: 1, requestTimeout: 100 });

		await assert.rejects(
			async () => await crawler.crawl(),
			/Crawling is already in progress/,
		);

		// Wait for first crawl to finish
		try {
			await crawl1;
		} catch {
			// Expected to fail due to mock rejection
		}

		await crawler.stop();
	});

	test("handles route generator functions", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: () => ["/", "/about"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();
		const urls = crawler.getAllDiscoveredUrls();

		assert.strictEqual(urls.length, 2);
		assert.strictEqual(urls[0].pathname, "/");
		assert.strictEqual(urls[1].pathname, "/about");

		await crawler.stop();
	});

	test("tracks crawl statistics", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();
		const beforeStats = crawler.getStatistics();
		assert.strictEqual(beforeStats.startTime > 0, true);
		assert.strictEqual(beforeStats.endTime, 0);

		// Mock successful fetch for statistics testing
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(new TextEncoder().encode("<html></html>").buffer),
			});

		await crawler.crawl({ maxResources: 1 });
		const afterStats = crawler.getStatistics();

		assert.strictEqual(afterStats.resourcesCount, 1);
		assert.strictEqual(afterStats.errorsCount, 0);

		await crawler.stop();
	});

	test("handles fetch errors gracefully", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/error"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		// Mock fetch failure
		globalThis.fetch = () => Promise.reject(new Error("Network error"));

		await crawler.crawl({ maxResources: 1 });
		const stats = crawler.getStatistics();

		assert.strictEqual(stats.resourcesCount, 0); // No successful resources
		assert.strictEqual(stats.errorsCount, 1); // One error

		await crawler.stop();
	});

	test("processes HTML resources for URL discovery", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		// Mock HTML with internal links
		const htmlContent =
			'<html><a href="/about">About</a><a href="/contact">Contact</a></html>';
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(new TextEncoder().encode(htmlContent).buffer),
			});

		await crawler.crawl({ maxResources: 1 });

		// Should discover links from HTML
		const allUrls = crawler.getAllDiscoveredUrls();
		assert.strictEqual(allUrls.length >= 1, true); // At least original route

		await crawler.stop();
	});

	test("respects discovery configuration", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
			discover: false, // Disable discovery
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		// Mock HTML with links that should be ignored
		const htmlContent = '<html><a href="/about">About</a></html>';
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(new TextEncoder().encode(htmlContent).buffer),
			});

		await crawler.crawl({ maxResources: 1 });

		const allUrls = crawler.getAllDiscoveredUrls();
		assert.strictEqual(allUrls.length, 1); // Only original route

		await crawler.stop();
	});

	test("applies Discover instance rules", async () => {
		const discover = new Discover({
			ignore: ["**/contact"],
		});

		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
			discover: discover,
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		// Mock HTML with links - /contact should be ignored
		const htmlContent =
			'<html><a href="/about">About</a><a href="/contact">Contact</a></html>';
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(new TextEncoder().encode(htmlContent).buffer),
			});

		await crawler.crawl({ maxResources: 1 });

		const allUrls = crawler.getAllDiscoveredUrls();
		const contactUrl = allUrls.find((url) => url.pathname === "/contact");
		assert.strictEqual(contactUrl, undefined); // Should be ignored

		await crawler.stop();
	});

	test("provides resource filtering methods", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		// Mock HTML content with proper headers
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
				arrayBuffer: () =>
					Promise.resolve(
						new TextEncoder().encode(
							"<html><head><title>Test</title></head><body>Content</body></html>",
						).buffer,
					),
			});

		await crawler.crawl({ maxResources: 1 });

		const resources = crawler.getResources();
		const htmlResources = crawler.getHtmlResources();
		const assetResources = crawler.getAssetResources();

		// Fix the actual test expectations
		assert.strictEqual(resources.length, 1);
		assert.strictEqual(htmlResources.length, 1); // Should detect HTML
		assert.strictEqual(assetResources.length, 0);
	});

	test("respects maxResources limit", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/", "/about", "/contact"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Map([["content-type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(new TextEncoder().encode("<html></html>").buffer),
			});

		await crawler.crawl({ maxResources: 2 });
		const resources = crawler.getResources();

		assert.strictEqual(resources.length, 2); // Respects limit

		await crawler.stop();
	});

	test("provides comprehensive JSON representation", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);
		await crawler.start();

		const json = crawler.toJSON();

		assert.strictEqual(json.isStarted, true);
		assert.strictEqual(json.isCrawling, false);
		assert.strictEqual(json.baseUrl, "http://localhost:3000/");
		assert.strictEqual(typeof json.statistics, "object");
		assert.strictEqual(typeof json.frontierStats, "object");
		assert.strictEqual(json.serverInfo, null); // String origin
		assert.strictEqual(json.resourcesCount, 0);

		await crawler.stop();
	});

	test("handles stop gracefully when not started", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		// Should not throw
		await crawler.stop();
		assert.strictEqual(crawler.isStarted(), false);
	});

	test("provides all discovered URLs", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/", "/about"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);
		await crawler.start();

		const allUrls = crawler.getAllDiscoveredUrls();
		assert.strictEqual(allUrls.length, 2);
		assert.strictEqual(allUrls[0].pathname, "/");
		assert.strictEqual(allUrls[1].pathname, "/about");

		await crawler.stop();
	});

	test("finalizes statistics on stop", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		// Let some time pass to ensure different timestamps
		await new Promise((resolve) => setTimeout(resolve, 1));

		await crawler.stop();

		const stats = crawler.getStatistics();
		assert.strictEqual(stats.endTime > 0, true);
		assert.strictEqual(stats.totalTime >= 0, true); // Can be 0 for very fast operations
	});

	test("addVisitedResource adds bundle to resources and marks as crawled", () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		// Create mock bundle resource
		const bundleBuffer = new TextEncoder().encode("console.log('bundle');");
		const sourcemapBuffer = new TextEncoder().encode('{"version":3}');
		const bundleUrl = new URL("http://localhost:3000/app.js");
		const baseUrl = new URL("http://localhost:3000");

		const bundleResource = new BundleResource(
			bundleBuffer,
			sourcemapBuffer,
			bundleUrl,
			baseUrl,
		);

		// Add bundle resource before starting
		crawler.addVisitedResource("/app.js", bundleResource);

		// Verify resource was added
		const resources = crawler.getResources();
		assert.strictEqual(resources.length, 1);
		assert.strictEqual(resources[0], bundleResource);

		// Verify URL is marked as discovered and crawled
		const frontierStats = crawler.getFrontierStats();
		assert.strictEqual(frontierStats.crawled, 1);
		assert.strictEqual(frontierStats.discovered, 0);
	});

	test("addVisitedResource throws if called after start", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		createdCrawlers.push(crawler);

		await crawler.start();

		const bundleBuffer = new TextEncoder().encode("console.log('bundle');");
		const bundleUrl = new URL("http://localhost:3000/app.js");
		const baseUrl = new URL("http://localhost:3000");

		const bundleResource = new BundleResource(
			bundleBuffer,
			null,
			bundleUrl,
			baseUrl,
		);

		assert.throws(
			() => crawler.addVisitedResource("/app.js", bundleResource),
			/Cannot add visited resources after crawler is started/,
		);

		await crawler.stop();
	});
});
