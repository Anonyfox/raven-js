/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Module server for serving ES modules with proper headers and caching.
 *
 * Implements high-performance module serving for zero-build ESM development.
 * Handles JavaScript file serving with appropriate MIME types, caching headers,
 * source map support, and security validation. Zero-dependency implementation
 * optimized for development server workflows.
 *
 * Supported file types:
 * - .js (JavaScript modules)
 * - .mjs (ES modules)
 * - .cjs (CommonJS modules)
 * - .jsx (JSX components)
 * - .ts/.tsx (TypeScript - for development)
 * - .map (Source maps)
 */

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import {
	fileExists,
	getMimeType,
	validateFilePath,
} from "./file-operations.js";
import { normalizePath, validatePath } from "./path-security.js";

/**
 * Serves a JavaScript module file with appropriate headers and caching.
 *
 * Handles the complete module serving pipeline including path validation,
 * file resolution, MIME type detection, header generation, and streaming
 * response. Essential for zero-build ESM development environments.
 *
 * **Performance**: Uses streaming for large files and efficient caching
 * headers to minimize redundant requests and bandwidth usage.
 *
 * @param {string} modulePath - Requested module path
 * @param {Object} [options={}] - Serving options
 * @param {string} [options.rootDir=process.cwd()] - Root directory for resolution
 * @param {boolean} [options.enableCaching=true] - Enable HTTP caching headers
 * @param {number} [options.maxAge=3600] - Cache max age in seconds
 * @param {boolean} [options.enableEtag=true] - Generate ETag headers
 * @param {boolean} [options.enableCompression=false] - Enable compression hints
 * @param {Object} [options.customHeaders={}] - Additional headers to set
 * @returns {Promise<{success: boolean, file?: Buffer|ReadableStream, headers?: Object, statusCode?: number, error?: string}>}
 *
 * @example
 * ```javascript
 * const result = await serveModule('/node_modules/lodash/index.js', {
 *   rootDir: '/project',
 *   enableCaching: true,
 *   maxAge: 7200
 * });
 * if (result.success) {
 *   // Stream file to response with headers
 *   response.writeHead(result.statusCode, result.headers);
 *   result.file.pipe(response);
 * }
 * ```
 */
