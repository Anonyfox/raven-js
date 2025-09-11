/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Metadata extraction - ICC, EXIF, XMP chunk processing.
 *
 * Extracts and validates metadata chunks:
 * - ICC color profiles (raw bytes)
 * - EXIF metadata (TIFF-wrapped)
 * - XMP metadata (RDF/XML)
 * - Unknown chunks preservation
 *
 * All metadata is returned as Uint8Array views for zero-copy efficiency.
 */

/**
 * Extract all metadata from parsed WebP chunks.
 *
 * @param {Map<string, Array<{type: string, data: Uint8Array}>>} chunksByType - Parsed chunks by type
 * @returns {{
 *   icc?: Uint8Array,
 *   exif?: Uint8Array,
 *   xmp?: Uint8Array,
 *   unknownChunks: Array<{type: string, data: Uint8Array}>
 * }}
 */
export function extractMetadata(chunksByType) {
  /** @type {{icc?: Uint8Array, exif?: Uint8Array, xmp?: Uint8Array, unknownChunks: Array<{type: string, data: Uint8Array}>}} */
  const metadata = { unknownChunks: [] };

  // Extract standard metadata chunks (use first occurrence if duplicates exist)
  const iccChunks = chunksByType.get("ICCP");
  if (iccChunks && iccChunks.length > 0) {
    metadata.icc = iccChunks[0].data;
  }

  const exifChunks = chunksByType.get("EXIF");
  if (exifChunks && exifChunks.length > 0) {
    metadata.exif = exifChunks[0].data;
  }

  const xmpChunks = chunksByType.get("XMP ");
  if (xmpChunks && xmpChunks.length > 0) {
    metadata.xmp = xmpChunks[0].data;
  }

  // Collect unknown chunks (not standard WebP chunks)
  const knownTypes = new Set(["VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF", "ICCP", "EXIF", "XMP ", "META"]);

  for (const [type, chunks] of chunksByType) {
    if (!knownTypes.has(type)) {
      for (const chunk of chunks) {
        metadata.unknownChunks.push({ type: chunk.type, data: chunk.data });
      }
    }
  }

  return metadata;
}

/**
 * Validate ICC color profile chunk.
 *
 * @param {Uint8Array} iccData - ICC profile data
 * @returns {Array<string>} Validation errors (empty if valid)
 */
export function validateICCP(iccData) {
  const errors = [];

  if (iccData.length < 128) {
    errors.push("ICCP: profile too small (minimum 128 bytes)");
    return errors;
  }

  // Check ICC profile signature (bytes 36-39 should be "acsp")
  const signature = String.fromCharCode(...iccData.subarray(36, 40));
  if (signature !== "acsp") {
    errors.push(`ICCP: invalid profile signature "${signature}" (expected "acsp")`);
  }

  // Validate profile size field (bytes 0-3, big-endian)
  const profileSize = (iccData[0] << 24) | (iccData[1] << 16) | (iccData[2] << 8) | iccData[3];
  if (profileSize !== iccData.length) {
    errors.push(`ICCP: profile size mismatch (header: ${profileSize}, actual: ${iccData.length})`);
  }

  return errors;
}

/**
 * Validate EXIF metadata chunk.
 *
 * @param {Uint8Array} exifData - EXIF data
 * @returns {Array<string>} Validation errors (empty if valid)
 */
export function validateEXIF(exifData) {
  const errors = [];

  if (exifData.length < 8) {
    errors.push("EXIF: data too small (minimum 8 bytes)");
    return errors;
  }

  // Check TIFF header (should start with "II*\0" or "MM\0*")
  const header = String.fromCharCode(...exifData.subarray(0, 2));
  if (header !== "II" && header !== "MM") {
    errors.push(`EXIF: invalid TIFF header "${header}" (expected "II" or "MM")`);
    return errors; // Early return if header is invalid
  }

  // Check magic number (bytes 2-3)
  let magic;
  if (header === "II") {
    // Little-endian
    magic = exifData[2] | (exifData[3] << 8);
  } else {
    // Big-endian
    magic = (exifData[2] << 8) | exifData[3];
  }

  if (magic !== 42) {
    errors.push(`EXIF: invalid TIFF magic number ${magic} (expected 42)`);
  }

  return errors;
}

/**
 * Validate XMP metadata chunk.
 *
 * @param {Uint8Array} xmpData - XMP data
 * @returns {Array<string>} Validation errors (empty if valid)
 */
export function validateXMP(xmpData) {
  const errors = [];

  if (xmpData.length === 0) {
    errors.push("XMP: empty data");
    return errors;
  }

  // Convert to string for basic validation
  let xmpString;
  try {
    xmpString = new TextDecoder("utf-8", { fatal: true }).decode(xmpData);
  } catch (_error) {
    errors.push("XMP: invalid UTF-8 encoding");
    return errors;
  }

  // Check for basic XMP packet structure (both are required)
  if (!xmpString.includes("<?xpacket") || !xmpString.includes("x:xmpmeta")) {
    errors.push("XMP: missing required XMP packet structure");
  }

  return errors;
}
