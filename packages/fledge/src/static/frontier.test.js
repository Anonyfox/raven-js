/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, test } from "node:test";

import { Frontier } from "./frontier.js";

describe("Frontier", () => {
	test("creates empty frontier", () => {
		const frontier = new Frontier();

		assert.strictEqual(frontier.hasPending(), false);
		assert.strictEqual(frontier.getPendingCount(), 0);
		assert.strictEqual(frontier.getNextPending(), null);
		assert.deepStrictEqual(frontier.getPendingUrls(), []);
		assert.deepStrictEqual(frontier.getAllUrls(), []);
	});

	test("creates frontier with base URL", () => {
		const frontier = new Frontier("https://example.com/app/");

		frontier.discover("/api/docs");
		const pending = frontier.getPendingUrls();

		assert.strictEqual(pending.length, 1);
		assert.strictEqual(pending[0].href, "https://example.com/api/docs");
	});

	test("discovers URLs", () => {
		const frontier = new Frontier();

		frontier.discover("https://example.com/page1");
		frontier.discover("https://example.com/page2");

		assert.strictEqual(frontier.hasPending(), true);
		assert.strictEqual(frontier.getPendingCount(), 2);

		const pending = frontier.getPendingUrls();
		assert.strictEqual(pending.length, 2);
		assert.strictEqual(pending[0].href, "https://example.com/page1");
		assert.strictEqual(pending[1].href, "https://example.com/page2");
	});

	test("normalizes discovered URLs", () => {
		const frontier = new Frontier();

		// Add same URL with different normalization
		frontier.discover("https://Example.com:443/path?b=2&a=1#section");
		frontier.discover("https://example.com/path?a=1&b=2");

		// Should be deduplicated to one URL
		assert.strictEqual(frontier.getPendingCount(), 1);
		const url = frontier.getNextPending();
		assert.strictEqual(url.href, "https://example.com/path?a=1&b=2");
	});

	test("marks URLs as crawled", () => {
		const frontier = new Frontier();
		const testUrl = "https://example.com/page";

		frontier.discover(testUrl);
		assert.strictEqual(frontier.isPending(testUrl), true);
		assert.strictEqual(frontier.isCrawled(testUrl), false);

		frontier.markCrawled(testUrl);
		assert.strictEqual(frontier.isPending(testUrl), false);
		assert.strictEqual(frontier.isCrawled(testUrl), true);
		assert.strictEqual(frontier.getPendingCount(), 0);

		const crawled = frontier.getCrawledUrls();
		assert.strictEqual(crawled.length, 1);
		assert.strictEqual(crawled[0].href, testUrl);
	});

	test("marks URLs as failed", () => {
		const frontier = new Frontier();
		const testUrl = "https://example.com/page";

		frontier.discover(testUrl);
		assert.strictEqual(frontier.isPending(testUrl), true);
		assert.strictEqual(frontier.isFailed(testUrl), false);

		frontier.markFailed(testUrl);
		assert.strictEqual(frontier.isPending(testUrl), false);
		assert.strictEqual(frontier.isFailed(testUrl), true);
		assert.strictEqual(frontier.getPendingCount(), 0);

		const failed = frontier.getFailedUrls();
		assert.strictEqual(failed.length, 1);
		assert.strictEqual(failed[0].href, testUrl);
	});

	test("rediscovers failed URLs", () => {
		const frontier = new Frontier();
		const testUrl = "https://example.com/page";

		frontier.discover(testUrl);
		frontier.markFailed(testUrl);
		assert.strictEqual(frontier.isFailed(testUrl), true);
		assert.strictEqual(frontier.isPending(testUrl), false);

		frontier.rediscover(testUrl);
		assert.strictEqual(frontier.isFailed(testUrl), false);
		assert.strictEqual(frontier.isPending(testUrl), true);
		assert.strictEqual(frontier.getPendingCount(), 1);
	});

	test("throws when marking non-discovered URL as crawled", () => {
		const frontier = new Frontier();

		assert.throws(
			() => frontier.markCrawled("https://example.com/page"),
			/URL not in discovered set/,
		);
	});

	test("throws when marking non-discovered URL as failed", () => {
		const frontier = new Frontier();

		assert.throws(
			() => frontier.markFailed("https://example.com/page"),
			/URL not in discovered set/,
		);
	});

	test("throws when rediscovering non-failed URL", () => {
		const frontier = new Frontier();

		assert.throws(
			() => frontier.rediscover("https://example.com/page"),
			/URL not in failed set/,
		);
	});

	test("handles URL objects", () => {
		const frontier = new Frontier();
		const url = new URL("https://example.com/page");

		frontier.discover(url);
		assert.strictEqual(frontier.isPending(url), true);

		frontier.markCrawled(url);
		assert.strictEqual(frontier.isCrawled(url), true);
	});

	test("handles invalid URLs gracefully in query methods", () => {
		const frontier = new Frontier();

		assert.strictEqual(frontier.isPending("not-a-url"), false);
		assert.strictEqual(frontier.isCrawled("not-a-url"), false);
		assert.strictEqual(frontier.isFailed("not-a-url"), false);
	});

	test("throws for invalid URLs in state change methods", () => {
		const frontier = new Frontier();

		assert.throws(() => frontier.discover("not-a-url"), /Invalid URL/);
		assert.throws(() => frontier.markCrawled("not-a-url"), /Invalid URL/);
		assert.throws(() => frontier.markFailed("not-a-url"), /Invalid URL/);
		assert.throws(() => frontier.rediscover("not-a-url"), /Invalid URL/);
	});

	test("gets next pending URL", () => {
		const frontier = new Frontier();

		frontier.discover("https://example.com/page1");
		frontier.discover("https://example.com/page2");

		const nextUrl = frontier.getNextPending();
		assert.strictEqual(nextUrl.href, "https://example.com/page1");

		// URL should still be pending (not removed by getNext)
		assert.strictEqual(frontier.getPendingCount(), 2);
	});

	test("gets all URLs", () => {
		const frontier = new Frontier();

		frontier.discover("https://example.com/page1");
		frontier.discover("https://example.com/page2");
		frontier.discover("https://example.com/page3");

		frontier.markCrawled("https://example.com/page1");
		frontier.markFailed("https://example.com/page2");

		const allUrls = frontier.getAllUrls();
		assert.strictEqual(allUrls.length, 3);

		const hrefs = allUrls.map((url) => url.href).sort();
		assert.deepStrictEqual(hrefs, [
			"https://example.com/page1",
			"https://example.com/page2",
			"https://example.com/page3",
		]);
	});

	test("gets statistics", () => {
		const frontier = new Frontier();

		frontier.discover("https://example.com/page1");
		frontier.discover("https://example.com/page2");
		frontier.discover("https://example.com/page3");
		frontier.discover("https://example.com/page4");

		frontier.markCrawled("https://example.com/page1");
		frontier.markFailed("https://example.com/page2");

		const stats = frontier.getStats();
		assert.deepStrictEqual(stats, {
			discovered: 2,
			crawled: 1,
			failed: 1,
			total: 4,
		});
	});

	test("handles relative URLs with base URL", () => {
		const frontier = new Frontier("https://example.com/app/");

		frontier.discover("/api");
		frontier.discover("../docs");
		frontier.discover("./help");

		const pending = frontier.getPendingUrls();
		const hrefs = pending.map((url) => url.href).sort();

		assert.deepStrictEqual(hrefs, [
			"https://example.com/api",
			"https://example.com/app/help",
			"https://example.com/docs",
		]);
	});
});
