/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { html } from "../html/index.js";
import { absoluteUrl } from "./utils.js";

/**
 *
 */

/**
 * @typedef {Object} SitemapConfig
 * @property {Object[]} pages - Array of page objects
 * @property {string} pages[].url - Page URL
 * @property {Date} [pages[].lastmod] - Last modification date
 * @property {string} [pages[].changefreq] - Change frequency
 * @property {number} [pages[].priority] - Priority (0.0-1.0)
 * @property {string} [domain] - Domain for URL construction
 * @property {Date} [lastmod] - Default last modification date
 * @property {string} [changefreq] - Default change frequency
 * @property {number} [priority] - Default priority
 */

/**
 * Generates an XML sitemap for search engines.
 *
 * Creates a properly formatted XML sitemap following the sitemap protocol specification.
 * Perfect for SEO and helping search engines discover and index your pages.
 *
 * @param {SitemapConfig} config - Configuration object for the sitemap
 * @returns {string} The generated XML sitemap as a string
 *
 * @example
 * import { sitemap } from '@raven-js/beak/seo';
 *
 * const xml = sitemap({
 *   domain: 'example.com',
 *   pages: ['/', '/about', '/contact', '/blog']
 * });
 * // Output:
 * // <?xml version="1.0" encoding="UTF-8"?>
 * // <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 * //   <url>
 * //     <loc>https://example.com/</loc>
 * //     <lastmod>2024-01-15T10:30:00.000Z</lastmod>
 * //     <changefreq>weekly</changefreq>
 * //     <priority>0.8</priority>
 * //   </url>
 * //   <url>
 * //     <loc>https://example.com/about</loc>
 * //     <lastmod>2024-01-15T10:30:00.000Z</lastmod>
 * //     <changefreq>weekly</changefreq>
 * //     <priority>0.8</priority>
 * //   </url>
 * //   ...
 * // </urlset>
 *
 * @example
 * // With custom settings
 * const xml = sitemap({
 *   domain: 'example.com',
 *   pages: ['/', '/blog', '/contact'],
 *   lastmod: '2024-01-01T00:00:00.000Z',
 *   changefreq: 'daily',
 *   priority: '1.0'
 * });
 *
 * @example
 * // Dynamic page generation
 * const blogPosts = ['/blog/post-1', '/blog/post-2', '/blog/post-3'];
 * const staticPages = ['/', '/about', '/contact'];
 * const allPages = [...staticPages, ...blogPosts];
 *
 * const xml = sitemap({
 *   domain: 'example.com',
 *   pages: allPages
 * });
 */
export const sitemap = ({ domain, pages, lastmod, changefreq, priority }) => {
	const defaultLastmod = new Date().toISOString();
	const defaultChangefreq = "weekly";
	const defaultPriority = "0.8";

	const entries = pages.map((/** @type {any} */ page) => {
		const url = domain ? absoluteUrl(page.path, domain) : page.path;
		const pageLastmod = page.lastmod || lastmod || defaultLastmod;
		const pageChangefreq = page.changefreq || changefreq || defaultChangefreq;
		const pagePriority = page.priority || priority || defaultPriority;

		return html`<url>
        <loc>${url}</loc>
        <lastmod>${pageLastmod}</lastmod>
        <changefreq>${pageChangefreq}</changefreq>
        <priority>${pagePriority}</priority>
      </url>`;
	});

	return html`<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${entries.join("\n")}
      </urlset>`;
};
