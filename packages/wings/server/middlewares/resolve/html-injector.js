/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTML injection utilities for import map script tags.
 *
 * Implements HTML parsing and modification for injecting import map script tags
 * into HTML documents. Provides flexible injection strategies, handles existing
 * import maps, and maintains HTML document integrity. Zero-dependency implementation
 * using efficient regex-based parsing for maximum performance.
 *
 * Injection strategies:
 * - head-start: Beginning of <head> section
 * - head-end: End of <head> section (default)
 * - body-start: Beginning of <body> section
 * - before-scripts: Before existing script tags
 */

/**
 * Injects an import map script tag into HTML content.
 *
 * Parses HTML content and injects import map script tags at the specified
 * location. Handles various HTML document structures, manages existing import
 * maps, and preserves document formatting. Essential for zero-build ESM
 * development workflows.
 *
 * **Injection Strategy**: Intelligently selects injection points based on
 * document structure and user preferences with fallback mechanisms.
 *
 * @param {string} htmlContent - HTML content to modify
 * @param {Object} importMap - Import map object to inject
 * @param {Object} [options={}] - Injection options
 * @param {string} [options.strategy='head-end'] - Injection strategy
 * @param {string} [options.existingMapStrategy='replace'] - How to handle existing import maps
 * @param {boolean} [options.preserveFormatting=true] - Maintain HTML formatting
 * @param {string} [options.indent='  '] - Indentation for injected script
 * @param {boolean} [options.minify=false] - Minify the import map JSON
 * @returns {{success: boolean, html?: string, injectionPoint?: string, error?: string}}
 *
 * @example
 * ```javascript
 * const importMap = { imports: { "lodash": "/node_modules/lodash/index.js" } };
 * const result = injectImportMap(htmlContent, importMap, { strategy: 'head-end' });
 * if (result.success) {
 *   console.log('Injected at:', result.injectionPoint);
 * }
 * ```
 */
export function injectImportMap(htmlContent, importMap, options = {}) {
	const {
		strategy = "head-end",
		existingMapStrategy = "replace",
		preserveFormatting = true,
		indent = "  ",
		minify = false,
	} = options;

	try {
		// Validate inputs
		if (typeof htmlContent !== "string" || htmlContent.length === 0) {
			return {
				success: false,
				error: "Invalid HTML content",
			};
		}

		if (!importMap || typeof importMap !== "object" || !importMap.imports) {
			return {
				success: false,
				error: "Invalid import map",
			};
		}

		// Handle existing import maps
		let processedHtml = htmlContent;
		let finalImportMap = importMap;

		const existingMaps = extractExistingImportMaps(htmlContent);
		if (existingMaps.length > 0) {
			const result = handleExistingImportMaps(
				processedHtml,
				finalImportMap,
				existingMaps,
				existingMapStrategy,
			);
			if (!result.success) {
				return result;
			}
			processedHtml = result.html;
			finalImportMap = result.importMap;
		}

		// Find injection point
		const injectionResult = findInjectionPoint(processedHtml, strategy);
		if (!injectionResult.success) {
			return injectionResult;
		}

		// Create import map script tag
		const scriptTag = createImportMapScript(finalImportMap, {
			indent,
			minify,
			preserveFormatting,
		});

		// Inject the script tag
		const injectedHtml = injectAtPosition(
			processedHtml,
			scriptTag,
			injectionResult.position,
			injectionResult.insertMode,
			{ preserveFormatting, indent },
		);

		return {
			success: true,
			html: injectedHtml,
			injectionPoint: injectionResult.location,
		};
	} catch {
		return {
			success: false,
			error: "HTML injection failed",
		};
	}
}

/**
 * Finds the optimal injection point in HTML content.
 *
 * Analyzes HTML structure to determine the best location for import map
 * injection based on the specified strategy. Uses intelligent fallback
 * mechanisms to ensure successful injection even with malformed HTML.
 *
 * **Strategy Priority**: Attempts primary strategy first, then falls back
 * to alternative locations to guarantee injection success.
 *
 * @param {string} htmlContent - HTML content to analyze
 * @param {string} strategy - Injection strategy
 * @returns {{success: boolean, position?: number, location?: string, insertMode?: string}}
 *
 * @example
 * ```javascript
 * const result = findInjectionPoint(htmlContent, 'head-end');
 * // Returns: { success: true, position: 245, location: 'head-end', insertMode: 'before' }
 * ```
 */
