/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive Instagram SEO optimization with comprehensive visual and commerce integration.
 *
 * Generates sophisticated Instagram-compatible meta tags that optimize content for Instagram's
 * visual-first ecosystem. Progressive enhancement from basic Open Graph compatibility to
 * full Instagram Business and commerce integration with Stories, Reels, and IGTV support.
 */

import { escapeHtml, html } from "./index.js";
import { normalizeUrl } from "./url.js";

/**
 * @typedef {Object} InstagramImage
 * @property {string} url - Image URL
 * @property {string} [alt] - Alt text for accessibility
 * @property {number} [width] - Image width in pixels
 * @property {number} [height] - Image height in pixels
 * @property {'square'|'landscape'|'portrait'} [aspectRatio] - Instagram-optimized aspect ratio
 */

/**
 * @typedef {Object} InstagramBusiness
 * @property {'product'|'business'|'creator'|'event'|'article'} [type] - Business content type
 * @property {string} [price] - Product price (e.g., "$99.99")
 * @property {'in_stock'|'out_of_stock'|'preorder'} [availability] - Product availability
 * @property {string} [brand] - Brand name
 * @property {string} [category] - Product/service category
 * @property {'new'|'used'|'refurbished'} [condition] - Product condition
 * @property {string} [sku] - Product SKU
 * @property {string} [gtin] - Product GTIN/UPC
 */

/**
 * @typedef {Object} InstagramShoppable
 * @property {Array<Object>} [products] - Array of products for shoppable posts
 * @property {string} [checkoutUrl] - Checkout URL for purchases
 * @property {string} [currency] - Currency code (ISO 4217)
 * @property {string} [shipping] - Shipping information
 */

/**
 * @typedef {Object} InstagramStories
 * @property {'event'|'product'|'article'|'video'|'live'} [type] - Story content type
 * @property {string} [cta] - Call-to-action text
 * @property {string} [url] - Story destination URL
 * @property {string} [expiresAt] - Story expiration date (ISO 8601)
 */

/**
 * @typedef {Object} InstagramReels
 * @property {number} [duration] - Reel duration in seconds
 * @property {string} [audio] - Audio track name
 * @property {string[]} [hashtags] - Reel hashtags
 * @property {boolean} [duetEnabled] - Allow duets
 * @property {boolean} [stitchEnabled] - Allow stitches
 * @property {string} [challenge] - Associated challenge
 */

/**
 * @typedef {Object} InstagramIGTV
 * @property {string} [title] - IGTV video title
 * @property {string} [description] - IGTV video description
 * @property {number} [duration] - Video duration in seconds
 * @property {string} [series] - Series name if part of series
 * @property {number} [episode] - Episode number
 * @property {string} [category] - Video category
 */

/**
 * @typedef {Object} InstagramLive
 * @property {string} [title] - Live stream title
 * @property {string} [description] - Live stream description
 * @property {string} [startTime] - Scheduled start time (ISO 8601)
 * @property {string} [endTime] - Scheduled end time (ISO 8601)
 * @property {string[]} [guests] - Guest usernames
 */

/**
 * @typedef {Object} InstagramLocation
 * @property {string} [name] - Location name
 * @property {number} [latitude] - Latitude coordinate
 * @property {number} [longitude] - Longitude coordinate
 * @property {string} [address] - Full address
 * @property {string} [city] - City name
 * @property {string} [country] - Country name
 */

/**
 * @typedef {Object} InstagramHashtags
 * @property {string[]} [primary] - Primary brand hashtags
 * @property {string[]} [trending] - Trending/popular hashtags
 * @property {string[]} [location] - Location-based hashtags
 * @property {string[]} [niche] - Niche/industry hashtags
 */

/**
 * @typedef {Object} InstagramEngagement
 * @property {string[]} [mentions] - User mentions (@username)
 * @property {boolean} [collaboration] - Collaboration post
 * @property {boolean} [brandedContent] - Branded content disclosure
 * @property {boolean} [sponsored] - Sponsored content disclosure
 * @property {string[]} [tags] - Tagged users
 */

