/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual } from "node:assert";
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
		deepStrictEqual(rootResult, {
			path: "README.md",
			content: rootContent,
			assets: [],
			directory: ".",
		});

		// Test nested directory README
		const nestedDir = join(testDir, "src", "components");
		await mkdir(nestedDir, { recursive: true });
		const nestedReadmePath = join(nestedDir, "README.md");
		const nestedContent = "# Components\n\nComponent documentation.";
		await writeFile(nestedReadmePath, nestedContent);

		const nestedResult = await extractReadmeData(nestedReadmePath, testDir);
		deepStrictEqual(nestedResult, {
			path: "src/components/README.md",
			content: nestedContent,
			assets: [],
			directory: "src/components",
		});

		// Test deeply nested README
		const deepDir = join(testDir, "docs", "api", "v1", "guides");
		await mkdir(deepDir, { recursive: true });
		const deepReadmePath = join(deepDir, "README.md");
		const deepContent = "# API Guides\n\nDeep documentation.";
		await writeFile(deepReadmePath, deepContent);

		const deepResult = await extractReadmeData(deepReadmePath, testDir);
		deepStrictEqual(deepResult, {
			path: "docs/api/v1/guides/README.md",
			content: deepContent,
			assets: [],
			directory: "docs/api/v1/guides",
		});

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
		deepStrictEqual(complexResult, {
			path: "lib/README.md",
			content: complexContent,
			assets: [],
			directory: "lib",
		});

		// Test empty README
		const emptyReadmePath = join(testDir, "empty", "README.md");
		await mkdir(join(testDir, "empty"), { recursive: true });
		await writeFile(emptyReadmePath, "");

		const emptyResult = await extractReadmeData(emptyReadmePath, testDir);
		deepStrictEqual(emptyResult, {
			path: "empty/README.md",
			content: "",
			assets: [],
			directory: "empty",
		});

		// Test different README filename
		const altReadmePath = join(testDir, "alt", "readme.txt");
		await mkdir(join(testDir, "alt"), { recursive: true });
		const altContent = "Alternative README format";
		await writeFile(altReadmePath, altContent);

		const altResult = await extractReadmeData(altReadmePath, testDir);
		deepStrictEqual(altResult, {
			path: "alt/readme.txt",
			content: altContent,
			assets: [],
			directory: "alt",
		});

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
		deepStrictEqual(specialResult, {
			path: "special/README.md",
			content: specialContent,
			assets: [],
			directory: "special",
		});

		// Test README in package root (current directory case)
		const currentDirContent = "# Current Directory README";
		const currentDirPath = join(testDir, "current.md");
		await writeFile(currentDirPath, currentDirContent);

		const currentResult = await extractReadmeData(currentDirPath, testDir);
		deepStrictEqual(currentResult, {
			path: "current.md",
			content: currentDirContent,
			assets: [],
			directory: ".",
		});
	} finally {
		// Cleanup
		await rm(testDir, { recursive: true, force: true });
	}
});
