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
 * // Output:
 * // <title>My Awesome Page | My Site</title>
 * // <meta name="description" property="description" content="The best page ever created" />
 * // <link rel="canonical" href="https://example.com/awesome-page" />
 *
 * // Social media tags (Open Graph + Twitter Cards + Pinterest + LinkedIn + Discord)
 * const socialTags = social({
 *   title: 'My Awesome Page',
 *   description: 'The best page ever created',
 *   domain: 'example.com',
 *   path: '/awesome-page',
 *   imageUrl: '/hero-image.jpg'
 * });
 * // Output:
 * // <meta name="og:type" property="og:type" content="website">
 * // <meta name="og:title" property="og:title" content="My Awesome Page" />
 * // <meta name="og:description" property="og:description" content="The best page ever created" />
 * // <meta name="og:url" property="og:url" content="https://example.com/awesome-page" />
 * // <meta name="og:image" property="og:image" content="https://example.com/hero-image.jpg" />
 * // <meta name="twitter:card" property="twitter:card" content="summary" />
 * // <meta name="twitter:title" property="twitter:title" content="My Awesome Page" />
 * // <meta name="twitter:description" property="twitter:description" content="The best page ever created" />
 * // <meta name="twitter:image" property="twitter:image" content="https://example.com/hero-image.jpg" />
 * // <meta name="twitter:image:src" property="twitter:image:src" content="https://example.com/hero-image.jpg">
 * // <meta name="twitter:image:alt" property="twitter:image:alt" content="Illustration of My Awesome Page">
 * // <meta name="pinterest:description" property="pinterest:description" content="The best page ever created" />
 * // <meta name="pinterest:media" property="pinterest:media" content="https://example.com/hero-image.jpg" />
 * // <meta name="pinterest:source" property="pinterest:source" content="https://example.com/awesome-page" />
 * // <meta name="linkedin:title" property="linkedin:title" content="My Awesome Page" />
 * // <meta name="linkedin:description" property="linkedin:description" content="The best page ever created" />
 * // <meta name="linkedin:url" property="linkedin:url" content="https://example.com/awesome-page" />
 * // <meta name="linkedin:image" property="linkedin:image" content="https://example.com/hero-image.jpg" />
 * // <meta name="discord:title" property="discord:title" content="My Awesome Page" />
 * // <meta name="discord:description" property="discord:description" content="The best page ever created" />
 * // <meta name="discord:url" property="discord:url" content="https://example.com/awesome-page" />
 * // <meta name="discord:image" property="discord:image" content="https://example.com/hero-image.jpg" />
 *
 * // Robots meta tag (search engine crawling control)
 * const robotsTags = robots({
 *   index: true,
 *   follow: false
 * });
 * // Output:
 * // <meta name="robots" content="index, nofollow" />
 *
 * // Author meta tag (content attribution)
 * const authorTags = author({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * // Output:
 * // <meta name="author" content="John Doe" />
 * // <meta name="reply-to" content="john@example.com" />
 *
 * // Canonical URL (duplicate content prevention)
 * const canonicalTags = canonical({
 *   domain: 'example.com',
 *   path: '/awesome-page'
 * });
 * // Output:
 * // <link rel="canonical" href="https://example.com/awesome-page" />
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
