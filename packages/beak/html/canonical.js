/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive canonical URL generator with advanced SEO optimization tiers.
 *
 * Generates comprehensive canonical markup that scales from basic URL consolidation
 * to enterprise-level SEO authority distribution. Each tier unlocks increasingly
 * sophisticated search engine signals for maximum ranking potential.
 */

import { html } from "./index.js";
import { normalizeUrl } from "./url.js";

/**
 * @typedef {Object} CanonicalConfig
 *
 * // TIER 1: Always Required - Core Canonical URL
 * @property {string} domain - Domain name for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [url] - Pre-constructed canonical URL (overrides domain+path)
 *
 * // TIER 2: Device Variants (unlocks mobile/AMP/print alternates)
 * @property {Object} [variants] - Device and format variants
 * @property {string} [variants.mobile] - Mobile URL (generates responsive alternate link)
 * @property {string} [variants.amp] - AMP URL (generates amphtml link)
 * @property {string} [variants.print] - Print URL (generates print alternate link)
 *
 * // TIER 3: International (unlocks hreflang for global SEO)
 * @property {Object} [languages] - Language variants for hreflang implementation
 * @property {string} [region] - Default region for x-default hreflang selection
 *
 * // TIER 4: Strategic Authority (unlocks enterprise-level relationships)
 * @property {Object} [strategy] - Advanced canonical relationships
 * @property {string[]} [strategy.syndicated] - Cross-domain syndicated URLs
 * @property {Object} [strategy.paginated] - Pagination relationships
 * @property {string} [strategy.paginated.prev] - Previous page URL (generates rel="prev")
 * @property {string} [strategy.paginated.next] - Next page URL (generates rel="next")
 */

/**
 * @typedef {Object} CanonicalVariants
 * @property {string} [mobile] - Mobile URL
 * @property {string} [amp] - AMP URL
 * @property {string} [print] - Print URL
 */

/**
 * @typedef {Object} CanonicalLanguages
 * @property {string} [region] - Language/region code mapping to URL path
 */

/**
 * @typedef {Object} CanonicalStrategy
 * @property {string[]} [syndicated] - Cross-domain syndicated URLs
 * @property {Object} [paginated] - Pagination relationships
 * @property {string} [paginated.prev] - Previous page URL
 * @property {string} [paginated.next] - Next page URL
 */

/**
 * Normalizes and constructs canonical URL from configuration.
 *
 * @param {CanonicalConfig} config - Canonical configuration
 * @returns {string|null} Normalized canonical URL or null if invalid
 */
const normalizeCanonicalUrl = (config) => {
  const { domain, path, url } = config;

  if (url) {
    // Normalize pre-provided URL
    return normalizeUrl(url, domain || "example.com");
  } else if (domain && (path || path === "")) {
    // Construct from domain and path
    return normalizeUrl(path || "", domain);
  }

  return null;
};

/**
 * Generates basic canonical link markup (Tier 1).
 *
 * @param {string} canonicalUrl - The canonical URL
 * @returns {string} Basic canonical link markup
 */
const generateBasicCanonical = (canonicalUrl) => {
  return html`
    <link rel="canonical" href="${canonicalUrl}" />
  `;
};

/**
 * Generates device/format variant alternate links (Tier 2).
 *
 * @param {string} domain - Domain for URL normalization
 * @param {CanonicalVariants} [variants] - Device and format variants
 * @returns {string} Variant alternate links markup
 */
const generateVariantAlternates = (domain, variants) => {
  if (!variants) return "";

  const { mobile, amp, print } = variants;
  let markup = "";

  if (mobile) {
    const mobileUrl = normalizeUrl(mobile, domain);
    markup += html`
      <link rel="alternate" href="${mobileUrl}" media="only screen and (max-width: 640px)" />
    `;
  }

  if (amp) {
    const ampUrl = normalizeUrl(amp, domain);
    markup += html`
      <link rel="amphtml" href="${ampUrl}" />
    `;
  }

  if (print) {
    const printUrl = normalizeUrl(print, domain);
    markup += html`
      <link rel="alternate" href="${printUrl}" media="print" />
    `;
  }

  return markup;
};

/**
 * Generates hreflang links for international SEO (Tier 3).
 *
 * @param {string} domain - Domain for URL normalization
 * @param {string} canonicalUrl - Fallback canonical URL for x-default
 * @param {CanonicalLanguages} [languages] - Language variants
 * @param {string} [region] - Default region for x-default
 * @returns {string} Hreflang links markup
 */
