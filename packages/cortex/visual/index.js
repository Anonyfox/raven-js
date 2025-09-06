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
 * Platform-native image manipulation supporting PNG, JPEG, WebP, and GIF formats.
 * Provides uniform API for decoding, transforming, and encoding images using only
 * modern JavaScript features and Node.js built-ins. Runs everywhere without native
 * dependencies or WebAssembly complexity.
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

export { GIFImage } from "./gif-image.js";
export { Image } from "./image-base.js";
export { createImage } from "./image-factory.js";
export { JPEGImage } from "./jpeg-image.js";
export { PNGImage } from "./png/index.js";
export { WebPImage } from "./webp-image.js";
