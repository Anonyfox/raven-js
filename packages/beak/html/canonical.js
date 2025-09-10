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
 * @property {string} domain - Domain name for URL construction
 * @property {string} path - Path for URL construction
 * @property {string} [url] - Pre-constructed canonical URL (overrides domain+path)
 * @property {Object} [variants] - Device and format variants
 * @property {string} [variants.mobile] - Mobile-optimized URL
 * @property {string} [variants.amp] - AMP version URL
 * @property {string} [variants.print] - Print-optimized URL
 * @property {Object} [languages] - Language/region variants for hreflang
 * @property {string} [region] - Default region for canonical selection
 * @property {Object} [strategy] - Advanced canonical relationships
 * @property {string[]} [strategy.syndicated] - Cross-domain syndicated URLs
 * @property {Object} [strategy.paginated] - Pagination relationships
 * @property {string} [strategy.paginated.prev] - Previous page URL
 * @property {string} [strategy.paginated.next] - Next page URL
 * @property {Object} [strategy.social] - Social media canonical overrides
 * @property {string} [strategy.social.twitter] - Twitter-specific canonical
 * @property {string} [strategy.social.facebook] - Facebook-specific canonical
 */

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
export const canonical = (/** @type {CanonicalConfig} */ config) => {
  if (!config || typeof config !== "object") return "";
  const { domain, path, url, variants, languages, region, strategy } = /** @type {any} */ (config);

  // Determine canonical URL with proper normalization
  let canonicalUrl;
  if (url) {
    // Normalize pre-provided URL
    canonicalUrl = normalizeUrl(url, domain || "example.com");
  } else if (domain && (path || path === "")) {
    // Construct from domain and path
    canonicalUrl = normalizeUrl(path || "", domain);
  } else {
    return "";
  }

  if (!canonicalUrl) return "";

  // Tier 1: Smart canonical (always present)
  let markup = html`
		<link rel="canonical" href="${canonicalUrl}" />
	`;

  // Tier 2: Multi-variant alternates
  if (variants) {
    const { mobile, amp, print } = variants;

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
  }

  // Tier 3: International hreflang
  if (languages && Object.keys(languages).length > 0) {
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
  }

  // Tier 4: Strategic relationships
  if (strategy) {
    const { syndicated, paginated, social } = strategy;

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

    // Social media canonical overrides
    if (social) {
      const { twitter, facebook } = social;

      if (twitter) {
        markup += html`
					<meta property="twitter:url" content="${twitter}" />
				`;
      }

      if (facebook) {
        markup += html`
					<meta property="og:url" content="${facebook}" />
				`;
      }
    }
  }

  return markup;
};
