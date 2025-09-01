/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for Metadata class.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { Metadata } from "./metadata.js";

describe("Metadata", () => {
	describe("constructor", () => {
		it("creates metadata with all fields", () => {
			const metadata = new Metadata({
				name: "MyApp",
				version: "1.0.0",
				description: "Test application",
				author: "John Doe",
				buildUrl: "https://example.com",
				banner: true,
			});

			assert.strictEqual(metadata.getName(), "MyApp");
			assert.strictEqual(metadata.getVersion(), "1.0.0");
			assert.strictEqual(metadata.getDescription(), "Test application");
			assert.strictEqual(metadata.getAuthor(), "John Doe");
			assert.strictEqual(metadata.getBuildUrl(), "https://example.com");
			assert.strictEqual(metadata.isBannerEnabled(), true);
		});

		it("applies default values", () => {
			const metadata = new Metadata({
				name: "MyApp",
				version: "1.0.0",
				description: "Test app",
				author: "Jane Doe",
			});

			assert.strictEqual(metadata.getBuildUrl(), "https://ravenjs.dev");
			assert.strictEqual(metadata.isBannerEnabled(), true);
		});

		it("respects banner disabled", () => {
			const metadata = new Metadata({
				name: "MyApp",
				version: "1.0.0",
				description: "Test app",
				author: "Jane Doe",
				banner: false,
			});

			assert.strictEqual(metadata.isBannerEnabled(), false);
		});
	});

	describe("fromPackageJson", () => {
		it("creates metadata from package.json", () => {
			const metadata = Metadata.fromPackageJson();

			// Should read from real fledge package.json
			assert.strictEqual(metadata.getName(), "@raven-js/fledge");
			assert.ok(metadata.getVersion().length > 0);
			assert.ok(metadata.getDescription().length > 0);
			assert.ok(metadata.getAuthor().length > 0);
			assert.strictEqual(metadata.getBuildUrl(), "https://ravenjs.dev");
		});

		it("applies overrides to package.json data", () => {
			const metadata = Metadata.fromPackageJson({
				name: "Custom App",
				description: "Override description",
				buildUrl: "https://custom.com",
			});

			assert.strictEqual(metadata.getName(), "Custom App");
			assert.strictEqual(metadata.getDescription(), "Override description");
			assert.strictEqual(metadata.getBuildUrl(), "https://custom.com");
			// Version and author should come from package.json
			assert.ok(metadata.getVersion().length > 0);
			assert.ok(metadata.getAuthor().length > 0);
		});

		it("disables banner via overrides", () => {
			const metadata = Metadata.fromPackageJson({
				banner: false,
			});

			assert.strictEqual(metadata.isBannerEnabled(), false);
		});
	});

	describe("generateBanner", () => {
		it("generates banner with all metadata", () => {
			const metadata = new Metadata({
				name: "TestApp",
				version: "2.1.0",
				description: "A test application",
				author: "Test Author <test@example.com>",
				buildUrl: "https://test.com",
				banner: true,
			});

			const banner = metadata.generateBanner();

			assert.ok(banner.includes("TestApp v2.1.0"));
			assert.ok(banner.includes("A test application"));
			assert.ok(banner.includes("Test Author <test@example.com>"));
			assert.ok(banner.includes("https://test.com"));
			assert.ok(banner.includes("build timestamp:"));
			assert.ok(banner.includes("// "));
			assert.ok(banner.includes("*".repeat(60)));
		});

		it("returns empty string when banner disabled", () => {
			const metadata = new Metadata({
				name: "TestApp",
				version: "1.0.0",
				description: "Test",
				author: "Author",
				banner: false,
			});

			const banner = metadata.generateBanner();

			assert.strictEqual(banner, "");
		});

		it("handles empty description", () => {
			const metadata = new Metadata({
				name: "TestApp",
				version: "1.0.0",
				description: "",
				author: "Author",
				banner: true,
			});

			const banner = metadata.generateBanner();

			assert.ok(banner.includes("No description"));
		});

		it("includes timestamp in ISO format", () => {
			const metadata = new Metadata({
				name: "TestApp",
				version: "1.0.0",
				description: "Test",
				author: "Author",
				banner: true,
			});

			const banner = metadata.generateBanner();
			const timestampMatch = banner.match(/build timestamp: ([\d-T:.Z]+)/);

			assert.ok(timestampMatch);
			assert.ok(timestampMatch[1]);
			// Should be valid ISO timestamp
			assert.ok(!Number.isNaN(Date.parse(timestampMatch[1])));
		});
	});

	describe("getters", () => {
		const metadata = new Metadata({
			name: "GetterTest",
			version: "3.2.1",
			description: "Getter test app",
			author: "Getter Author",
			buildUrl: "https://getter.com",
			banner: true,
		});

		it("getName returns name", () => {
			assert.strictEqual(metadata.getName(), "GetterTest");
		});

		it("getVersion returns version", () => {
			assert.strictEqual(metadata.getVersion(), "3.2.1");
		});

		it("getDescription returns description", () => {
			assert.strictEqual(metadata.getDescription(), "Getter test app");
		});

		it("getAuthor returns author", () => {
			assert.strictEqual(metadata.getAuthor(), "Getter Author");
		});

		it("getBuildUrl returns build URL", () => {
			assert.strictEqual(metadata.getBuildUrl(), "https://getter.com");
		});

		it("isBannerEnabled returns banner flag", () => {
			assert.strictEqual(metadata.isBannerEnabled(), true);
		});
	});
});