export function findInjectionPoint(htmlContent, strategy) {
	try {
		// Strategy implementations with fallbacks
		const strategies = {
			"head-start": () => findHeadStart(htmlContent),
			"head-end": () => findHeadEnd(htmlContent),
			"body-start": () => findBodyStart(htmlContent),
			"before-scripts": () => findBeforeScripts(htmlContent),
		};

		// Try primary strategy
		if (strategies[strategy]) {
			const result = strategies[strategy]();
			if (result.success) {
				return result;
			}
		}

		// Fallback strategies in priority order
		const fallbacks = [
			"head-end",
			"head-start",
			"body-start",
			"before-scripts",
		];
		for (const fallback of fallbacks) {
			if (fallback !== strategy && strategies[fallback]) {
				const result = strategies[fallback]();
				if (result.success) {
					return {
						...result,
						location: `${fallback} (fallback)`,
					};
				}
			}
		}

		// Last resort: inject at beginning of document
		return {
			success: true,
			position: 0,
			location: "document-start (fallback)",
			insertMode: "after",
		};
	} catch {
		return {
			success: false,
			error: "Failed to find injection point",
		};
	}
}

/**
 * Creates an import map script tag with proper formatting.
 *
 * Generates a well-formatted script tag containing the import map JSON.
 * Handles indentation, minification, and formatting options to match
 * the surrounding HTML document style.
 *
 * **Formatting**: Maintains consistent indentation and line breaks
 * for readable HTML output in development environments.
 *
 * @param {Object} importMap - Import map object
 * @param {Object} [options={}] - Formatting options
 * @param {string} [options.indent='  '] - Indentation string
 * @param {boolean} [options.minify=false] - Minify JSON output
 * @param {boolean} [options.preserveFormatting=true] - Maintain formatting
 * @returns {string} Formatted script tag HTML
 *
 * @example
 * ```javascript
 * const script = createImportMapScript(importMap, { indent: '  ', minify: false });
 * // Returns: '<script type="importmap">\n  {\n    "imports": {...}\n  }\n</script>'
 * ```
 */
export function createImportMapScript(importMap, options = {}) {
	const { indent = "  ", minify = false, preserveFormatting = true } = options;

	try {
		let jsonContent;
		if (minify) {
			jsonContent = JSON.stringify(importMap);
		} else {
			jsonContent = JSON.stringify(importMap, null, preserveFormatting ? 2 : 0);
		}

		if (preserveFormatting && !minify) {
			// Add proper indentation to each line
			const lines = jsonContent.split("\n");
			const indentedLines = lines.map((line, index) => {
				if (index === 0 || index === lines.length - 1) {
					return indent + line;
				}
				return indent + line;
			});

			return `<script type="importmap">\n${indentedLines.join("\n")}\n</script>`;
		}

		return `<script type="importmap">${jsonContent}</script>`;
	} catch {
		// Fallback to basic script tag
		return '<script type="importmap">{}</script>';
	}
}

/**
 * Extracts existing import map script tags from HTML.
 *
 * Parses HTML content to find and extract existing import map script tags.
 * Returns both the import map data and location information for replacement
 * or merging operations.
 *
 * **Detection**: Uses robust regex patterns to identify import map scripts
 * regardless of formatting or attribute order variations.
 *
 * @param {string} htmlContent - HTML content to parse
 * @returns {Array<{importMap: Object, start: number, end: number, content: string}>}
 *
 * @example
 * ```javascript
 * const existing = extractExistingImportMaps(htmlContent);
 * // Returns: [{ importMap: {...}, start: 123, end: 456, content: '<script>...</script>' }]
 * ```
 */
