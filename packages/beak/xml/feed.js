/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { normalizeUrl } from "../html/url.js";
import { escapeXml } from "./escape-xml.js";

/**
 * @typedef {Object} FeedAuthor
 * @property {string} name - Author name
 * @property {string} [email] - Author email
 */

/**
 * @typedef {Object} FeedEnclosure
 * @property {string} url - Enclosure URL
 * @property {string} type - MIME type (e.g., 'audio/mpeg')
 * @property {number} length - File size in bytes
 */

/**
 * @typedef {Object} FeedItem
 * @property {string} title - Item title
 * @property {string} url - Item URL (relative or absolute)
 * @property {string|Date} [date] - Publication date (ISO string or Date object)
 * @property {string} [updated] - Last updated date (ISO string or Date object)
 * @property {string} [id] - Unique identifier (auto-generated for Atom)
 * @property {string|FeedAuthor} [author] - Author name or author object
 * @property {string} [summary] - Brief summary/description
 * @property {string} [content] - Full content (HTML allowed)
 * @property {string[]} [categories] - Item categories/tags
 * @property {FeedEnclosure} [enclosure] - Media enclosure (podcast/audio/video)
 */

/**
 * @typedef {Object} FeedConfig
 * @property {'rss'|'atom'} [format] - Feed format (default: 'rss')
 * @property {string} [title] - Feed title
 * @property {string} [description] - Feed description
 * @property {string} [link] - Feed URL/link
 * @property {string} [language] - Feed language (default: 'en')
 * @property {string|Date} [updated] - Feed last updated date
 * @property {string|FeedAuthor} [author] - Feed author
 * @property {string} [generator] - Feed generator name
 * @property {string[]} [extensions] - Enabled extensions (future use)
 * @property {FeedItem[]} items - Feed items
 */

/**
 * @typedef {Object} NormalizedFeedMetadata
 * @property {string} title - Feed title
 * @property {string} description - Feed description
 * @property {string} link - Feed link
 * @property {string} language - Feed language
 * @property {string} updated - Last updated date
 * @property {FeedAuthor} [author] - Feed author
 * @property {string} [generator] - Feed generator
 */

/**
 * @typedef {Object} NormalizedFeed
 * @property {NormalizedFeedMetadata} metadata - Normalized feed metadata
 * @property {NormalizedFeedItem[]} items - Normalized feed items
 */

/**
 * @typedef {Object} NormalizedFeedItem
 * @property {string} id - Unique identifier
 * @property {string} title - Item title
 * @property {string} url - Item URL
 * @property {string} published - Publication date
 * @property {string} updated - Last updated date
 * @property {FeedAuthor} [author] - Item author
 * @property {string} [summary] - Item summary
 * @property {string} [content] - Item content
 * @property {string[]} [categories] - Item categories
 * @property {FeedEnclosure} [enclosure] - Item enclosure
 */

/**
 * Valid feed formats
 * @type {Set<string>}
 */
const VALID_FORMATS = new Set(["rss", "atom"]);

/**
 * Safely gets author name from author object
 * @param {FeedAuthor|undefined} author - Author object
 * @returns {string} Author name or empty string
 */
const getAuthorName = (author) => {
  return author?.name || "";
};

/**
 * Safely gets author email from author object
 * @param {FeedAuthor|undefined} author - Author object
 * @returns {string} Author email or empty string
 */
const getAuthorEmail = (author) => {
  return author?.email || "";
};

/**
 * Safely gets enclosure properties
 * @param {FeedEnclosure|undefined} enclosure - Enclosure object
 * @returns {FeedEnclosure} Enclosure properties with defaults
 */
const getEnclosureProps = (enclosure) => {
  return {
    url: enclosure?.url || "",
    type: enclosure?.type || "",
    length: enclosure?.length || 0,
  };
};

/**
 * Generates a unique ID for feed items
 * @param {string} url - Item URL
 * @param {string} [published] - Publication date
 * @returns {string} Unique identifier
 */
