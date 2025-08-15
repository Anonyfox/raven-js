import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
	DEFAULT_VALUES,
	HTML_TAGS,
	NODE_TYPES,
	REGEX_PATTERNS,
	VALIDATORS,
} from "./types.js";

describe("Markdown Types", () => {
	describe("NODE_TYPES", () => {
		it("should have all required node types", () => {
			const expectedTypes = [
				"paragraph",
				"heading",
				"list",
				"listItem",
				"blockquote",
				"codeBlock",
				"horizontalRule",
				"link",
				"image",
				"bold",
				"italic",
				"code",
				"text",
			];

			expectedTypes.forEach((type) => {
				assert.ok(
					Object.values(NODE_TYPES).includes(type),
					`Node type "${type}" should be defined`,
				);
			});
		});

		it("should have consistent property names", () => {
			const expectedKeys = [
				"PARAGRAPH",
				"HEADING",
				"LIST",
				"LIST_ITEM",
				"BLOCKQUOTE",
				"CODE_BLOCK",
				"HORIZONTAL_RULE",
				"LINK",
				"IMAGE",
				"BOLD",
				"ITALIC",
				"CODE",
				"TEXT",
			];

			expectedKeys.forEach((key) => {
				assert.ok(
					key in NODE_TYPES,
					`Property "${key}" should be defined in NODE_TYPES`,
				);
			});
		});

		it("should have unique values", () => {
			const values = Object.values(NODE_TYPES);
			const uniqueValues = new Set(values);
			assert.equal(
				values.length,
				uniqueValues.size,
				"All node type values should be unique",
			);
		});
	});

	describe("REGEX_PATTERNS", () => {
		it("should have all required regex patterns", () => {
			const expectedPatterns = [
				"HEADING",
				"UNORDERED_LIST",
				"ORDERED_LIST",
				"BLOCKQUOTE",
				"CODE_BLOCK_START",
				"CODE_BLOCK_END",
				"HORIZONTAL_RULE",
				"BOLD",
				"ITALIC",
				"INLINE_CODE",
				"LINK",
				"IMAGE",
				"WHITESPACE",
				"EMPTY_LINE",
			];

			expectedPatterns.forEach((pattern) => {
				assert.ok(
					pattern in REGEX_PATTERNS,
					`Regex pattern "${pattern}" should be defined`,
				);
			});
		});

		it("should have valid regex objects", () => {
			Object.entries(REGEX_PATTERNS).forEach(([name, pattern]) => {
				assert.ok(
					pattern instanceof RegExp,
					`Pattern "${name}" should be a RegExp object`,
				);
			});
		});

		describe("HEADING pattern", () => {
			it("should match valid headings", () => {
				const testCases = [
					"# Heading 1",
					"## Heading 2",
					"### Heading 3",
					"#### Heading 4",
					"##### Heading 5",
					"###### Heading 6",
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.HEADING);
					assert.ok(match, `Should match "${testCase}"`);
					assert.equal(match[1].length, testCase.indexOf(" "));
					assert.equal(match[2], testCase.substring(testCase.indexOf(" ") + 1));
				});
			});

			it("should not match invalid headings", () => {
				const testCases = [
					"#Heading 1", // No space
					"####### Heading 7", // Too many hashes
					"#", // No content
					"# ", // No content after space
					" Heading 1", // No hash
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.HEADING);
					assert.ok(!match, `Should not match "${testCase}"`);
				});
			});
		});

		describe("UNORDERED_LIST pattern", () => {
			it("should match valid unordered list items", () => {
				const testCases = [
					"- Item 1",
					"* Item 2",
					"- Another item",
					"* Yet another item",
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.UNORDERED_LIST);
					assert.ok(match, `Should match "${testCase}"`);
					assert.equal(match[1], testCase.substring(2));
				});
			});

			it("should not match invalid unordered list items", () => {
				const testCases = [
					"-Item 1", // No space
					"*Item 2", // No space
					"-", // No content
					"*", // No content
					" Item 1", // No marker
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.UNORDERED_LIST);
					assert.ok(!match, `Should not match "${testCase}"`);
				});
			});
		});

		describe("ORDERED_LIST pattern", () => {
			it("should match valid ordered list items", () => {
				const testCases = [
					"1. Item 1",
					"2. Item 2",
					"10. Item 10",
					"999. Very long number",
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.ORDERED_LIST);
					assert.ok(match, `Should match "${testCase}"`);
					assert.equal(match[1], testCase.split(".")[0]);
					assert.equal(match[2], testCase.substring(testCase.indexOf(" ") + 1));
				});
			});

			it("should not match invalid ordered list items", () => {
				const testCases = [
					"1.Item 1", // No space
					"0. Item 0", // Zero is not valid
					"1", // No content
					"1.", // No content after dot
					". Item 1", // No number
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.ORDERED_LIST);
					assert.ok(!match, `Should not match "${testCase}"`);
				});
			});
		});

		describe("BLOCKQUOTE pattern", () => {
			it("should match valid blockquotes", () => {
				const testCases = [
					"> This is a quote",
					"> Another quote",
					"> Quote with **bold** text",
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.BLOCKQUOTE);
					assert.ok(match, `Should match "${testCase}"`);
					assert.equal(match[1], testCase.substring(2));
				});
			});

			it("should not match invalid blockquotes", () => {
				const testCases = [
					">This is not a quote", // No space
					">", // No content
					"> ", // No content after space
					" This is not a quote", // No >
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.BLOCKQUOTE);
					assert.ok(!match, `Should not match "${testCase}"`);
				});
			});
		});

		describe("CODE_BLOCK patterns", () => {
			it("should match code block start", () => {
				const testCases = ["```", "```javascript", "```python", "```html"];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.CODE_BLOCK_START);
					assert.ok(match, `Should match "${testCase}"`);
					if (testCase.length > 3) {
						assert.equal(match[1], testCase.substring(3));
					} else {
						assert.equal(match[1], "");
					}
				});
			});

			it("should match code block end", () => {
				const testCases = ["```"];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.CODE_BLOCK_END);
					assert.ok(match, `Should match "${testCase}"`);
				});
			});

			it("should not match invalid code block patterns", () => {
				const invalidStarts = [
					"``", // Too few backticks
					"````", // Too many backticks
					"``` ", // Space after backticks
				];

				invalidStarts.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.CODE_BLOCK_START);
					assert.ok(!match, `Should not match "${testCase}"`);
				});
			});
		});

		describe("HORIZONTAL_RULE pattern", () => {
			it("should match valid horizontal rules", () => {
				const testCases = ["---", "----", "-----", "------"];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.HORIZONTAL_RULE);
					assert.ok(match, `Should match "${testCase}"`);
				});
			});

			it("should not match invalid horizontal rules", () => {
				const testCases = [
					"--", // Too few dashes
					"--- ", // Space after dashes
					" ---", // Space before dashes
					"---a", // Character after dashes
				];

				testCases.forEach((testCase) => {
					const match = testCase.match(REGEX_PATTERNS.HORIZONTAL_RULE);
					assert.ok(!match, `Should not match "${testCase}"`);
				});
			});
		});

		describe("Inline patterns", () => {
			describe("BOLD pattern", () => {
				it("should match bold text", () => {
					const text = "This is **bold** text and **more bold** text";
					const matches = [...text.matchAll(REGEX_PATTERNS.BOLD)];
					assert.equal(matches.length, 2);
					assert.equal(matches[0][1], "bold");
					assert.equal(matches[1][1], "more bold");
				});
			});

			describe("ITALIC pattern", () => {
				it("should match italic text", () => {
					const text = "This is *italic* text and *more italic* text";
					const matches = [...text.matchAll(REGEX_PATTERNS.ITALIC)];
					assert.equal(matches.length, 2);
					assert.equal(matches[0][1], "italic");
					assert.equal(matches[1][1], "more italic");
				});
			});

			describe("INLINE_CODE pattern", () => {
				it("should match inline code", () => {
					const text = "This is `code` and `more code`";
					const matches = [...text.matchAll(REGEX_PATTERNS.INLINE_CODE)];
					assert.equal(matches.length, 2);
					assert.equal(matches[0][1], "code");
					assert.equal(matches[1][1], "more code");
				});
			});

			describe("LINK pattern", () => {
				it("should match links", () => {
					const text =
						"This is a [link](https://example.com) and [another](https://test.com)";
					const matches = [...text.matchAll(REGEX_PATTERNS.LINK)];
					assert.equal(matches.length, 2);
					assert.equal(matches[0][1], "link");
					assert.equal(matches[0][2], "https://example.com");
					assert.equal(matches[1][1], "another");
					assert.equal(matches[1][2], "https://test.com");
				});
			});

			describe("IMAGE pattern", () => {
				it("should match images", () => {
					const text =
						"This is an ![image](https://example.com/img.png) and ![alt](https://test.com/img.jpg)";
					const matches = [...text.matchAll(REGEX_PATTERNS.IMAGE)];
					assert.equal(matches.length, 2);
					assert.equal(matches[0][1], "image");
					assert.equal(matches[0][2], "https://example.com/img.png");
					assert.equal(matches[1][1], "alt");
					assert.equal(matches[1][2], "https://test.com/img.jpg");
				});
			});
		});

		describe("Utility patterns", () => {
			describe("WHITESPACE pattern", () => {
				it("should match whitespace-only lines", () => {
					const testCases = ["", " ", "  ", "\t", "\n", "\r\n"];

					testCases.forEach((testCase) => {
						const match = testCase.match(REGEX_PATTERNS.WHITESPACE);
						assert.ok(match, `Should match "${testCase}"`);
					});
				});

				it("should not match lines with content", () => {
					const testCases = ["a", " a", "a ", " a ", "text"];

					testCases.forEach((testCase) => {
						const match = testCase.match(REGEX_PATTERNS.WHITESPACE);
						assert.ok(!match, `Should not match "${testCase}"`);
					});
				});
			});

			describe("EMPTY_LINE pattern", () => {
				it("should match empty lines", () => {
					const testCases = [""];

					testCases.forEach((testCase) => {
						const match = testCase.match(REGEX_PATTERNS.EMPTY_LINE);
						assert.ok(match, `Should match "${testCase}"`);
					});
				});

				it("should not match non-empty lines", () => {
					const testCases = [" ", "a", "text", "  "];

					testCases.forEach((testCase) => {
						const match = testCase.match(REGEX_PATTERNS.EMPTY_LINE);
						assert.ok(!match, `Should not match "${testCase}"`);
					});
				});
			});
		});
	});

	describe("HTML_TAGS", () => {
		it("should have tags for all node types", () => {
			Object.values(NODE_TYPES).forEach((nodeType) => {
				assert.ok(
					nodeType in HTML_TAGS,
					`HTML tag should be defined for node type "${nodeType}"`,
				);
			});
		});

		it("should have correct tag mappings", () => {
			const expectedMappings = {
				[NODE_TYPES.PARAGRAPH]: "p",
				[NODE_TYPES.LIST_ITEM]: "li",
				[NODE_TYPES.BLOCKQUOTE]: "blockquote",
				[NODE_TYPES.CODE_BLOCK]: "pre",
				[NODE_TYPES.HORIZONTAL_RULE]: "hr",
				[NODE_TYPES.LINK]: "a",
				[NODE_TYPES.IMAGE]: "img",
				[NODE_TYPES.BOLD]: "strong",
				[NODE_TYPES.ITALIC]: "em",
				[NODE_TYPES.CODE]: "code",
				[NODE_TYPES.TEXT]: null,
			};

			Object.entries(expectedMappings).forEach(([nodeType, expectedTag]) => {
				assert.equal(
					HTML_TAGS[nodeType],
					expectedTag,
					`Node type "${nodeType}" should map to "${expectedTag}"`,
				);
			});
		});

		it("should handle special cases correctly", () => {
			// Heading tag should be "h" (will be combined with level)
			assert.equal(HTML_TAGS[NODE_TYPES.HEADING], "h");

			// List tag should be "ul" (will be overridden for ordered lists)
			assert.equal(HTML_TAGS[NODE_TYPES.LIST], "ul");

			// Text should have no tag
			assert.equal(HTML_TAGS[NODE_TYPES.TEXT], null);
		});
	});

	describe("DEFAULT_VALUES", () => {
		it("should have all required default values", () => {
			const expectedDefaults = [
				"HEADING_LEVEL",
				"LIST_ORDERED",
				"CODE_LANGUAGE",
				"LINK_URL",
				"IMAGE_ALT",
			];

			expectedDefaults.forEach((key) => {
				assert.ok(
					key in DEFAULT_VALUES,
					`Default value "${key}" should be defined`,
				);
			});
		});

		it("should have correct default values", () => {
			assert.equal(DEFAULT_VALUES.HEADING_LEVEL, 1);
			assert.equal(DEFAULT_VALUES.LIST_ORDERED, false);
			assert.equal(DEFAULT_VALUES.CODE_LANGUAGE, "");
			assert.equal(DEFAULT_VALUES.LINK_URL, "#");
			assert.equal(DEFAULT_VALUES.IMAGE_ALT, "");
		});
	});

	describe("VALIDATORS", () => {
		describe("isValidNodeType", () => {
			it("should validate valid node types", () => {
				Object.values(NODE_TYPES).forEach((nodeType) => {
					assert.ok(
						VALIDATORS.isValidNodeType(nodeType),
						`Node type "${nodeType}" should be valid`,
					);
				});
			});

			it("should reject invalid node types", () => {
				const invalidTypes = [
					"invalid",
					"",
					null,
					undefined,
					"paragraphs", // Plural
					"HEADING", // Wrong case
				];

				invalidTypes.forEach((nodeType) => {
					assert.ok(
						!VALIDATORS.isValidNodeType(nodeType),
						`Node type "${nodeType}" should be invalid`,
					);
				});
			});
		});

		describe("isValidHeadingLevel", () => {
			it("should validate valid heading levels", () => {
				for (let i = 1; i <= 6; i++) {
					assert.ok(
						VALIDATORS.isValidHeadingLevel(i),
						`Heading level ${i} should be valid`,
					);
				}
			});

			it("should reject invalid heading levels", () => {
				const invalidLevels = [
					0, // Too low
					7, // Too high
					-1, // Negative
					1.5, // Float
					"1", // String
					null,
					undefined,
				];

				invalidLevels.forEach((level) => {
					assert.ok(
						!VALIDATORS.isValidHeadingLevel(level),
						`Heading level ${level} should be invalid`,
					);
				});
			});
		});

		describe("isValidUrl", () => {
			it("should validate valid URLs", () => {
				const validUrls = [
					"https://example.com",
					"http://test.com",
					"ftp://files.com",
					"#anchor",
					"/relative/path",
					"mailto:user@example.com",
				];

				validUrls.forEach((url) => {
					assert.ok(VALIDATORS.isValidUrl(url), `URL "${url}" should be valid`);
				});
			});

			it("should reject invalid URLs", () => {
				const invalidUrls = [
					"", // Empty
					null,
					undefined,
					123, // Number
					{}, // Object
					[], // Array
				];

				invalidUrls.forEach((url) => {
					assert.ok(
						!VALIDATORS.isValidUrl(url),
						`URL "${url}" should be invalid`,
					);
				});
			});
		});

		describe("isValidContent", () => {
			it("should validate valid string content", () => {
				const validStrings = ["text", "123", " ", ""];

				validStrings.forEach((content) => {
					assert.ok(
						VALIDATORS.isValidContent(content),
						`String content "${content}" should be valid`,
					);
				});
			});

			it("should validate valid array content", () => {
				const validArrays = [
					[{ type: "text", content: "hello" }],
					[{ type: "bold", content: "bold text" }],
					[], // Empty array is valid
				];

				validArrays.forEach((content) => {
					assert.ok(
						VALIDATORS.isValidContent(content),
						`Array content should be valid`,
					);
				});
			});

			it("should reject invalid content", () => {
				const invalidContent = [
					null,
					undefined,
					123, // Number
					{}, // Object
					true, // Boolean
					false, // Boolean
				];

				invalidContent.forEach((content) => {
					assert.ok(
						!VALIDATORS.isValidContent(content),
						`Content ${content} should be invalid`,
					);
				});
			});
		});
	});
});
