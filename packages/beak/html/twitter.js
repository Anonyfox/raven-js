/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive Twitter Cards generator with comprehensive creator attribution and engagement optimization.
 *
 * Generates sophisticated Twitter Card meta tags that scale from basic cards to enterprise-level
 * creator attribution and analytics integration. Each tier unlocks increasingly powerful
 * Twitter-specific engagement and SEO capabilities unique to Twitter's real-time ecosystem.
 */

import { escapeHtml, html } from "../html/index.js";
import { normalizeUrl } from "../html/url.js";

/**
 * @typedef {Object} TwitterImage
 * @property {string} url - Image URL
 * @property {string} [alt] - Alt text for accessibility
 * @property {number} [width] - Image width in pixels
 * @property {number} [height] - Image height in pixels
 */

/**
 * @typedef {Object} TwitterVideo
 * @property {string} url - Video URL
 * @property {string} [type] - Video MIME type
 * @property {number} [width] - Video width in pixels
 * @property {number} [height] - Video height in pixels
 * @property {number} [duration] - Video duration in seconds
 * @property {string} [thumbnail] - Video thumbnail URL
 * @property {Object} [stream] - Video stream for player cards
 * @property {string} [stream.url] - Stream URL
 * @property {string} [stream.contentType] - Stream content type
 */

/**
 * @typedef {Object} TwitterApp
 * @property {string} name - App name
 * @property {string} [id] - App ID
 * @property {string} [url] - App deep link URL
 */

/**
 * @typedef {Object} TwitterAppConfig
 * @property {TwitterApp} [iphone] - iPhone app details
 * @property {TwitterApp} [ipad] - iPad app details
 * @property {TwitterApp} [googleplay] - Google Play app details
 * @property {string} [country] - App store country code
 */

/**
 * @typedef {Object} TwitterThreadConfig
 * @property {number} [position] - Position in thread
 * @property {number} [total] - Total tweets in thread
 * @property {string} [nextUrl] - Next tweet URL in thread
 */

/**
 * @typedef {Object} TwitterAnalyticsConfig
 * @property {string} [trackingId] - Twitter pixel/tracking ID
 * @property {string[]} [conversionEvents] - Conversion events
 */

/**
 * @typedef {Object} TwitterAdsConfig
 * @property {string} [campaignId] - Twitter Ads campaign ID
 * @property {string} [creativeId] - Twitter Ads creative ID
 * @property {string} [attribution] - Attribution type
 */

/**
 * @typedef {Object} TwitterConfig
 *
 * **Tier 1 (Core Twitter Cards):** Essential metadata for all Twitter Cards
 * @property {string} title - Tweet title (required)
 * @property {string} description - Tweet description (required)
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [url] - Canonical URL
 * @property {TwitterImage|TwitterImage[]|string} [image] - Primary image(s)
 * @property {string} [cardType] - Twitter card type (summary, summary_large_image, app, player)
 *
 * **Tier 2 (Content Type Cards):** Specialized cards for different content types
 * @property {string} [contentType] - Content type for auto-detection (article, video, app, product, event)
 * @property {TwitterVideo} [video] - Video content for player cards
 * @property {Object} [article] - Article-specific metadata
 * @property {string} [article.creator] - Article creator @username
 * @property {string} [article.site] - Article site @username
 * @property {string} [article.author] - Article author name
 * @property {string} [article.section] - Article section
 * @property {string} [article.publishedTime] - Publication date (ISO 8601)
 * @property {Object} [app] - App-specific metadata
 * @property {TwitterApp} [app.iphone] - iPhone app details
 * @property {TwitterApp} [app.ipad] - iPad app details
 * @property {TwitterApp} [app.googleplay] - Google Play app details
 * @property {string} [app.country] - App store country code
 * @property {Object} [player] - Player card metadata
 * @property {string} [player.url] - Player URL
 * @property {number} [player.width] - Player width
 * @property {number} [player.height] - Player height
 * @property {string} [player.stream] - Player stream URL
 * @property {string} [player.streamContentType] - Stream content type
 * @property {Object} [gallery] - Gallery metadata for multiple images
 * @property {string[]} [gallery.images] - Array of image URLs
 *
 * **Tier 3 (Advanced Attribution):** Creator attribution and engagement features
 * @property {string} [creator] - Content creator @username
 * @property {string} [site] - Website/site @username
 * @property {Object} [thread] - Thread metadata
 * @property {number} [thread.position] - Position in thread
 * @property {number} [thread.total] - Total tweets in thread
 * @property {string} [thread.nextUrl] - Next tweet URL in thread
 *
 * **Tier 4 (Enterprise Integration):** Analytics and ads for professional use
 * @property {Object} [analytics] - Twitter analytics
 * @property {string} [analytics.trackingId] - Twitter pixel/tracking ID
 * @property {string[]} [analytics.conversionEvents] - Conversion events
 * @property {Object} [ads] - Twitter Ads integration
 * @property {string} [ads.campaignId] - Twitter Ads campaign ID
 * @property {string} [ads.creativeId] - Twitter Ads creative ID
 * @property {string} [ads.attribution] - Attribution type
 */

