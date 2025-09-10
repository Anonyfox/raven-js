/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive Open Graph generator with comprehensive Facebook ecosystem optimization.
 *
 * Generates sophisticated Open Graph meta tags that scale from basic social sharing
 * to enterprise-level Facebook integration. Each tier unlocks increasingly powerful
 * content specialization, rich media optimization, and analytics capabilities.
 */

import { escapeHtml, html } from "./index.js";
import { normalizeUrl } from "./url.js";

/**
 * @typedef {Object} OpenGraphImage
 * @property {string} url - Image URL
 * @property {string} [secureUrl] - HTTPS image URL
 * @property {string} [type] - Image MIME type
 * @property {number} [width] - Image width in pixels
 * @property {number} [height] - Image height in pixels
 * @property {string} [alt] - Alt text for accessibility
 */

/**
 * @typedef {Object} OpenGraphVideo
 * @property {string} url - Video URL
 * @property {string} [secureUrl] - HTTPS video URL
 * @property {string} [type] - Video MIME type
 * @property {number} [width] - Video width in pixels
 * @property {number} [height] - Video height in pixels
 * @property {number} [duration] - Video duration in seconds
 * @property {string} [title] - Video title
 * @property {string} [description] - Video description
 * @property {OpenGraphImage} [thumbnail] - Video thumbnail image
 */

/**
 * @typedef {Object} OpenGraphAudio
 * @property {string} url - Audio URL
 * @property {string} [secureUrl] - HTTPS audio URL
 * @property {string} [type] - Audio MIME type
 * @property {string} [title] - Audio title
 * @property {number} [duration] - Audio duration in seconds
 * @property {string} [artist] - Artist name
 * @property {string} [album] - Album name
 */

/**
 * @typedef {Object} OpenGraphContactData
 * @property {string} [streetAddress] - Street address
 * @property {string} [locality] - City/locality
 * @property {string} [region] - State/region
 * @property {string} [postalCode] - Postal code
 * @property {string} [countryName] - Country name
 * @property {string} [email] - Email address
 * @property {string} [phoneNumber] - Phone number
 * @property {string} [faxNumber] - Fax number
 */

