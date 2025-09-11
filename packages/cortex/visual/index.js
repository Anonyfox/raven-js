/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Pure JavaScript image processing with zero dependencies.
 *
 * Platform-native image manipulation supporting JPEG, PNG, BMP, WebP, and GIF formats.
 * Provides uniform API for decoding, transforming, and encoding images using only
 * modern JavaScript features and Node.js built-ins. Runs everywhere without native
 * dependencies or WebAssembly complexity.
 *
 * @example
 * // Decode JPEG image
 * import { decodeJPEG } from "@raven-js/cortex/visual";
 *
 * const result = await decodeJPEG(jpegBuffer);
 * console.log(`Decoded ${result.width}x${result.height} JPEG`);
 *
 * @example
 * // Create image from buffer
 * import { createImage } from "@raven-js/cortex/visual";
 *
 * const image = createImage(buffer, 'image/png');
 * const resized = image.resize(800, 600).crop(0, 0, 400, 300);
 * const webpBuffer = resized.toBuffer('image/webp');
 *
 * @example
 * // Extract metadata
 * const metadata = image.getMetadata();
 * console.log(metadata.exif, metadata.xmp);
 */

export { decodeBMP, encodeBMP } from "./codecs/bmp/index.js";
export { decodeJPEG, encodeJPEG } from "./codecs/jpeg/index.js";
// Codec functions (new architecture)
export { decodePNG, encodePNG } from "./codecs/png/index.js";
// Base Image class
export { Image } from "./image.js";

// TODO: Convert remaining formats to codec functions
// export { GIFImage } from "./gif-image.js";
// export { WebPImage } from "./webp-image.js";
