/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { Config } from "./config/config.js";
import { Discover } from "./config/discover.js";
import { Crawler } from "./crawler.js";

describe("Crawler", () => {
	test("constructs with valid Config instance", () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);

		assert.strictEqual(crawler.isStarted(), false);
		assert.strictEqual(crawler.isCrawling(), false);
		assert.strictEqual(crawler.getBaseUrl(), null);
		assert.deepStrictEqual(crawler.getResources(), []);
	});

	test("throws on invalid constructor arguments", () => {
		assert.throws(
			() => new Crawler(null),
			/Crawler requires a valid Config instance/,
		);
		assert.throws(
			() => new Crawler({}),
			/Crawler requires a valid Config instance/,
		);
		assert.throws(
			() => new Crawler("not a config"),
			/Crawler requires a valid Config instance/,
		);
	});

	test("starts with string server origin", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/", "/about"],
		});

		const crawler = new Crawler(config);

		await crawler.start();

		assert.strictEqual(crawler.isStarted(), true);
		assert.strictEqual(crawler.getBaseUrl()?.href, "http://localhost:3000/");
		assert.strictEqual(crawler.getServerInfo(), null); // No server instance for string origins

		// Should have seeded frontier with routes
		const frontierStats = crawler.getFrontierStats();
		assert.strictEqual(frontierStats.discovered, 2); // "/" and "/about"
		assert.strictEqual(frontierStats.total, 2);

		await crawler.stop();
		assert.strictEqual(crawler.isStarted(), false);
	});

	test("prevents double start", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);

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
		await crawler.start();

		// Mock Resource.fetch to reject immediately without timers
		const originalFetch = globalThis.fetch;
		globalThis.fetch = () => Promise.reject(new Error("Mock rejection"));

		const crawl1 = crawler.crawl({ maxResources: 1 });

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

		globalThis.fetch = originalFetch;
		await crawler.stop();
	});

	test("handles route generator functions", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: async () => ["/generated", "/dynamic"],
		});

		const crawler = new Crawler(config);
		await crawler.start();

		const frontierStats = crawler.getFrontierStats();
		assert.strictEqual(frontierStats.discovered, 2);
		assert.strictEqual(frontierStats.total, 2);

		await crawler.stop();
	});

	test("tracks crawl statistics", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		await crawler.start();

		const statsBeforeCrawl = crawler.getStatistics();
		assert.strictEqual(statsBeforeCrawl.resourcesCount, 0);
		assert.strictEqual(statsBeforeCrawl.errorsCount, 0);
		assert.strictEqual(typeof statsBeforeCrawl.startTime, "number");

		// Mock successful fetch
		const originalFetch = globalThis.fetch;
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: new Map([["Content-Type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(
						new TextEncoder().encode("<html><body>Test</body></html>").buffer,
					),
			});

		await crawler.crawl({ maxResources: 1 });

		const statsAfterCrawl = crawler.getStatistics();
		assert.strictEqual(statsAfterCrawl.resourcesCount, 1);
		assert.strictEqual(statsAfterCrawl.errorsCount, 0);
		assert.strictEqual(typeof statsAfterCrawl.totalTime, "number");
		assert.strictEqual(statsAfterCrawl.totalTime > 0, true);

		globalThis.fetch = originalFetch;
		await crawler.stop();
	});

	test("handles fetch errors gracefully", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/error"],
		});

		const crawler = new Crawler(config);
		await crawler.start();

		// Mock fetch failure
		const originalFetch = globalThis.fetch;
		globalThis.fetch = () => Promise.reject(new Error("Network error"));

		// Should not throw - errors are tracked but don't stop crawling
		await crawler.crawl({ maxResources: 1 });

		const stats = crawler.getStatistics();
		assert.strictEqual(stats.resourcesCount, 0);
		assert.strictEqual(stats.errorsCount, 1);

		const frontierStats = crawler.getFrontierStats();
		assert.strictEqual(frontierStats.failed, 1);

		globalThis.fetch = originalFetch;
		await crawler.stop();
	});

	test("processes HTML resources for URL discovery", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
		await crawler.start();

		// Mock HTML response with links
		const originalFetch = globalThis.fetch;
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: new Map([["Content-Type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(
						new TextEncoder().encode(
							'<html><body><a href="/page1">Page 1</a><a href="/page2">Page 2</a></body></html>',
						).buffer,
					),
			});

		await crawler.crawl({ maxResources: 1 });

		// Should have discovered new URLs
		const frontierStats = crawler.getFrontierStats();
		assert.strictEqual(frontierStats.discovered, 2); // /page1 and /page2 should be discovered
		assert.strictEqual(frontierStats.crawled, 1); // Original "/" was crawled

		const resources = crawler.getResources();
		assert.strictEqual(resources.length, 1);
		assert.strictEqual(resources[0].isHtml(), true);

		globalThis.fetch = originalFetch;
		await crawler.stop();
	});

	test("respects discovery configuration", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
			discover: false, // Disable discovery
		});

		const crawler = new Crawler(config);
		await crawler.start();

		// Mock HTML response with links
		const originalFetch = globalThis.fetch;
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: new Map([["Content-Type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(
						new TextEncoder().encode(
							'<html><body><a href="/page1">Page 1</a></body></html>',
						).buffer,
					),
			});

		await crawler.crawl({ maxResources: 1 });

		// Should NOT have discovered new URLs due to disabled discovery
		const frontierStats = crawler.getFrontierStats();
		assert.strictEqual(frontierStats.discovered, 0); // No new URLs discovered
		assert.strictEqual(frontierStats.crawled, 1); // Original "/" was crawled

		globalThis.fetch = originalFetch;
		await crawler.stop();
	});

	test("applies Discover instance rules", async () => {
		const discover = new Discover({
			ignore: ["*.pdf", "/admin/*"],
		});

		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
			discover,
		});

		const crawler = new Crawler(config);
		await crawler.start();

		// Mock HTML response with mixed links
		const originalFetch = globalThis.fetch;
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: new Map([["Content-Type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(
						new TextEncoder().encode(
							"<html><body>" +
								'<a href="/page1">Page 1</a>' +
								'<a href="/document.pdf">PDF</a>' +
								'<a href="/admin/settings">Admin</a>' +
								"</body></html>",
						).buffer,
					),
			});

		await crawler.crawl({ maxResources: 1 });

		// Should only discover /page1 (others filtered by ignore rules)
		const frontierStats = crawler.getFrontierStats();
		assert.strictEqual(frontierStats.discovered, 1); // Only /page1
		assert.strictEqual(frontierStats.crawled, 1); // Original "/"

		globalThis.fetch = originalFetch;
		await crawler.stop();
	});

	test("provides resource filtering methods", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/html", "/image"],
		});

		const crawler = new Crawler(config);
		await crawler.start();

		// Mock mixed content types
		const originalFetch = globalThis.fetch;
		let callCount = 0;
		globalThis.fetch = () => {
			callCount++;
			if (callCount === 1) {
				// First call - HTML
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Map([["Content-Type", "text/html"]]),
					arrayBuffer: () =>
						Promise.resolve(
							new TextEncoder().encode("<html><body>HTML</body></html>").buffer,
						),
				});
			} else {
				// Second call - Image
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Map([["Content-Type", "image/jpeg"]]),
					arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
				});
			}
		};

		await crawler.crawl({ maxResources: 2 });

		const allResources = crawler.getResources();
		const htmlResources = crawler.getHtmlResources();
		const assetResources = crawler.getAssetResources();

		assert.strictEqual(allResources.length, 2);
		assert.strictEqual(htmlResources.length, 1);
		assert.strictEqual(assetResources.length, 1);

		assert.strictEqual(htmlResources[0].isHtml(), true);
		assert.strictEqual(assetResources[0].isAsset(), true);

		globalThis.fetch = originalFetch;
		await crawler.stop();
	});

	test("respects maxResources limit", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/", "/page1", "/page2", "/page3"],
		});

		const crawler = new Crawler(config);
		await crawler.start();

		// Mock successful responses
		const originalFetch = globalThis.fetch;
		globalThis.fetch = () =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: new Map([["Content-Type", "text/html"]]),
				arrayBuffer: () =>
					Promise.resolve(
						new TextEncoder().encode("<html><body>Test</body></html>").buffer,
					),
			});

		await crawler.crawl({ maxResources: 2 });

		const resources = crawler.getResources();
		assert.strictEqual(resources.length, 2); // Should stop at limit

		const frontierStats = crawler.getFrontierStats();
		assert.strictEqual(frontierStats.crawled, 2);
		assert.strictEqual(frontierStats.discovered, 2); // Remaining URLs still pending

		globalThis.fetch = originalFetch;
		await crawler.stop();
	});

	test("provides comprehensive JSON representation", async () => {
		const config = new Config({
			server: "http://localhost:3000",
			routes: ["/"],
		});

		const crawler = new Crawler(config);
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
		await crawler.start();

		// Add small delay to ensure timing difference
		await new Promise((resolve) => setTimeout(resolve, 1));

		// Don't crawl - just stop
		await crawler.stop();

		const stats = crawler.getStatistics();
		assert.strictEqual(typeof stats.totalTime, "number");
		assert.strictEqual(stats.totalTime > 0, true);
	});
});
