/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { extractReadmeData } from "./content-integration.js";

test("extractReadmeData - comprehensive branch coverage", async () => {
	// Create temporary test directory
	const testDir = "/tmp/glean-content-test";
	await rm(testDir, { recursive: true, force: true });
	await mkdir(testDir, { recursive: true });

	try {
		// Test root README
		const rootReadmePath = join(testDir, "README.md");
		const rootContent = "# Root Project\n\nThis is the main README.";
		await writeFile(rootReadmePath, rootContent);

		const rootResult = await extractReadmeData(rootReadmePath, testDir);
		strictEqual(rootResult.path, "README.md");
		strictEqual(rootResult.content, rootContent);
		deepStrictEqual(rootResult.assetIds, []);
		strictEqual(rootResult.directory, ".");
		strictEqual(rootResult.id, "root");

		// Test nested directory README
		const nestedDir = join(testDir, "src", "components");
		await mkdir(nestedDir, { recursive: true });
		const nestedReadmePath = join(nestedDir, "README.md");
		const nestedContent = "# Components\n\nComponent documentation.";
		await writeFile(nestedReadmePath, nestedContent);

		const nestedResult = await extractReadmeData(nestedReadmePath, testDir);
		strictEqual(nestedResult.path, "src/components/README.md");
		strictEqual(nestedResult.content, nestedContent);
		deepStrictEqual(nestedResult.assetIds, []);
		strictEqual(nestedResult.directory, "src/components");
		strictEqual(nestedResult.id, "src/components");

		// Test deeply nested README
		const deepDir = join(testDir, "docs", "api", "v1", "guides");
		await mkdir(deepDir, { recursive: true });
		const deepReadmePath = join(deepDir, "README.md");
		const deepContent = "# API Guides\n\nDeep documentation.";
		await writeFile(deepReadmePath, deepContent);

		const deepResult = await extractReadmeData(deepReadmePath, testDir);
		strictEqual(deepResult.path, "docs/api/v1/guides/README.md");
		strictEqual(deepResult.content, deepContent);
		deepStrictEqual(deepResult.assetIds, []);
		strictEqual(deepResult.directory, "docs/api/v1/guides");
		strictEqual(deepResult.id, "docs/api/v1/guides");

		// Test README with complex content
		const complexContent = `# Complex README

This README contains:
- Lists
- **Bold text**
- \`code snippets\`
- [Links](https://example.com)
- Images: ![alt](./image.png)

## Code Examples

\`\`\`javascript
function example() {
  return "test";
}
\`\`\`

> Blockquotes
> Multi-line

---

Final section.`;

		const complexReadmePath = join(testDir, "lib", "README.md");
		await mkdir(join(testDir, "lib"), { recursive: true });
		await writeFile(complexReadmePath, complexContent);

		const complexResult = await extractReadmeData(complexReadmePath, testDir);
		strictEqual(complexResult.path, "lib/README.md");
		strictEqual(complexResult.content, complexContent);
		deepStrictEqual(complexResult.assetIds, []);
		strictEqual(complexResult.directory, "lib");
		strictEqual(complexResult.id, "lib");

		// Test empty README
		const emptyReadmePath = join(testDir, "empty", "README.md");
		await mkdir(join(testDir, "empty"), { recursive: true });
		await writeFile(emptyReadmePath, "");

		const emptyResult = await extractReadmeData(emptyReadmePath, testDir);
		strictEqual(emptyResult.path, "empty/README.md");
		strictEqual(emptyResult.content, "");
		deepStrictEqual(emptyResult.assetIds, []);
		strictEqual(emptyResult.directory, "empty");
		strictEqual(emptyResult.id, "empty");

		// Test different README filename
		const altReadmePath = join(testDir, "alt", "readme.txt");
		await mkdir(join(testDir, "alt"), { recursive: true });
		const altContent = "Alternative README format";
		await writeFile(altReadmePath, altContent);

		const altResult = await extractReadmeData(altReadmePath, testDir);
		strictEqual(altResult.path, "alt/readme.txt");
		strictEqual(altResult.content, altContent);
		deepStrictEqual(altResult.assetIds, []);
		strictEqual(altResult.directory, "alt");
		strictEqual(altResult.id, "alt");

		// Test README with special characters
		const specialContent = `# README with Special Characters

Unicode: 🚀 ✨ 💻
Symbols: ©️ ®️ ™️
Math: ∑ ∞ ± ≤ ≥
Quotes: "smart quotes" 'single'
Emoji: 😀 🎉 🔥

Non-ASCII paths and content.`;

		const specialReadmePath = join(testDir, "special", "README.md");
		await mkdir(join(testDir, "special"), { recursive: true });
		await writeFile(specialReadmePath, specialContent);

		const specialResult = await extractReadmeData(specialReadmePath, testDir);
		strictEqual(specialResult.path, "special/README.md");
		strictEqual(specialResult.content, specialContent);
		deepStrictEqual(specialResult.assetIds, []);
		strictEqual(specialResult.directory, "special");
		strictEqual(specialResult.id, "special");

		// Test README in package root (current directory case)
		const currentDirContent = "# Current Directory README";
		const currentDirPath = join(testDir, "current.md");
		await writeFile(currentDirPath, currentDirContent);

		const currentResult = await extractReadmeData(currentDirPath, testDir);
		strictEqual(currentResult.path, "current.md");
		strictEqual(currentResult.content, currentDirContent);
		deepStrictEqual(currentResult.assetIds, []);
		strictEqual(currentResult.directory, ".");
		strictEqual(currentResult.id, "root");
	} finally {
		// Cleanup
		await rm(testDir, { recursive: true, force: true });
	}
});