/**
 * @typedef {Object} InstagramConfig
 * @property {string} title - Post title
 * @property {string} description - Post description
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [url] - Canonical URL
 * @property {InstagramImage|InstagramImage[]|string} [image] - Primary image(s)
 * @property {InstagramImage[]} [multipleImages] - Additional images for carousel
 * @property {'article'|'product'|'event'|'video'|'business'} [contentType] - Content type for defaults
 * @property {InstagramBusiness} [business] - Business profile information
 * @property {InstagramShoppable} [shoppable] - Shoppable post configuration
 * @property {InstagramStories} [stories] - Stories optimization
 * @property {InstagramReels} [reels] - Reels optimization
 * @property {InstagramIGTV} [igtv] - IGTV optimization
 * @property {InstagramLive} [live] - Live streaming configuration
 * @property {InstagramLocation} [location] - Location geotagging
 * @property {InstagramHashtags} [hashtags] - Hashtag strategy
 * @property {InstagramEngagement} [engagement] - User engagement features
 * @property {Object} [contact] - Contact information
 * @property {string} [contact.phone] - Phone number
 * @property {string} [contact.email] - Email address
 * @property {string} [contact.address] - Physical address
 */

/**
 * Intelligent content-type aware defaults for Instagram SEO optimization.
 *
 * @param {string} contentType - Content type identifier
 * @returns {Object} Default configuration based on content type
 */
const getContentTypeDefaults = (contentType) => {
  switch (contentType) {
    case "article":
      return {
        image: { aspectRatio: "landscape" },
        maxImages: 10,
        business: { type: "article" },
      };

    case "product":
      return {
        image: { aspectRatio: "square" },
        maxImages: 4,
        business: { type: "product" },
        shoppable: { products: [] },
      };

    case "event":
      return {
        image: { aspectRatio: "landscape" },
        maxImages: 6,
        business: { type: "event" },
        stories: { type: "event" },
        live: {},
      };

    case "video":
      return {
        image: { aspectRatio: "landscape" },
        maxImages: 1,
        reels: { duration: 30 },
        igtv: {},
      };

    default:
      return {
        image: { aspectRatio: "square" },
        maxImages: 4,
        business: { type: "business" },
      };
  }
};

/**
 * Optimizes image dimensions for Instagram's aspect ratio requirements.
 *
 * @param {InstagramImage} image - Image configuration
 * @returns {Object} Optimized image dimensions
 */
const optimizeInstagramImage = (image) => {
  if (!image || !image.aspectRatio) return image;

  const { aspectRatio } = image;
  let width = image.width || 1080;
  let height = image.height || 1080;

  switch (aspectRatio) {
    case "square":
      width = height = 1080;
      break;
    case "landscape":
      width = 1080;
      height = 566;
      break;
    case "portrait":
      width = 1080;
      height = 1350;
      break;
  }

  return { ...image, width, height };
};

