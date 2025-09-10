/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive robots meta tags generator with comprehensive SEO control.
 *
 * Generates sophisticated robots meta tags that control search engine crawling,
 * indexing, and display behavior. Progressive enhancement from basic directives
 * to enterprise-level SEO management with search engine specific optimizations.
 */

import { escapeHtml, html } from "./index.js";

/**
 * @typedef {Object} RobotsBasicConfig
 * @property {boolean} [index=true] - Allow/disallow page indexing
 * @property {boolean} [follow=true] - Allow/disallow link following
 */

/**
 * @typedef {Object} RobotsAdvancedConfig
 * @property {boolean} [archive=true] - Allow/disallow cached copies
 * @property {boolean} [snippet=true] - Allow/disallow text snippets in search results
 * @property {boolean} [imageindex=true] - Allow/disallow indexing of images on page
 * @property {boolean} [cache=true] - Allow/disallow cached page storage
 * @property {number} [maxSnippet] - Maximum snippet length (Google: 0-320, Bing: 0-1000)
 * @property {number} [maxImagePreview] - Maximum image preview size ('none', 'standard', 'large')
 * @property {number} [maxVideoPreview] - Maximum video preview duration in seconds
 * @property {string} [unavailableAfter] - ISO 8601 date when content becomes unavailable
 */

/**
 * @typedef {Object} RobotsSearchEngineConfig
 * @property {boolean} [googlebot=true] - Google-specific indexing control
 * @property {boolean} [bingbot=true] - Bing-specific indexing control
 * @property {boolean} [slurp=true] - Yahoo-specific indexing control
 * @property {boolean} [duckduckbot=true] - DuckDuckGo-specific indexing control
 * @property {number} [crawlDelay] - Delay between crawler requests in seconds
 * @property {string} [host] - Preferred domain for multi-domain sites
 */

/**
 * @typedef {Object} RobotsEnterpriseConfig
 * @property {string} [contentType] - Content type for intelligent defaults ('article', 'product', 'news', 'page', 'category')
 * @property {boolean} [isStaging=false] - Staging environment flag
 * @property {boolean} [isPrivate=false] - Private/protected content flag
 * @property {boolean} [isPaid=false] - Paid content requiring subscription
 * @property {string} [locale] - Content locale for international SEO
 * @property {string[]} [sitemaps] - Sitemap URLs to include
 * @property {Object} [news] - News-specific directives
 * @property {boolean} [news.follow=true] - Allow following links in news content
 * @property {boolean} [news.archive=true] - Allow archiving news content
 * @property {Object} [ecommerce] - E-commerce specific directives
 * @property {boolean} [ecommerce.index=true] - Index product pages
 * @property {boolean} [ecommerce.snippet=true] - Allow product snippets
 * @property {number} [ecommerce.maxImagePreview] - Product image preview size
 */

/**
 * @typedef {Object} RobotsConfig
 *
 * **Tier 1 (Basic SEO Control):** Essential indexing and crawling directives
 * @property {boolean} [index=true] - Allow/disallow page indexing
 * @property {boolean} [follow=true] - Allow/disallow link following
 *
 * **Tier 2 (Advanced Crawling Directives):** Enhanced search result control
 * @property {boolean} [archive=true] - Allow/disallow cached page copies
 * @property {boolean} [snippet=true] - Allow/disallow text snippets in search results
 * @property {boolean} [imageindex=true] - Allow/disallow indexing of images on page
 * @property {boolean} [cache=true] - Allow/disallow page storage in search cache
 *
 * **Tier 3 (Search Engine Specific):** Platform-specific optimizations
 * @property {boolean} [googlebot=true] - Google-specific indexing control
 * @property {boolean} [bingbot=true] - Bing-specific indexing control
 * @property {boolean} [slurp=true] - Yahoo-specific indexing control
 * @property {boolean} [duckduckbot=true] - DuckDuckGo-specific indexing control
 * @property {number} [maxSnippet] - Maximum snippet length (Google: 0-320, Bing: 0-1000)
 * @property {number|'none'|'standard'|'large'} [maxImagePreview] - Maximum image preview size
 * @property {number} [maxVideoPreview] - Maximum video preview duration in seconds
 * @property {string} [unavailableAfter] - ISO 8601 date when content becomes unavailable
 * @property {number} [crawlDelay] - Delay between crawler requests in seconds
 * @property {string} [host] - Preferred domain for multi-domain sites
 *
 * **Tier 4 (Enterprise SEO Management):** Advanced content and environment controls
 * @property {string} [contentType] - Content type for intelligent defaults ('article', 'product', 'news', 'page', 'category')
 * @property {boolean} [isStaging=false] - Staging environment flag (auto-blocks all indexing)
 * @property {boolean} [isPrivate=false] - Private/protected content flag (auto-blocks indexing)
 * @property {boolean} [isPaid=false] - Paid content requiring subscription (auto-blocks indexing)
 * @property {string} [locale] - Content locale for international SEO
 * @property {string[]} [sitemaps] - Sitemap URLs to include (max 5)
 * @property {Object} [news] - News-specific directives (auto-applies for contentType: 'news')
 * @property {boolean} [news.follow=true] - Allow following links in news content
 * @property {boolean} [news.archive=true] - Allow archiving news content
 * @property {Object} [ecommerce] - E-commerce specific directives (auto-applies for contentType: 'product')
 * @property {boolean} [ecommerce.index=true] - Index product pages
 * @property {boolean} [ecommerce.snippet=true] - Allow product snippets
 * @property {number} [ecommerce.maxImagePreview] - Product image preview size
 */