export async function serveModule(modulePath, options = {}) {
	const {
		rootDir = process.cwd(),
		enableCaching = true,
		maxAge = 3600,
		enableEtag = true,
		enableCompression = false,
		customHeaders = {},
	} = options;

	try {
		// Step 1: Basic path validation and normalization
		// For module serving, we need more permissive path handling than web requests
		if (typeof modulePath !== "string" || modulePath.length === 0) {
			return {
				success: false,
				statusCode: 400,
				error: "Invalid module path",
			};
		}

		// Basic security validation
		if (!validatePath(modulePath)) {
			return {
				success: false,
				statusCode: 400,
				error: "Invalid module path",
			};
		}

		// Normalize the path
		const normalized = normalizePath(modulePath);
		if (!normalized) {
			return {
				success: false,
				statusCode: 400,
				error: "Invalid module path",
			};
		}

		// Step 2: Resolve to absolute file path
		const absolutePath = resolve(rootDir, normalized.replace(/^\//, ""));

		// Additional security validation
		const validatedPath = validateFilePath(absolutePath);
		if (!validatedPath) {
			return {
				success: false,
				statusCode: 403,
				error: "Access denied",
			};
		}

		// Step 3: Check if file exists and is servable
		if (!(await fileExists(absolutePath))) {
			return {
				success: false,
				statusCode: 404,
				error: "Module not found",
			};
		}

		// Step 4: Validate file type
		const validationResult = validateModuleFile(absolutePath);
		if (!validationResult.valid) {
			return {
				success: false,
				statusCode: 415,
				error: validationResult.error,
			};
		}

		// Step 5: Get file stats for headers
		const stats = await stat(absolutePath);
		if (!stats.isFile()) {
			return {
				success: false,
				statusCode: 404,
				error: "Path is not a file",
			};
		}

		// Step 6: Generate headers
		const headers = await generateModuleHeaders(absolutePath, stats, {
			enableCaching,
			maxAge,
			enableEtag,
			enableCompression,
			customHeaders,
			originalPath: normalized, // Pass original path for source map hints
		});

		// Step 7: Create file stream or read small files
		let fileContent;
		if (stats.size > 1024 * 1024) {
			// Stream files larger than 1MB
			fileContent = createReadStream(absolutePath);
		} else {
			// Read small files into memory for better performance
			fileContent = await readFile(absolutePath);
		}

		return {
			success: true,
			file: fileContent,
			headers,
			statusCode: 200,
		};
	} catch {
		return {
			success: false,
			statusCode: 500,
			error: "Internal server error",
		};
	}
}

/**
 * Validates if a file can be served as a module.
 *
 * Performs comprehensive validation to ensure the requested file is a valid
 * JavaScript module that can be safely served. Checks file extensions,
 * content type hints, and security restrictions.
 *
 * **Security**: Prevents serving of non-module files, executables,
 * or potentially dangerous content through the module server.
 *
 * @param {string} filePath - Absolute file path to validate
 * @returns {{valid: boolean, error?: string, moduleType?: string}}
 *
 * @example
 * ```javascript
 * const validation = validateModuleFile('/project/src/app.js');
 * if (validation.valid) {
 *   console.log('Module type:', validation.moduleType);
 * }
 * ```
 */
export function validateModuleFile(filePath) {
	try {
		const ext = extname(filePath).toLowerCase();
		const fileName = filePath.toLowerCase();

		// Block potentially dangerous files first
		const blockedPatterns = [
			/\.exe$/,
			/\.bat$/,
			/\.cmd$/,
			/\.sh$/,
			/\.ps1$/,
			/config\.json$/,
			/\.env$/,
			/package-lock\.json$/,
			/yarn\.lock$/,
		];

		for (const pattern of blockedPatterns) {
			if (pattern.test(fileName)) {
				return {
					valid: false,
					error: "File type not permitted",
				};
			}
		}

		// Define supported module extensions
		const moduleExtensions = {
			".js": "javascript",
			".mjs": "module",
			".cjs": "commonjs",
			".jsx": "jsx",
			".ts": "typescript",
			".tsx": "tsx",
			".map": "sourcemap",
		};

		if (!moduleExtensions[ext]) {
			return {
				valid: false,
				error: `Unsupported file type: ${ext}`,
			};
		}

		return {
			valid: true,
			moduleType: moduleExtensions[ext],
		};
	} catch {
		return {
			valid: false,
			error: "File validation failed",
		};
	}
}

/**
 * Generates appropriate HTTP headers for module serving.
 *
 * Creates comprehensive HTTP headers optimized for ES module serving including
 * MIME types, caching directives, security headers, and performance hints.
 * Handles ETags, compression hints, and browser compatibility.
 *
 * **Header Strategy**: Optimizes for development performance while maintaining
 * proper HTTP semantics and browser caching behavior.
 *
 * @param {string} filePath - File path for header generation
 * @param {Object} stats - File stats from fs.stat()
 * @param {Object} options - Header generation options
 * @returns {Promise<Object>} HTTP headers object
 *
 * @example
 * ```javascript
 * const headers = await generateModuleHeaders('/app.js', stats, {
 *   enableCaching: true,
 *   maxAge: 3600
 * });
 * // Returns: { 'Content-Type': 'text/javascript', 'Cache-Control': '...', ... }
 * ```
 */
export async function generateModuleHeaders(filePath, stats, options = {}) {
	const {
		enableCaching = true,
		maxAge = 3600,
		enableEtag = true,
		enableCompression = false,
		customHeaders = {},
		originalPath = null,
	} = options;

	const headers = {};

	try {
		// Content-Type based on file extension
		const mimeType = getMimeType(filePath);
		headers["Content-Type"] = mimeType;

		// Content-Length for non-streamed content
		headers["Content-Length"] = stats.size.toString();

		// Last-Modified header
		headers["Last-Modified"] = stats.mtime.toUTCString();

		// ETag generation for caching
		if (enableEtag) {
			const etag = await generateETag(filePath, stats);
			if (etag) {
				headers["ETag"] = etag;
			}
		}

		// Cache control headers
		if (enableCaching) {
			const cacheControl = generateCacheControl(filePath, maxAge);
			headers["Cache-Control"] = cacheControl;
		} else {
			headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
			headers["Pragma"] = "no-cache";
			headers["Expires"] = "0";
		}

		// CORS headers for module loading
		headers["Access-Control-Allow-Origin"] = "*";
		headers["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS";
		headers["Access-Control-Allow-Headers"] = "Content-Type, Cache-Control";

		// Security headers
		headers["X-Content-Type-Options"] = "nosniff";

		// Compression hints
		if (enableCompression) {
			headers["Vary"] = "Accept-Encoding";
		}

		// Module-specific headers
		const ext = extname(filePath).toLowerCase();
		if (ext === ".mjs") {
			headers["X-Content-Type"] = "module";
		} else if (ext === ".cjs") {
			headers["X-Content-Type"] = "commonjs";
		}

		// Source map detection and hint
		if (ext === ".js" || ext === ".mjs") {
			const mapFile = filePath + ".map";
			if (await fileExists(mapFile)) {
				// Use original request path for SourceMap header if available
				const pathForSourceMap = originalPath || filePath;
				headers["SourceMap"] = `${pathForSourceMap}.map`;
			}
		}

		// Apply custom headers (allow override)
		Object.assign(headers, customHeaders);

		return headers;
	} catch {
		// Fallback headers
		return {
			"Content-Type": "text/javascript",
			"Content-Length": stats.size.toString(),
			"Cache-Control": "no-cache",
			...customHeaders,
		};
	}
}

/**
 * Generates cache control directives based on file type and context.
 *
 * Creates appropriate cache control headers optimized for different file types
 * and development vs production scenarios. Balances performance with
 * development workflow requirements.
 *
 * **Caching Strategy**: Aggressive caching for immutable content,
 * shorter caching for frequently changing development files.
 *
 * @param {string} filePath - File path for cache strategy
 * @param {number} maxAge - Maximum cache age in seconds
 * @returns {string} Cache-Control header value
 *
 * @example
 * ```javascript
 * const cacheControl = generateCacheControl('/node_modules/lodash/index.js', 7200);
 * // Returns: "public, max-age=7200, immutable"
 * ```
 */
export function generateCacheControl(filePath, maxAge) {
	try {
		// Source maps - short cache (check first to override other patterns)
		if (filePath.endsWith(".map")) {
			return `public, max-age=${Math.min(maxAge, 60)}`;
		}

		// Different caching strategies based on file location
		if (filePath.includes("/node_modules/")) {
			// Aggressive caching for node_modules (immutable)
			return `public, max-age=${maxAge * 24}, immutable`;
		}

		if (filePath.includes("/@workspace/") || filePath.includes("/src/")) {
			// Shorter caching for development files
			return `public, max-age=${Math.min(maxAge, 300)}, must-revalidate`;
		}

		// Default caching
		return `public, max-age=${maxAge}`;
	} catch {
		return `public, max-age=${maxAge}`;
	}
}

/**
 * Generates an ETag for file-based caching.
 *
 * Creates a strong ETag based on file content and modification time for
 * efficient HTTP caching. Uses fast hashing algorithms optimized for
 * development server performance.
 *
 * **ETag Strategy**: Combines file size, mtime, and content hash for
 * reliable cache invalidation while minimizing computation overhead.
 *
 * @param {string} filePath - File path for ETag generation
 * @param {Object} stats - File stats from fs.stat()
 * @returns {Promise<string|null>} ETag value or null if generation fails
 *
 * @example
 * ```javascript
 * const etag = await generateETag('/app.js', stats);
 * // Returns: '"1234567890abcdef-1640995200000-1024"'
 * ```
 */
export async function generateETag(filePath, stats) {
	try {
		// For small files, use content hash
		if (stats.size < 64 * 1024) {
			// 64KB
			const content = await readFile(filePath);
			const hash = createHash("md5").update(content).digest("hex");
			return `"${hash}-${stats.mtime.getTime()}-${stats.size}"`;
		}

		// For large files, use file metadata
		const metaString = `${filePath}-${stats.mtime.getTime()}-${stats.size}`;
		const hash = createHash("md5").update(metaString).digest("hex");
		return `"${hash}"`;
	} catch {
		// Fallback to simple etag
		return `"${stats.mtime.getTime()}-${stats.size}"`;
	}
}

/**
 * Handles conditional requests using If-None-Match and If-Modified-Since.
 *
 * Implements HTTP conditional request handling for efficient caching.
 * Checks ETags and modification times to determine if content has changed
 * and whether to return 304 Not Modified responses.
 *
 * **Performance**: Dramatically reduces bandwidth and improves load times
 * by avoiding unnecessary file transfers for unchanged content.
 *
 * @param {Object} requestHeaders - HTTP request headers
 * @param {string} etag - Current ETag value
 * @param {Date} lastModified - File last modified date
 * @returns {{modified: boolean, statusCode?: number}} Conditional check result
 *
 * @example
 * ```javascript
 * const result = checkConditionalRequest(headers, etag, stats.mtime);
 * if (!result.modified) {
 *   return { statusCode: 304, headers: { ETag: etag } };
 * }
 * ```
 */
export function checkConditionalRequest(requestHeaders, etag, lastModified) {
	try {
		const ifNoneMatch = requestHeaders["if-none-match"];
		const ifModifiedSince = requestHeaders["if-modified-since"];

		// Check ETag first (stronger validation)
		if (ifNoneMatch && etag) {
			// Handle multiple ETags in If-None-Match
			const etags = ifNoneMatch.split(",").map((tag) => tag.trim());
			if (etags.includes(etag) || etags.includes("*")) {
				return {
					modified: false,
					statusCode: 304,
				};
			}
		}

		// Check modification time
		if (ifModifiedSince && lastModified) {
			const requestTime = new Date(ifModifiedSince);
			if (!Number.isNaN(requestTime.getTime()) && lastModified <= requestTime) {
				return {
					modified: false,
					statusCode: 304,
				};
			}
		}

		return {
			modified: true,
		};
	} catch {
		// On error, assume modified
		return {
			modified: true,
		};
	}
}

/**
 * Streams a file to the response with proper error handling.
 *
 * Handles efficient file streaming with error recovery, partial content
 * support, and proper cleanup. Optimized for module serving performance
 * and reliability.
 *
 * **Streaming Strategy**: Uses Node.js streams for memory efficiency
 * and supports backpressure handling for large files.
 *
 * @param {string} filePath - File to stream
 * @param {Object} response - HTTP response object
 * @param {Object} [options={}] - Streaming options
 * @param {number} [options.start] - Start byte position
 * @param {number} [options.end] - End byte position
 * @returns {Promise<{success: boolean, error?: string}>}
 *
 * @example
 * ```javascript
 * const result = await streamModuleFile('/app.js', response);
 * if (!result.success) {
 *   console.error('Streaming failed:', result.error);
 * }
 * ```
 */
export async function streamModuleFile(filePath, response, options = {}) {
	try {
		const { start, end } = options;

		const streamOptions = {};
		if (start !== undefined) streamOptions.start = start;
		if (end !== undefined) streamOptions.end = end;

		const fileStream = createReadStream(filePath, streamOptions);

		// Handle stream errors
		fileStream.on("error", () => {
			if (!response.headersSent) {
				response.writeHead(500, { "Content-Type": "text/plain" });
				response.end("Internal Server Error");
			}
		});

		// Stream the file
		await pipeline(fileStream, response);

		return {
			success: true,
		};
	} catch {
		if (!response.headersSent) {
			response.writeHead(500, { "Content-Type": "text/plain" });
			response.end("Streaming Error");
		}

		return {
			success: false,
			error: "File streaming failed",
		};
	}
}

/**
 * Resolves module paths to absolute file paths with extension handling.
 *
 * Implements Node.js-style module resolution with support for automatic
 * extension resolution, index file detection, and package.json main field
 * resolution. Essential for flexible module serving.
 *
 * **Resolution Strategy**: Follows Node.js module resolution algorithm
 * with extensions and index file fallbacks for maximum compatibility.
 *
 * @param {string} modulePath - Module path to resolve
 * @param {string} rootDir - Root directory for resolution
 * @returns {Promise<{success: boolean, resolvedPath?: string, error?: string}>}
 *
 * @example
 * ```javascript
 * const result = await resolveModulePath('./utils', '/project/src');
 * // May resolve to: /project/src/utils.js or /project/src/utils/index.js
 * ```
 */
export async function resolveModulePath(modulePath, rootDir) {
	try {
		const basePath = resolve(rootDir, modulePath.replace(/^\//, ""));

		// Extension candidates for auto-resolution
		const extensions = [".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx"];

		// Try exact path first (but only if it's a file, not a directory)
		if (await fileExists(basePath)) {
			try {
				const stats = await stat(basePath);
				if (stats.isFile()) {
					return {
						success: true,
						resolvedPath: basePath,
					};
				}
			} catch {
				// If stat fails, continue to other resolution methods
			}
		}

		// Try with extensions
		for (const ext of extensions) {
			const pathWithExt = basePath + ext;
			if (await fileExists(pathWithExt)) {
				return {
					success: true,
					resolvedPath: pathWithExt,
				};
			}
		}

		// Try index files
		for (const ext of extensions) {
			const indexPath = join(basePath, `index${ext}`);
			if (await fileExists(indexPath)) {
				return {
					success: true,
					resolvedPath: indexPath,
				};
			}
		}

		return {
			success: false,
			error: "Module not found",
		};
	} catch {
		return {
			success: false,
			error: "Module resolution failed",
		};
	}
}

/**
 * Gets module serving statistics for monitoring and debugging.
 *
 * @param {string} filePath - File path to analyze
 * @returns {Promise<Object>} Module statistics
 */
export async function getModuleStats(filePath) {
	try {
		const stats = await stat(filePath);
		const validation = validateModuleFile(filePath);

		return {
			path: filePath,
			size: stats.size,
			lastModified: stats.mtime,
			moduleType: validation.moduleType,
			valid: validation.valid,
			extension: extname(filePath),
		};
	} catch {
		return {
			path: filePath,
			size: 0,
			valid: false,
			error: "Unable to read file stats",
		};
	}
}