/**
 * @typedef {Object} OpenGraphConfig
 *
 * **Tier 1 (Core Open Graph):** Essential metadata for all social sharing
 * @property {string} title - Page title for Open Graph (required)
 * @property {string} description - Page description for Open Graph (required)
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction (legacy, use 'url' instead)
 * @property {string} [url] - Pre-constructed canonical URL
 * @property {string} [type] - Content type (auto-detected if not provided)
 * @property {string} [siteName] - Site name
 * @property {OpenGraphImage|OpenGraphImage[]|string} [image] - Primary image(s)
 *
 * **Tier 2 (Content Type Specialization):** Specialized metadata for different content types
 * @property {Object} [article] - Article-specific metadata (auto-triggers 'article' type)
 * @property {string[]} [article.authors] - Article author names
 * @property {string} [article.publishedTime] - Article publication date (ISO 8601)
 * @property {string} [article.modifiedTime] - Article modification date (ISO 8601)
 * @property {string} [article.section] - Article section/category
 * @property {string[]} [article.tags] - Article tags/keywords
 * @property {Object} [book] - Book-specific metadata (auto-triggers 'book' type)
 * @property {string[]} [book.authors] - Book author names
 * @property {string} [book.isbn] - Book ISBN
 * @property {string} [book.releaseDate] - Book release date (ISO 8601)
 * @property {string[]} [book.tags] - Book tags/genres
 * @property {Object} [profile] - Profile-specific metadata (auto-triggers 'profile' type)
 * @property {string} [profile.firstName] - First name
 * @property {string} [profile.lastName] - Last name
 * @property {string} [profile.username] - Username
 * @property {string} [profile.gender] - Gender
 * @property {Object} [product] - Product-specific metadata (auto-triggers 'product' type)
 * @property {Object} [product.price] - Product price information
 * @property {string} [product.price.amount] - Price amount
 * @property {string} [product.price.currency] - Price currency (ISO 4217)
 * @property {string} [product.availability] - Product availability
 * @property {string} [product.condition] - Product condition
 * @property {Object} [business] - Business-specific metadata (auto-triggers 'business.business' type)
 * @property {OpenGraphContactData} [business.contactData] - Business contact information
 *
 * **Tier 3 (Rich Media & Localization):** Advanced media and localization features
 * @property {OpenGraphVideo} [video] - Video content with rich metadata
 * @property {OpenGraphAudio} [audio] - Audio content with rich metadata
 * @property {string} [locale] - Primary locale (e.g., 'en_US')
 * @property {string[]} [alternateLocales] - Alternate locales for multi-language sites
 * @property {string} [fbAppId] - Facebook App ID for enhanced integration
 * @property {string[]} [fbPages] - Facebook Page IDs for page management
 * @property {string[]} [fbAdmins] - Facebook Admin IDs for page administration
 *
 * **Tier 4 (Enterprise Integration):** Analytics, tracking, and syndication
 * @property {Object} [analytics] - Facebook analytics and tracking integration
 * @property {string} [analytics.pixelId] - Facebook Pixel ID for conversion tracking
 * @property {string[]} [analytics.conversionGoals] - Conversion goals for tracking
 * @property {string[]} [analytics.customEvents] - Custom events for advanced tracking
 * @property {Object} [syndication] - Content syndication metadata
 * @property {string} [syndication.originalSource] - Original source URL for syndicated content
 * @property {string[]} [syndication.partners] - Syndication partner domains
 * @property {string} [verification] - Facebook domain verification token
 */

/**
 * Detects Open Graph content type from URL patterns and content.
 *
 * @param {string} url - URL to analyze
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {string} [explicitType] - Explicitly provided type
 * @returns {string} Detected Open Graph content type
 */
const detectOgType = (url, title, description, explicitType) => {
  if (explicitType) return explicitType;

  const titleLower = title ? title.toLowerCase() : "";
  const descLower = description ? description.toLowerCase() : "";
  const urlLower = url ? url.toLowerCase() : "";

  // Video content detection
  if (
    urlLower.includes("/videos/") ||
    urlLower.includes("/watch") ||
    urlLower.includes(".mp4") ||
    urlLower.includes(".mov") ||
    urlLower.includes(".avi") ||
    titleLower.includes("video") ||
    descLower.includes("watch") ||
    descLower.includes("video")
  ) {
    return "video.other";
  }

  // Audio content detection
  if (
    urlLower.includes("/audio/") ||
    urlLower.includes("/music/") ||
    urlLower.includes("/podcast") ||
    urlLower.includes(".mp3") ||
    urlLower.includes(".wav") ||
    urlLower.includes(".aac") ||
    titleLower.includes("audio") ||
    titleLower.includes("music") ||
    descLower.includes("listen") ||
    descLower.includes("audio")
  ) {
    return "music.song";
  }

  // Book content detection
  if (
    urlLower.includes("/books/") ||
    urlLower.includes("/book/") ||
    titleLower.includes("book") ||
    titleLower.includes("novel") ||
    titleLower.includes("ebook") ||
    descLower.includes("isbn") ||
    descLower.includes("author") ||
    /\b\d{10}|\d{13}\b/.test(descLower)
  ) {
    return "book";
  }

  // Profile content detection
  if (
    urlLower.includes("/profile/") ||
    urlLower.includes("/user/") ||
    urlLower.includes("/author/") ||
    urlLower.includes("/member/") ||
    titleLower.includes("profile") ||
    titleLower.includes("about me") ||
    descLower.includes("profile") ||
    descLower.includes("biography")
  ) {
    return "profile";
  }

  // Product content detection
  if (
    urlLower.includes("/products/") ||
    urlLower.includes("/product/") ||
    urlLower.includes("/shop/") ||
    urlLower.includes("/store/") ||
    urlLower.includes("/buy/") ||
    titleLower.includes("product") ||
    titleLower.includes("price") ||
    descLower.includes("price") ||
    descLower.includes("buy now") ||
    descLower.includes("purchase")
  ) {
    return "product";
  }

  // Business/contact content detection
  if (
    urlLower.includes("/contact") ||
    urlLower.includes("/about") ||
    urlLower.includes("/company") ||
    titleLower.includes("contact") ||
    titleLower.includes("about us") ||
    titleLower.includes("company") ||
    descLower.includes("contact") ||
    descLower.includes("address")
  ) {
    return "business.business";
  }

  // Article/blog content detection
  if (
    urlLower.includes("/blog/") ||
    urlLower.includes("/article/") ||
    urlLower.includes("/news/") ||
    urlLower.includes("/post/") ||
    titleLower.includes("article") ||
    titleLower.includes("blog") ||
    descLower.includes("published") ||
    descLower.includes("author")
  ) {
    return "article";
  }

  return "website"; // Default
};

