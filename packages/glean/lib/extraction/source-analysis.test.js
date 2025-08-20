/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { extractSourceSnippet, findClosingBrace } from "./source-analysis.js";

test("extractSourceSnippet - comprehensive branch coverage", () => {
	const testLines = [
		"// File header",
		"export function testFunc() {",
		"  return true;",
		"}",
		"",
		"export class TestClass {",
		"  constructor() {",
		"    this.value = 42;",
		"  }",
		"  method() {",
		"    return this.value;",
		"  }",
		"}",
		"",
		"export const testVar = 'hello';",
		"export const multiLine = {",
		"  key: 'value'",
		"};",
		"// End of file",
	];

	// Test function type - should find closing brace at line 3 (index 3)
	strictEqual(
		extractSourceSnippet(testLines, 2, "function"), // testFunc at line 2
		"export function testFunc() {\n  return true;\n}",
	);

	// Test class type - should find closing brace at line 12 (index 12)
	strictEqual(
		extractSourceSnippet(testLines, 6, "class"), // TestClass at line 6
		"export class TestClass {\n  constructor() {\n    this.value = 42;\n  }\n  method() {\n    return this.value;\n  }\n}",
	);

	// Test variable type - should use +2 lines (startIndex + 2 + 1 = 3 lines total)
	strictEqual(
		extractSourceSnippet(testLines, 15, "variable"), // testVar at line 15
		"export const testVar = 'hello';\nexport const multiLine = {\n  key: 'value'",
	);

	// Test const type - should use +2 lines (startIndex + 2 + 1 = 3 lines total)
	strictEqual(
		extractSourceSnippet(testLines, 16, "const"),
		"export const multiLine = {\n  key: 'value'\n};",
	);

	// Test function without closing brace - should fallback to +5 lines
	const unclosedLines = [
		"export function unclosed() {",
		"  console.log('test');",
		"  // Missing closing brace",
		"  console.log('more');",
		"  console.log('even more');",
		"  console.log('and more');",
		"  console.log('final');",
	];

	strictEqual(
		extractSourceSnippet(unclosedLines, 1, "function"),
		"export function unclosed() {\n  console.log('test');\n  // Missing closing brace\n  console.log('more');\n  console.log('even more');\n  console.log('and more');",
	);

	// Test class without closing brace - should fallback to +10 lines
	strictEqual(
		extractSourceSnippet(unclosedLines, 1, "class"),
		unclosedLines.join("\n"), // All 7 lines (less than 10+1 fallback)
	);

	// Test edge case - entityLine at start of file
	strictEqual(
		extractSourceSnippet(testLines, 1, "variable"),
		"// File header\nexport function testFunc() {\n  return true;",
	);

	// Test edge case - entityLine near end of file
	strictEqual(
		extractSourceSnippet(testLines, 19, "variable"), // Line 19 (last line)
		"// End of file",
	);

	// Test edge case - entityLine beyond file (should handle gracefully)
	strictEqual(
		extractSourceSnippet(testLines, 25, "variable"),
		"", // Should return empty string when startIndex beyond array
	);
});

test("findClosingBrace - comprehensive branch coverage", () => {
	const testLines = [
		"function test() {", // 0: open brace
		"  if (true) {", // 1: nested open
		"    return false;", // 2
		"  }", // 3: nested close
		"}", // 4: main close
		"", // 5
		"const obj = { key: 'val' };", // 6: same-line braces
		"// Comment with { brace", // 7: brace in comment
		"function unclosed() {", // 8: never closed
		"  console.log('test');", // 9
	];

	// Test normal function with proper closing
	strictEqual(findClosingBrace(testLines, 0), 4);

	// Test nested braces - should find the matching outer brace
	strictEqual(findClosingBrace(testLines, 0), 4);

	// Test same-line braces
	strictEqual(findClosingBrace(testLines, 6), 6);

	// Test starting from nested brace
	strictEqual(findClosingBrace(testLines, 1), 3);

	// Test unclosed function - should return null
	strictEqual(findClosingBrace(testLines, 8), null);

	// Test no opening brace found - should return null
	const noBraceLines = ["console.log('no braces');", "return true;"];
	strictEqual(findClosingBrace(noBraceLines, 0), null);

	// Test empty lines array
	strictEqual(findClosingBrace([], 0), null);

	// Test startIndex beyond array length
	strictEqual(findClosingBrace(testLines, 20), null);

	// Test line with only closing brace (no opening brace found first)
	const onlyClosingLines = ["}", "  return;"];
	strictEqual(findClosingBrace(onlyClosingLines, 0), null);

	// Test complex nested structure
	const complexLines = [
		"class Complex {", // 0: open
		"  method() {", // 1: nested open
		"    if (condition) {", // 2: double nested
		"      while (true) {", // 3: triple nested
		"        break;", // 4
		"      }", // 5: triple close
		"    }", // 6: double close
		"  }", // 7: nested close
		"}", // 8: main close
	];

	strictEqual(findClosingBrace(complexLines, 0), 8); // Full class
	strictEqual(findClosingBrace(complexLines, 1), 7); // Method
	strictEqual(findClosingBrace(complexLines, 2), 6); // If block
	strictEqual(findClosingBrace(complexLines, 3), 5); // While loop
});
