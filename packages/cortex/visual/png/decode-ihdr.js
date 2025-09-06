/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Decodes and validates PNG IHDR (Image Header) chunks.
 *
 * The IHDR chunk contains critical image parameters that define the PNG canvas:
 * - Image dimensions (width, height)
 * - Bit depth per sample
 * - Color type (grayscale, RGB, palette, etc.)
 * - Compression method (always 0 for DEFLATE)
 * - Filter method (always 0 for adaptive filtering)
 * - Interlace method (0=none, 1=Adam7)
 *
 * This decoder validates all parameters against PNG specification limits
 * and provides structured access to image properties.
 *
 * @param {Uint8Array} data - IHDR chunk data (13 bytes)
 * @returns {{width: number, height: number, bitDepth: number, colorType: number, compressionMethod: number, filterMethod: number, interlaceMethod: number, channels: number, hasAlpha: boolean, bytesPerPixel: number, samplesPerPixel: number}} Decoded IHDR information
 *
 * @example
 * // Decode IHDR from chunk data
 * const ihdr = decodeIHDR(ihdrChunk.data);
 * console.log(`${ihdr.width}x${ihdr.height}, ${ihdr.bitDepth}-bit ${getColorTypeName(ihdr.colorType)}`);
 *
 * @example
 * // Check for alpha channel
 * if (ihdr.hasAlpha) {
 *   console.log('Image has transparency');
 * }
 */

/**
 * PNG color type constants as defined in PNG specification.
 * Each color type determines the interpretation of pixel data.
 */
export const COLOR_TYPES = {
	/** Grayscale: Each pixel is a grayscale sample */
	GRAYSCALE: 0,
	/** RGB: Each pixel is an RGB triple */
	RGB: 2,
	/** Palette: Each pixel is a palette index */
	PALETTE: 3,
	/** Grayscale + Alpha: Each pixel is a grayscale sample followed by alpha */
	GRAYSCALE_ALPHA: 4,
	/** RGB + Alpha: Each pixel is an RGB triple followed by alpha */
	RGB_ALPHA: 6,
};

/**
 * Valid bit depths for each color type according to PNG specification.
 * Enforces PNG's strict bit depth requirements per color type.
 */
export const VALID_BIT_DEPTHS = {
	[COLOR_TYPES.GRAYSCALE]: [1, 2, 4, 8, 16],
	[COLOR_TYPES.RGB]: [8, 16],
	[COLOR_TYPES.PALETTE]: [1, 2, 4, 8],
	[COLOR_TYPES.GRAYSCALE_ALPHA]: [8, 16],
	[COLOR_TYPES.RGB_ALPHA]: [8, 16],
};

/**
 * Read 32-bit big-endian unsigned integer from buffer.
 *
 * @param {Uint8Array} buffer - Buffer to read from
 * @param {number} offset - Byte offset to read from
 * @returns {number} 32-bit unsigned integer
 *
 * @private
 */
function readUint32BE(buffer, offset) {
	return ((buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3]) >>> 0;
}

/**
 * Calculate number of channels for a color type.
 * Channels represent independent color/alpha components.
 *
 * @param {number} colorType - PNG color type
 * @returns {number} Number of channels (1-4)
 *
 * @private
 */
function getChannelCount(colorType) {
	switch (colorType) {
		case COLOR_TYPES.GRAYSCALE:
		case COLOR_TYPES.PALETTE:
			return 1;
		case COLOR_TYPES.GRAYSCALE_ALPHA:
			return 2;
		case COLOR_TYPES.RGB:
			return 3;
		case COLOR_TYPES.RGB_ALPHA:
			return 4;
		default:
			throw new Error(`Invalid color type: ${colorType}`);
	}
}

/**
 * Calculate samples per pixel for a color type.
 * Samples are the actual data values stored per pixel.
 * For palette images, this is 1 (the index), regardless of final color channels.
 *
 * @param {number} colorType - PNG color type
 * @returns {number} Number of samples per pixel (1-4)
 *
 * @private
 */
function getSamplesPerPixel(colorType) {
	switch (colorType) {
		case COLOR_TYPES.GRAYSCALE:
		case COLOR_TYPES.PALETTE:
			return 1;
		case COLOR_TYPES.GRAYSCALE_ALPHA:
			return 2;
		case COLOR_TYPES.RGB:
			return 3;
		case COLOR_TYPES.RGB_ALPHA:
			return 4;
		default:
			throw new Error(`Invalid color type: ${colorType}`);
	}
}

/**
 * Check if color type includes alpha channel.
 *
 * @param {number} colorType - PNG color type
 * @returns {boolean} True if color type includes alpha
 *
 * @private
 */
function hasAlphaChannel(colorType) {
	return colorType === COLOR_TYPES.GRAYSCALE_ALPHA || colorType === COLOR_TYPES.RGB_ALPHA;
}

/**
 * Calculate bytes per pixel for given color type and bit depth.
 * This is the storage requirement per pixel in the decoded image data.
 *
 * @param {number} colorType - PNG color type
 * @param {number} bitDepth - Bit depth per sample
 * @returns {number} Bytes per pixel (may be fractional for sub-byte depths)
 *
 * @private
 */
function getBytesPerPixel(colorType, bitDepth) {
	const samplesPerPixel = getSamplesPerPixel(colorType);
	return (samplesPerPixel * bitDepth) / 8;
}

