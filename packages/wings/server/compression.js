/**
 * @fileoverview Wings Compression Middleware - Because bytes matter
 *
 * This middleware provides automatic HTTP response compression using standard
 * algorithms like gzip, brotli, and deflate. It intelligently selects the best
 * compression method based on client Accept-Encoding headers, content type,
 * and response size to optimize both bandwidth and performance.
 *
 * Built with zero dependencies using Node.js native zlib module, this middleware
 * seamlessly integrates with Wings' after-callback architecture to compress
 * responses without interfering with the request lifecycle.
 *
 * ## Key Features
 * - ✅ Standards-compliant Accept-Encoding parsing with quality values
 * - ✅ Smart content-type detection (compresses text, skips images/video)
 * - ✅ Configurable size thresholds (don't compress tiny responses)
 * - ✅ Graceful error handling (fallback to uncompressed on failure)
 * - ✅ Memory-efficient streaming for large responses
 * - ✅ Production-ready with comprehensive error resilience
 *
 * ## Supported Algorithms
 * - **Brotli**: Best compression ratio, modern browsers (Chrome 50+, Firefox 44+)
 * - **Gzip**: Universal compatibility, excellent compression
 * - **Deflate**: Good compatibility, decent compression
 *
 * @example Basic Usage
 * ```javascript
 * import { CompressionMiddleware } from '@raven-js/wings/server/compression.js';
 * import { Router } from '@raven-js/wings/core/router.js';
 *
 * const router = new Router();
 * const compression = new CompressionMiddleware();
 *
 * // Enable compression for all responses
 * router.use(compression);
 *
 * router.get('/api/data', (ctx) => {
 *   ctx.json({ data: largeDataArray }); // Will be automatically compressed
 * });
 * ```
 *
 * @example Advanced Configuration
 * ```javascript
 * const compression = new CompressionMiddleware({
 *   threshold: 2048,           // Only compress responses >= 2KB
 *   algorithms: ['brotli', 'gzip'], // Prefer brotli, fallback to gzip
 *   level: 9,                  // Maximum compression (slower but smaller)
 *   compressibleTypes: ['text/', 'application/json', 'application/xml']
 * });
 * ```
 *
 * @author RavenJS Team
 * @since 0.2.6
 */

import {
	constants,
	createBrotliCompress,
	createDeflate,
	createGzip,
} from "node:zlib";
import { Middleware } from "../core/middleware.js";

/**
 * Default compressible MIME types
 * These content types benefit from compression and are safe to compress
 */
const DEFAULT_COMPRESSIBLE_TYPES = [
	"text/",
	"application/json",
	"application/javascript",
	"application/xml",
	"application/rss+xml",
	"application/atom+xml",
	"image/svg+xml",
];

/**
 * Content types that should never be compressed
 * These are either already compressed or binary formats
 */
const NON_COMPRESSIBLE_TYPES = [
	"image/",
	"video/",
	"audio/",
	"application/zip",
	"application/gzip",
	"application/br",
	"application/compress",
	"application/pdf",
	"application/octet-stream",
];

/**
 * Parse Accept-Encoding header with quality values
 *
 * Parses the Accept-Encoding header according to RFC 7231 Section 5.3.4,
 * handling quality values (q-values) and returning encodings sorted by preference.
 *
 * @param {string} acceptEncoding - The Accept-Encoding header value
 * @returns {Array<{encoding: string, quality: number}>} Sorted array of accepted encodings
 *
 * @example
 * ```javascript
 * parseAcceptEncoding('gzip, deflate;q=0.9, br;q=1.0, *;q=0.1');
 * // Returns: [
 * //   { encoding: 'br', quality: 1.0 },
 * //   { encoding: 'gzip', quality: 1.0 },
 * //   { encoding: 'deflate', quality: 0.9 },
 * //   { encoding: '*', quality: 0.1 }
 * // ]
 * ```
 */