/**
 * Intelligent content-type aware defaults for SEO optimization.
 *
 * @param {string} contentType - Content type identifier
 * @param {boolean} isStaging - Whether this is a staging environment
 * @param {boolean} isPrivate - Whether this is private content
 * @param {boolean} isPaid - Whether this is paid content
 * @returns {Object} Default configuration based on content type
 */
const getContentTypeDefaults = (contentType, isStaging, isPrivate, isPaid) => {
  // Handle environment overrides first
  if (isStaging) {
    return {
      index: false,
      follow: false,
      archive: false,
      snippet: false,
      imageindex: false,
      cache: false,
      googlebot: false,
      bingbot: false,
    };
  }

  if (isPrivate || isPaid) {
    return {
      index: false,
      follow: false,
      archive: false,
      snippet: false,
      imageindex: false,
      cache: false,
    };
  }

  // Content-type specific defaults
  switch (contentType) {
    case "article":
      return {
        index: true,
        follow: true,
        archive: true,
        snippet: true,
        imageindex: true,
        cache: true,
        maxSnippet: 160,
        maxImagePreview: "large",
        maxVideoPreview: 30,
      };

    case "news":
      return {
        index: true,
        follow: true,
        archive: true,
        snippet: true,
        imageindex: true,
        cache: true,
        maxSnippet: 200,
        maxImagePreview: "large",
        maxVideoPreview: 60,
        news: {
          follow: true,
          archive: true,
        },
      };

    case "product":
      return {
        index: true,
        follow: true,
        archive: true,
        snippet: true,
        imageindex: true,
        cache: true,
        maxSnippet: 120,
        maxImagePreview: "large",
        maxVideoPreview: 45,
        ecommerce: {
          index: true,
          snippet: true,
          maxImagePreview: "large",
        },
      };

    case "category":
      return {
        index: true,
        follow: true,
        archive: true,
        snippet: true,
        imageindex: false,
        cache: true,
        maxSnippet: 140,
        maxImagePreview: "standard",
      };

    default:
      return {
        index: true,
        follow: true,
        archive: true,
        snippet: true,
        imageindex: true,
        cache: true,
        maxSnippet: 160,
        maxImagePreview: "large",
      };
  }
};

/**
 * Generates basic robots directives (index, follow).
 *
 * @param {RobotsConfig} config - Robots configuration
 * @returns {string[]} Array of basic directives
 */
const generateBasicDirectives = (config) => {
  const directives = [];

  // @ts-expect-error: Intentional check for both boolean false and numeric zero
  if (config.index === false || config.index === 0) {
    directives.push("noindex");
  } else {
    directives.push("index");
  }

  // @ts-expect-error: Intentional check for both boolean false and numeric zero
  if (config.follow === false || config.follow === 0) {
    directives.push("nofollow");
  } else {
    directives.push("follow");
  }

  return directives;
};

/**
 * Generates advanced robots directives (archive, snippet, imageindex, cache).
 *
 * @param {RobotsConfig} config - Robots configuration
 * @returns {string[]} Array of advanced directives
 */
const generateAdvancedDirectives = (config) => {
  const directives = [];

  if (config.archive === false) {
    directives.push("noarchive");
  }

  if (config.snippet === false) {
    directives.push("nosnippet");
  }

  if (config.imageindex === false) {
    directives.push("noimageindex");
  }

  if (config.cache === false) {
    directives.push("nocache");
  }

  return directives;
};

/**
 * Generates search engine specific robots directives.
 *
 * @param {RobotsConfig} config - Robots configuration
 * @returns {string[]} Array of search engine specific directives
 */