/**
 * Get human-readable name for color type.
 * Useful for debugging and error messages.
 *
 * @param {number} colorType - PNG color type
 * @returns {string} Color type name
 *
 * @example
 * console.log(getColorTypeName(2)); // "RGB"
 * console.log(getColorTypeName(6)); // "RGB+Alpha"
 */
export function getColorTypeName(colorType) {
	switch (colorType) {
		case COLOR_TYPES.GRAYSCALE:
			return "Grayscale";
		case COLOR_TYPES.RGB:
			return "RGB";
		case COLOR_TYPES.PALETTE:
			return "Palette";
		case COLOR_TYPES.GRAYSCALE_ALPHA:
			return "Grayscale+Alpha";
		case COLOR_TYPES.RGB_ALPHA:
			return "RGB+Alpha";
		default:
			return `Unknown(${colorType})`;
	}
}

/**
 * Validate IHDR parameters against PNG specification.
 * Ensures all values are within valid ranges and combinations.
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bitDepth - Bit depth per sample
 * @param {number} colorType - Color type
 * @param {number} compressionMethod - Compression method
 * @param {number} filterMethod - Filter method
 * @param {number} interlaceMethod - Interlace method
 * @throws {Error} If any parameter is invalid
 *
 * @private
 */
function validateIHDRParameters(width, height, bitDepth, colorType, compressionMethod, filterMethod, interlaceMethod) {
	// Validate dimensions
	if (width === 0 || width > 0x7fffffff) {
		throw new Error(`Invalid width: ${width} (must be 1-2147483647)`);
	}

	if (height === 0 || height > 0x7fffffff) {
		throw new Error(`Invalid height: ${height} (must be 1-2147483647)`);
	}

	// Validate color type
	if (!(colorType in VALID_BIT_DEPTHS)) {
		throw new Error(`Invalid color type: ${colorType}`);
	}

	// Validate bit depth for color type
	const validDepths = VALID_BIT_DEPTHS[colorType];
	if (!validDepths.includes(bitDepth)) {
		throw new Error(`Invalid bit depth ${bitDepth} for color type ${getColorTypeName(colorType)} (valid: ${validDepths.join(", ")})`);
	}

	// Validate compression method (must be 0)
	if (compressionMethod !== 0) {
		throw new Error(`Invalid compression method: ${compressionMethod} (must be 0)`);
	}

	// Validate filter method (must be 0)
	if (filterMethod !== 0) {
		throw new Error(`Invalid filter method: ${filterMethod} (must be 0)`);
	}

	// Validate interlace method (0 or 1)
	if (interlaceMethod !== 0 && interlaceMethod !== 1) {
		throw new Error(`Invalid interlace method: ${interlaceMethod} (must be 0 or 1)`);
	}
}

/**
 * Decode PNG IHDR (Image Header) chunk.
 *
 * Parses the 13-byte IHDR chunk data and extracts image parameters.
 * Validates all parameters against PNG specification requirements.
 * Returns structured object with image properties and derived values.
 *
 * @param {Uint8Array} data - IHDR chunk data (must be exactly 13 bytes)
 * @returns {{width: number, height: number, bitDepth: number, colorType: number, compressionMethod: number, filterMethod: number, interlaceMethod: number, channels: number, hasAlpha: boolean, bytesPerPixel: number, samplesPerPixel: number}} Decoded IHDR information
 * @throws {Error} If data is invalid or parameters violate PNG specification
 *
 * @example
 * // Decode IHDR from parsed chunk
 * const ihdrChunk = findChunksByType(chunks, 'IHDR')[0];
 * const ihdr = decodeIHDR(ihdrChunk.data);
 * console.log(`Image: ${ihdr.width}x${ihdr.height}, ${ihdr.bitDepth}-bit`);
 *
 * @example
 * // Check image properties
 * const ihdr = decodeIHDR(data);
 * if (ihdr.interlaceMethod === 1) {
 *   console.log('Image uses Adam7 interlacing');
 * }
 * if (ihdr.colorType === COLOR_TYPES.PALETTE) {
 *   console.log('Palette-based image, need PLTE chunk');
 * }
 */
export function decodeIHDR(data) {
	if (!(data instanceof Uint8Array)) {
		throw new TypeError("Expected data to be Uint8Array");
	}

	if (data.length !== 13) {
		throw new Error(`IHDR chunk must be exactly 13 bytes, got ${data.length}`);
	}

	// Parse IHDR fields (PNG spec section 11.2.2)
	const width = readUint32BE(data, 0);
	const height = readUint32BE(data, 4);
	const bitDepth = data[8];
	const colorType = data[9];
	const compressionMethod = data[10];
	const filterMethod = data[11];
	const interlaceMethod = data[12];

	// Validate all parameters
	validateIHDRParameters(width, height, bitDepth, colorType, compressionMethod, filterMethod, interlaceMethod);

	// Calculate derived properties
	const channels = getChannelCount(colorType);
	const hasAlpha = hasAlphaChannel(colorType);
	const bytesPerPixel = getBytesPerPixel(colorType, bitDepth);
	const samplesPerPixel = getSamplesPerPixel(colorType);

	return {
		width,
		height,
		bitDepth,
		colorType,
		compressionMethod,
		filterMethod,
		interlaceMethod,
		channels,
		hasAlpha,
		bytesPerPixel,
		samplesPerPixel,
	};
}
