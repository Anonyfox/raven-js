/**
 * @packageDocumentation
 *
 * Zero-config SEO meta tag generators for modern web apps.
 *
 * Stop writing boilerplate meta tags by hand. These functions generate
 * production-ready HTML with proper Open Graph, Twitter Cards, and basic SEO tags.
 *
 * @example
 * import { general, social } from '@raven-js/beak/seo';
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
 * // Social media tags (Open Graph + Twitter Cards)
 * const socialTags = social({
 *   title: 'My Awesome Page',
 *   description: 'The best page ever created',
 *   domain: 'example.com',
 *   path: '/awesome-page',
 *   imageUrl: '/hero-image.jpg'
 * });
 *
 * // Result: Clean, properly formatted meta tags ready for your <head>
 */

export { general } from "./general.js";
export { openGraph } from "./open-graph.js";
export { social } from "./social.js";
export { twitter } from "./twitter.js";