const generateSearchEngineDirectives = (config) => {
  const directives = [];

  const { googlebot, bingbot, slurp, duckduckbot } = config;

  // Google-specific directives
  if (googlebot === false) {
    directives.push("googlebot: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache");
  }

  // Bing-specific directives
  if (bingbot === false) {
    directives.push("bingbot: noindex, nofollow, noarchive, nosnippet, nocache");
  }

  // Yahoo-specific directives
  if (slurp === false) {
    directives.push("slurp: noindex, nofollow, noarchive, nosnippet");
  }

  // DuckDuckGo-specific directives
  if (duckduckbot === false) {
    directives.push("duckduckbot: noindex, nofollow, nosnippet");
  }

  return directives;
};

/**
 * Generates Google-specific robots directives (max-snippet, max-image-preview, etc.).
 *
 * @param {RobotsConfig} config - Robots configuration
 * @returns {string[]} Array of Google-specific directives
 */
const generateGoogleDirectives = (config) => {
  const directives = [];

  if (config.maxSnippet != null) {
    directives.push(`max-snippet:${config.maxSnippet}`);
  }

  if (config.maxImagePreview != null) {
    directives.push(`max-image-preview:${config.maxImagePreview}`);
  }

  if (config.maxVideoPreview != null) {
    directives.push(`max-video-preview:${config.maxVideoPreview}`);
  }

  if (config.unavailableAfter) {
    directives.push(`unavailable_after:${config.unavailableAfter}`);
  }

  return directives;
};

/**
 * Generates enterprise-level robots markup (canonical, sitemaps, content-specific).
 *
 * @param {RobotsConfig} config - Robots configuration
 * @returns {string} Enterprise markup
 */
const generateEnterpriseMarkup = (config) => {
  let markup = "";

  if (config.host) {
    markup += html`<link rel="canonical" href="https://${escapeHtml(config.host)}" />`;
  }

  if (config.sitemaps && config.sitemaps.length > 0) {
    for (const sitemap of config.sitemaps.slice(0, 5)) {
      // Limit to 5 sitemaps
      markup += html`<link rel="sitemap" type="application/xml" href="${sitemap}" />`;
    }
  }

  // Content-specific optimizations
  if (config.news && config.contentType === "news") {
    const newsDirectives = [];
    if (/** @type {any} */ (config.news).follow === false) {
      newsDirectives.push("nofollow");
    }
    if (/** @type {any} */ (config.news).archive === false) {
      newsDirectives.push("noarchive");
    }
    if (newsDirectives.length > 0) {
      markup += html`<meta name="robots" content="${newsDirectives.join(", ")}" />`;
    }
  }

  if (config.ecommerce && config.contentType === "product") {
    const commerceDirectives = [];
    if (/** @type {any} */ (config.ecommerce).index === false) {
      commerceDirectives.push("noindex");
    }
    if (/** @type {any} */ (config.ecommerce).snippet === false) {
      commerceDirectives.push("nosnippet");
    }
    if (commerceDirectives.length > 0) {
      markup += html`<meta name="robots" content="${commerceDirectives.join(", ")}" />`;
    }

    if (/** @type {any} */ (config.ecommerce).maxImagePreview) {
      markup += html`<meta name="robots" content="max-image-preview:${/** @type {any} */ (config.ecommerce).maxImagePreview}" />`;
    }
  }

  return markup;
};