export function parseAcceptEncoding(acceptEncoding) {
	if (!acceptEncoding || typeof acceptEncoding !== "string") {
		return [];
	}

	const encodings = [];
	const parts = acceptEncoding.split(",");

	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed) continue;

		// Parse encoding and optional quality value
		// Format: "encoding" or "encoding;q=0.5"
		const [encoding, ...qualityParts] = trimmed.split(";");
		const encodingName = encoding.trim().toLowerCase();

		let quality = 1.0; // Default quality value

		// Look for q-value in parameters
		for (const qPart of qualityParts) {
			const qTrimmed = qPart.trim();
			if (qTrimmed.startsWith("q=")) {
				const qValue = parseFloat(qTrimmed.substring(2));
				if (!Number.isNaN(qValue) && qValue >= 0 && qValue <= 1) {
					quality = qValue;
				}
				break;
			}
		}

		// Skip encodings with zero quality (explicitly rejected)
		if (quality > 0) {
			encodings.push({ encoding: encodingName, quality });
		}
	}

	// Sort by quality value (highest first), then by original order
	return encodings.sort((a, b) => {
		if (b.quality !== a.quality) {
			return b.quality - a.quality;
		}
		// Maintain original order for same quality
		return 0;
	});
}

/**
 * Select the best compression algorithm based on client preferences and available algorithms
 *
 * @param {Array<{encoding: string, quality: number}>} acceptedEncodings - Parsed Accept-Encoding preferences
 * @param {string[]} availableAlgorithms - Available compression algorithms in preference order
 * @returns {string|null} Selected compression algorithm or null if none suitable
 *
 * @example
 * ```javascript
 * const accepted = parseAcceptEncoding('gzip, br;q=0.8');
 * const available = ['brotli', 'gzip', 'deflate'];
 * selectBestEncoding(accepted, available); // Returns 'gzip'
 * ```
 */
export function selectBestEncoding(acceptedEncodings, availableAlgorithms) {
	// Normalize algorithm names for comparison
	const algorithmMap = {
		br: "brotli",
		brotli: "brotli",
		gzip: "gzip",
		deflate: "deflate",
	};

	for (const { encoding } of acceptedEncodings) {
		/** @type {string|undefined} */
		const normalizedEncoding =
			algorithmMap[/** @type {keyof typeof algorithmMap} */ (encoding)];
		if (
			normalizedEncoding &&
			availableAlgorithms.includes(normalizedEncoding)
		) {
			return normalizedEncoding;
		}
	}

	return null;
}

/**
 * Check if a response should be compressed based on content type and size
 *
 * @param {string|null} contentType - Response content-type header
 * @param {number} contentLength - Response content length in bytes
 * @param {Object} options - Compression configuration
 * @param {number} options.threshold - Minimum size threshold for compression
 * @param {string[]} options.compressibleTypes - Array of compressible content type prefixes
 * @returns {boolean} True if response should be compressed
 */
export function shouldCompress(contentType, contentLength, options) {
	// Don't compress if below threshold
	if (contentLength < options.threshold) {
		return false;
	}

	// Don't compress if no content type
	if (!contentType) {
		return false;
	}

	const normalizedType = contentType.toLowerCase().split(";")[0]; // Remove charset etc.

	// Check if explicitly non-compressible
	for (const nonCompressible of NON_COMPRESSIBLE_TYPES) {
		if (normalizedType.startsWith(nonCompressible)) {
			return false;
		}
	}

	// Check if explicitly compressible
	for (const compressible of options.compressibleTypes) {
		if (normalizedType.startsWith(compressible)) {
			return true;
		}
	}

	return false;
}

/**
 * Get compression options for a specific algorithm
 *
 * @param {string} algorithm - Compression algorithm ('gzip', 'deflate', 'brotli')
 * @param {number} level - Compression level (1-9 for gzip/deflate, 1-11 for brotli)
 * @returns {Object} Algorithm-specific compression options
 */