/**
 * Detects optimal Twitter card type based on content and configuration.
 *
 * @param {string} contentType - Explicit content type
 * @param {boolean} hasVideo - Whether content has video
 * @param {boolean} hasApp - Whether content has app metadata
 * @param {boolean} hasGallery - Whether content has gallery
 * @param {boolean} hasLargeImage - Whether content has large image
 * @returns {string} Optimal Twitter card type
 */
const detectTwitterCardType = (contentType, hasVideo, hasApp, hasGallery, hasLargeImage) => {
  if (contentType === "app" || hasApp) return "app";
  if (contentType === "video" || hasVideo) return "player";
  if (hasGallery) return "gallery";
  if (hasLargeImage) return "summary_large_image";
  return "summary";
};

/**
 * Validates and formats Twitter @username.
 *
 * @param {string} username - Twitter username with or without @
 * @returns {string} Formatted @username or empty string
 */
const formatTwitterUsername = (username) => {
  if (!username || typeof username !== "string") return "";

  const cleanUsername = username.trim().replace(/^@/, "");
  return cleanUsername ? `@${cleanUsername}` : "";
};

/**
 * Generates basic Twitter card metadata (Tier 1).
 *
 * @param {string} detectedCardType - Detected Twitter card type
 * @param {string} escapedTitle - HTML-escaped title
 * @param {string} escapedDescription - HTML-escaped description
 * @param {string} [canonicalUrl] - Canonical URL for the content
 * @returns {string} Basic Twitter card markup
 */
const generateBasicTwitterCard = (detectedCardType, escapedTitle, escapedDescription, canonicalUrl) => {
  let markup = html`
		<meta name="twitter:card" property="twitter:card" content="${detectedCardType}" />
		<meta name="twitter:title" property="twitter:title" content="${escapedTitle}" />
		<meta name="twitter:description" property="twitter:description" content="${escapedDescription}" />
	`;

  if (canonicalUrl) {
    markup += html`
			<meta name="twitter:url" property="twitter:url" content="${canonicalUrl}" />
		`;
  }

  return markup;
};

/**
 * Generates Twitter image markup with support for various image formats.
 *
 * @param {TwitterImage|TwitterImage[]|string} image - Image configuration
 * @param {string} escapedTitle - HTML-escaped title for alt text
 * @param {string} [domain] - Domain for URL normalization
 * @returns {string} Twitter image markup
 */