/**
 * Generates basic Open Graph metadata (Tier 1).
 *
 * @param {string} escapedTitle - HTML-escaped title
 * @param {string} escapedDescription - HTML-escaped description
 * @param {string} detectedType - Detected Open Graph content type
 * @param {string} [canonicalUrl] - Canonical URL for the content
 * @param {string} [siteName] - Site name
 * @returns {string} Basic Open Graph markup
 */
const generateBasicOpenGraph = (escapedTitle, escapedDescription, detectedType, canonicalUrl, siteName) => {
  let markup = html`
		<meta name="og:title" property="og:title" content="${escapedTitle}" />
		<meta name="og:description" property="og:description" content="${escapedDescription}" />
		<meta name="og:type" property="og:type" content="${detectedType}" />
	`;

  if (canonicalUrl) {
    markup += html`
			<meta name="og:url" property="og:url" content="${canonicalUrl}" />
		`;
  }

  if (siteName) {
    markup += html`
			<meta name="og:site_name" property="og:site_name" content="${siteName}" />
		`;
  }

  return markup;
};

/**
 * Generates Open Graph image markup with support for various image formats.
 *
 * @param {OpenGraphImage|OpenGraphImage[]|string} image - Image configuration
 * @param {string} [domain] - Domain for URL normalization
 * @returns {string} Open Graph image markup
 */