const generateItemId = (url, published) => {
  const base = published ? `${url}:${published}` : url;
  // Simple hash for ID generation
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `urn:feed:item:${Math.abs(hash)}`;
};

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
 * Normalizes an author object
 * @param {string|FeedAuthor|undefined} author - Author to normalize
 * @returns {FeedAuthor|undefined} Normalized author object
 */
const normalizeAuthor = (author) => {
  if (!author) return undefined;
  if (typeof author === "string") {
    return { name: author };
  }
  if (typeof author === "object" && author !== null) {
    const authorObj = /** @type {FeedAuthor} */ (author);
    return {
      name: authorObj.name || "Unknown",
      email: authorObj.email,
    };
  }
  return undefined;
};

/**
 * Normalizes a feed item to standard format
 * @param {string|FeedItem} item - Item to normalize
 * @param {string|undefined} baseUrl - Base URL for relative links
 * @returns {NormalizedFeedItem} Normalized item
 */
const normalizeItem = (item, baseUrl) => {
  if (typeof item === "string") {
    return {
      id: generateItemId(item),
      title: "Untitled",
      url: baseUrl ? normalizeUrl(item, baseUrl) : item,
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
  }

  if (typeof item === "object" && item !== null) {
    const published = normalizeDate(item.date);
    let url = item.url || "/";

    // Only normalize if we have a baseUrl and the URL is relative
    if (baseUrl && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = normalizeUrl(url, baseUrl);
    }

    return {
      id: item.id || generateItemId(url, published),
      title: item.title || "Untitled",
      url,
      published,
      updated: item.updated !== undefined ? normalizeDate(item.updated) : published,
      author: normalizeAuthor(item.author),
      summary: item.summary,
      content: item.content,
      categories: Array.isArray(item.categories) ? item.categories : [],
      enclosure: item.enclosure,
    };
  }

  return {
    id: generateItemId("/"),
    title: "Untitled",
    url: "/",
    published: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
};

/**
 * Validates feed configuration
 * @param {FeedConfig} config - Configuration to validate
 * @throws {TypeError} When configuration is invalid
 */
const validateConfig = (config) => {
  if (!config || typeof config !== "object") {
    throw new TypeError("Feed configuration must be an object");
  }

  if (config.format && !VALID_FORMATS.has(config.format)) {
    throw new TypeError(`Invalid format: ${config.format}. Must be 'rss' or 'atom'`);
  }

  if (!("items" in config) || !Array.isArray(config.items)) {
    throw new TypeError("Items must be an array");
  }

  // Validate enclosure format if present
  config.items.forEach((item, index) => {
    if (item && typeof item === "object" && item.enclosure) {
      const enc = item.enclosure;
      if (!enc.url || !enc.type || typeof enc.length !== "number") {
        throw new TypeError(`Invalid enclosure in item ${index}: must have url, type, and length`);
      }
    }
  });
};

/**
 * RSS 2.0 renderer
 * @param {NormalizedFeed} feed - Normalized feed data
 * @returns {string} RSS 2.0 XML string
 */
const renderRss20 = (feed) => {
  let itemsXml = "";
  for (const item of feed.items) {
    const authorName = getAuthorName(item.author);
    const authorEmail = getAuthorEmail(item.author);
    const enclosureProps = getEnclosureProps(item.enclosure);

    itemsXml += `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${new Date(item.published).toUTCString()}</pubDate>
      ${authorName ? `<author>${escapeXml(authorEmail || authorName)}</author>` : ""}
      ${item.summary ? `<description><![CDATA[${item.summary}]]></description>` : ""}
      ${item.content ? `<content:encoded><![CDATA[${item.content}]]></content:encoded>` : ""}
      ${item.categories && item.categories.length > 0 ? item.categories.map((cat) => `<category>${escapeXml(cat)}</category>`).join("") : ""}
      ${enclosureProps.url ? `<enclosure url="${escapeXml(enclosureProps.url)}" type="${escapeXml(enclosureProps.type)}" length="${enclosureProps.length}"/>` : ""}
    </item>`;
  }

  const feedAuthorName = getAuthorName(/** @type {FeedAuthor} */ (feed.metadata.author));
  const feedAuthorEmail = getAuthorEmail(/** @type {FeedAuthor} */ (feed.metadata.author));

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(feed.metadata.title)}</title>
    <description>${escapeXml(feed.metadata.description)}</description>
    <link>${escapeXml(feed.metadata.link)}</link>
    <language>${escapeXml(feed.metadata.language)}</language>
    <lastBuildDate>${new Date(feed.metadata.updated).toUTCString()}</lastBuildDate>
    ${feedAuthorName ? `<managingEditor>${escapeXml(feedAuthorEmail || feedAuthorName)}</managingEditor>` : ""}
    ${feed.metadata.generator ? `<generator>${escapeXml(feed.metadata.generator)}</generator>` : ""}
    ${itemsXml}
  </channel>
</rss>`;
};

/**
 * Atom 1.0 renderer
 * @param {NormalizedFeed} feed - Normalized feed data
 * @returns {string} Atom 1.0 XML string
 */
const renderAtom10 = (feed) => {
  let entriesXml = "";
  for (const item of feed.items) {
    const authorName = getAuthorName(item.author);
    const authorEmail = getAuthorEmail(item.author);
    const enclosureProps = getEnclosureProps(item.enclosure);

    entriesXml += `
    <entry>
      <id>${escapeXml(item.id)}</id>
      <title>${escapeXml(item.title)}</title>
      <link rel="alternate" type="text/html" href="${escapeXml(item.url)}"/>
      <published>${item.published}</published>
      <updated>${item.updated}</updated>
      ${authorName ? `<author><name>${escapeXml(authorName)}</name>${authorEmail ? `<email>${escapeXml(authorEmail)}</email>` : ""}</author>` : ""}
      ${item.summary ? `<summary><![CDATA[${item.summary}]]></summary>` : ""}
      ${item.content ? `<content type="html"><![CDATA[${item.content}]]></content>` : ""}
      ${item.categories && item.categories.length > 0 ? item.categories.map((cat) => `<category term="${escapeXml(cat)}"/>`).join("") : ""}
      ${enclosureProps.url ? `<link rel="enclosure" type="${escapeXml(enclosureProps.type)}" href="${escapeXml(enclosureProps.url)}" length="${enclosureProps.length}"/>` : ""}
    </entry>`;
  }

  const feedAuthorName = getAuthorName(/** @type {FeedAuthor} */ (feed.metadata.author));
  const feedAuthorEmail = getAuthorEmail(/** @type {FeedAuthor} */ (feed.metadata.author));

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${escapeXml(feed.metadata.link || "urn:feed:main")}</id>
  <title>${escapeXml(feed.metadata.title)}</title>
  <subtitle>${escapeXml(feed.metadata.description)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${escapeXml(feed.metadata.link)}"/>
  <link rel="alternate" type="text/html" href="${escapeXml(feed.metadata.link)}"/>
  <updated>${feed.metadata.updated}</updated>
  ${feedAuthorName ? `<author><name>${escapeXml(feedAuthorName)}</name>${feedAuthorEmail ? `<email>${escapeXml(feedAuthorEmail)}</email>` : ""}</author>` : ""}
  ${feed.metadata.generator ? `<generator>${escapeXml(feed.metadata.generator)}</generator>` : ""}
  ${entriesXml}
</feed>`;
};

/**
 * Feed format renderers
 * @type {Object<string, Function>}
 */
const renderers = {
  rss: renderRss20,
  atom: renderAtom10,
};

/**
 * Generates an RSS or Atom feed from the provided configuration.
 *
 * Surgical precision feed generation with format-agnostic API.
 * Supports RSS 2.0 and Atom 1.0 with identical configuration.
 * Format choice is just an implementation detail.
 *
 * @param {string|FeedConfig} formatOrConfig - Format string or full configuration object
 * @param {FeedItem[]} [items] - Feed items (when formatOrConfig is string)
 * @returns {string} Well-formed XML feed string
 *
 * @example
 * // Simple API - RSS with basic items
 * import { feed } from '@raven-js/beak/xml';
 *
 * const rss = feed('rss', [
 *   { title: 'Post 1', url: '/post1', date: '2024-01-01' },
 *   { title: 'Post 2', url: '/post2', date: '2024-01-02' }
 * ]);
 *
 * @example
 * // Simple API - Atom format
 * const atom = feed('atom', [
 *   { title: 'Post 1', url: '/post1', date: '2024-01-01' },
 *   { title: 'Post 2', url: '/post2', date: '2024-01-02' }
 * ]);
 *
 * @example
 * // Advanced API with full configuration
 * const feedXml = feed({
 *   format: 'rss',
 *   title: 'My Tech Blog',
 *   description: 'Latest technology insights',
 *   link: 'https://example.com',
 *   language: 'en',
 *   author: { name: 'John Doe', email: 'john@example.com' },
 *   items: [
 *     {
 *       title: 'Advanced JavaScript Techniques',
 *       url: '/posts/advanced-js',
 *       date: '2024-01-01T10:00:00Z',
 *       author: 'Jane Smith',
 *       summary: 'Deep dive into modern JS patterns',
 *       content: '<p>Full article content...</p>',
 *       categories: ['javascript', 'programming'],
 *       enclosure: {
 *         url: 'https://example.com/podcast.mp3',
 *         type: 'audio/mpeg',
 *         length: 12345678
 *       }
 *     }
 *   ]
 * });
 *
 * @throws {TypeError} When configuration is invalid
 * @throws {TypeError} When format is unsupported
 */
export const feed = (formatOrConfig, items) => {
  // Detect API style and normalize inputs
  let config;
  if (typeof formatOrConfig === "string" && Array.isArray(items)) {
    // Simple API: feed(format, items)
    config = { format: formatOrConfig, items };
  } else if (typeof formatOrConfig === "object" && formatOrConfig !== null && !Array.isArray(formatOrConfig)) {
    // Advanced API: feed(config)
    config = formatOrConfig;
  } else {
    throw new TypeError("Invalid arguments: expected feed(format, items) or feed(config)");
  }

  // Validate and set defaults
  if (!("items" in config)) {
    throw new TypeError("Items must be an array");
  }

  const normalizedConfig = {
    format: /** @type {'rss'|'atom'} */ (config.format || "rss"),
    title: config.title || "Untitled Feed",
    description: config.description || "",
    link: config.link || "",
    language: config.language || "en",
    updated: normalizeDate(config.updated),
    author: normalizeAuthor(config.author),
    generator: config.generator || "RavenJS Feed Generator",
    items: config.items || [],
  };

  // Validate configuration
  validateConfig(normalizedConfig);

  // Extract domain from link for URL normalization
  const baseUrl = normalizedConfig.link ? new URL(normalizedConfig.link).hostname : undefined;

  // Normalize feed metadata
  const normalizedFeed = {
    metadata: {
      title: normalizedConfig.title,
      description: normalizedConfig.description,
      link: normalizedConfig.link,
      language: normalizedConfig.language,
      updated: normalizedConfig.updated,
      author: normalizedConfig.author,
      generator: normalizedConfig.generator,
    },
    items: normalizedConfig.items.map((item) => normalizeItem(item, baseUrl)),
  };

  // Render feed in requested format
  const renderer = renderers[normalizedConfig.format];
  if (!renderer) {
    throw new TypeError(`Unsupported feed format: ${normalizedConfig.format}`);
  }

  return renderer(normalizedFeed);
};
