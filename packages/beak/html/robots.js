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
 * @property {boolean} [index=true] - Basic indexing control
 * @property {boolean} [follow=true] - Basic following control
 * @property {boolean} [archive=true] - Archive control
 * @property {boolean} [snippet=true] - Snippet control
 * @property {boolean} [imageindex=true] - Image indexing control
 * @property {boolean} [cache=true] - Cache control
 * @property {number} [maxSnippet] - Maximum snippet length
 * @property {number|'none'|'standard'|'large'} [maxImagePreview] - Image preview size
 * @property {number} [maxVideoPreview] - Video preview duration
 * @property {string} [unavailableAfter] - Content expiration date
 * @property {boolean} [googlebot=true] - Google bot control
 * @property {boolean} [bingbot=true] - Bing bot control
 * @property {boolean} [slurp=true] - Yahoo bot control
 * @property {boolean} [duckduckbot=true] - DuckDuckGo bot control
 * @property {number} [crawlDelay] - Crawl delay
 * @property {string} [host] - Preferred host
 * @property {string} [contentType] - Content type for defaults
 * @property {boolean} [isStaging=false] - Staging environment
 * @property {boolean} [isPrivate=false] - Private content
 * @property {boolean} [isPaid=false] - Paid content
 * @property {string} [locale] - Content locale
 * @property {string[]} [sitemaps] - Sitemap URLs
 * @property {Object} [news] - News directives
 * @property {Object} [ecommerce] - E-commerce directives
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
 * Generates comprehensive robots meta tags with progressive SEO control.
 *
 * **Tier 1: Basic SEO Control** - Foundation indexing and following control
 * **Tier 2: Advanced Crawling Directives** - Snippet control, archiving, image indexing
 * **Tier 3: Search Engine Specific** - Platform-specific optimizations and crawl management
 * **Tier 4: Enterprise SEO Management** - Content-type intelligence and advanced controls
 *
 * Each configuration option unlocks increasingly sophisticated SEO capabilities
 * without redundancy. Missing options generate no corresponding markup.
 *
 * @param {RobotsConfig} config - Progressive robots configuration
 * @returns {string} Generated robots HTML markup
 *
 * @example
 * // Tier 1: Basic SEO control
 * robots({
 *   index: true,
 *   follow: true
 * });
 * // → Basic indexing control for all search engines
 *
 * @example
 * // Tier 2: Advanced snippet control (maximum SEO impact)
 * robots({
 *   index: true,
 *   follow: true,
 *   maxSnippet: 160,
 *   maxImagePreview: 'large',
 *   maxVideoPreview: 30,
 *   archive: true,
 *   snippet: true,
 *   imageindex: true
 * });
 * // → Controls search result appearance and crawl behavior
 *
 * @example
 * // Tier 3: Search engine specific optimization
 * robots({
 *   index: true,
 *   follow: true,
 *   googlebot: true,
 *   bingbot: true,
 *   unavailableAfter: '2024-12-31T23:59:59Z',
 *   crawlDelay: 1
 * });
 * // → Platform-specific optimizations with crawl budget management
 *
 * @example
 * // Tier 4: Article content with enterprise controls
 * robots({
 *   contentType: 'article',
 *   maxSnippet: 160,
 *   maxImagePreview: 'large',
 *   maxVideoPreview: 30,
 *   locale: 'en-US',
 *   sitemaps: ['/sitemap.xml', '/sitemap-news.xml']
 * });
 * // → Content-aware defaults with international SEO support
 *
 * @example
 * // Tier 4: E-commerce product optimization
 * robots({
 *   contentType: 'product',
 *   maxSnippet: 120,
 *   maxImagePreview: 'large',
 *   ecommerce: {
 *     index: true,
 *     snippet: true,
 *     maxImagePreview: 'large'
 *   }
 * });
 * // → Product-specific SEO optimizations
 *
 * @example
 * // Tier 4: News content with breaking news optimization
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
 * // → News-specific SEO with high visibility settings
 *
 * @example
 * // Staging environment protection
 * robots({
 *   isStaging: true
 * });
 * // → Blocks all indexing for staging environments
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

  // Tier 1: Basic directives (always present)
  const basicDirectives = [];

  // @ts-expect-error: Intentional check for both boolean false and numeric zero
  if (finalConfig.index === false || finalConfig.index === 0) {
    basicDirectives.push("noindex");
  } else {
    basicDirectives.push("index");
  }

  // @ts-expect-error: Intentional check for both boolean false and numeric zero
  if (finalConfig.follow === false || finalConfig.follow === 0) {
    basicDirectives.push("nofollow");
  } else {
    basicDirectives.push("follow");
  }

  // Tier 2: Advanced directives
  const advancedDirectives = [];

  if (finalConfig.archive === false) {
    advancedDirectives.push("noarchive");
  }

  if (finalConfig.snippet === false) {
    advancedDirectives.push("nosnippet");
  }

  if (finalConfig.imageindex === false) {
    advancedDirectives.push("noimageindex");
  }

  if (finalConfig.cache === false) {
    advancedDirectives.push("nocache");
  }

  // Combine all directives
  const allDirectives = [...basicDirectives, ...advancedDirectives];
  const robotsContent = allDirectives.join(", ");

  // Generate search engine specific directives
  const searchEngineDirectives = generateSearchEngineDirectives(finalConfig);

  // Build the HTML output
  let markup = "";

  // Main robots meta tag
  markup += html`<meta name="robots" content="${robotsContent}" />`;

  // Add search engine specific tags
  for (const directive of searchEngineDirectives) {
    markup += html`<meta name="robots" content="${directive}" />`;
  }

  // Tier 3: Google-specific meta tags
  if (finalConfig.maxSnippet != null) {
    markup += html`<meta name="robots" content="max-snippet:${finalConfig.maxSnippet}" />`;
  }

  if (finalConfig.maxImagePreview != null) {
    markup += html`<meta name="robots" content="max-image-preview:${finalConfig.maxImagePreview}" />`;
  }

  if (finalConfig.maxVideoPreview != null) {
    markup += html`<meta name="robots" content="max-video-preview:${finalConfig.maxVideoPreview}" />`;
  }

  if (finalConfig.unavailableAfter) {
    markup += html`<meta name="robots" content="unavailable_after:${finalConfig.unavailableAfter}" />`;
  }

  // Tier 4: Enterprise features
  if (finalConfig.host) {
    markup += html`<link rel="canonical" href="https://${escapeHtml(finalConfig.host)}" />`;
  }

  if (finalConfig.sitemaps && finalConfig.sitemaps.length > 0) {
    for (const sitemap of finalConfig.sitemaps.slice(0, 5)) {
      // Limit to 5 sitemaps
      markup += html`<link rel="sitemap" type="application/xml" href="${sitemap}" />`;
    }
  }

  // Content-specific optimizations
  if (finalConfig.news && finalConfig.contentType === "news") {
    const newsDirectives = [];
    if (/** @type {any} */ (finalConfig.news).follow === false) {
      newsDirectives.push("nofollow");
    }
    if (/** @type {any} */ (finalConfig.news).archive === false) {
      newsDirectives.push("noarchive");
    }
    if (newsDirectives.length > 0) {
      markup += html`<meta name="robots" content="${newsDirectives.join(", ")}" />`;
    }
  }

  if (finalConfig.ecommerce && finalConfig.contentType === "product") {
    const commerceDirectives = [];
    if (/** @type {any} */ (finalConfig.ecommerce).index === false) {
      commerceDirectives.push("noindex");
    }
    if (/** @type {any} */ (finalConfig.ecommerce).snippet === false) {
      commerceDirectives.push("nosnippet");
    }
    if (commerceDirectives.length > 0) {
      markup += html`<meta name="robots" content="${commerceDirectives.join(", ")}" />`;
    }

    if (/** @type {any} */ (finalConfig.ecommerce).maxImagePreview) {
      markup += html`<meta name="robots" content="max-image-preview:${/** @type {any} */ (finalConfig.ecommerce).maxImagePreview}" />`;
    }
  }

  return markup;
};