export function extractExistingImportMaps(htmlContent) {
	try {
		const importMaps = [];

		// Regex to match import map script tags (flexible with attributes and whitespace)
		const scriptRegex =
			/<script[^>]*type\s*=\s*["']importmap["'][^>]*>([\s\S]*?)<\/script>/gi;
		let match;

		while (true) {
			match = scriptRegex.exec(htmlContent);
			if (match === null) break;
			const [fullMatch, jsonContent] = match;
			const start = match.index;
			const end = start + fullMatch.length;

			try {
				// Parse the JSON content
				const trimmedContent = jsonContent.trim();
				if (trimmedContent) {
					const importMap = JSON.parse(trimmedContent);
					importMaps.push({
						importMap,
						start,
						end,
						content: fullMatch,
					});
				}
			} catch {}
		}

		return importMaps;
	} catch {
		return [];
	}
}

/**
 * Handles existing import maps based on the specified strategy.
 *
 * Processes existing import map script tags according to the chosen strategy:
 * replace (remove existing), merge (combine), or append (add new). Ensures
 * proper import map semantics and conflict resolution.
 *
 * **Merge Strategy**: Follows Import Maps specification for conflict resolution
 * with later entries taking precedence over earlier ones.
 *
 * @param {string} htmlContent - HTML content with existing import maps
 * @param {Object} newImportMap - New import map to inject
 * @param {Array} existingMaps - Existing import map information
 * @param {string} strategy - Handling strategy ('replace', 'merge', 'append')
 * @returns {{success: boolean, html?: string, importMap?: Object, error?: string}}
 *
 * @example
 * ```javascript
 * const result = handleExistingImportMaps(html, newMap, existing, 'merge');
 * // Returns merged import map and HTML with existing maps removed
 * ```
 */
export function handleExistingImportMaps(
	htmlContent,
	newImportMap,
	existingMaps,
	strategy,
) {
	try {
		switch (strategy) {
			case "replace": {
				// Remove all existing import maps
				let processedHtml = htmlContent;
				// Remove from end to start to maintain positions
				const sortedMaps = [...existingMaps].sort((a, b) => b.start - a.start);

				for (const map of sortedMaps) {
					processedHtml =
						processedHtml.slice(0, map.start) + processedHtml.slice(map.end);
				}

				return {
					success: true,
					html: processedHtml,
					importMap: newImportMap,
				};
			}

			case "merge": {
				// Merge all import maps
				const mergedImports = {};

				// Add existing import maps first
				for (const map of existingMaps) {
					if (map.importMap.imports) {
						Object.assign(mergedImports, map.importMap.imports);
					}
				}

				// Add new import map (overwrites conflicts)
				if (newImportMap.imports) {
					Object.assign(mergedImports, newImportMap.imports);
				}

				// Remove existing maps from HTML
				let processedHtml = htmlContent;
				const sortedMaps = [...existingMaps].sort((a, b) => b.start - a.start);

				for (const map of sortedMaps) {
					processedHtml =
						processedHtml.slice(0, map.start) + processedHtml.slice(map.end);
				}

				return {
					success: true,
					html: processedHtml,
					importMap: { imports: mergedImports },
				};
			}

			case "append": {
				// Keep existing maps, add new one
				return {
					success: true,
					html: htmlContent,
					importMap: newImportMap,
				};
			}

			default: {
				return {
					success: false,
					error: `Unknown strategy: ${strategy}`,
				};
			}
		}
	} catch {
		return {
			success: false,
			error: "Failed to handle existing import maps",
		};
	}
}

/**
 * Validates HTML content for common issues that might affect injection.
 *
 * Performs basic HTML validation to identify potential issues that could
 * interfere with import map injection. Checks for malformed tags, missing
 * required elements, and other structural problems.
 *
 * **Validation Rules**: Ensures minimum HTML structure requirements
 * for successful import map injection without breaking document integrity.
 *
 * @param {string} htmlContent - HTML content to validate
 * @returns {{valid: boolean, warnings?: Array<string>, error?: string}}
 *
 * @example
 * ```javascript
 * const validation = validateHtmlStructure(htmlContent);
 * if (!validation.valid) {
 *   console.warn('HTML issues:', validation.warnings);
 * }
 * ```
 */
export function validateHtmlStructure(htmlContent) {
	try {
		const warnings = [];

		// Check for basic HTML structure
		if (!htmlContent.includes("<html")) {
			warnings.push("Missing <html> tag");
		}

		if (!htmlContent.includes("<head")) {
			warnings.push("Missing <head> tag");
		}

		if (!htmlContent.includes("<body")) {
			warnings.push("Missing <body> tag");
		}

		// Check for unclosed tags that might interfere (simplified check)
		const openTags = (htmlContent.match(/<[^/!][^>]*[^/]>/g) || []).filter(
			(tag) =>
				!tag.includes("<!") &&
				!tag.includes("</") &&
				!["<br>", "<hr>", "<img", "<input", "<meta", "<link"].some(
					(selfClosing) => tag.toLowerCase().startsWith(selfClosing),
				),
		);
		const closeTags = htmlContent.match(/<\/[^>]+>/g) || [];

		if (Math.abs(openTags.length - closeTags.length) > 2) {
			// Allow some tolerance
			warnings.push("Potentially unclosed HTML tags detected");
		}

		// Check for DOCTYPE
		if (!htmlContent.trim().toLowerCase().startsWith("<!doctype")) {
			warnings.push("Missing DOCTYPE declaration");
		}

		return {
			valid: warnings.length === 0,
			warnings: warnings.length > 0 ? warnings : undefined,
		};
	} catch {
		return {
			valid: false,
			error: "HTML validation failed",
		};
	}
}

// Helper Functions

/**
 * Finds the start of the <head> section.
 *
 * @param {string} htmlContent - HTML content
 * @returns {{success: boolean, position?: number, location?: string, insertMode?: string}}
 */
function findHeadStart(htmlContent) {
	const headMatch = htmlContent.match(/<head[^>]*>/i);
	if (headMatch) {
		return {
			success: true,
			position: headMatch.index + headMatch[0].length,
			location: "head-start",
			insertMode: "after",
		};
	}
	return { success: false };
}

/**
 * Finds the end of the <head> section.
 *
 * @param {string} htmlContent - HTML content
 * @returns {{success: boolean, position?: number, location?: string, insertMode?: string}}
 */
function findHeadEnd(htmlContent) {
	const headEndMatch = htmlContent.match(/<\/head>/i);
	if (headEndMatch) {
		return {
			success: true,
			position: headEndMatch.index,
			location: "head-end",
			insertMode: "before",
		};
	}
	return { success: false };
}

/**
 * Finds the start of the <body> section.
 *
 * @param {string} htmlContent - HTML content
 * @returns {{success: boolean, position?: number, location?: string, insertMode?: string}}
 */
function findBodyStart(htmlContent) {
	const bodyMatch = htmlContent.match(/<body[^>]*>/i);
	if (bodyMatch) {
		return {
			success: true,
			position: bodyMatch.index + bodyMatch[0].length,
			location: "body-start",
			insertMode: "after",
		};
	}
	return { success: false };
}

/**
 * Finds position before existing script tags.
 *
 * @param {string} htmlContent - HTML content
 * @returns {{success: boolean, position?: number, location?: string, insertMode?: string}}
 */
function findBeforeScripts(htmlContent) {
	const scriptMatch = htmlContent.match(/<script[^>]*>/i);
	if (scriptMatch) {
		return {
			success: true,
			position: scriptMatch.index,
			location: "before-scripts",
			insertMode: "before",
		};
	}
	return { success: false };
}

/**
 * Injects content at the specified position with proper formatting.
 *
 * @param {string} htmlContent - Original HTML content
 * @param {string} content - Content to inject
 * @param {number} position - Injection position
 * @param {string} insertMode - 'before' or 'after'
 * @param {Object} options - Formatting options
 * @returns {string} Modified HTML content
 */
function injectAtPosition(
	htmlContent,
	content,
	position,
	insertMode,
	options = {},
) {
	const { preserveFormatting = true, indent = "  " } = options;

	try {
		let injectedContent = content;

		if (preserveFormatting) {
			// Add appropriate line breaks and indentation
			if (insertMode === "before") {
				injectedContent = content + "\n" + indent;
			} else {
				injectedContent = "\n" + indent + content;
			}
		}

		if (insertMode === "before") {
			return (
				htmlContent.slice(0, position) +
				injectedContent +
				htmlContent.slice(position)
			);
		} else {
			return (
				htmlContent.slice(0, position) +
				injectedContent +
				htmlContent.slice(position)
			);
		}
	} catch {
		// Fallback to simple injection
		return (
			htmlContent.slice(0, position) + content + htmlContent.slice(position)
		);
	}
}

/**
 * Normalizes HTML content for consistent processing.
 *
 * @param {string} htmlContent - HTML content to normalize
 * @returns {string} Normalized HTML content
 */
export function normalizeHtmlContent(htmlContent) {
	if (typeof htmlContent !== "string") {
		return "";
	}

	// Basic normalization
	return htmlContent
		.replace(/\r\n/g, "\n") // Normalize line endings
		.replace(/\r/g, "\n") // Convert remaining \r to \n
		.trim();
}

/**
 * Gets injection point statistics for debugging and optimization.
 *
 * @param {string} htmlContent - HTML content to analyze
 * @returns {Object} Statistics about available injection points
 */
export function getInjectionStats(htmlContent) {
	try {
		const stats = {
			hasHead: /<head[^>]*>/i.test(htmlContent),
			hasBody: /<body[^>]*>/i.test(htmlContent),
			scriptCount: (htmlContent.match(/<script[^>]*>/gi) || []).length,
			existingImportMaps: extractExistingImportMaps(htmlContent).length,
			documentLength: htmlContent.length,
		};

		return stats;
	} catch {
		return {
			hasHead: false,
			hasBody: false,
			scriptCount: 0,
			existingImportMaps: 0,
			documentLength: 0,
		};
	}
}
