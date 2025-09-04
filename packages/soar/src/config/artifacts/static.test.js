/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for StaticArtifact class.
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { StaticArtifact } from "./static.js";

describe("StaticArtifact", () => {
	let tempDir;

	beforeEach(() => {
		// Create temporary directory for test files
		tempDir = mkdtempSync(join(tmpdir(), "soar-static-test-"));
	});

	afterEach(() => {
		// Clean up temporary directory
		if (tempDir) {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	/**
	 * Helper function to create test files
	 * @param {Record<string, string>} files - Object with filepath -> content mapping
	 */
	function createTestFiles(files) {
		for (const [filePath, content] of Object.entries(files)) {
			const fullPath = join(tempDir, filePath);

			// Create directory if needed
			const dir = dirname(fullPath);
			if (dir !== tempDir) {
				mkdirSync(dir, { recursive: true });
			}

			writeFileSync(fullPath, content, "utf8");
		}
	}

	describe("constructor", () => {
		it("should create instance with valid config", () => {
			const config = {
				type: "static",
				path: tempDir,
			};

			const artifact = new StaticArtifact(config);
			assert.strictEqual(artifact instanceof StaticArtifact, true);
			assert.strictEqual(artifact.getType(), "static");
			assert.strictEqual(artifact.getPath(), tempDir);
		});

		it("should set default index file", () => {
			const config = {
				type: "static",
				path: tempDir,
			};

			const artifact = new StaticArtifact(config);
			assert.strictEqual(artifact.getIndexFile(), "index.html");
		});

		it("should accept custom index file", () => {
			const config = {
				type: "static",
				path: tempDir,
				indexFile: "main.html",
			};

			const artifact = new StaticArtifact(config);
			assert.strictEqual(artifact.getIndexFile(), "main.html");
		});

		it("should accept exclude patterns", () => {
			const config = {
				type: "static",
				path: tempDir,
				excludePatterns: ["*.tmp", "node_modules"],
			};

			const artifact = new StaticArtifact(config);
			const patterns = artifact.getExcludePatterns();
			assert.deepStrictEqual(patterns, ["*.tmp", "node_modules"]);
		});

		it("should throw error for invalid type", () => {
			const config = {
				type: "invalid",
				path: tempDir,
			};

			assert.throws(
				() => new StaticArtifact(config),
				/Artifact type must be 'static'/,
			);
		});
	});

	describe("validation", () => {
		it("should validate successfully with valid config", () => {
			const config = {
				type: "static",
				path: tempDir,
			};

			const artifact = new StaticArtifact(config);
			const errors = artifact.validate();
			assert.deepStrictEqual(errors, []);
		});

		it("should return errors for invalid index file", () => {
			const config = {
				type: "static",
				path: tempDir,
				indexFile: "",
			};

			const artifact = new StaticArtifact(config);
			const errors = artifact.validate();
			assert.ok(errors.length > 0);
			assert.ok(
				errors[0].message.includes("Index file must be a non-empty string"),
			);
		});
	});

	describe("file scanning", () => {
		it("should scan directory and create manifest", async () => {
			createTestFiles({
				"index.html": "<html><body>Hello World</body></html>",
				"style.css": "body { margin: 0; }",
				"assets/logo.png": "fake-png-data",
			});

			const config = {
				type: "static",
				path: tempDir,
			};

			const artifact = new StaticArtifact(config);
			const manifest = await artifact.getManifest();

			// Check manifest structure
			assert.ok(manifest.files);
			assert.ok(typeof manifest.totalSize === "number");
			assert.ok(typeof manifest.fileCount === "number");
			assert.ok(manifest.scannedAt instanceof Date);

			// Check files are found
			const filePaths = Object.keys(manifest.files);
			assert.ok(filePaths.includes("/index.html"));
			assert.ok(filePaths.includes("/style.css"));
			assert.ok(filePaths.includes("/assets/logo.png"));

			// Check file metadata
			const indexFile = manifest.files["/index.html"];
			assert.ok(typeof indexFile.checksum === "string");
			assert.ok(indexFile.checksum.length === 64); // SHA-256 is 64 hex chars
			assert.ok(typeof indexFile.size === "number");
			assert.strictEqual(indexFile.mimeType, "text/html");
			assert.ok(indexFile.lastModified instanceof Date);
		});

		it("should exclude files matching patterns", async () => {
			createTestFiles({
				"index.html": "<html><body>Hello World</body></html>",
				"temp.tmp": "temporary file",
				"node_modules/package.json": '{"name": "test"}',
			});

			const config = {
				type: "static",
				path: tempDir,
				excludePatterns: ["*.tmp", "node_modules"],
			};

			const artifact = new StaticArtifact(config);
			const manifest = await artifact.getManifest();

			const filePaths = Object.keys(manifest.files);
			assert.ok(filePaths.includes("/index.html"));
			assert.ok(!filePaths.some((path) => path.includes("temp.tmp")));
			assert.ok(!filePaths.some((path) => path.includes("node_modules")));
		});

		it("should detect correct MIME types", async () => {
			createTestFiles({
				"index.html": "<html></html>",
				"style.css": "body {}",
				"script.js": "console.log('test');",
				"data.json": '{"test": true}',
				"image.png": "fake-png",
			});

			const config = {
				type: "static",
				path: tempDir,
			};

			const artifact = new StaticArtifact(config);
			const manifest = await artifact.getManifest();

			assert.strictEqual(manifest.files["/index.html"].mimeType, "text/html");
			assert.strictEqual(manifest.files["/style.css"].mimeType, "text/css");
			assert.strictEqual(
				manifest.files["/script.js"].mimeType,
				"application/javascript",
			);
			assert.strictEqual(
				manifest.files["/data.json"].mimeType,
				"application/json",
			);
			assert.strictEqual(manifest.files["/image.png"].mimeType, "image/png");
		});

		it("should provide utility methods", async () => {
			createTestFiles({
				"file1.txt": "Hello",
				"file2.txt": "World",
			});

			const config = {
				type: "static",
				path: tempDir,
			};

			const artifact = new StaticArtifact(config);

			const filePaths = await artifact.getFilePaths();
			const totalSize = await artifact.getTotalSize();
			const fileCount = await artifact.getFileCount();
			const lastModified = await artifact.getLastModified();

			assert.strictEqual(filePaths.length, 2);
			assert.ok(filePaths.includes("/file1.txt"));
			assert.ok(filePaths.includes("/file2.txt"));
			assert.strictEqual(totalSize, 10); // "Hello" + "World" = 10 bytes
			assert.strictEqual(fileCount, 2);
			assert.ok(lastModified instanceof Date);
		});
	});

	describe("prepare", () => {
		it("should prepare deployment-ready artifact info", async () => {
			createTestFiles({
				"index.html": "<html><body>Test</body></html>",
			});

			const config = {
				type: "static",
				path: tempDir,
			};

			const artifact = new StaticArtifact(config);
			const prepared = await artifact.prepare();

			assert.strictEqual(prepared.type, "static");
			assert.strictEqual(prepared.path, tempDir);
			assert.strictEqual(prepared.indexFile, "index.html");
			assert.ok(prepared.manifest);
			assert.ok(typeof prepared.totalSize === "number");
			assert.ok(typeof prepared.fileCount === "number");
			assert.strictEqual(prepared.executable, false);
			assert.strictEqual(prepared.runtime, null);
		});
	});
});