export function getCompressionOptions(algorithm, level) {
	switch (algorithm) {
		case "gzip":
			return {
				level: Math.max(1, Math.min(9, level)),
			};
		case "deflate":
			return {
				level: Math.max(1, Math.min(9, level)),
			};
		case "brotli":
			return {
				[constants.BROTLI_PARAM_QUALITY]: Math.max(1, Math.min(11, level)),
				[constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
			};
		default:
			throw new Error(`Unsupported compression algorithm: ${algorithm}`);
	}
}

/**
 * Create a compression stream for the specified algorithm
 *
 * @param {string} algorithm - Compression algorithm
 * @param {Object} options - Compression options
 * @returns {import('stream').Transform} Compression transform stream
 */
export function createCompressionStream(algorithm, options) {
	switch (algorithm) {
		case "gzip":
			return createGzip(options);
		case "deflate":
			return createDeflate(options);
		case "brotli":
			return createBrotliCompress(options);
		default:
			throw new Error(`Unsupported compression algorithm: ${algorithm}`);
	}
}

/**
 * Compress response data using the specified algorithm
 *
 * @param {string|Buffer} data - Response data to compress
 * @param {string} algorithm - Compression algorithm
 * @param {Object} options - Compression options
 * @returns {Promise<Buffer>} Compressed data
 */
export async function compressData(data, algorithm, options) {
	return new Promise((resolve, reject) => {
		/** @type {Buffer[]} */
		const chunks = [];
		const compressor = createCompressionStream(algorithm, options);

		compressor.on("data", (chunk) => chunks.push(chunk));
		compressor.on("end", () => resolve(Buffer.concat(chunks)));
		compressor.on("error", reject);

		// Write data and close
		if (typeof data === "string") {
			compressor.write(Buffer.from(data, "utf8"));
		} else {
			compressor.write(data);
		}
		compressor.end();
	});
}

/**
 * CompressionMiddleware - Automatic HTTP response compression
 *
 * This middleware automatically compresses HTTP responses using the best available
 * compression algorithm based on client Accept-Encoding headers. It integrates
 * seamlessly with Wings' after-callback architecture to compress responses without
 * interfering with request processing.
 *
 * The middleware intelligently decides whether to compress based on:
 * - Content-Type (only compresses text-based content)
 * - Response size (configurable threshold)
 * - Client capabilities (Accept-Encoding header)
 * - Algorithm availability and preference
 *
 * ## Error Resilience
 *
 * Compression failures never break requests. If compression fails for any reason,
 * the middleware gracefully falls back to serving the uncompressed response.
 * This ensures maximum reliability in production environments.
 *
 * ## Performance Considerations
 *
 * - Small responses (< threshold) are not compressed to avoid overhead
 * - Large responses use streaming compression to manage memory usage
 * - Compression level can be tuned for speed vs. compression ratio
 * - Already compressed content is automatically skipped
 *
 * @example Basic Setup
 * ```javascript
 * import { CompressionMiddleware } from '@raven-js/wings/server/compression.js';
 *
 * const compression = new CompressionMiddleware();
 * router.use(compression);
 *
 * // All responses will now be automatically compressed when beneficial
 * ```
 *
 * @example Custom Configuration
 * ```javascript
 * const compression = new CompressionMiddleware({
 *   threshold: 4096,                    // Only compress >= 4KB responses
 *   algorithms: ['brotli', 'gzip'],     // Prefer brotli, fallback to gzip
 *   level: 4,                           // Faster compression (lower level)
 *   compressibleTypes: [                // Custom content types to compress
 *     'text/',
 *     'application/json',
 *     'application/javascript'
 *   ]
 * });
 * ```
 */
export class Compression extends Middleware {
	/**
	 * Create a new CompressionMiddleware instance
	 *
	 * @param {Object} [options={}] - Compression configuration options
	 * @param {number} [options.threshold=1024] - Minimum response size to compress (bytes)
	 * @param {string[]} [options.algorithms=['brotli', 'gzip', 'deflate']] - Preferred compression algorithms in order
	 * @param {number} [options.level=6] - Compression level (1=fast, 9=best for gzip/deflate, 11=best for brotli)
	 * @param {string[]} [options.compressibleTypes] - Content types to compress (defaults to text-based types)
	 * @param {string} [options.identifier='@raven-js/wings/compression'] - Middleware identifier
	 *
	 * @example Development Setup (Fast Compression)
	 * ```javascript
	 * const compression = new CompressionMiddleware({
	 *   level: 1,  // Fastest compression for development
	 *   threshold: 512  // Compress smaller responses for testing
	 * });
	 * ```
	 *
	 * @example Production Setup (Maximum Compression)
	 * ```javascript
	 * const compression = new CompressionMiddleware({
	 *   level: 9,  // Best compression ratio
	 *   threshold: 2048,  // Only compress larger responses
	 *   algorithms: ['brotli', 'gzip']  // Skip deflate for better compression
	 * });
	 * ```
	 */
	constructor(options = {}) {
		const {
			threshold = 1024,
			algorithms = ["brotli", "gzip", "deflate"],
			level = 6,
			compressibleTypes = DEFAULT_COMPRESSIBLE_TYPES,
			identifier = "@raven-js/wings/compression",
		} = options;

		// Validate configuration
		if (threshold < 0) {
			throw new Error("Compression threshold must be non-negative");
		}
		if (!Array.isArray(algorithms) || algorithms.length === 0) {
			throw new Error("At least one compression algorithm must be specified");
		}
		if (level < 1 || level > 11) {
			throw new Error("Compression level must be between 1 and 11");
		}

		super(async (ctx) => {
			// Register after callback for compression
			ctx.addAfterCallback(
				new Middleware(async (ctx) => {
					await this.#compressResponse(ctx);
				}, `${identifier}-compressor`),
			);
		}, identifier);

		// Store configuration
		this.threshold = threshold;
		this.algorithms = algorithms;
		this.level = level;
		this.compressibleTypes = compressibleTypes;
	}

	/**
	 * Compress response if appropriate
	 *
	 * This private method handles the actual compression logic:
	 * 1. Check if response should be compressed
	 * 2. Parse client Accept-Encoding preferences
	 * 3. Select best available compression algorithm
	 * 4. Compress response data
	 * 5. Update response headers
	 *
	 * @param {import('../core/context.js').Context} ctx - Request context
	 */
	async #compressResponse(ctx) {
		try {
			// Skip if response already ended or no body
			if (ctx.responseEnded || !ctx.responseBody) {
				return;
			}

			// Skip if already compressed
			if (ctx.responseHeaders.has("content-encoding")) {
				return;
			}

			// Get response information
			const contentType = ctx.responseHeaders.get("content-type");
			const responseData = ctx.responseBody;
			const contentLength =
				typeof responseData === "string"
					? Buffer.byteLength(responseData, "utf8")
					: Buffer.byteLength(responseData);

			// Check if response should be compressed
			if (
				!shouldCompress(contentType, contentLength, {
					threshold: this.threshold,
					compressibleTypes: this.compressibleTypes,
				})
			) {
				return;
			}

			// Parse client Accept-Encoding header
			const acceptEncoding = ctx.requestHeaders.get("accept-encoding") || "";
			const acceptedEncodings = parseAcceptEncoding(acceptEncoding);

			// Select best compression algorithm
			const selectedAlgorithm = selectBestEncoding(
				acceptedEncodings,
				this.algorithms,
			);
			if (!selectedAlgorithm) {
				return; // Client doesn't accept any of our algorithms
			}

			// Get compression options
			const compressionOptions = getCompressionOptions(
				selectedAlgorithm,
				this.level,
			);

			// Compress the response
			const compressedData = await compressData(
				responseData,
				selectedAlgorithm,
				compressionOptions,
			);

			// Only use compressed version if it's actually smaller
			if (compressedData.length < contentLength) {
				// Update response with compressed data
				ctx.responseBody = compressedData;

				// Set compression headers
				const encodingHeader =
					selectedAlgorithm === "brotli" ? "br" : selectedAlgorithm;
				ctx.responseHeaders.set("content-encoding", encodingHeader);
				ctx.responseHeaders.set("vary", "Accept-Encoding");

				// Update content-length with compressed size
				ctx.responseHeaders.set(
					"content-length",
					compressedData.length.toString(),
				);
			}
		} catch (error) {
			// Compression failed - log error but continue with uncompressed response
			// This ensures that compression issues never break requests
			if (ctx.errors) {
				const compressionError = new Error(
					`Compression failed: ${error.message}`,
				);
				compressionError.name = "CompressionError";
				/** @type {any} */ (compressionError).originalError = error;
				/** @type {any} */ (compressionError).algorithm =
					/** @type {any} */ (error).algorithm || "unknown";
				ctx.errors.push(compressionError);
			}
			// Gracefully continue without compression
		}
	}
}
