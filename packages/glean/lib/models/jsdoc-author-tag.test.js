/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc author tag model.
 *
 * Ravens test authorship metadata documentation with precision.
 * Verifies author tag parsing, validation, and attribution indication.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocAuthorTag } from "./jsdoc-author-tag.js";

test("JSDocAuthorTag - name only", () => {
	const tag = new JSDocAuthorTag("John Doe");

	strictEqual(tag.authorInfo, "John Doe", "Should parse author info");
	strictEqual(tag.name, "John Doe", "Should parse name");
	strictEqual(tag.email, "", "Should have empty email");
	strictEqual(tag.additional, "", "Should have empty additional");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - name with email", () => {
	const tag = new JSDocAuthorTag("Jane Smith <jane@example.com>");

	strictEqual(
		tag.authorInfo,
		"Jane Smith <jane@example.com>",
		"Should parse author info",
	);
	strictEqual(tag.name, "Jane Smith", "Should parse name");
	strictEqual(tag.email, "jane@example.com", "Should parse email");
	strictEqual(tag.additional, "", "Should have empty additional");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - name with email and additional info", () => {
	const tag = new JSDocAuthorTag(
		"Bob Wilson <bob@company.com> (Lead Developer)",
	);

	strictEqual(
		tag.authorInfo,
		"Bob Wilson <bob@company.com> (Lead Developer)",
		"Should parse author info",
	);
	strictEqual(tag.name, "Bob Wilson", "Should parse name");
	strictEqual(tag.email, "bob@company.com", "Should parse email");
	strictEqual(
		tag.additional,
		"(Lead Developer)",
		"Should parse additional info",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - organizational authorship", () => {
	const tag = new JSDocAuthorTag("Development Team at TechCorp");

	strictEqual(
		tag.authorInfo,
		"Development Team at TechCorp",
		"Should parse organizational info",
	);
	strictEqual(tag.name, "Development Team at TechCorp", "Should parse as name");
	strictEqual(tag.email, "", "Should have empty email");
	strictEqual(tag.additional, "", "Should have empty additional");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - username format", () => {
	const tag = new JSDocAuthorTag("Anonyfox <max@anonyfox.com>");

	strictEqual(
		tag.authorInfo,
		"Anonyfox <max@anonyfox.com>",
		"Should parse username format",
	);
	strictEqual(tag.name, "Anonyfox", "Should parse username as name");
	strictEqual(tag.email, "max@anonyfox.com", "Should parse email");
	strictEqual(tag.additional, "", "Should have empty additional");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - multiple names", () => {
	const tag = new JSDocAuthorTag("John Doe and Jane Smith");

	strictEqual(
		tag.authorInfo,
		"John Doe and Jane Smith",
		"Should parse multiple names",
	);
	strictEqual(
		tag.name,
		"John Doe and Jane Smith",
		"Should parse as single name",
	);
	strictEqual(tag.email, "", "Should have empty email");
	strictEqual(tag.additional, "", "Should have empty additional");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - complex format", () => {
	const tag = new JSDocAuthorTag(
		"Dr. Sarah Johnson <s.johnson@university.edu> (Department of Computer Science)",
	);

	strictEqual(
		tag.authorInfo,
		"Dr. Sarah Johnson <s.johnson@university.edu> (Department of Computer Science)",
		"Should parse complex format",
	);
	strictEqual(
		tag.name,
		"Dr. Sarah Johnson",
		"Should parse full name with title",
	);
	strictEqual(
		tag.email,
		"s.johnson@university.edu",
		"Should parse academic email",
	);
	strictEqual(
		tag.additional,
		"(Department of Computer Science)",
		"Should parse department info",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - whitespace handling", () => {
	const spacedTag = new JSDocAuthorTag("   Alice Cooper <alice@music.com>   ");

	strictEqual(
		spacedTag.authorInfo,
		"Alice Cooper <alice@music.com>",
		"Should trim author info whitespace",
	);
	strictEqual(spacedTag.name, "Alice Cooper", "Should parse trimmed name");
	strictEqual(spacedTag.email, "alice@music.com", "Should parse email");
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - empty content", () => {
	const tag = new JSDocAuthorTag("");

	strictEqual(tag.authorInfo, "", "Should have empty author info");
	strictEqual(tag.name, "", "Should have empty name");
	strictEqual(tag.email, "", "Should have empty email");
	strictEqual(tag.additional, "", "Should have empty additional");
	strictEqual(tag.isValid(), false, "Should be invalid without content");
});

test("JSDocAuthorTag - only whitespace", () => {
	const tag = new JSDocAuthorTag("   \n\t  ");

	strictEqual(tag.authorInfo, "", "Should handle whitespace-only content");
	strictEqual(tag.name, "", "Should have empty name");
	strictEqual(tag.email, "", "Should have empty email");
	strictEqual(tag.additional, "", "Should have empty additional");
	strictEqual(tag.isValid(), false, "Should be invalid");
});

test("JSDocAuthorTag - email only format", () => {
	const tag = new JSDocAuthorTag("<contact@example.com>");

	strictEqual(
		tag.authorInfo,
		"<contact@example.com>",
		"Should parse email-only",
	);
	strictEqual(
		tag.name,
		"<contact@example.com>",
		"Should treat as name when no prefix",
	);
	strictEqual(tag.email, "", "Should not extract email without name prefix");
	strictEqual(tag.additional, "", "Should have empty additional");
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - serialization", () => {
	const tag = new JSDocAuthorTag("Charlie Brown <charlie@peanuts.com>");
	const json = tag.toJSON();

	strictEqual(json.__type, "author", "Should have correct type");
	strictEqual(
		json.__data.authorInfo,
		"Charlie Brown <charlie@peanuts.com>",
		"Should serialize author info",
	);
	strictEqual(json.__data.name, "Charlie Brown", "Should serialize name");
	strictEqual(
		json.__data.email,
		"charlie@peanuts.com",
		"Should serialize email",
	);
	strictEqual(json.__data.additional, "", "Should serialize additional");
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocAuthorTag - serialization without email", () => {
	const tag = new JSDocAuthorTag("Anonymous Developer");
	const json = tag.toJSON();

	strictEqual(json.__type, "author", "Should have correct type");
	strictEqual(
		json.__data.authorInfo,
		"Anonymous Developer",
		"Should serialize author info",
	);
	strictEqual(json.__data.name, "Anonymous Developer", "Should serialize name");
	strictEqual(json.__data.email, "", "Should serialize empty email");
	strictEqual(json.__data.additional, "", "Should serialize empty additional");
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocAuthorTag - HTML output", () => {
	const tag = new JSDocAuthorTag("David Miller <david@code.dev>");

	strictEqual(
		tag.toHTML(),
		'<div class="author-info"><strong class="author-label">Author:</strong> David Miller <david@code.dev></div>',
		"Should generate correct HTML output",
	);
});

test("JSDocAuthorTag - Markdown output", () => {
	const tag = new JSDocAuthorTag("Emma Watson <emma@scripts.org>");

	strictEqual(
		tag.toMarkdown(),
		"**Author:** Emma Watson <emma@scripts.org>",
		"Should generate correct Markdown output",
	);
});

test("JSDocAuthorTag - common author patterns", () => {
	// Corporate format
	const corpTag = new JSDocAuthorTag("Engineering Team <team@company.com>");
	strictEqual(
		corpTag.name,
		"Engineering Team",
		"Should handle corporate patterns",
	);
	strictEqual(
		corpTag.email,
		"team@company.com",
		"Should parse corporate email",
	);
	strictEqual(corpTag.isValid(), true, "Should be valid");

	// Academic format
	const acadTag = new JSDocAuthorTag(
		"Prof. Alan Turing <a.turing@cambridge.ac.uk>",
	);
	strictEqual(
		acadTag.name,
		"Prof. Alan Turing",
		"Should handle academic patterns",
	);
	strictEqual(
		acadTag.email,
		"a.turing@cambridge.ac.uk",
		"Should parse academic email",
	);
	strictEqual(acadTag.isValid(), true, "Should be valid");

	// Open source format
	const ossTag = new JSDocAuthorTag("developer123 <dev@opensource.io>");
	strictEqual(ossTag.name, "developer123", "Should handle OSS patterns");
	strictEqual(ossTag.email, "dev@opensource.io", "Should parse OSS email");
	strictEqual(ossTag.isValid(), true, "Should be valid");
});

test("JSDocAuthorTag - edge cases", () => {
	// Very long author info
	const longTag = new JSDocAuthorTag(
		"Very Long Author Name With Multiple Middle Names And Suffixes Jr. III <very.long.email.address@extremely.long.domain.name.example.com>",
	);
	strictEqual(longTag.isValid(), true, "Should handle very long author info");

	// Special characters in name
	const specialTag = new JSDocAuthorTag(
		"François Müller <françois@münchen.de>",
	);
	strictEqual(
		specialTag.name,
		"François Müller",
		"Should handle special characters",
	);
	strictEqual(
		specialTag.email,
		"françois@münchen.de",
		"Should parse international email",
	);
	strictEqual(specialTag.isValid(), true, "Should be valid");

	// Numbers and symbols
	const symbolTag = new JSDocAuthorTag("User_123 <user+tag@domain.co.uk>");
	strictEqual(symbolTag.name, "User_123", "Should handle numbers and symbols");
	strictEqual(
		symbolTag.email,
		"user+tag@domain.co.uk",
		"Should parse complex email",
	);
	strictEqual(symbolTag.isValid(), true, "Should be valid");
});