const generateTwitterImages = (image, escapedTitle, domain) => {
  let markup = "";

  if (typeof image === "string") {
    // Simple string image
    const imageUrl = domain ? normalizeUrl(image, domain) : image;
    markup += html`
				<meta name="twitter:image" property="twitter:image" content="${imageUrl}" />
				<meta name="twitter:image:alt" property="twitter:image:alt" content="${escapedTitle} illustration" />
			`;
  } else if (Array.isArray(image) && image.length > 0) {
    // Multiple images for gallery
    const maxImages = Math.min(image.length, 4); // Twitter supports up to 4 images
    for (let i = 0; i < maxImages; i++) {
      const img = image[i];
      const imageUrl = domain ? normalizeUrl(img.url, domain) : img.url;
      markup += html`
					<meta name="twitter:image${i}" property="twitter:image${i}" content="${imageUrl}" />
				`;
      if (img.alt) {
        markup += html`
						<meta name="twitter:image${i}:alt" property="twitter:image${i}:alt" content="${escapeHtml(img.alt)}" />
					`;
      }
    }
  } else if (typeof image === "object" && !Array.isArray(image) && /** @type {TwitterImage} */ (image).url) {
    // Single rich image object
    const imageUrl = domain
      ? normalizeUrl(/** @type {TwitterImage} */ (image).url, domain)
      : /** @type {TwitterImage} */ (image).url;
    markup += html`
				<meta name="twitter:image" property="twitter:image" content="${imageUrl}" />
			`;
    if (/** @type {TwitterImage} */ (image).alt) {
      markup += html`
					<meta name="twitter:image:alt" property="twitter:image:alt" content="${escapeHtml(/** @type {TwitterImage} */ (image).alt)}" />
				`;
    }
    if (/** @type {TwitterImage} */ (image).width != null) {
      markup += html`
					<meta name="twitter:image:width" property="twitter:image:width" content="${/** @type {TwitterImage} */ (image).width}" />
				`;
    }
    if (/** @type {TwitterImage} */ (image).height != null) {
      markup += html`
					<meta name="twitter:image:height" property="twitter:image:height" content="${/** @type {TwitterImage} */ (image).height}" />
				`;
    }
  }

  return markup;
};

/**
 * Generates video and player card markup (Tier 2).
 *
 * @param {boolean} hasVideo - Whether content has video
 * @param {TwitterVideo} [video] - Video configuration
 * @param {any} [player] - Player configuration
 * @param {string} [domain] - Domain for URL normalization
 * @param {TwitterImage|TwitterImage[]|string} [image] - Image configuration for thumbnail fallback
 * @returns {string} Video/player markup
 */
