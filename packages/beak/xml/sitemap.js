/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { normalizeUrl } from "../html/url.js";
import { xml } from "./index.js";

/**
 * @typedef {Object} SitemapPageConfig
 * @property {string} path - Page path or full URL
 * @property {string|Date} [lastmod] - Last modification date (ISO string or Date object)
 * @property {'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'} [changefreq] - Change frequency
 * @property {number} [priority] - Priority (0.0 to 1.0)
 */

/**
 * @typedef {Object} SitemapConfig
 * @property {string} [domain] - Domain for URL construction (omitted for relative paths)
 * @property {string[]|SitemapPageConfig[]} pages - Array of page paths or page configurations
 * @property {string|Date} [lastmod] - Default last modification date
 * @property {'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'} [changefreq] - Default change frequency
 * @property {number} [priority] - Default priority (0.0 to 1.0)
 */

/**
 * Valid change frequency values for sitemap protocol
 * @type {Set<string>}
 */
const VALID_CHANGE_FREQS = new Set(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);

/**
 * Normalizes a date to ISO string format
 * @param {string|Date|undefined} date - Date to normalize
 * @returns {string} ISO date string
 */
const normalizeDate = (date) => {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();
  if (typeof date === "string") {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  return new Date().toISOString();
};

/**
 * Validates and normalizes a priority value
 * @param {number|string|undefined} priority - Priority value to validate
 * @returns {string} Validated priority as string (0.0 to 1.0)
 */
const normalizePriority = (priority) => {
  if (priority === undefined || priority === null) return "0.8";
  const num = typeof priority === "string" ? parseFloat(priority) : priority;
  if (Number.isNaN(num) || num < 0 || num > 1) return "0.8";
  const rounded = Math.round(num * 10) / 10;
  return rounded.toFixed(1); // Return as string to preserve .0 for whole numbers
};

/**
 * Validates change frequency value
 * @param {string|undefined} changefreq - Change frequency to validate
 * @returns {string} Validated change frequency
 */
const normalizeChangefreq = (changefreq) => {
  if (!changefreq) return "weekly";
  return VALID_CHANGE_FREQS.has(changefreq) ? changefreq : "weekly";
};

/**
 * Normalizes a page configuration to standard format
 * @param {string|SitemapPageConfig} page - Page configuration
 * @returns {SitemapPageConfig} Normalized page configuration
 */
const normalizePage = (page) => {
  if (typeof page === "string") {
    return {
      path: page,
      lastmod: undefined,
      changefreq: undefined,
      priority: undefined,
    };
  }

  if (typeof page === "object" && page !== null) {
    return {
      path: page.path || "/",
      lastmod: page.lastmod,
      changefreq: page.changefreq,
      priority: page.priority,
    };
  }

  return { path: "/" };
};

/**
 * Normalizes URL based on domain presence
 * @param {string} path - Page path
 * @param {string|undefined} domain - Domain for absolute URLs
 * @returns {string} Normalized URL
 */
const normalizePageUrl = (path, domain) => {
  if (!domain) return path;
  return normalizeUrl(path, domain);
};

/**
 * Validates domain format if provided
 * @param {string|undefined} domain - Domain to validate
 * @returns {boolean} True if valid or undefined
 */
const isValidDomain = (domain) => {
  if (!domain) return true;
  if (typeof domain !== "string") return false;
  if (domain.includes("..") || domain.includes(" ")) return false;
  try {
    new URL(`https://${domain}`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generates an XML sitemap for search engines.
 *
 * Surgical precision sitemap generation with progressive API complexity.
 * Supports both simple string arrays and advanced configuration objects.
 * Falls back to relative paths when no domain is provided.
 *
 * @param {string|SitemapConfig} domainOrConfig - Domain string or full configuration object
 * @param {string[]|SitemapPageConfig[]} [pages] - Array of page paths/configs (when domainOrConfig is string)
 * @returns {string} Well-formed XML sitemap string
 *
 * @example
 * // Simple usage - just domain and page paths
 * import { sitemap } from '@raven-js/beak/xml';
 *
 * const xml = sitemap('example.com', ['/', '/about', '/blog']);
 *
 * @example
 * // Relative paths (no domain)
 * const xml = sitemap(['/', '/about', '/contact']);
 *
 * @example
 * // Advanced configuration with per-page settings
 * const xml = sitemap({
 *   domain: 'example.com',
 *   pages: [
 *     '/',
 *     { path: '/blog', changefreq: 'daily', priority: 0.9 },
 *     { path: '/contact', priority: 0.5 }
 *   ],
 *   lastmod: '2024-01-01T00:00:00.000Z',
 *   changefreq: 'weekly',
 *   priority: 0.8
 * });
 *
 * @example
 * // Dynamic page generation
 * const blogPosts = ['/blog/post-1', '/blog/post-2'];
 * const xml = sitemap('example.com', [
 *   '/',
 *   '/about',
 *   ...blogPosts.map(path => ({ path, changefreq: 'monthly' }))
 * ]);
 *
 * @throws {TypeError} When domain format is invalid
 * @throws {TypeError} When pages is not an array
 */
export const sitemap = (domainOrConfig, pages) => {
  // Detect API style and normalize inputs
  let config;
  if (typeof domainOrConfig === "string" && Array.isArray(pages)) {
    // Simple API: sitemap(domain, pages)
    config = { domain: domainOrConfig, pages };
  } else if (typeof domainOrConfig === "object" && domainOrConfig !== null && !Array.isArray(domainOrConfig)) {
    // Advanced API: sitemap(config)
    config = domainOrConfig;
  } else if (Array.isArray(domainOrConfig)) {
    // Relative paths API: sitemap(pages)
    config = { pages: domainOrConfig };
  } else if (typeof domainOrConfig === "string" && pages === undefined) {
    // Simple API without second parameter - not valid
    throw new TypeError("Pages array is required when using simple API");
  } else {
    throw new TypeError("Invalid arguments: expected sitemap(domain, pages), sitemap(config), or sitemap(pages)");
  }

  // Validate inputs
  if (!isValidDomain(config.domain)) {
    throw new TypeError("Invalid domain format");
  }

  if (!Array.isArray(config.pages)) {
    throw new TypeError("Pages must be an array");
  }

  // Generate consistent timestamp for this sitemap generation
  const generationTime = new Date().toISOString();

  // Normalize configuration with defaults
  const normalizedConfig = {
    domain: config.domain,
    lastmod: normalizeDate(config.lastmod),
    changefreq: normalizeChangefreq(config.changefreq),
    priority: normalizePriority(config.priority),
    pages: config.pages,
  };

  // Process pages
  const entries = normalizedConfig.pages.map((page) => {
    const normalizedPage = normalizePage(page);
    const url = normalizePageUrl(normalizedPage.path, normalizedConfig.domain);

    const pageLastmod =
      normalizedPage.lastmod !== undefined
        ? normalizeDate(normalizedPage.lastmod)
        : normalizedConfig.lastmod || generationTime;
    const pageChangefreq =
      normalizedPage.changefreq !== undefined
        ? normalizeChangefreq(normalizedPage.changefreq)
        : normalizedConfig.changefreq;
    const pagePriority =
      normalizedPage.priority !== undefined ? normalizePriority(normalizedPage.priority) : normalizedConfig.priority;

    return xml`      <url>
        <loc>${url}</loc>
        <lastmod>${pageLastmod}</lastmod>
        <changefreq>${pageChangefreq}</changefreq>
        <priority>${pagePriority}</priority>
      </url>`;
  });

  const indentedEntries = entries.map((entry) => `      ${entry.trim()}`).join("\n");
  return xml`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indentedEntries}
</urlset>`;
};
