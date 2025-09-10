/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shared URL normalization utilities for HTML meta tag generation.
 *
 * Provides pure functions for normalizing URLs across all social media and SEO utilities
 * to ensure consistent HTTPS enforcement and proper URL formatting.
 */

/**
 * Normalizes a URL to ensure HTTPS and proper absolute URL formatting.
 *
 * This function handles:
 * - Converting HTTP URLs to HTTPS
 * - Converting relative URLs to absolute URLs using the provided domain
 * - Preserving already-absolute HTTPS URLs unchanged
 * - Gracefully handling edge cases like empty/null inputs
 *
 * @param {string} url - The URL to normalize (can be relative or absolute)
 * @param {string} [domain='example.com'] - Domain to use for relative URLs
 * @returns {string} Normalized HTTPS URL
 *
 * @example
 * // HTTP to HTTPS conversion
 * normalizeUrl('http://example.com/page') // → 'https://example.com/page'
 *
 * @example
 * // Relative URL with domain
 * normalizeUrl('/page', 'example.com') // → 'https://example.com/page'
 *
 * @example
 * // Already HTTPS absolute URL (unchanged)
 * normalizeUrl('https://example.com/page') // → 'https://example.com/page'
 *
 * @example
 * // Empty/null handling
 * normalizeUrl(null, 'example.com') // → 'https://example.com'
 * normalizeUrl('', 'example.com') // → 'https://example.com'
 */
export const normalizeUrl = (url, domain = "example.com") => {
  if (!url || typeof url !== "string") return `https://${domain}`;

  // Already absolute URL - ensure HTTPS and normalize www subdomains
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/^http:/, "https:").replace(/^https:\/\/www\./, "https://");
  }

  // Relative URL - construct absolute with leading slash if needed
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `https://${domain}${cleanPath}`;
};
