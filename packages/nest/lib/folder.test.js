/**
 * @fileoverview Tests for Folder class
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmdirSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { Folder } from "./folder.js";

/**
 * Create a temporary directory for testing
 * @returns {string} Path to temporary directory
 */
function createTempDir() {
	return mkdtempSync(join(tmpdir(), "folder-test-"));
}

/**
 * Create a test file
 * @param {string} dir - Directory to create file in
 * @param {string} filename - Name of the file
 * @param {string} content - File content
 */
function createFile(dir, filename, content) {
	writeFileSync(join(dir, filename), content);
}

/**
 * Create a test directory
 * @param {string} parentDir - Parent directory
 * @param {string} dirname - Name of the directory
 * @returns {string} Path to created directory
 */
function createDir(parentDir, dirname) {
	const dirPath = join(parentDir, dirname);
	mkdirSync(dirPath);
	return dirPath;
}

/**
 * Clean up temporary directory
 * @param {string} dir - Directory to clean up
 */
function cleanupTempDir(dir) {
	try {
		// Remove all files and subdirectories recursively
		const entries = readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const entryPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				cleanupTempDir(entryPath);
			} else {
				unlinkSync(entryPath);
			}
		}
		rmdirSync(dir);
	} catch {
		// Ignore cleanup errors
	}
}

