/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, test } from "node:test";

import { Config, generateStaticSite } from "./index.js";

describe("Static module", () => {
	test("exports generateStaticSite function", () => {
		assert.strictEqual(typeof generateStaticSite, "function");
	});

	test("exports Config class", () => {
		assert.strictEqual(typeof Config, "function");
	});

	test("generateStaticSite works with resolver function", async () => {
		const outputDir = "/tmp/fledge-resolver-integration-test";

		// Clean up any existing output
		await rm(outputDir, { recursive: true, force: true });

		// Create resolver function that simulates wings Context
		const resolver = async (path) => {
			const routes = {
				"/": "<html><head><title>Home</title></head><body><h1>Welcome</h1><a href='/about'>About</a></body></html>",
				"/about":
					"<html><head><title>About</title></head><body><h1>About Us</h1><a href='/'>Home</a></body></html>",
				"/api/data": JSON.stringify({
					message: "Hello from API",
					timestamp: Date.now(),
				}),
			};

			const content =
				routes[path] || "<html><body><h1>404 Not Found</h1></body></html>";
			const contentType = path.startsWith("/api/")
				? "application/json"
				: "text/html";
			const status = routes[path] ? 200 : 404;

			return new Response(content, {
				status,
				headers: { "content-type": contentType },
			});
		};

		// Create config with resolver
		const config = new Config({
			resolver,
			routes: ["/", "/about", "/api/data"],
			discover: false, // Disable discovery for predictable test
		});

		// Generate static site
		const result = await generateStaticSite(config, { outputDir });

		// Verify results
		assert.strictEqual(result.totalFiles, 3);
		assert.strictEqual(result.savedFiles, 3);
		assert.strictEqual(result.errorsCount, 0);

		// Verify files were created
		const indexPath = join(outputDir, "index.html");
		const aboutPath = join(outputDir, "about", "index.html");
		const apiPath = join(outputDir, "api", "data");

		assert(existsSync(indexPath), "Home page should exist");
		assert(existsSync(aboutPath), "About page should exist");
		assert(existsSync(apiPath), "API data should exist");

		// Verify content
		const indexContent = readFileSync(indexPath, "utf8");
		assert(
			indexContent.includes("<h1>Welcome</h1>"),
			"Home page should contain welcome message",
		);
		assert(
			indexContent.includes("href='/about'"),
			"Home page should link to about",
		);

		const aboutContent = readFileSync(aboutPath, "utf8");
		assert(
			aboutContent.includes("<h1>About Us</h1>"),
			"About page should contain about message",
		);

		const apiContent = readFileSync(apiPath, "utf8");
		const apiData = JSON.parse(apiContent);
		assert.strictEqual(apiData.message, "Hello from API");

		// Clean up
		await rm(outputDir, { recursive: true, force: true });
	});

	test("resolver function receives clean pathname", async () => {
		const outputDir = "/tmp/fledge-resolver-pathname-test";

		// Clean up any existing output
		await rm(outputDir, { recursive: true, force: true });

		const receivedPaths = [];

		// Resolver that tracks received paths
		const resolver = async (path) => {
			receivedPaths.push(path);
			return new Response(`Received path: ${path}`, {
				status: 200,
				headers: { "content-type": "text/html" },
			});
		};

		// Create config with resolver
		const config = new Config({
			resolver,
			routes: ["/", "/nested/path", "/api/endpoint"],
			discover: false,
		});

		// Generate static site
		await generateStaticSite(config, { outputDir });

		// Verify resolver received clean pathnames
		assert.deepStrictEqual(receivedPaths.sort(), [
			"/",
			"/api/endpoint",
			"/nested/path",
		]);

		// Clean up
		await rm(outputDir, { recursive: true, force: true });
	});
});
