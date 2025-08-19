/**
 * @file File Operations Tests - Comprehensive test suite for file operation utilities
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { listFilesRecursive } from "./file-operations.js";

// Test directory setup helpers
const testDir = path.join(process.cwd(), "test-assets");

async function createTestStructure() {
	await fs.mkdir(testDir, { recursive: true });

	// Create files in root
	await fs.writeFile(path.join(testDir, "index.html"), "<!DOCTYPE html>");
	await fs.writeFile(path.join(testDir, "favicon.ico"), "fake icon");

	// Create subdirectories with files
	await fs.mkdir(path.join(testDir, "css"), { recursive: true });
	await fs.writeFile(path.join(testDir, "css", "style.css"), "body {}");
	await fs.writeFile(path.join(testDir, "css", "theme.css"), ".theme {}");

	await fs.mkdir(path.join(testDir, "js"), { recursive: true });
	await fs.writeFile(path.join(testDir, "js", "app.js"), "console.log('app');");
	await fs.writeFile(
		path.join(testDir, "js", "utils.js"),
		"export const util = {};",
	);

	// Create nested subdirectories
	await fs.mkdir(path.join(testDir, "images", "icons"), { recursive: true });
	await fs.writeFile(path.join(testDir, "images", "logo.png"), "fake png");
	await fs.writeFile(
		path.join(testDir, "images", "icons", "arrow.svg"),
		"<svg></svg>",
	);

	// Create deep nesting
	await fs.mkdir(path.join(testDir, "assets", "fonts", "roboto"), {
		recursive: true,
	});
	await fs.writeFile(
		path.join(testDir, "assets", "fonts", "roboto", "regular.woff2"),
		"fake font",
	);

	// Create empty directory
	await fs.mkdir(path.join(testDir, "empty"), { recursive: true });
}

async function cleanupTestStructure() {
	try {
		await fs.rm(testDir, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}
}

test("listFilesRecursive", async (t) => {
	await t.test("returns empty array for non-existent directory", async () => {
		const files = await listFilesRecursive("/non/existent/directory");
		assert.deepStrictEqual(files, []);
	});

	await t.test("returns empty array for unreadable directory", async () => {
		// This test might not work on all systems, but we'll try
		const files = await listFilesRecursive("/root/private");
		assert.deepStrictEqual(files, []);
	});

	await t.test("returns empty array for empty directory", async () => {
		await createTestStructure();

		const files = await listFilesRecursive(path.join(testDir, "empty"));
		assert.deepStrictEqual(files, []);

		await cleanupTestStructure();
	});

	await t.test("lists files in flat directory", async () => {
		const flatDir = path.join(process.cwd(), "test-flat");
		await fs.mkdir(flatDir, { recursive: true });
		await fs.writeFile(path.join(flatDir, "file1.txt"), "content1");
		await fs.writeFile(path.join(flatDir, "file2.txt"), "content2");

		const files = await listFilesRecursive(flatDir);
		files.sort(); // Sort for consistent testing

		assert.deepStrictEqual(files, ["/file1.txt", "/file2.txt"]);

		await fs.rm(flatDir, { recursive: true, force: true });
	});

	await t.test(
		"recursively lists all files with correct web paths",
		async () => {
			await createTestStructure();

			const files = await listFilesRecursive(testDir);
			files.sort(); // Sort for consistent testing

			const expected = [
				"/assets/fonts/roboto/regular.woff2",
				"/css/style.css",
				"/css/theme.css",
				"/favicon.ico",
				"/images/icons/arrow.svg",
				"/images/logo.png",
				"/index.html",
				"/js/app.js",
				"/js/utils.js",
			];

			assert.deepStrictEqual(files, expected);

			await cleanupTestStructure();
		},
	);

	await t.test("handles directories with special characters", async () => {
		const specialDir = path.join(process.cwd(), "test-special");
		await fs.mkdir(specialDir, { recursive: true });

		// Create directory with spaces and special chars
		const subDir = path.join(specialDir, "folder with spaces");
		await fs.mkdir(subDir, { recursive: true });
		await fs.writeFile(path.join(subDir, "file-with-dash.txt"), "content");
		await fs.writeFile(
			path.join(subDir, "file_with_underscore.txt"),
			"content",
		);

		const files = await listFilesRecursive(specialDir);
		files.sort();

		const expected = [
			"/folder with spaces/file-with-dash.txt",
			"/folder with spaces/file_with_underscore.txt",
		];

		assert.deepStrictEqual(files, expected);

		await fs.rm(specialDir, { recursive: true, force: true });
	});

	await t.test("handles very deep nesting", async () => {
		const deepDir = path.join(process.cwd(), "test-deep");
		const deepPath = path.join(
			deepDir,
			"level1",
			"level2",
			"level3",
			"level4",
			"level5",
		);
		await fs.mkdir(deepPath, { recursive: true });
		await fs.writeFile(path.join(deepPath, "deep-file.txt"), "deep content");

		const files = await listFilesRecursive(deepDir);

		assert.deepStrictEqual(files, [
			"/level1/level2/level3/level4/level5/deep-file.txt",
		]);

		await fs.rm(deepDir, { recursive: true, force: true });
	});

	await t.test("normalizes path separators to forward slashes", async () => {
		const pathTestDir = path.join(process.cwd(), "test-paths");
		const subDir = path.join(pathTestDir, "sub", "dir");
		await fs.mkdir(subDir, { recursive: true });
		await fs.writeFile(path.join(subDir, "file.txt"), "content");

		const files = await listFilesRecursive(pathTestDir);

		// Should always use forward slashes regardless of OS
		assert.strictEqual(files[0], "/sub/dir/file.txt");
		assert.strictEqual(files[0].includes("\\"), false);

		await fs.rm(pathTestDir, { recursive: true, force: true });
	});

	await t.test("handles symlinks as regular files if they exist", async () => {
		const symlinkDir = path.join(process.cwd(), "test-symlinks");
		await fs.mkdir(symlinkDir, { recursive: true });

		// Create a regular file
		await fs.writeFile(
			path.join(symlinkDir, "original.txt"),
			"original content",
		);

		try {
			// Create a symlink (might fail on some systems without proper permissions)
			await fs.symlink(
				path.join(symlinkDir, "original.txt"),
				path.join(symlinkDir, "link.txt"),
			);

			const files = await listFilesRecursive(symlinkDir);
			files.sort();

			// Should include both original and link
			assert.strictEqual(files.length, 2);
			assert.strictEqual(files.includes("/original.txt"), true);
			assert.strictEqual(files.includes("/link.txt"), true);
		} catch {
			// Symlink creation failed (permissions, OS support, etc.)
			// Just test the original file
			const files = await listFilesRecursive(symlinkDir);
			assert.deepStrictEqual(files, ["/original.txt"]);
		}

		await fs.rm(symlinkDir, { recursive: true, force: true });
	});

	await t.test("handles large number of files efficiently", async () => {
		const largeDir = path.join(process.cwd(), "test-large");
		await fs.mkdir(largeDir, { recursive: true });

		// Create 100 files
		const promises = [];
		for (let i = 0; i < 100; i++) {
			promises.push(
				fs.writeFile(path.join(largeDir, `file${i}.txt`), `content${i}`),
			);
		}
		await Promise.all(promises);

		const files = await listFilesRecursive(largeDir);

		assert.strictEqual(files.length, 100);
		// Check that all files have correct format
		for (const file of files) {
			assert.strictEqual(file.startsWith("/file"), true);
			assert.strictEqual(file.endsWith(".txt"), true);
		}

		await fs.rm(largeDir, { recursive: true, force: true });
	});

	await t.test("uses basePath parameter correctly for recursion", async () => {
		await createTestStructure();

		// Test calling with basePath (simulating internal recursion)
		const files = await listFilesRecursive(path.join(testDir, "css"), "css");
		files.sort();

		assert.deepStrictEqual(files, ["/css/style.css", "/css/theme.css"]);

		await cleanupTestStructure();
	});
});
