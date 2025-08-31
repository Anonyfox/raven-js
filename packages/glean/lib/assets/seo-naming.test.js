/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for SEO-friendly asset naming with word deduplication
 *
 * Validates the generateSeoFilename utility function that creates
 * human-readable, SEO-optimized asset URLs with automatic word
 * deduplication and intelligent slug generation.
 */

import assert from "node:assert";
import { basename, extname } from "node:path";
import { describe, it } from "node:test";

/**
 * Generate SEO-friendly filename with word deduplication
 * (Copy of function from registry.js for isolated testing)
 */
function generateSeoFilename(originalPath, altText, hash) {
	const extension = extname(originalPath);
	const originalBase = basename(originalPath, extension);

	// Extract words from alt text and original filename
	const altWords = altText
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ") // Replace non-alphanumeric with spaces
		.split(/\s+/)
		.filter((word) => word.length > 0);

	const originalWords = originalBase
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((word) => word.length > 0);

	// Combine and deduplicate words (preserving alt text order first)
	const allWords = [...altWords, ...originalWords];
	const uniqueWords = [];
	const seen = new Set();

	for (const word of allWords) {
		if (!seen.has(word) && word.length > 1) {
			// Skip single character words
			uniqueWords.push(word);
			seen.add(word);
		}
	}

	// Fallback to original base if no meaningful words extracted
	const slug = uniqueWords.length > 0 ? uniqueWords.join("-") : originalBase;

	// Ensure exactly 8-character hash
	let shortHash = hash.substring(0, 8);
	if (shortHash.length < 8) {
		shortHash = shortHash.padEnd(8, "0");
	}

	return `${slug}-${shortHash}${extension}`;
}

describe("SEO Asset Naming", () => {
	const mockHash = "4a0046b48b5937c8d1e2f3a7b9c0d1e2f3a4b5c6d7e8f9";

	it("should generate basic SEO filename", () => {
		const result = generateSeoFilename("logo.png", "Company Logo", mockHash);
		assert.strictEqual(result, "company-logo-4a0046b4.png");
	});

	it("should deduplicate words between alt text and filename", () => {
		const result = generateSeoFilename(
			"company-logo.webp",
			"Company Logo Image",
			mockHash,
		);
		assert.strictEqual(result, "company-logo-image-4a0046b4.webp");
	});

	it("should handle empty alt text gracefully", () => {
		const result = generateSeoFilename("awesome-icon.svg", "", mockHash);
		assert.strictEqual(result, "awesome-icon-4a0046b4.svg");
	});

	it("should handle complex paths correctly", () => {
		const result = generateSeoFilename(
			"media/brand/primary-logo.png",
			"Brand Primary Logo",
			mockHash,
		);
		assert.strictEqual(result, "brand-primary-logo-4a0046b4.png");
	});

	it("should clean special characters", () => {
		const result = generateSeoFilename(
			"my_image@2x.png",
			"My-Image (Retina)",
			mockHash,
		);
		assert.strictEqual(result, "my-image-retina-2x-4a0046b4.png");
	});

	it("should skip single character words", () => {
		const result = generateSeoFilename("a.png", "A B C Logo", mockHash);
		assert.strictEqual(result, "logo-4a0046b4.png");
	});

	it("should preserve alt text word order over filename", () => {
		const result = generateSeoFilename(
			"secondary-primary.png",
			"Primary Secondary",
			mockHash,
		);
		assert.strictEqual(result, "primary-secondary-4a0046b4.png");
	});

	it("should handle no meaningful words extraction", () => {
		const result = generateSeoFilename("123.png", "! @ # $ %", mockHash);
		assert.strictEqual(result, "123-4a0046b4.png");
	});

	it("should handle unicode and international characters", () => {
		const result = generateSeoFilename("café-logo.jpg", "Café Logo", mockHash);
		assert.strictEqual(result, "caf-logo-4a0046b4.jpg");
	});

	it("should use exactly 8-character hash", () => {
		const shortHash = "abc123";
		const longHash = "abc123def456789012345678901234567890";

		const result1 = generateSeoFilename("test.png", "Test", shortHash);
		const result2 = generateSeoFilename("test.png", "Test", longHash);

		assert.strictEqual(result1, "test-abc12300.png"); // Pads short hash to 8 chars
		assert.strictEqual(result2, "test-abc123de.png"); // Truncates long hash to 8 chars
	});
});