const generateVideoMarkup = (hasVideo, video, player, domain, image) => {
  let markup = "";

  // Handle video content
  if (video?.url && (player || hasVideo)) {
    const videoUrl = domain ? normalizeUrl(video.url, domain) : video.url;
    markup += html`
			<meta name="twitter:player" property="twitter:player" content="${videoUrl}" />
		`;

    if (video.width != null) {
      markup += html`
				<meta name="twitter:player:width" property="twitter:player:width" content="${video.width}" />
			`;
    }

    if (video.height != null) {
      markup += html`
				<meta name="twitter:player:height" property="twitter:player:height" content="${video.height}" />
			`;
    }

    if (video.stream?.url) {
      const streamUrl = domain ? normalizeUrl(video.stream.url, domain) : video.stream.url;
      markup += html`
				<meta name="twitter:player:stream" property="twitter:player:stream" content="${streamUrl}" />
			`;

      if (video.stream.contentType) {
        markup += html`
					<meta name="twitter:player:stream:content_type" property="twitter:player:stream:content_type" content="${video.stream.contentType}" />
				`;
      }
    }

    // Use video thumbnail if no image provided
    if (!image && video.thumbnail) {
      const thumbUrl = domain ? normalizeUrl(video.thumbnail, domain) : video.thumbnail;
      markup += html`
				<meta name="twitter:image" property="twitter:image" content="${thumbUrl}" />
			`;
    }
  }

  // Handle player card configuration
  if (player && (hasVideo || player.url)) {
    if (player.url) {
      const playerUrl = domain ? normalizeUrl(player.url, domain) : player.url;
      markup += html`
				<meta name="twitter:player" property="twitter:player" content="${playerUrl}" />
			`;
    }

    if (player.width != null) {
      markup += html`
				<meta name="twitter:player:width" property="twitter:player:width" content="${player.width}" />
			`;
    }

    if (player.height != null) {
      markup += html`
				<meta name="twitter:player:height" property="twitter:player:height" content="${player.height}" />
			`;
    }

    if (player.stream) {
      const streamUrl = domain ? normalizeUrl(player.stream, domain) : player.stream;
      markup += html`
				<meta name="twitter:player:stream" property="twitter:player:stream" content="${streamUrl}" />
			`;
    }

    if (player.streamContentType) {
      markup += html`
				<meta name="twitter:player:stream:content_type" property="twitter:player:stream:content_type" content="${player.streamContentType}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates app store integration markup (Tier 2).
 *
 * @param {TwitterAppConfig} app - App configuration
 * @returns {string} App markup
 */
const generateAppMarkup = (app) => {
  if (!app) return "";

  let markup = "";
  const { iphone, ipad, googleplay, country } = app;

  if (iphone) {
    if (iphone.name) {
      markup += html`
					<meta name="twitter:app:name:iphone" property="twitter:app:name:iphone" content="${iphone.name}" />
				`;
    }
    if (iphone.id) {
      markup += html`
					<meta name="twitter:app:id:iphone" property="twitter:app:id:iphone" content="${iphone.id}" />
				`;
    }
    if (iphone.url) {
      markup += html`
					<meta name="twitter:app:url:iphone" property="twitter:app:url:iphone" content="${iphone.url}" />
				`;
    }
  }

  if (ipad) {
    if (ipad.name) {
      markup += html`
					<meta name="twitter:app:name:ipad" property="twitter:app:name:ipad" content="${ipad.name}" />
				`;
    }
    if (ipad.id) {
      markup += html`
					<meta name="twitter:app:id:ipad" property="twitter:app:id:ipad" content="${ipad.id}" />
				`;
    }
    if (ipad.url) {
      markup += html`
					<meta name="twitter:app:url:ipad" property="twitter:app:url:ipad" content="${ipad.url}" />
				`;
    }
  }

  if (googleplay) {
    if (googleplay.name) {
      markup += html`
					<meta name="twitter:app:name:googleplay" property="twitter:app:name:googleplay" content="${googleplay.name}" />
				`;
    }
    if (googleplay.id) {
      markup += html`
					<meta name="twitter:app:id:googleplay" property="twitter:app:id:googleplay" content="${googleplay.id}" />
				`;
    }
    if (googleplay.url) {
      markup += html`
					<meta name="twitter:app:url:googleplay" property="twitter:app:url:googleplay" content="${googleplay.url}" />
				`;
    }
  }

  if (country) {
    markup += html`
				<meta name="twitter:app:country" property="twitter:app:country" content="${country}" />
			`;
  }

  return markup;
};

/**
 * Generates article-specific and attribution markup (Tier 3).
 *
 * @param {Object} article - Article configuration
 * @param {TwitterThreadConfig} thread - Thread configuration
 * @param {string} creator - Creator @username
 * @param {string} site - Site @username
 * @param {string} [domain] - Domain for URL normalization
 * @returns {string} Article and attribution markup
 */
const generateArticleMarkup = (article, thread, creator, site, domain) => {
  let markup = "";

  // Creator and site attribution (maximum Twitter SEO value)
  if (creator) {
    const formattedCreator = formatTwitterUsername(creator);
    if (formattedCreator) {
      markup += html`
				<meta name="twitter:creator" property="twitter:creator" content="${formattedCreator}" />
			`;
    }
  }

  if (site) {
    const formattedSite = formatTwitterUsername(site);
    if (formattedSite) {
      markup += html`
				<meta name="twitter:site" property="twitter:site" content="${formattedSite}" />
			`;
    }
  }

  // Article-specific metadata
  if (article) {
    const { author: articleAuthor, section } = /** @type {any} */ (article);

    if (articleAuthor) {
      markup += html`
				<meta name="twitter:label1" property="twitter:label1" content="Written by" />
				<meta name="twitter:data1" property="twitter:data1" content="${articleAuthor}" />
			`;
    }

    if (section) {
      markup += html`
				<meta name="twitter:label2" property="twitter:label2" content="Filed under" />
				<meta name="twitter:data2" property="twitter:data2" content="${section}" />
			`;
    }
  }

  // Thread support
  if (thread?.position && thread.total) {
    markup += html`
			<meta name="twitter:label1" property="twitter:label1" content="Reading" />
			<meta name="twitter:data1" property="twitter:data1" content="${thread.position} of ${thread.total}" />
		`;

    if (thread.nextUrl) {
      const nextUrl = domain ? normalizeUrl(thread.nextUrl, domain) : thread.nextUrl;
      markup += html`
				<meta name="twitter:label2" property="twitter:label2" content="Next" />
				<meta name="twitter:data2" property="twitter:data2" content="${nextUrl}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates analytics and ads markup (Tier 4).
 *
 * @param {TwitterAnalyticsConfig} analytics - Analytics configuration
 * @param {TwitterAdsConfig} ads - Ads configuration
 * @returns {string} Analytics and ads markup
 */
const generateAnalyticsMarkup = (analytics, ads) => {
  let markup = "";

  if (analytics) {
    const { trackingId, conversionEvents } = analytics;

    if (trackingId) {
      markup += html`
				<meta name="twitter:tracking" property="twitter:tracking" content="${trackingId}" />
			`;
    }

    if (conversionEvents && conversionEvents.length > 0) {
      const validEvents = conversionEvents.filter((/** @type {string} */ event) => event != null && event !== "");
      for (const event of validEvents.slice(0, 3)) {
        // Limit to 3 events
        markup += html`
					<meta name="twitter:conversion" property="twitter:conversion" content="${event}" />
				`;
      }
    }
  }

  if (ads) {
    const { campaignId, creativeId, attribution } = ads;

    if (campaignId) {
      markup += html`
				<meta name="twitter:campaign" property="twitter:campaign" content="${campaignId}" />
			`;
    }

    if (creativeId) {
      markup += html`
				<meta name="twitter:creative" property="twitter:creative" content="${creativeId}" />
			`;
    }

    if (attribution) {
      markup += html`
				<meta name="twitter:attribution" property="twitter:attribution" content="${attribution}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates progressive Twitter Cards with comprehensive creator attribution and engagement optimization.
 *
 * **Tier 1 (Core Twitter Cards):** Essential metadata for all Twitter Cards
 * **Tier 2 (Content Type Cards):** Specialized cards for different content types
 * **Tier 3 (Advanced Attribution):** Creator attribution and engagement features
 * **Tier 4 (Enterprise Integration):** Analytics and ads for professional use
 *
 * Each configuration option unlocks additional Twitter-specific markup without redundancy.
 * Missing options generate no corresponding markup, ensuring clean output.
 *
 * @param {TwitterConfig} config - Progressive Twitter configuration
 * @returns {string} Generated Twitter HTML markup
 *
 * @example
 * // Tier 1: Basic Twitter card (essential metadata only)
 * twitter({
 *   title: 'Amazing Tech Tutorial',
 *   description: 'Learn the latest in web development'
 * });
 * // → Basic summary card with title and description
 *
 * @example
 * // Tier 1 + Image: Enhanced card with visual content
 * twitter({
 *   domain: 'example.com',
 *   title: 'Amazing Tech Tutorial',
 *   description: 'Learn the latest in web development',
 *   image: '/tutorial-hero.jpg'
 * });
 * // → Summary large image card with hero image
 *
 * @example
 * // Tier 2: Article card with creator attribution
 * twitter({
 *   domain: 'example.com',
 *   title: 'Breaking News: Tech Innovation',
 *   description: 'Latest breakthrough in technology',
 *   image: '/news-image.jpg',
 *   contentType: 'article',
 *   article: {
 *     author: 'Jane Reporter',
 *     section: 'Technology'
 *   }
 * });
 * // → Article card with author and section metadata
 *
 * @example
 * // Tier 2: Video player card
 * twitter({
 *   domain: 'example.com',
 *   title: 'Amazing Product Demo',
 *   description: 'Watch our latest product in action',
 *   video: {
 *     url: '/demo.mp4',
 *     width: 1280,
 *     height: 720,
 *     thumbnail: '/demo-thumb.jpg'
 *   }
 * });
 * // → Video player card with embedded player
 *
 * @example
 * // Tier 2: App card with store integration
 * twitter({
 *   title: 'Download Our Amazing App',
 *   description: 'The best app for productivity',
 *   image: '/app-screenshot.jpg',
 *   contentType: 'app',
 *   app: {
 *     iphone: {
 *       name: 'Productivity Pro',
 *       id: '123456789',
 *       url: 'productivitypro://home'
 *     },
 *     googleplay: {
 *       name: 'Productivity Pro',
 *       id: 'com.productivity.pro'
 *     }
 *   }
 * });
 * // → App card with iOS and Android integration
 *
 * @example
 * // Tier 3: Gallery card with thread and attribution
 * twitter({
 *   domain: 'example.com',
 *   title: 'Product Showcase',
 *   description: 'See all our amazing products',
 *   gallery: {
 *     images: ['/product1.jpg', '/product2.jpg', '/product3.jpg', '/product4.jpg']
 *   },
 *   thread: {
 *     position: 1,
 *     total: 3,
 *     nextUrl: '/thread-part-2'
 *   },
 *   creator: '@productexpert',
 *   site: '@brandaccount'
 * });
 * // → Gallery card with thread optimization and creator attribution
 *
 * @example
 * // Tier 4: Enterprise card with analytics and ads
 * twitter({
 *   domain: 'example.com',
 *   title: 'Premium Product Launch',
 *   description: 'Introducing our flagship product',
 *   image: '/launch-image.jpg',
 *   creator: '@ceo',
 *   site: '@company',
 *   analytics: {
 *     trackingId: 'twitter_pixel_123',
 *     conversionEvents: ['Purchase', 'Lead']
 *   },
 *   ads: {
 *     campaignId: 'campaign_456',
 *     creativeId: 'creative_789',
 *     attribution: 'purchase'
 *   }
 * });
 * // → Enterprise card with analytics and ads integration
 */
/**
 * @param {TwitterConfig} config - Progressive Twitter configuration
 * @returns {string} Generated Twitter HTML markup
 */
export const twitter = (/** @type {TwitterConfig} */ config) => {
  if (!config || typeof config !== "object") return "";
  const {
    domain,
    url,
    title,
    description,
    image,
    video,
    cardType,
    contentType,
    article,
    app,
    player,
    gallery,
    thread,
    creator,
    site,
    analytics,
    ads,
  } = /** @type {any} */ (config);

  if (!title || !description) return "";

  // Escape HTML entities in title and description
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  // Determine canonical URL with Twitter optimization
  let canonicalUrl;
  if (url) {
    canonicalUrl = normalizeUrl(url, domain || "example.com");
  } else if (domain) {
    canonicalUrl = `https://${domain}`;
  }

  // Detect content characteristics for card type optimization
  const hasVideo = !!video?.url;
  const hasApp = !!(app && (app.iphone || app.ipad || app.googleplay));
  const hasGallery = !!(gallery?.images && gallery.images.length > 1);
  const hasLargeImage = !!(
    (typeof image === "object" && !Array.isArray(image) && /** @type {TwitterImage} */ (image).url) ||
    (Array.isArray(image) && image.length === 1)
  );

  // Auto-detect optimal card type
  const detectedCardType =
    cardType ||
    detectTwitterCardType(contentType, hasVideo, hasApp, hasGallery, hasLargeImage) ||
    (hasApp ? "app" : null) ||
    (hasVideo ? "player" : null);

  // Clean orchestration through pure functions
  let markup = generateBasicTwitterCard(detectedCardType, escapedTitle, escapedDescription, canonicalUrl);
  markup += generateTwitterImages(image, escapedTitle, domain);

  // Handle gallery images (alternative to image array)
  if (gallery?.images && gallery.images.length > 1 && detectedCardType === "gallery") {
    const maxImages = Math.min(gallery.images.length, 4);
    for (let i = 0; i < maxImages; i++) {
      const imageUrl = domain ? normalizeUrl(gallery.images[i], domain) : gallery.images[i];
      markup += html`
				<meta name="twitter:image${i}" property="twitter:image${i}" content="${imageUrl}" />
			`;
    }
  }

  // Tier 2: Content type specific markup
  markup += generateVideoMarkup(hasVideo, video, player, domain, image);

  if (detectedCardType === "app" && app) {
    markup += generateAppMarkup(app);
  }

  // Tier 3: Attribution and engagement features
  markup += generateArticleMarkup(article, thread, creator, site, domain);

  // Tier 4: Enterprise integration
  markup += generateAnalyticsMarkup(analytics, ads);

  return markup;
};
