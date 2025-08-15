/**
 * @packageDocumentation
 *
 * Zero-config SEO meta tag generators for modern web apps.
 *
 * Stop writing boilerplate meta tags by hand. These functions generate
 * production-ready HTML with proper Open Graph, Twitter Cards, and basic SEO tags.
 *
 * @example
 * import { general, social, robots, author, canonical } from '@raven-js/beak/seo';
 *
 * // Basic SEO tags (title, description, canonical)
 * const basicTags = general({
 *   title: 'My Awesome Page',
 *   description: 'The best page ever created',
 *   domain: 'example.com',
 *   path: '/awesome-page',
 *   suffix: 'My Site'
 * });
 *
 * // Social media tags (Open Graph + Twitter Cards + Pinterest + LinkedIn + Discord)
 * const socialTags = social({
 *   title: 'My Awesome Page',
 *   description: 'The best page ever created',
 *   domain: 'example.com',
 *   path: '/awesome-page',
 *   imageUrl: '/hero-image.jpg'
 * });
 *
 * // Robots meta tag (search engine crawling control)
 * const robotsTags = robots({
 *   index: true,
 *   follow: false
 * });
 *
 * // Author meta tag (content attribution)
 * const authorTags = author({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 *
 * // Canonical URL (duplicate content prevention)
 * const canonicalTags = canonical({
 *   domain: 'example.com',
 *   path: '/awesome-page'
 * });
 *
 * // Result: Clean, properly formatted meta tags ready for your <head>
 */

export { author } from "./author.js";
export { canonical } from "./canonical.js";
export { discord } from "./discord.js";
export { general } from "./general.js";
export { linkedin } from "./linkedin.js";
export { openGraph } from "./open-graph.js";
export { pinterest } from "./pinterest.js";
export { robots } from "./robots.js";
export { social } from "./social.js";
export { twitter } from "./twitter.js";