/**
 * Generates comprehensive Instagram SEO optimization with progressive enhancement.
 *
 * **Tier 1: Basic Instagram Integration** - Open Graph foundation for Instagram compatibility
 * **Tier 2: Enhanced Visual Content** - Image optimization, alt text, carousel support
 * **Tier 3: Business & Commerce Features** - Shoppable posts, product tagging, business profile
 * **Tier 4: Advanced Instagram Features** - Stories, Reels, IGTV, live streaming, location, hashtags
 *
 * Each configuration option unlocks increasingly sophisticated Instagram-specific optimization
 * without redundancy. Missing options generate no corresponding markup.
 *
 * @param {InstagramConfig} config - Progressive Instagram configuration
 * @returns {string} Generated Instagram HTML markup
 *
 * @example
 * // Tier 1: Basic Instagram post
 * instagram({
 *   title: "Beautiful Sunset",
 *   description: "Amazing sunset at the beach",
 *   image: "/sunset.jpg"
 * });
 * // → Basic Open Graph tags for Instagram compatibility
 *
 * @example
 * // Tier 2: Visual content optimization
 * instagram({
 *   title: "Product Showcase",
 *   description: "Premium product photography",
 *   image: {
 *     url: "/product.jpg",
 *     alt: "Elegant product in premium packaging",
 *     aspectRatio: "square"
 *   },
 *   multipleImages: ["/angle1.jpg", "/angle2.jpg", "/angle3.jpg"]
 * });
 * // → Optimized images with alt text and carousel support
 *
 * @example
 * // Tier 3: Shoppable post with business integration
 * instagram({
 *   title: "Premium Collection",
 *   description: "Shop our latest fashion collection",
 *   image: "/collection.jpg",
 *   contentType: "product",
 *   business: {
 *     type: "product",
 *     price: "$299.99",
 *     availability: "in_stock",
 *     brand: "Premium Brand"
 *   },
 *   shoppable: {
 *     products: [
 *       { name: "Premium Dress", price: "$199.99", url: "/dress" }
 *     ],
 *     checkoutUrl: "/checkout"
 *   }
 * });
 * // → E-commerce integration with product tagging
 *
 * @example
 * // Tier 4: Full Instagram ecosystem optimization
 * instagram({
 *   title: "Live Fashion Show",
 *   description: "Exclusive behind-the-scenes access",
 *   image: "/show-poster.jpg",
 *   contentType: "event",
 *   stories: {
 *     type: "event",
 *     cta: "Watch Live",
 *     url: "/live-stream"
 *   },
 *   reels: {
 *     duration: 30,
 *     hashtags: ["fashion", "runway", "exclusive"],
 *     duetEnabled: true
 *   },
 *   live: {
 *     title: "Fashion Show Live",
 *     startTime: "2024-01-15T20:00:00Z"
 *   },
 *   location: {
 *     name: "Fashion District",
 *     latitude: 40.7505,
 *     longitude: -73.9934
 *   },
 *   hashtags: {
 *     primary: ["brand", "fashion"],
 *     trending: ["runway", "exclusive"],
 *     location: ["nyc", "fashiondistrict"]
 *   }
 * });
 * // → Complete Instagram ecosystem integration
 */