const generateHreflangLinks = (domain, canonicalUrl, languages, region) => {
  if (!languages || Object.keys(languages).length === 0) return "";

  let markup = "";

  // Add hreflang links for each language variant
  for (const [langCode, langPath] of Object.entries(languages)) {
    const langUrl = normalizeUrl(langPath, domain);
    markup += html`
      <link rel="alternate" hreflang="${langCode}" href="${langUrl}" />
    `;
  }

  // Add x-default if we have multiple languages but no explicit default
  if (Object.keys(languages).length > 1 && !(/** @type {any} */ (languages)["x-default"])) {
    const defaultUrl =
      region && /** @type {any} */ (languages)[region]
        ? normalizeUrl(/** @type {any} */ (languages)[region], domain)
        : canonicalUrl;
    markup += html`
      <link rel="alternate" hreflang="x-default" href="${defaultUrl}" />
    `;
  }

  return markup;
};

/**
 * Generates strategic canonical relationships (Tier 4).
 *
 * @param {string} domain - Domain for URL normalization
 * @param {CanonicalStrategy} [strategy] - Strategic relationships configuration
 * @returns {string} Strategic relationships markup
 */
const generateStrategicRelationships = (domain, strategy) => {
  if (!strategy) return "";

  const { syndicated, paginated } = strategy;
  let markup = "";

  // Syndication canonicals
  if (syndicated && syndicated.length > 0) {
    for (const syndicatedUrl of syndicated) {
      markup += html`
        <link rel="canonical" href="${syndicatedUrl}" />
      `;
    }
  }

  // Pagination relationships
  if (paginated) {
    const { prev, next } = paginated;

    if (prev) {
      const prevUrl = normalizeUrl(prev, domain);
      markup += html`
        <link rel="prev" href="${prevUrl}" />
      `;
    }

    if (next) {
      const nextUrl = normalizeUrl(next, domain);
      markup += html`
        <link rel="next" href="${nextUrl}" />
      `;
    }
  }

  return markup;
};

/**
 * Generates progressive canonical markup with advanced SEO optimization tiers.
 *
 * **Tier 1 (Smart Canonical):** Intelligent URL normalization and basic canonical
 * **Tier 2 (Multi-Variant):** Device/format variants with alternate relationships
 * **Tier 3 (International):** Complete hreflang implementation for global SEO
 * **Tier 4 (Strategic):** Enterprise-level canonical authority distribution
 *
 * Each configuration option unlocks additional markup without redundancy.
 * Missing options generate no corresponding markup, ensuring clean output.
 *
 * @param {CanonicalConfig} config - Progressive canonical configuration
 * @returns {string} Generated canonical HTML markup
 *
 * @example
 * // Tier 1: Smart canonical with URL normalization
 * canonical({ domain: 'example.com', path: '/article' });
 * // → '<link rel="canonical" href="https://example.com/article" />'
 *
 * @example
 * // Tier 2: Multi-variant with device alternates
 * canonical({
 *   domain: 'example.com',
 *   path: '/article',
 *   variants: {
 *     mobile: '/mobile/article',
 *     amp: '/amp/article'
 *   }
 * });
 * // → Canonical + alternate links for mobile/AMP variants
 *
 * @example
 * // Tier 3: International with hreflang
 * canonical({
 *   domain: 'example.com',
 *   path: '/article',
 *   languages: {
 *     'en-US': '/article',
 *     'es-ES': '/articulo',
 *     'fr-FR': '/article-fr'
 *   },
 *   region: 'en-US'
 * });
 * // → Complete hreflang implementation + canonical
 *
 * @example
 * // Tier 4: Strategic with pagination and syndication
 * canonical({
 *   domain: 'example.com',
 *   path: '/article?page=2',
 *   strategy: {
 *     paginated: { prev: '/article?page=1', next: '/article?page=3' },
 *     syndicated: ['https://medium.com/@user/article']
 *   }
 * });
 * // → Pagination canonicals + cross-domain relationships
 */
/**
 * @param {CanonicalConfig} config - Progressive canonical configuration
 * @returns {string} Generated canonical HTML markup
 */
export const canonical = (config) => {
  if (!config || typeof config !== "object") return "";

  // Clean orchestration through pure functions
  const canonicalUrl = normalizeCanonicalUrl(config);
  if (!canonicalUrl) return "";

  let markup = generateBasicCanonical(canonicalUrl);
  markup += generateVariantAlternates(config.domain, config.variants);
  markup += generateHreflangLinks(config.domain, canonicalUrl, config.languages, config.region);
  markup += generateStrategicRelationships(config.domain, config.strategy);

  return markup;
};
