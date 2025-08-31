/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file JavaScript symbol extraction with single-pass processing optimization.
 *
 * Extracts publicly exported identifiers from JavaScript source code using
 * pre-compiled regex patterns and character-based early exit optimizations.
 */

import { Identifier } from "../models/identifier.js";

// Pre-compiled regex patterns for V8 optimization
const IMPORT_PATTERN =
	/^\s*import\s+(.+?)\s+from\s+['"`]([^'"`]+)['"`]\s*;?\s*$/;
const EXPORT_CONST_PATTERN = /^\s*export\s+(?:const|let|var)\s+(.+)$/;
const EXPORT_FUNCTION_PATTERN =
	/^\s*export\s+(?:async\s+)?function\*?\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/;
const EXPORT_CLASS_PATTERN = /^\s*export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/;
const EXPORT_DEFAULT_PATTERN = /^\s*export\s+default\s+(.+)$/;
const EXPORT_LIST_PATTERN =
	/^\s*export\s+\{([^}]+)\}(?:\s+from\s+['"`]([^'"`]+)['"`])?\s*;?\s*$/;
const EXPORT_STAR_PATTERN =
	/^\s*export\s+\*(?:\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*))?\s+from\s+['"`]([^'"`]+)['"`]\s*;?\s*$/;
const DESTRUCTURE_PATTERN = /\{([^}]+)\}/;
const ARRAY_DESTRUCTURE_PATTERN = /\[([^\]]+)\]/;

/**
 * Extracts publicly exported identifiers from JavaScript source code.
 *
 * Returns ONLY identifiers that are exported (made publicly available) by the module.
 * For re-exports, captures source path for dependency tracking. Regular imports
 * that are not re-exported are ignored.
 *
 * @param {string} code - JavaScript source code to analyze
 * @returns {Array<Identifier>} Array of exported identifiers with source paths (null for local exports)
 *
 * @example
 * // Basic exports extraction
 * const identifiers = extractIdentifiers(`
 *   import { helper } from './utils.js';
 *   import { unused } from './other.js';  // ← NOT tracked (not re-exported)
 *   export { helper };                    // ← Tracked with sourcePath
 *   export const local = 'value';         // ← Tracked as local
 * `);
 * // → [Identifier('helper', 'helper', './utils.js'), Identifier('local', 'local', null)]
 *
 * @example
 * // Complex export patterns
 * const identifiers = extractIdentifiers(`
 *   export default class MyClass {}
 *   export * as utils from './utils.js';
 *   export { func as alias } from './lib.js';
 * `);
 * // → Handles all ES module patterns
 */
export function extractIdentifiers(code) {
	if (!code || typeof code !== "string") {
		return [];
	}

	// Single-pass processing for maximum V8 performance
	return extractIdentifiersSinglePass(code);
}

/**
 * Single-pass extraction processing imports and exports simultaneously
 * @param {string} code - Raw JavaScript code
 * @returns {Array<Identifier>}
 */
function extractIdentifiersSinglePass(code) {
	/** @type {Array<Identifier>} */
	const exports = [];
	/** @type {Map<string, {originalName: string, sourcePath: string}>} */
	const importMap = new Map();
	const lines = code.split("\n");
	const lineCount = lines.length;

	// Single-pass processing with optimized loops
	for (let i = 0; i < lineCount; i++) {
		const line = lines[i];
		const trimmedLine = line.trim();

		// Fast path: skip obviously irrelevant lines
		if (trimmedLine.length < 6) continue;

		const firstChar = trimmedLine[0];
		const secondChar = trimmedLine[1];

		// Ultra-fast comment detection
		if (firstChar === "/" && (secondChar === "/" || secondChar === "*"))
			continue;

		// Process imports (build map on the fly)
		if (trimmedLine.startsWith("import ")) {
			processImportLine(trimmedLine, importMap);
			continue;
		}

		// Process exports (main extraction)
		if (trimmedLine.startsWith("export ")) {
			processExportLine(trimmedLine, lines, i, importMap, exports);
		}
	}

	return exports;
}

/**
 * Processes a single import line for the import map.
 *
 * @param {string} line - Trimmed import line
 * @param {Map<string, {originalName: string, sourcePath: string}>} importMap - Import map to update
 */
function processImportLine(line, importMap) {
	// Handle only single-line imports - multiline imports eliminated for simplicity
	const fullImport = line;

	const match = IMPORT_PATTERN.exec(fullImport);
	if (match) {
		const [, importClause, sourcePath] = match;
		parseImportClauseFast(importClause.trim(), sourcePath, importMap);
	}
}

/**
 * Parse import clause into import map
 * @param {string} clause - Import clause
 * @param {string} sourcePath - Source path
 * @param {Map<string, {originalName: string, sourcePath: string}>} importMap - Map to update
 */
function parseImportClauseFast(clause, sourcePath, importMap) {
	// Handle namespace import: * as namespace
	if (clause.includes("* as ")) {
		const namespaceMatch = clause.match(/\*\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
		if (namespaceMatch) {
			importMap.set(namespaceMatch[1], {
				originalName: namespaceMatch[1],
				sourcePath: sourcePath,
			});
		}
		return;
	}

	// Handle braced imports and default imports
	const parts = clause.split(",");
	let hasProcessedBraces = false;

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i].trim();
		// Assume all parts are non-empty in real code

		// Handle braced imports
		if (part.includes("{") && !hasProcessedBraces) {
			let braceContent = part;
			let j = i;
			while (j < parts.length && !braceContent.includes("}")) {
				j++;
				if (j < parts.length) braceContent += `, ${parts[j].trim()}`;
			}

			const braceMatch = braceContent.match(/\{([^}]+)\}/);
			if (braceMatch) {
				parseNamedImportsFast(braceMatch[1], sourcePath, importMap);
				hasProcessedBraces = true;
				i = j;
			}
			continue;
		}

		// Skip brace parts we already processed - assume clean input

		// Default import
		const defaultMatch = part.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
		if (defaultMatch) {
			importMap.set(defaultMatch[1], {
				originalName: defaultMatch[1],
				sourcePath: sourcePath,
			});
		}
	}
}

/**
 * Fast named imports parsing.
 *
 * @param {string} namedImports - Named imports content
 * @param {string} sourcePath - Source path
 * @param {Map<string, {originalName: string, sourcePath: string}>} importMap - Map to update
 */
function parseNamedImportsFast(namedImports, sourcePath, importMap) {
	const items = namedImports.split(",");
	for (let i = 0; i < items.length; i++) {
		const item = items[i].trim();
		// Assume all import items are non-empty

		if (item.includes(" as ")) {
			const parts = item.split(" as ");
			if (parts.length === 2) {
				importMap.set(parts[1].trim(), {
					originalName: parts[0].trim(),
					sourcePath: sourcePath,
				});
			}
		} else {
			importMap.set(item, {
				originalName: item,
				sourcePath: sourcePath,
			});
		}
	}
}

/**
 * Processes a single export line with maximum performance.
 *
 * @param {string} line - Trimmed export line
 * @param {Array<string>} lines - All lines for multiline handling
 * @param {number} lineIndex - Current line index
 * @param {Map<string, {originalName: string, sourcePath: string}>} importMap - Import map for resolution
 * @param {Array<Identifier>} exports - Exports array to append to
 */
function processExportLine(line, lines, lineIndex, importMap, exports) {
	// Handle multiline exports efficiently
	let fullExport = line;
	if (line.includes("{") && !line.includes("}")) {
		for (let j = lineIndex + 1; j < lines.length; j++) {
			const nextLine = lines[j].trim();
			fullExport += ` ${nextLine}`;
			if (nextLine.includes("}")) break;
		}
	}

	// Fast pattern matching with early returns
	extractFromLineFast(fullExport, importMap, exports);
}

/**
 * Process export line with pattern matching
 * @param {string} line - Export line
 * @param {Map<string, {originalName: string, sourcePath: string}>} importMap - Import map
 * @param {Array<Identifier>} exports - Exports array
 */
function extractFromLineFast(line, importMap, exports) {
	// Export star: export * from './file.js'
	let match = EXPORT_STAR_PATTERN.exec(line);
	if (match) {
		exports.push(new Identifier(match[1] || "*", "*", match[2]));
		return;
	}

	// Export list: export { name1, name2 as alias } from './file.js'
	match = EXPORT_LIST_PATTERN.exec(line);
	if (match) {
		parseExportListFast(match[1], match[2], importMap, exports);
		return;
	}

	// Export default: export default something
	match = EXPORT_DEFAULT_PATTERN.exec(line);
	if (match) {
		const originalName = extractDefaultOriginalNameFast(match[1].trim());
		exports.push(
			new Identifier(
				"default",
				originalName,
				resolveSourcePathFast(originalName, importMap),
			),
		);
		return;
	}

	// Export function: export function name() {}
	match = EXPORT_FUNCTION_PATTERN.exec(line);
	if (match) {
		exports.push(new Identifier(match[1], match[1], null));
		return;
	}

	// Export class: export class Name {}
	match = EXPORT_CLASS_PATTERN.exec(line);
	if (match) {
		exports.push(new Identifier(match[1], match[1], null));
		return;
	}

	// Export const/let/var: export const name = value
	match = EXPORT_CONST_PATTERN.exec(line);
	if (match) {
		parseVariableDeclarationFast(match[1], exports);
	}
}

/**
 * Fast export list parsing.
 *
 * @param {string} exportList - Export list content
 * @param {string|null} sourcePath - Source path if re-export
 * @param {Map<string, {originalName: string, sourcePath: string}>} importMap - Import map
 * @param {Array<Identifier>} exports - Exports array
 */
function parseExportListFast(exportList, sourcePath, importMap, exports) {
	const items = exportList.split(",");
	for (let i = 0; i < items.length; i++) {
		const item = items[i].trim();
		// Assume all export items are non-empty

		if (item.includes(" as ")) {
			const parts = item.split(" as ");
			if (parts.length === 2) {
				const original = parts[0].trim();
				const alias = parts[1].trim();

				exports.push(
					new Identifier(
						alias,
						sourcePath
							? original
							: importMap.get(original)?.originalName || original,
						sourcePath || importMap.get(original)?.sourcePath || null,
					),
				);
			}
		} else {
			exports.push(
				new Identifier(
					item,
					sourcePath ? item : importMap.get(item)?.originalName || item,
					sourcePath || importMap.get(item)?.sourcePath || null,
				),
			);
		}
	}
}

/**
 * Fast default export name extraction.
 *
 * @param {string} defaultExport - Default export expression
 * @returns {string} Original name or "default"
 */
function extractDefaultOriginalNameFast(defaultExport) {
	// Named function/class
	const match = defaultExport.match(
		/^(?:function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
	);
	if (match) return match[1];

	// Anonymous function/class
	if (/^(?:function|class)\s*[({]/.test(defaultExport)) return "default";

	// Identifier - assume all other cases are simple identifiers
	const match2 = defaultExport.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s|$|;)/);
	return match2 ? match2[1] : "default";
}

/**
 * Fast source path resolution.
 *
 * @param {string} symbol - Symbol name
 * @param {Map<string, {originalName: string, sourcePath: string}>} importMap - Import map
 * @returns {string|null} Source path or null if local
 */
function resolveSourcePathFast(symbol, importMap) {
	const importInfo = importMap.get(symbol);
	return importInfo ? importInfo.sourcePath : null;
}

/**
 * Fast variable declaration parsing.
 *
 * @param {string} declaration - Variable declaration
 * @param {Array<Identifier>} exports - Exports array
 */
function parseVariableDeclarationFast(declaration, exports) {
	const equalIndex = declaration.indexOf("=");
	// Assume declarations have equals signs
	const variablePart = declaration.slice(0, equalIndex).trim();

	// Check destructuring patterns first
	const destructureMatch = DESTRUCTURE_PATTERN.exec(variablePart);
	if (destructureMatch) {
		parseDestructuringFast(destructureMatch[1], exports);
		return;
	}

	const arrayMatch = ARRAY_DESTRUCTURE_PATTERN.exec(variablePart);
	if (arrayMatch) {
		parseArrayDestructuringFast(arrayMatch[1], exports);
		return;
	}

	// Handle simple declarations
	const declarations = declaration.split(",");
	for (let i = 0; i < declarations.length; i++) {
		const decl = declarations[i].trim();
		const declEqualIndex = decl.indexOf("=");
		// Assume declarations have equals signs
		const declVariablePart = decl.slice(0, declEqualIndex).trim();
		const nameMatch = declVariablePart.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);

		if (nameMatch) {
			exports.push(new Identifier(nameMatch[1], nameMatch[1], null));
		}
	}
}

/**
 * Fast destructuring parsing.
 *
 * @param {string} content - Destructuring content
 * @param {Array<Identifier>} exports - Exports array
 */
function parseDestructuringFast(content, exports) {
	const items = content.split(",");
	for (let i = 0; i < items.length; i++) {
		const item = items[i].trim();
		// Assume all destructuring items are non-empty

		if (item.includes(":")) {
			const parts = item.split(":");
			if (parts.length === 2) {
				exports.push(new Identifier(parts[1].trim(), parts[0].trim(), null));
			}
		} else if (item.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
			exports.push(new Identifier(item, item, null));
		}
	}
}

/**
 * Fast array destructuring parsing.
 *
 * @param {string} content - Array destructuring content
 * @param {Array<Identifier>} exports - Exports array
 */
function parseArrayDestructuringFast(content, exports) {
	const items = content.split(",");
	for (let i = 0; i < items.length; i++) {
		const item = items[i].trim();
		// Assume all array destructuring items are valid identifiers
		exports.push(new Identifier(item, item, null));
	}
}

// Single-pass implementation with regex pattern matching