export const instagram = (config) => {
  if (!config || typeof config !== "object") return "";
  const {
    domain,
    url,
    title,
    description,
    image,
    multipleImages,
    contentType,
    shoppable,
    stories,
    reels,
    igtv,
    live,
    location,
    hashtags,
    engagement,
    contact,
  } = config;

  if (!title || !description) return "";

  // Escape HTML entities
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  // Apply content-type specific defaults
  const defaults = getContentTypeDefaults(contentType);
  const finalConfig = { ...defaults, ...config };

  // Determine canonical URL
  let canonicalUrl;
  if (url) {
    canonicalUrl = normalizeUrl(url, domain || "example.com");
  } else if (domain) {
    canonicalUrl = `https://${domain}`;
  }

  // Tier 1: Basic Open Graph tags (always present)
  let markup = html`
		<meta property="og:title" content="${escapedTitle}" />
		<meta property="og:description" content="${escapedDescription}" />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Instagram" />
	`;

  if (canonicalUrl) {
    markup += html`<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`;
  }

  // Handle primary image with Instagram optimization
  if (image) {
    if (typeof image === "string") {
      // Simple string image
      const imageUrl = domain ? normalizeUrl(image, domain) : image;
      markup += html`
				<meta property="og:image" content="${imageUrl}" />
				<meta property="og:image:alt" content="${escapedTitle} on Instagram" />
			`;
    } else if (typeof image === "object" && !Array.isArray(image) && /** @type {InstagramImage} */ (image).url) {
      // Rich image object with Instagram optimization
      const optimizedImage = optimizeInstagramImage(/** @type {InstagramImage} */ (image));
      const imageUrl = domain
        ? normalizeUrl(/** @type {any} */ (optimizedImage).url, domain)
        : /** @type {any} */ (optimizedImage).url;

      markup += html`<meta property="og:image" content="${imageUrl}" />`;

      if (/** @type {any} */ (optimizedImage).alt != null) {
        markup += html`<meta property="og:image:alt" content="${escapeHtml(/** @type {any} */ (optimizedImage).alt)}" />`;
      }

      if (/** @type {any} */ (optimizedImage).width != null) {
        markup += html`<meta property="og:image:width" content="${/** @type {any} */ (optimizedImage).width}" />`;
      }

      if (/** @type {any} */ (optimizedImage).height != null) {
        markup += html`<meta property="og:image:height" content="${/** @type {any} */ (optimizedImage).height}" />`;
      }
    }
  }

  // Handle multiple images for carousel posts
  if (multipleImages && Array.isArray(multipleImages)) {
    const maxImages = Math.min(multipleImages.length, 10); // Instagram supports up to 10 images
    for (let i = 0; i < maxImages; i++) {
      const img = multipleImages[i];
      if (typeof img === "string") {
        const imageUrl = domain ? normalizeUrl(img, domain) : img;
        markup += html`<meta property="og:image" content="${imageUrl}" />`;
      } else if (typeof img === "object" && !Array.isArray(img) && /** @type {InstagramImage} */ (img).url) {
        const optimizedImg = optimizeInstagramImage(/** @type {InstagramImage} */ (img));
        const imageUrl = domain
          ? normalizeUrl(/** @type {any} */ (optimizedImg).url, domain)
          : /** @type {any} */ (optimizedImg).url;
        markup += html`<meta property="og:image" content="${imageUrl}" />`;
      }
    }
  }

  // Tier 2: Enhanced visual content
  if (finalConfig.business) {
    const { type, price, availability, brand, category, condition } = finalConfig.business;

    if (type) {
      markup += html`<meta property="og:type" content="${type}" />`;
    }

    if (price) {
      markup += html`<meta property="product:price" content="${price}" />`;
    }

    if (availability) {
      markup += html`<meta property="product:availability" content="${availability}" />`;
    }

    if (brand) {
      markup += html`<meta property="product:brand" content="${escapeHtml(brand)}" />`;
    }

    if (category) {
      markup += html`<meta property="product:category" content="${escapeHtml(category)}" />`;
    }

    if (condition) {
      markup += html`<meta property="product:condition" content="${condition}" />`;
    }
  }

  // Tier 3: Business and commerce features
  if (shoppable?.products && shoppable.products.length > 0) {
    for (const product of shoppable.products.slice(0, 5)) {
      // Limit to 5 products
      if (/** @type {any} */ (product).name && /** @type {any} */ (product).url) {
        const productUrl = domain
          ? normalizeUrl(/** @type {any} */ (product).url, domain)
          : /** @type {any} */ (product).url;
        markup += html`
					<meta property="product:name" content="${escapeHtml(/** @type {any} */ (product).name)}" />
					<meta property="product:url" content="${productUrl}" />
				`;
        if (/** @type {any} */ (product).price != null) {
          markup += html`<meta property="product:price" content="${/** @type {any} */ (product).price}" />`;
        }
      }
    }

    if (shoppable.checkoutUrl) {
      const checkoutUrl = domain ? normalizeUrl(shoppable.checkoutUrl, domain) : shoppable.checkoutUrl;
      markup += html`<meta property="commerce:checkout_url" content="${checkoutUrl}" />`;
    }
  }

  // Contact information
  if (contact) {
    if (contact.phone) {
      markup += html`<meta property="business:contact_data:phone_number" content="${contact.phone}" />`;
    }
    if (contact.email) {
      markup += html`<meta property="business:contact_data:email" content="${contact.email}" />`;
    }
    if (contact.address) {
      markup += html`<meta property="business:contact_data:street_address" content="${escapeHtml(contact.address)}" />`;
    }
  }

  // Tier 4: Advanced Instagram features
  if (stories) {
    const { type, cta, url: storyUrl } = stories;

    if (type) {
      markup += html`<meta property="instagram:story:type" content="${type}" />`;
    }

    if (cta) {
      markup += html`<meta property="instagram:story:cta" content="${escapeHtml(cta)}" />`;
    }

    if (storyUrl) {
      const normalizedUrl = domain ? normalizeUrl(storyUrl, domain) : storyUrl;
      markup += html`<meta property="instagram:story:url" content="${normalizedUrl}" />`;
    }
  }

  if (reels) {
    const { duration, audio, hashtags: reelHashtags, duetEnabled, stitchEnabled } = reels;

    if (duration != null) {
      markup += html`<meta property="instagram:reel:duration" content="${duration}" />`;
    }

    if (audio) {
      markup += html`<meta property="instagram:reel:audio" content="${escapeHtml(audio)}" />`;
    }

    if (reelHashtags && reelHashtags.length > 0) {
      for (const tag of reelHashtags.slice(0, 10)) {
        // Limit to 10 hashtags
        markup += html`<meta property="instagram:reel:hashtag" content="${escapeHtml(tag)}" />`;
      }
    }

    if (duetEnabled) {
      markup += html`<meta property="instagram:reel:duet_enabled" content="true" />`;
    }

    if (stitchEnabled) {
      markup += html`<meta property="instagram:reel:stitch_enabled" content="true" />`;
    }
  }

  if (igtv) {
    const { title: igtvTitle, description: igtvDesc, duration: igtvDuration, series, episode } = igtv;

    if (igtvTitle) {
      markup += html`<meta property="instagram:igtv:title" content="${escapeHtml(igtvTitle)}" />`;
    }

    if (igtvDesc) {
      markup += html`<meta property="instagram:igtv:description" content="${escapeHtml(igtvDesc)}" />`;
    }

    if (igtvDuration != null) {
      markup += html`<meta property="instagram:igtv:duration" content="${igtvDuration}" />`;
    }

    if (series) {
      markup += html`<meta property="instagram:igtv:series" content="${escapeHtml(series)}" />`;
    }

    if (episode) {
      markup += html`<meta property="instagram:igtv:episode" content="${episode}" />`;
    }
  }

  if (live) {
    const { title: liveTitle, description: liveDesc, startTime } = live;

    if (liveTitle) {
      markup += html`<meta property="instagram:live:title" content="${escapeHtml(liveTitle)}" />`;
    }

    if (liveDesc) {
      markup += html`<meta property="instagram:live:description" content="${escapeHtml(liveDesc)}" />`;
    }

    if (startTime != null) {
      markup += html`<meta property="instagram:live:start_time" content="${startTime}" />`;
    }
  }

  if (location) {
    const { name: locName, latitude, longitude, address } = location;

    if (locName) {
      markup += html`<meta property="instagram:location:name" content="${escapeHtml(locName)}" />`;
    }

    if (latitude && longitude) {
      markup += html`<meta property="instagram:location:latitude" content="${latitude}" />`;
      markup += html`<meta property="instagram:location:longitude" content="${longitude}" />`;
    }

    if (address) {
      markup += html`<meta property="instagram:location:address" content="${escapeHtml(address)}" />`;
    }
  }

  if (hashtags) {
    const { primary, trending, location: locTags, niche } = hashtags;

    const allHashtags = [...(primary || []), ...(trending || []), ...(locTags || []), ...(niche || [])].slice(0, 30); // Instagram supports up to 30 hashtags

    for (const tag of allHashtags) {
      markup += html`<meta property="instagram:hashtag" content="${escapeHtml(tag)}" />`;
    }
  }

  if (engagement) {
    const { mentions, collaboration, brandedContent, sponsored } = engagement;

    if (mentions && mentions.length > 0) {
      for (const mention of mentions.slice(0, 20)) {
        // Limit to 20 mentions
        markup += html`<meta property="instagram:mention" content="${escapeHtml(mention)}" />`;
      }
    }

    if (collaboration) {
      markup += html`<meta property="instagram:collaboration" content="true" />`;
    }

    if (brandedContent) {
      markup += html`<meta property="instagram:branded_content" content="true" />`;
    }

    if (sponsored) {
      markup += html`<meta property="instagram:sponsored" content="true" />`;
    }
  }

  return markup;
};