/**
 * Generates comprehensive robots meta tags with progressive SEO control.
 *
 * **Tier 1 (Basic SEO Control):** Essential indexing and crawling directives
 * **Tier 2 (Advanced Crawling Directives):** Enhanced search result control
 * **Tier 3 (Search Engine Specific):** Platform-specific optimizations
 * **Tier 4 (Enterprise SEO Management):** Content-type intelligence and advanced controls
 *
 * Each configuration option unlocks increasingly sophisticated SEO capabilities
 * without redundancy. Missing options generate no corresponding markup.
 *
 * @param {RobotsConfig} config - Progressive robots configuration
 * @returns {string} Generated robots HTML markup
 *
 * @example
 * // Tier 1: Essential SEO (minimal viable indexing)
 * robots({
 *   index: true,
 *   follow: true
 * });
 * // → Basic allow indexing and following for all search engines
 *
 * @example
 * // Tier 1 + Blocking: Essential SEO with blocking
 * robots({
 *   index: false,
 *   follow: false
 * });
 * // → Block all indexing and following
 *
 * @example
 * // Tier 2: Advanced control (enhanced search appearance)
 * robots({
 *   index: true,
 *   follow: true,
 *   snippet: true,
 *   archive: true,
 *   maxSnippet: 160,
 *   maxImagePreview: 'large'
 * });
 * // → Control how content appears in search results
 *
 * @example
 * // Tier 2: No snippets (privacy-focused)
 * robots({
 *   index: true,
 *   follow: true,
 *   snippet: false,
 *   maxSnippet: 0
 * });
 * // → Allow indexing but hide text snippets
 *
 * @example
 * // Tier 3: Google-specific optimizations
 * robots({
 *   index: true,
 *   follow: true,
 *   googlebot: true,
 *   maxSnippet: 160,
 *   maxImagePreview: 'large',
 *   maxVideoPreview: 30,
 *   unavailableAfter: '2024-12-31T23:59:59Z'
 * });
 * // → Google-specific search result control and expiration
 *
 * @example
 * // Tier 3: Multi-engine platform control
 * robots({
 *   index: true,
 *   follow: true,
 *   googlebot: true,
 *   bingbot: true,
 *   slurp: true,
 *   host: 'example.com'
 * });
 * // → Platform-specific control with canonical domain preference
 *
 * @example
 * // Tier 4: Article content (intelligent defaults)
 * robots({
 *   contentType: 'article',
 *   maxSnippet: 160,
 *   maxImagePreview: 'large',
 *   sitemaps: ['/sitemap.xml']
 * });
 * // → Article-optimized settings with intelligent defaults applied
 *
 * @example
 * // Tier 4: E-commerce product (commerce-specific)
 * robots({
 *   contentType: 'product',
 *   maxSnippet: 120,
 *   maxImagePreview: 'large',
 *   ecommerce: {
 *     index: true,
 *     snippet: true
 *   }
 * });
 * // → Product-optimized settings for e-commerce SEO
 *
 * @example
 * // Tier 4: News content (time-sensitive optimization)
 * robots({
 *   contentType: 'news',
 *   maxSnippet: 200,
 *   maxImagePreview: 'large',
 *   maxVideoPreview: 60,
 *   news: {
 *     follow: true,
 *     archive: true
 *   }
 * });
 * // → News-optimized settings for breaking news and time-sensitive content
 *
 * @example
 * // Enterprise: Staging environment protection
 * robots({
 *   isStaging: true
 * });
 * // → Auto-blocks ALL indexing for staging environments (security override)
 *
 * @example
 * // Enterprise: Private/paid content protection
 * robots({
 *   isPaid: true,
 *   maxSnippet: 50
 * });
 * // → Auto-blocks indexing with minimal snippet for paid content
 */
/**
 * @param {RobotsConfig} config - Progressive robots configuration
 * @returns {string} Generated robots HTML markup
 */
export const robots = (/** @type {RobotsConfig} */ config = {}) => {
  // Handle null or invalid config
  if (!config || typeof config !== "object") {
    config = {};
  }

  // Merge with intelligent content-type defaults
  const defaults = getContentTypeDefaults(config.contentType, config.isStaging, config.isPrivate, config.isPaid);

  // Environment flags take absolute precedence for security
  const finalConfig = {
    ...defaults,
    ...config,
    // Force environment overrides regardless of user settings
    ...(config.isStaging
      ? {
          index: false,
          follow: false,
          archive: false,
          snippet: false,
          imageindex: false,
          cache: false,
          googlebot: false,
          bingbot: false,
        }
      : {}),
    ...(config.isPrivate || config.isPaid
      ? {
          index: false,
          follow: false,
          archive: false,
          snippet: false,
          imageindex: false,
          cache: false,
        }
      : {}),
  };

  // Clean orchestration through pure functions
  const basicDirectives = generateBasicDirectives(finalConfig);
  const advancedDirectives = generateAdvancedDirectives(finalConfig);
  const searchEngineDirectives = generateSearchEngineDirectives(finalConfig);
  const googleDirectives = generateGoogleDirectives(finalConfig);

  // Combine all directives
  const allDirectives = [...basicDirectives, ...advancedDirectives];
  const robotsContent = allDirectives.join(", ");

  // Build the HTML output
  let markup = html`<meta name="robots" content="${robotsContent}" />`;

  // Add search engine specific tags
  for (const directive of searchEngineDirectives) {
    markup += html`<meta name="robots" content="${directive}" />`;
  }

  // Add Google-specific directives
  for (const directive of googleDirectives) {
    markup += html`<meta name="robots" content="${directive}" />`;
  }

  // Add enterprise features
  markup += generateEnterpriseMarkup(finalConfig);

  return markup;
};