const generateOpenGraphImages = (image, domain) => {
  let markup = "";

  if (typeof image === "string") {
    // Simple string image
    const imageUrl = domain ? normalizeUrl(image, domain) : image;
    markup += html`
			<meta name="og:image" property="og:image" content="${imageUrl}" />
		`;
  } else if (Array.isArray(image) && image.length > 0) {
    // Multiple images
    for (const img of image) {
      const imageUrl = domain ? normalizeUrl(img.url, domain) : img.url;
      markup += html`
				<meta name="og:image" property="og:image" content="${imageUrl}" />
			`;
      if (img.secureUrl) {
        markup += html`
					<meta name="og:image:secure_url" property="og:image:secure_url" content="${img.secureUrl}" />
				`;
      }
      if (img.type) {
        markup += html`
					<meta name="og:image:type" property="og:image:type" content="${img.type}" />
				`;
      }
      if (img.width) {
        markup += html`
					<meta name="og:image:width" property="og:image:width" content="${img.width}" />
				`;
      }
      if (img.height) {
        markup += html`
					<meta name="og:image:height" property="og:image:height" content="${img.height}" />
				`;
      }
      if (img.alt) {
        markup += html`
					<meta name="og:image:alt" property="og:image:alt" content="${img.alt}" />
				`;
      }
    }
  } else if (typeof image === "object" && !Array.isArray(image)) {
    // Single rich image object (URL is optional for dimension-only specs)
    if (/** @type {OpenGraphImage} */ (image).url) {
      const imageUrl = domain
        ? normalizeUrl(/** @type {OpenGraphImage} */ (image).url, domain)
        : /** @type {OpenGraphImage} */ (image).url;
      markup += html`
				<meta name="og:image" property="og:image" content="${imageUrl}" />
			`;
    }
    if (/** @type {OpenGraphImage} */ (image).secureUrl) {
      markup += html`
				<meta name="og:image:secure_url" property="og:image:secure_url" content="${/** @type {OpenGraphImage} */ (image).secureUrl}" />
			`;
    }
    if (/** @type {OpenGraphImage} */ (image).type) {
      markup += html`
				<meta name="og:image:type" property="og:image:type" content="${/** @type {OpenGraphImage} */ (image).type}" />
			`;
    }
    if (/** @type {OpenGraphImage} */ (image).width !== undefined) {
      markup += html`
				<meta name="og:image:width" property="og:image:width" content="${/** @type {OpenGraphImage} */ (image).width}" />
			`;
    }
    if (/** @type {OpenGraphImage} */ (image).height !== undefined) {
      markup += html`
				<meta name="og:image:height" property="og:image:height" content="${/** @type {OpenGraphImage} */ (image).height}" />
			`;
    }
    if (/** @type {OpenGraphImage} */ (image).alt) {
      markup += html`
				<meta name="og:image:alt" property="og:image:alt" content="${/** @type {OpenGraphImage} */ (image).alt}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates article-specific markup (Tier 2).
 *
 * @param {any} article - Article configuration
 * @returns {string} Article markup
 */
const generateArticleMarkup = (article) => {
  if (!article) return "";

  let markup = "";
  const { authors, publishedTime, modifiedTime, section, tags } = article;

  if (authors && authors.length > 0) {
    for (const author of authors) {
      markup += html`
				<meta name="article:author" property="article:author" content="${author}" />
			`;
    }
  }

  if (publishedTime) {
    markup += html`
			<meta name="article:published_time" property="article:published_time" content="${publishedTime}" />
		`;
  }

  if (modifiedTime) {
    markup += html`
			<meta name="article:modified_time" property="article:modified_time" content="${modifiedTime}" />
		`;
  }

  if (section) {
    markup += html`
			<meta name="article:section" property="article:section" content="${section}" />
		`;
  }

  if (tags && tags.length > 0) {
    for (const tag of tags) {
      markup += html`
				<meta name="article:tag" property="article:tag" content="${tag}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates book-specific markup (Tier 2).
 *
 * @param {any} book - Book configuration
 * @returns {string} Book markup
 */
const generateBookMarkup = (book) => {
  if (!book) return "";

  let markup = "";
  const { authors, isbn, releaseDate, tags } = book;

  if (authors && authors.length > 0) {
    for (const author of authors) {
      markup += html`
				<meta name="book:author" property="book:author" content="${author}" />
			`;
    }
  }

  if (isbn) {
    markup += html`
			<meta name="book:isbn" property="book:isbn" content="${isbn}" />
		`;
  }

  if (releaseDate) {
    markup += html`
			<meta name="book:release_date" property="book:release_date" content="${releaseDate}" />
		`;
  }

  if (tags && tags.length > 0) {
    for (const tag of tags) {
      markup += html`
				<meta name="book:tag" property="book:tag" content="${tag}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates profile-specific markup (Tier 2).
 *
 * @param {any} profile - Profile configuration
 * @returns {string} Profile markup
 */
const generateProfileMarkup = (profile) => {
  if (!profile) return "";

  let markup = "";
  const { firstName, lastName, username, gender } = profile;

  if (firstName) {
    markup += html`
			<meta name="profile:first_name" property="profile:first_name" content="${firstName}" />
		`;
  }

  if (lastName) {
    markup += html`
			<meta name="profile:last_name" property="profile:last_name" content="${lastName}" />
		`;
  }

  if (username) {
    markup += html`
			<meta name="profile:username" property="profile:username" content="${username}" />
		`;
  }

  if (gender) {
    markup += html`
			<meta name="profile:gender" property="profile:gender" content="${gender}" />
		`;
  }

  return markup;
};

/**
 * Generates product-specific markup (Tier 2).
 *
 * @param {any} product - Product configuration
 * @returns {string} Product markup
 */
const generateProductMarkup = (product) => {
  if (!product) return "";

  let markup = "";
  const { price, availability, condition } = product;

  if (price?.amount) {
    markup += html`
			<meta name="product:price:amount" property="product:price:amount" content="${price.amount}" />
		`;
    if (price.currency) {
      markup += html`
				<meta name="product:price:currency" property="product:price:currency" content="${price.currency}" />
			`;
    }
  }

  if (availability) {
    markup += html`
			<meta name="product:availability" property="product:availability" content="${availability}" />
		`;
  }

  if (condition) {
    markup += html`
			<meta name="product:condition" property="product:condition" content="${condition}" />
		`;
  }

  return markup;
};

/**
 * Generates business-specific markup (Tier 2).
 *
 * @param {any} business - Business configuration
 * @returns {string} Business markup
 */
const generateBusinessMarkup = (business) => {
  if (!business) return "";

  let markup = "";
  const { contactData } = business;

  if (contactData) {
    const { streetAddress, locality, region, postalCode, countryName, email, phoneNumber, faxNumber } = contactData;

    if (streetAddress) {
      markup += html`
				<meta name="business:contact_data:street_address" property="business:contact_data:street_address" content="${streetAddress}" />
			`;
    }

    if (locality) {
      markup += html`
				<meta name="business:contact_data:locality" property="business:contact_data:locality" content="${locality}" />
			`;
    }

    if (region) {
      markup += html`
				<meta name="business:contact_data:region" property="business:contact_data:region" content="${region}" />
			`;
    }

    if (postalCode) {
      markup += html`
				<meta name="business:contact_data:postal_code" property="business:contact_data:postal_code" content="${postalCode}" />
			`;
    }

    if (countryName) {
      markup += html`
				<meta name="business:contact_data:country_name" property="business:contact_data:country_name" content="${countryName}" />
			`;
    }

    if (email) {
      markup += html`
				<meta name="business:contact_data:email" property="business:contact_data:email" content="${email}" />
			`;
    }

    if (phoneNumber) {
      markup += html`
				<meta name="business:contact_data:phone_number" property="business:contact_data:phone_number" content="${phoneNumber}" />
			`;
    }

    if (faxNumber) {
      markup += html`
				<meta name="business:contact_data:fax_number" property="business:contact_data:fax_number" content="${faxNumber}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates video markup (Tier 3).
 *
 * @param {OpenGraphVideo} video - Video configuration
 * @param {string} [domain] - Domain for URL normalization
 * @returns {string} Video markup
 */
const generateVideoMarkup = (video, domain) => {
  if (!video) return "";

  let markup = "";
  const { url: videoUrl, secureUrl, type: videoType, width, height, duration, title: videoTitle } = video;

  if (videoUrl) {
    const normalizedVideoUrl = domain ? normalizeUrl(videoUrl, domain) : videoUrl;
    markup += html`
			<meta name="og:video" property="og:video" content="${normalizedVideoUrl}" />
		`;
  }

  if (secureUrl) {
    markup += html`
			<meta name="og:video:secure_url" property="og:video:secure_url" content="${secureUrl}" />
		`;
  }

  if (videoType) {
    markup += html`
			<meta name="og:video:type" property="og:video:type" content="${videoType}" />
		`;
  }

  if (width) {
    markup += html`
			<meta name="og:video:width" property="og:video:width" content="${width}" />
		`;
  }

  if (height) {
    markup += html`
			<meta name="og:video:height" property="og:video:height" content="${height}" />
		`;
  }

  if (duration !== undefined) {
    markup += html`
			<meta name="og:video:duration" property="og:video:duration" content="${duration}" />
		`;
  }

  if (videoTitle) {
    markup += html`
			<meta name="og:video:title" property="og:video:title" content="${videoTitle}" />
		`;
  }

  return markup;
};

/**
 * Generates audio markup (Tier 3).
 *
 * @param {OpenGraphAudio} audio - Audio configuration
 * @param {string} [domain] - Domain for URL normalization
 * @returns {string} Audio markup
 */
const generateAudioMarkup = (audio, domain) => {
  if (!audio) return "";

  let markup = "";
  const { url: audioUrl, secureUrl, type: audioType, title: audioTitle } = audio;

  if (audioUrl) {
    const normalizedAudioUrl = domain ? normalizeUrl(audioUrl, domain) : audioUrl;
    markup += html`
			<meta name="og:audio" property="og:audio" content="${normalizedAudioUrl}" />
		`;
  }

  if (secureUrl) {
    markup += html`
			<meta name="og:audio:secure_url" property="og:audio:secure_url" content="${secureUrl}" />
		`;
  }

  if (audioType) {
    markup += html`
			<meta name="og:audio:type" property="og:audio:type" content="${audioType}" />
		`;
  }

  if (audioTitle) {
    markup += html`
			<meta name="og:audio:title" property="og:audio:title" content="${audioTitle}" />
		`;
  }

  return markup;
};

/**
 * Generates localization markup (Tier 3).
 *
 * @param {string} [locale] - Primary locale
 * @param {string[]} [alternateLocales] - Alternate locales
 * @returns {string} Localization markup
 */
const generateLocalizationMarkup = (locale, alternateLocales) => {
  let markup = "";

  if (locale) {
    markup += html`
			<meta name="og:locale" property="og:locale" content="${locale}" />
		`;
  }

  if (alternateLocales && alternateLocales.length > 0) {
    for (const altLocale of alternateLocales) {
      markup += html`
				<meta name="og:locale:alternate" property="og:locale:alternate" content="${altLocale}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates Facebook integration markup (Tier 3).
 *
 * @param {string} [fbAppId] - Facebook App ID
 * @param {string[]} [fbPages] - Facebook Page IDs
 * @param {string[]} [fbAdmins] - Facebook Admin IDs
 * @returns {string} Facebook integration markup
 */
const generateFacebookIntegrationMarkup = (fbAppId, fbPages, fbAdmins) => {
  let markup = "";

  if (fbAppId) {
    markup += html`
			<meta name="fb:app_id" property="fb:app_id" content="${fbAppId}" />
		`;
  }

  if (fbPages && fbPages.length > 0) {
    for (const pageId of fbPages) {
      markup += html`
				<meta name="fb:pages" property="fb:pages" content="${pageId}" />
			`;
    }
  }

  if (fbAdmins && fbAdmins.length > 0) {
    for (const adminId of fbAdmins) {
      markup += html`
				<meta name="fb:admins" property="fb:admins" content="${adminId}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates analytics markup (Tier 4).
 *
 * @param {any} analytics - Analytics configuration
 * @returns {string} Analytics markup
 */
const generateAnalyticsMarkup = (analytics) => {
  if (!analytics) return "";

  let markup = "";
  const { pixelId, conversionGoals, customEvents } = analytics;

  if (pixelId) {
    markup += html`
			<meta name="fb:analytics" property="fb:analytics" content="${pixelId}" />
		`;
  }

  if (conversionGoals && conversionGoals.length > 0) {
    for (const goal of conversionGoals) {
      markup += html`
				<meta name="fb:conversion" property="fb:conversion" content="${goal}" />
			`;
    }
  }

  if (customEvents && customEvents.length > 0) {
    for (const event of customEvents) {
      markup += html`
				<meta name="fb:event" property="fb:event" content="${event}" />
			`;
    }
  }

  return markup;
};

/**
 * Generates syndication markup (Tier 4).
 *
 * @param {any} syndication - Syndication configuration
 * @param {string} [verification] - Facebook domain verification
 * @returns {string} Syndication and verification markup
 */
const generateSyndicationMarkup = (syndication, verification) => {
  let markup = "";

  if (syndication) {
    const { originalSource, partners } = syndication;

    if (originalSource) {
      markup += html`
				<meta name="og:syndication" property="og:syndication" content="${originalSource}" />
			`;
    }

    if (partners && partners.length > 0) {
      for (const partner of partners) {
        markup += html`
					<meta name="og:syndication:partner" property="og:syndication:partner" content="${partner}" />
				`;
      }
    }
  }

  if (verification) {
    markup += html`
			<meta name="fb:domain_verification" property="fb:domain_verification" content="${verification}" />
		`;
  }

  return markup;
};

/**
 * Generates progressive Open Graph meta tags with comprehensive Facebook ecosystem optimization.
 *
 * **Tier 1 (Core Open Graph):** Essential metadata for all social sharing
 * **Tier 2 (Content Type Specialization):** Specialized metadata for different content types
 * **Tier 3 (Rich Media & Localization):** Advanced media and localization features
 * **Tier 4 (Enterprise Integration):** Analytics, tracking, and syndication
 *
 * Each configuration option unlocks additional Open Graph markup without redundancy.
 * Missing options generate no corresponding markup, ensuring clean output.
 *
 * @param {OpenGraphConfig} config - Progressive Open Graph configuration
 * @returns {string} Generated Open Graph HTML markup
 *
 * @example
 * // Tier 1: Essential Open Graph (minimal viable social sharing)
 * openGraph({
 *   title: 'My Amazing Article',
 *   description: 'Learn something incredible today'
 * });
 * // → Basic og:title, og:description, og:type for all platforms
 *
 * @example
 * // Tier 1 + Image: Enhanced visual sharing
 * openGraph({
 *   domain: 'example.com',
 *   title: 'My Amazing Article',
 *   description: 'Learn something incredible today',
 *   image: '/hero-image.jpg'
 * });
 * // → Adds og:image for rich visual previews
 *
 * @example
 * // Tier 1 + URL: Canonical linking
 * openGraph({
 *   domain: 'example.com',
 *   url: '/article/my-amazing-article',
 *   title: 'My Amazing Article',
 *   description: 'Learn something incredible today',
 *   siteName: 'My Blog'
 * });
 * // → Adds og:url and og:site_name for better attribution
 *
 * @example
 * // Tier 2: Article specialization (auto-detects from content)
 * openGraph({
 *   domain: 'example.com',
 *   url: '/blog/my-amazing-article',
 *   title: 'My Amazing Article',
 *   description: 'Learn something incredible today',
 *   article: {
 *     authors: ['Jane Author'],
 *     publishedTime: '2024-01-15T10:00:00Z',
 *     section: 'Technology'
 *   }
 * });
 * // → Article-specific metadata for rich article cards
 *
 * @example
 * // Tier 2: Product commerce (auto-triggers product type)
 * openGraph({
 *   domain: 'example.com',
 *   url: '/products/widget',
 *   title: 'Amazing Widget',
 *   description: 'The best widget ever made',
 *   product: {
 *     price: { amount: '29.99', currency: 'USD' },
 *     availability: 'in stock'
 *   }
 * });
 * // → Product-specific metadata for commerce cards
 *
 * @example
 * // Tier 3: Rich media with video
 * openGraph({
 *   domain: 'example.com',
 *   url: '/videos/product-demo',
 *   title: 'Product Demo',
 *   description: 'See our product in action',
 *   video: {
 *     url: '/demo.mp4',
 *     type: 'video/mp4',
 *     width: 1920,
 *     height: 1080
 *   },
 *   locale: 'en_US'
 * });
 * // → Video-specific metadata with localization
 *
 * @example
 * // Tier 3: Facebook App integration
 * openGraph({
 *   domain: 'example.com',
 *   url: '/article',
 *   title: 'My Article',
 *   description: 'Article description',
 *   fbAppId: '123456789',
 *   fbPages: ['987654321']
 * });
 * // → Facebook-specific integration for enhanced features
 *
 * @example
 * // Tier 4: Enterprise analytics and tracking
 * openGraph({
 *   domain: 'example.com',
 *   url: '/products/widget',
 *   title: 'Amazing Widget',
 *   description: 'The best widget ever',
 *   analytics: {
 *     pixelId: '987654321',
 *     conversionGoals: ['Purchase', 'Lead']
 *   },
 *   syndication: {
 *     originalSource: 'https://original-site.com'
 *   }
 * });
 * // → Complete enterprise setup with analytics and syndication
 */
/**
 * @param {OpenGraphConfig} config - Progressive Open Graph configuration
 * @returns {string} Generated Open Graph HTML markup
 */
export const openGraph = (/** @type {OpenGraphConfig} */ config) => {
  if (!config || typeof config !== "object") return "";
  const {
    domain,
    url,
    title,
    description,
    type,
    siteName,
    image,
    video,
    audio,
    article,
    book,
    profile,
    product,
    business,
    locale,
    alternateLocales,
    fbAppId,
    fbPages,
    fbAdmins,
    analytics,
    syndication,
    verification,
  } = /** @type {any} */ (config);

  if (!title || !description) return "";

  // Escape HTML entities in title and description
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  // Determine canonical URL with Open Graph optimization
  let canonicalUrl;
  if (url) {
    canonicalUrl = normalizeUrl(url, domain || "example.com");
  } else if (/** @type {any} */ (config).path !== undefined) {
    // Support legacy path parameter for backward compatibility
    const path = /** @type {any} */ (config).path;
    if (path) {
      canonicalUrl = normalizeUrl(path, domain || "example.com");
    } else if (domain) {
      canonicalUrl = `https://${domain}`;
    }
  } else if (domain) {
    canonicalUrl = `https://${domain}`;
  }

  // Auto-detect content type if not provided
  const detectedType = detectOgType(canonicalUrl, title, description, type);

  // Clean orchestration through pure functions
  let markup = generateBasicOpenGraph(escapedTitle, escapedDescription, detectedType, canonicalUrl, siteName);
  markup += generateOpenGraphImages(image, domain);

  // Tier 2: Content type specialization
  if ((detectedType === "article" || detectedType.startsWith("article")) && article) {
    markup += generateArticleMarkup(article);
  }

  if ((detectedType === "book" || detectedType.startsWith("book")) && book) {
    markup += generateBookMarkup(book);
  }

  if ((detectedType === "profile" || detectedType.startsWith("profile")) && profile) {
    markup += generateProfileMarkup(profile);
  }

  if ((detectedType === "product" || detectedType.startsWith("product")) && product) {
    markup += generateProductMarkup(product);
  }

  if ((detectedType === "business.business" || detectedType.startsWith("business")) && business) {
    markup += generateBusinessMarkup(business);
  }

  // Tier 3: Rich media and localization
  markup += generateVideoMarkup(video, domain);
  markup += generateAudioMarkup(audio, domain);
  markup += generateLocalizationMarkup(locale, alternateLocales);
  markup += generateFacebookIntegrationMarkup(fbAppId, fbPages, fbAdmins);

  // Tier 4: Enterprise analytics and syndication
  markup += generateAnalyticsMarkup(analytics);
  markup += generateSyndicationMarkup(syndication, verification);

  return markup;
};