describe("Folder", () => {
	test("should create empty instance without path", () => {
		const folder = new Folder();

		assert.strictEqual(folder.rootPath, null);
		assert.strictEqual(folder.size, 0);
		assert.deepStrictEqual(folder.listing, {});
	});

	test("should load folder with files", () => {
		const tempDir = createTempDir();

		try {
			createFile(tempDir, "package.json", '{"name": "test"}');
			createFile(tempDir, "README.md", "# Test Package");
			createFile(tempDir, "index.js", "console.log('test');");

			const folder = new Folder(tempDir);

			assert.strictEqual(folder.rootPath, tempDir);
			assert.strictEqual(folder.size, 3);
			assert.strictEqual(folder.getFile("package.json"), '{"name": "test"}');
			assert.strictEqual(folder.getFile("README.md"), "# Test Package");
			assert.strictEqual(folder.getFile("index.js"), "console.log('test');");
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should load nested directories", () => {
		const tempDir = createTempDir();

		try {
			createFile(tempDir, "package.json", '{"name": "test"}');
			const libDir = createDir(tempDir, "lib");
			createFile(libDir, "index.js", "export {};");
			const srcDir = createDir(tempDir, "src");
			createFile(srcDir, "main.js", "console.log('main');");

			const folder = new Folder(tempDir);

			assert.strictEqual(folder.size, 3);
			assert.strictEqual(folder.getFile("package.json"), '{"name": "test"}');
			assert.strictEqual(folder.getFile("lib/index.js"), "export {};");
			assert.strictEqual(folder.getFile("src/main.js"), "console.log('main');");
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should respect .gitignore patterns", () => {
		const tempDir = createTempDir();

		try {
			createFile(tempDir, "package.json", '{"name": "test"}');
			createFile(tempDir, "README.md", "# Test Package");
			createFile(tempDir, ".gitignore", "node_modules\n*.log\n.DS_Store");
			createFile(tempDir, "app.log", "log content");
			createFile(tempDir, ".DS_Store", "ds store content");

			const folder = new Folder(tempDir);

			assert.strictEqual(folder.size, 3); // package.json, README.md, .gitignore
			assert.strictEqual(folder.hasFile("package.json"), true);
			assert.strictEqual(folder.hasFile("README.md"), true);
			assert.strictEqual(folder.hasFile(".gitignore"), true);
			assert.strictEqual(folder.hasFile("app.log"), false);
			assert.strictEqual(folder.hasFile(".DS_Store"), false);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should handle .gitignore with glob patterns", () => {
		const tempDir = createTempDir();

		try {
			createFile(tempDir, "package.json", '{"name": "test"}');
			createFile(tempDir, ".gitignore", "*.js\n*.md");
			createFile(tempDir, "index.js", "console.log('test');");
			createFile(tempDir, "README.md", "# Test");
			createFile(tempDir, "config.json", '{"test": true}');

			const folder = new Folder(tempDir);

			assert.strictEqual(folder.size, 3); // package.json, .gitignore, config.json
			assert.strictEqual(folder.hasFile("package.json"), true);
			assert.strictEqual(folder.hasFile(".gitignore"), true);
			assert.strictEqual(folder.hasFile("index.js"), false);
			assert.strictEqual(folder.hasFile("README.md"), false);
			assert.strictEqual(folder.hasFile("config.json"), true);
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should add and remove files manually", () => {
		const folder = new Folder();

		// Add files
		folder.addFile("test.js", "console.log('test');");
		folder.addFile("config.json", '{"test": true}');

		assert.strictEqual(folder.size, 2);
		assert.strictEqual(folder.getFile("test.js"), "console.log('test');");
		assert.strictEqual(folder.getFile("config.json"), '{"test": true}');

		// Remove file
		assert.strictEqual(folder.removeFile("test.js"), true);
		assert.strictEqual(folder.size, 1);
		assert.strictEqual(folder.hasFile("test.js"), false);
		assert.strictEqual(folder.hasFile("config.json"), true);

		// Remove non-existent file
		assert.strictEqual(folder.removeFile("nonexistent.js"), false);
	});

	test("should get file paths", () => {
		const folder = new Folder();

		folder.addFile("test.js", "content");
		folder.addFile("config.json", "content");
		folder.addFile("lib/index.js", "content");

		const paths = folder.getFilePaths();
		assert.strictEqual(paths.length, 3);
		assert(paths.includes("test.js"));
		assert(paths.includes("config.json"));
		assert(paths.includes("lib/index.js"));
	});

	test("should clear all files", () => {
		const folder = new Folder();

		folder.addFile("test.js", "content");
		folder.addFile("config.json", "content");

		assert.strictEqual(folder.size, 2);

		folder.clear();

		assert.strictEqual(folder.size, 0);
		assert.deepStrictEqual(folder.listing, {});
	});

	test("should get files by extension", () => {
		const folder = new Folder();

		folder.addFile("index.js", "js content");
		folder.addFile("config.json", "json content");
		folder.addFile("lib/helper.js", "helper content");
		folder.addFile("README.md", "md content");

		const jsFiles = folder.getFilesByExtension("js");
		assert.strictEqual(Object.keys(jsFiles).length, 2);
		assert.strictEqual(jsFiles["index.js"], "js content");
		assert.strictEqual(jsFiles["lib/helper.js"], "helper content");

		const jsonFiles = folder.getFilesByExtension(".json");
		assert.strictEqual(Object.keys(jsonFiles).length, 1);
		assert.strictEqual(jsonFiles["config.json"], "json content");
	});

	test("should get files matching pattern", () => {
		const folder = new Folder();

		folder.addFile("index.js", "content");
		folder.addFile("config.json", "content");
		folder.addFile("lib/helper.js", "content");
		folder.addFile("src/main.js", "content");

		const libFiles = folder.getFilesMatching(/^lib\//);
		assert.strictEqual(Object.keys(libFiles).length, 1);
		assert.strictEqual(libFiles["lib/helper.js"], "content");

		const jsFiles = folder.getFilesMatching(/\.js$/);
		assert.strictEqual(Object.keys(jsFiles).length, 3);
		assert.strictEqual(jsFiles["index.js"], "content");
		assert.strictEqual(jsFiles["lib/helper.js"], "content");
		assert.strictEqual(jsFiles["src/main.js"], "content");
	});

	test("should set root path after construction", () => {
		const tempDir = createTempDir();

		try {
			createFile(tempDir, "package.json", '{"name": "test"}');

			const folder = new Folder();
			assert.strictEqual(folder.rootPath, null);

			folder.setRootPath(tempDir);
			assert.strictEqual(folder.rootPath, tempDir);

			folder.loadFolder();
			assert.strictEqual(folder.size, 1);
			assert.strictEqual(folder.getFile("package.json"), '{"name": "test"}');
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should reload folder", () => {
		const tempDir = createTempDir();

		try {
			createFile(tempDir, "package.json", '{"name": "test"}');

			const folder = new Folder(tempDir);
			assert.strictEqual(folder.size, 1);

			// Add a new file
			createFile(tempDir, "newfile.js", "new content");

			// Reload should pick up the new file
			folder.reload();
			assert.strictEqual(folder.size, 2);
			assert.strictEqual(folder.getFile("newfile.js"), "new content");
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should convert to JSON", () => {
		const folder = new Folder();
		folder.addFile("test.js", "content");
		folder.addFile("config.json", "content");

		const json = folder.toJSON();

		assert.strictEqual(json.rootPath, null);
		assert.strictEqual(json.size, 2);
		assert.strictEqual(json.listing["test.js"], "content");
		assert.strictEqual(json.listing["config.json"], "content");
	});

	test("should handle non-existent folder", () => {
		const folder = new Folder("/non/existent/path");

		assert.strictEqual(folder.rootPath, "/non/existent/path");
		assert.strictEqual(folder.size, 0);
		assert.deepStrictEqual(folder.listing, {});
	});

	test("should handle empty folder", () => {
		const tempDir = createTempDir();

		try {
			const folder = new Folder(tempDir);

			assert.strictEqual(folder.rootPath, tempDir);
			assert.strictEqual(folder.size, 0);
			assert.deepStrictEqual(folder.listing, {});
		} finally {
			cleanupTempDir(tempDir);
		}
	});

	test("should handle .gitignore with comments", () => {
		const tempDir = createTempDir();

		try {
			createFile(tempDir, "package.json", '{"name": "test"}');
			createFile(
				tempDir,
				".gitignore",
				"# This is a comment\nnode_modules\n# Another comment\n*.log",
			);
			createFile(tempDir, "app.log", "log content");
			createFile(tempDir, "config.json", "config content");

			const folder = new Folder(tempDir);

			assert.strictEqual(folder.size, 3); // package.json, .gitignore, config.json
			assert.strictEqual(folder.hasFile("package.json"), true);
			assert.strictEqual(folder.hasFile(".gitignore"), true);
			assert.strictEqual(folder.hasFile("config.json"), true);
			assert.strictEqual(folder.hasFile("app.log"), false);
		} finally {
			cleanupTempDir(tempDir);
		}
	});
});
