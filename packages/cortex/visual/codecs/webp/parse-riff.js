/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file RIFF WebP container parser - Zero-dependency WebP container parsing.
 *
 * Parses RIFF WebP containers with strict validation:
 * - RIFF header validation and size checking
 * - Chunk parsing with precise offset tracking
 * - VP8X ordering constraints enforcement
 * - Metadata chunk deduplication detection
 * - Unknown chunk preservation
 *
 * Returns structured chunk table for downstream processing.
 */

/**
 * Parse RIFF WebP container into structured chunk table.
 *
 * @param {Uint8Array} bytes - WebP file bytes
 * @returns {{
 *   riffSize: number,
 *   chunks: Array<{type: string, data: Uint8Array, offset: number, size: number}>,
 *   chunksByType: Map<string, Array<{type: string, data: Uint8Array, offset: number, size: number}>>,
 *   hasVP8X: boolean,
 *   features?: {icc: boolean, alpha: boolean, exif: boolean, xmp: boolean, anim: boolean, tiles: boolean},
 *   orderValid: boolean,
 *   errors: Array<string>
 * }}
 * @throws {Error} Invalid RIFF structure, size overflow, or critical parsing errors
 */
export function parseRIFFWebP(bytes) {
  if (bytes.length < 12) {
    throw new Error("RIFF: file too small (minimum 12 bytes)");
  }

  // Validate RIFF signature
  const riffSig = String.fromCharCode(...bytes.subarray(0, 4));
  if (riffSig !== "RIFF") {
    throw new Error(`RIFF: invalid signature "${riffSig}", expected "RIFF"`);
  }

  // Read RIFF size (little-endian)
  const riffSize = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);

  // Validate WebP signature
  const webpSig = String.fromCharCode(...bytes.subarray(8, 12));
  if (webpSig !== "WEBP") {
    throw new Error(`RIFF: invalid WebP signature "${webpSig}", expected "WEBP"`);
  }

  // Validate container size
  if (riffSize + 8 > bytes.length) {
    throw new Error(`RIFF: size overflow (declared ${riffSize + 8}, actual ${bytes.length})`);
  }

  const chunks = [];
  const chunksByType = new Map();
  const errors = [];
  let offset = 12; // Start after RIFF header
  const endOffset = Math.min(8 + riffSize, bytes.length);

  // Parse chunks
  while (offset < endOffset) {
    if (offset + 8 > endOffset) {
      errors.push(`RIFF: incomplete chunk header at offset 0x${offset.toString(16)}`);
      break;
    }

    // Read chunk type and size
    const type = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const size = bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24);

    const dataOffset = offset + 8;
    const paddedSize = size + (size & 1); // Even-byte padding

    // Validate chunk boundaries
    if (dataOffset + size > endOffset) {
      errors.push(`RIFF: chunk "${type}" size overflow at offset 0x${offset.toString(16)} (size ${size})`);
      break;
    }

    // Extract chunk data (view, not copy)
    const data = bytes.subarray(dataOffset, dataOffset + size);

    const chunk = { type, data, offset: dataOffset, size };
    chunks.push(chunk);

    // Group by type
    if (!chunksByType.has(type)) {
      chunksByType.set(type, []);
    }
    chunksByType.get(type).push(chunk);

    // Advance to next chunk (with padding)
    offset = dataOffset + paddedSize;
  }

  // Check for VP8X presence and parse features
  const hasVP8X = chunksByType.has("VP8X");
  let features;

  if (hasVP8X) {
    const vp8xChunk = chunksByType.get("VP8X")[0];
    if (vp8xChunk.size >= 10) {
      const flags = vp8xChunk.data[0];
      features = {
        icc: !!(flags & 0x20),
        alpha: !!(flags & 0x10),
        exif: !!(flags & 0x08),
        xmp: !!(flags & 0x04),
        anim: !!(flags & 0x02),
        tiles: !!(flags & 0x01),
      };
    }
  }

  // Validate chunk ordering for VP8X files
  let orderValid = true;
  if (hasVP8X) {
    // VP8X must be first chunk
    if (chunks.length === 0 || chunks[0].type !== "VP8X") {
      errors.push("VP8X: must be first chunk after WEBP header");
      orderValid = false;
    }
  }

  // Check for duplicate metadata chunks
  const metadataTypes = ["ICCP", "EXIF", "XMP "];
  for (const type of metadataTypes) {
    const typeChunks = chunksByType.get(type);
    if (typeChunks && typeChunks.length > 1) {
      errors.push(`RIFF: duplicate ${type} chunks (${typeChunks.length} found)`);
    }
  }

  // Check for multiple ALPH chunks
  const alphChunks = chunksByType.get("ALPH");
  if (alphChunks && alphChunks.length > 1) {
    errors.push(`RIFF: duplicate ALPH chunks (${alphChunks.length} found)`);
  }

  // Validate single primary stream (VP8 or VP8L, not both, unless animation)
  const vp8Chunks = chunksByType.get("VP8 ") || [];
  const vp8lChunks = chunksByType.get("VP8L") || [];

  if (!hasVP8X) {
    // Simple WebP: exactly one VP8 or VP8L
    if (vp8Chunks.length + vp8lChunks.length !== 1) {
      errors.push(
        `RIFF: simple WebP requires exactly one VP8 or VP8L chunk (found ${vp8Chunks.length} VP8, ${vp8lChunks.length} VP8L)`
      );
    }
  }

  return {
    riffSize,
    chunks,
    chunksByType,
    hasVP8X,
    features,
    orderValid,
    errors,
  };
}
