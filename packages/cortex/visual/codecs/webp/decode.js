/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file WebP decoder orchestrator - Main entry point for WebP decoding.
 *
 * Orchestrates the complete WebP decoding pipeline:
 * - RIFF container parsing and validation
 * - VP8X feature detection and metadata extraction
 * - VP8/VP8L bitstream decoding
 * - Alpha channel processing
 * - Final RGBA composition
 *
 * Returns standardized {pixels, width, height, metadata} format.
 */

import { compositeRGBA, decodeAlpha } from "./alpha/decode-alpha.js";
import { extractMetadata } from "./features/metadata.js";
import { parseVP8X, validateVP8XFeatures } from "./features/vp8x.js";
import { parseRIFFWebP } from "./parse-riff.js";
import { decodeVP8ToRGBA } from "./vp8/decode.js";

/**
 * Decode WebP image to RGBA pixels and metadata.
 *
 * @param {Uint8Array} bytes - WebP file bytes
 * @returns {{
 *   pixels: Uint8Array,
 *   width: number,
 *   height: number,
 *   metadata: {
 *     icc?: Uint8Array,
 *     exif?: Uint8Array,
 *     xmp?: Uint8Array,
 *     unknownChunks: Array<{type: string, data: Uint8Array}>
 *   }
 * }}
 * @throws {Error} Invalid WebP format, unsupported features, or decoding errors
 */
export function decodeWEBP(bytes) {
  // Parse RIFF container
  let parsed;
  try {
    parsed = parseRIFFWebP(bytes);
  } catch (error) {
    throw new Error(`WebP parsing failed: ${error.message}`);
  }

  // Fail on parsing errors
  if (parsed.errors.length > 0) {
    throw new Error(`WebP parsing failed: ${parsed.errors.join("; ")}`);
  }

  // Parse VP8X header if present
  let vp8xInfo;

  if (parsed.hasVP8X) {
    const vp8xChunk = parsed.chunksByType.get("VP8X")[0];
    try {
      vp8xInfo = parseVP8X(vp8xChunk.data);
    } catch (error) {
      throw new Error(`WebP VP8X parsing failed: ${error.message}`);
    }

    // Validate VP8X features against available chunks
    const featureErrors = validateVP8XFeatures(vp8xInfo.flags, parsed.chunksByType);
    if (featureErrors.length > 0) {
      throw new Error(`WebP VP8X validation failed: ${featureErrors.join("; ")}`);
    }
  }

  // Extract metadata
  const metadata = extractMetadata(parsed.chunksByType);

  // Determine primary stream type and validate presence
  const vp8Chunks = parsed.chunksByType.get("VP8 ") || [];
  const vp8lChunks = parsed.chunksByType.get("VP8L") || [];
  const alphChunks = parsed.chunksByType.get("ALPH") || [];

  // Only check for missing primary stream if parsing succeeded without errors
  // (parsing errors already include primary stream validation for simple WebP)
  if (parsed.errors.length === 0 && vp8Chunks.length === 0 && vp8lChunks.length === 0) {
    throw new Error("WebP: no primary image stream (VP8 or VP8L) found");
  }

  // Decode VP8 lossy images (M6 + M7)
  if (vp8Chunks.length > 0) {
    const vp8Chunk = vp8Chunks[0];

    // Determine dimensions and alpha requirements
    let width,
      height,
      hasAlpha = false;

    if (vp8xInfo) {
      // VP8X format: use VP8X dimensions and alpha flag
      width = vp8xInfo.width;
      height = vp8xInfo.height;
      hasAlpha = vp8xInfo.flags.alpha;

      // Validate alpha requirements
      if (hasAlpha && alphChunks.length === 0) {
        throw new Error("WebP: VP8X alpha flag set but no ALPH chunk found");
      }
      if (!hasAlpha && alphChunks.length > 0) {
        throw new Error("WebP: ALPH chunk present but VP8X alpha flag not set");
      }
    } else {
      // Simple VP8 format: decode to get dimensions, no alpha
      const vp8Result = decodeVP8ToRGBA(vp8Chunk.data);
      width = vp8Result.width;
      height = vp8Result.height;
      hasAlpha = false;

      // Simple VP8 should not have ALPH chunks
      if (alphChunks.length > 0) {
        throw new Error("WebP: ALPH chunk not allowed in simple VP8 format");
      }

      return {
        pixels: vp8Result.pixels,
        width,
        height,
        metadata,
      };
    }

    // Decode VP8X with potential alpha
    const vp8Result = decodeVP8ToRGBA(vp8Chunk.data);

    // Validate VP8 dimensions match VP8X canvas
    if (vp8Result.width !== width || vp8Result.height !== height) {
      throw new Error(
        `WebP: VP8 dimensions ${vp8Result.width}x${vp8Result.height} do not match VP8X canvas ${width}x${height}`
      );
    }

    if (hasAlpha) {
      // Decode alpha channel and composite
      const alphChunk = alphChunks[0];
      const alphaPlane = decodeAlpha(alphChunk.data, width, height);

      // Convert RGBA to RGB for compositing
      const rgbPixels = new Uint8Array(width * height * 3);
      for (let i = 0; i < width * height; i++) {
        const rgbaIdx = i * 4;
        const rgbIdx = i * 3;
        rgbPixels[rgbIdx] = vp8Result.pixels[rgbaIdx]; // R
        rgbPixels[rgbIdx + 1] = vp8Result.pixels[rgbaIdx + 1]; // G
        rgbPixels[rgbIdx + 2] = vp8Result.pixels[rgbaIdx + 2]; // B
        // Skip alpha channel from VP8 (always 255)
      }

      // Composite RGB with alpha plane
      const finalPixels = compositeRGBA(rgbPixels, alphaPlane, width, height);

      return {
        pixels: finalPixels,
        width,
        height,
        metadata,
      };
    } else {
      // No alpha, return VP8 result directly
      return {
        pixels: vp8Result.pixels,
        width,
        height,
        metadata,
      };
    }
  }

  // VP8L lossless images (deferred to M8/M9)
  if (vp8lChunks.length > 0) {
    throw new Error("WebP: VP8L lossless decoding not implemented yet");
  }

  // This should not be reached due to earlier validation
  throw new Error("WebP: no supported image format found");
}

/**
 * Extract metadata from parsed chunks.
 *
 * @param {Map<string, Array<{type: string, data: Uint8Array}>>} chunksByType - Parsed chunks by type
 * @returns {{
 *   icc?: Uint8Array,
 *   exif?: Uint8Array,
 *   xmp?: Uint8Array,
 *   unknownChunks: Array<{type: string, data: Uint8Array}>
 * }}
 */
function _extractMetadata(chunksByType) {
  /** @type {{icc?: Uint8Array, exif?: Uint8Array, xmp?: Uint8Array, unknownChunks: Array<{type: string, data: Uint8Array}>}} */
  const metadata = { unknownChunks: [] };

  // Extract standard metadata chunks
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
