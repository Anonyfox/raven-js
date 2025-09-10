/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive YouTube SEO optimization with comprehensive video and channel integration.
 *
 * Generates sophisticated YouTube-compatible meta tags that optimize content for the world's
 * largest video platform. Progressive enhancement from basic video sharing to full YouTube
 * ecosystem integration with live streaming, monetization, and global localization support.
 */

import { escapeHtml, html } from "./index.js";
import { normalizeUrl } from "./url.js";

/**
 * @typedef {Object} YouTubeVideo
 * @property {string} url - Video URL
 * @property {string} [thumbnail] - Video thumbnail URL
 * @property {number} [duration] - Video duration in seconds
 * @property {string} [quality] - Video quality (SD, HD, FHD, UHD)
 * @property {string} [format] - Video format (MP4, WebM, etc.)
 * @property {number} [width] - Video width in pixels
 * @property {number} [height] - Video height in pixels
 * @property {boolean} [isLive] - Whether this is a live stream
 * @property {string} [actualStartTime] - Live stream actual start time (ISO 8601)
 * @property {string} [actualEndTime] - Live stream actual end time (ISO 8601)
 */

/**
 * @typedef {Object} YouTubeContentDetails
 * @property {string} [definition] - Video definition (SD, HD)
 * @property {boolean} [caption] - Whether captions are available
 * @property {boolean} [licensedContent] - Whether content is licensed
 * @property {string} [projection] - Video projection (rectangular, 360)
 * @property {string} [dimension] - Video dimension (2d, 3d)
 * @property {string} [regionRestriction] - Regional availability
 * @property {Object} [regionRestriction.allowed] - Allowed regions
 * @property {Object} [regionRestriction.blocked] - Blocked regions
 */

/**
 * @typedef {Object} YouTubeStatistics
 * @property {number} [viewCount] - Number of views
 * @property {number} [likeCount] - Number of likes
 * @property {number} [dislikeCount] - Number of dislikes
 * @property {number} [commentCount] - Number of comments
 * @property {number} [favoriteCount] - Number of favorites
 * @property {number} [subscriberCount] - Channel subscriber count
 */

/**
 * @typedef {Object} YouTubeChannel
 * @property {string} [title] - Channel title
 * @property {string} [description] - Channel description
 * @property {string} [customUrl] - Custom channel URL
 * @property {string} [publishedAt] - Channel creation date (ISO 8601)
 * @property {string} [country] - Channel country
 * @property {YouTubeStatistics} [statistics] - Channel statistics
 */

/**
 * @typedef {Object} YouTubeMonetization
 * @property {boolean} [isMonetized] - Whether video is monetized
 * @property {boolean} [adsEnabled] - Whether ads are enabled
 * @property {Array<Object>} [sponsorships] - Sponsorship information
 * @property {Object} [merchandise] - Merchandise information
 * @property {boolean} [merchandise.available] - Whether merchandise is available
 * @property {string} [merchandise.url] - Merchandise URL
 */

/**
 * @typedef {Object} YouTubeLiveStreaming
 * @property {number} [concurrentViewers] - Current concurrent viewers
 * @property {number} [totalViewers] - Total viewers during live stream
 * @property {boolean} [chatEnabled] - Whether live chat is enabled
 * @property {boolean} [donationsEnabled] - Whether donations are enabled
 * @property {Array<Object>} [superChats] - Super chat messages
 * @property {Array<Object>} [superStickers] - Super sticker messages
 */

/**
 * @typedef {Object} YouTubeLocalization
 * @property {string} [defaultLanguage] - Default language code
 * @property {string} [defaultAudioLanguage] - Default audio language code
 * @property {Object} [title] - Localized titles
 * @property {Object} [description] - Localized descriptions
 */

/**
 * @typedef {Object} YouTubeSEO
 * @property {string[]} [tags] - Video tags
 * @property {string} [category] - Video category
 * @property {string} [recordingDate] - Recording date (ISO 8601)
 * @property {string[]} [keywords] - SEO keywords
 * @property {boolean} [syndicated] - Whether video is syndicated
 */

/**
 * @typedef {Object} YouTubeEngagement
 * @property {number} [likes] - Number of likes
 * @property {number} [dislikes] - Number of dislikes
 * @property {number} [comments] - Number of comments
 * @property {number} [shares] - Number of shares
 * @property {number} [subscriptions] - Number of subscriptions gained
 * @property {number} [watchLater] - Number of watch later additions
 */

/**
 * @typedef {Object} YouTubePlaylist
 * @property {string} [title] - Playlist title
 * @property {string} [description] - Playlist description
 * @property {number} [position] - Video position in playlist
 * @property {number} [totalVideos] - Total videos in playlist
 * @property {string} [playlistId] - Playlist ID
 */

/**
 * @typedef {Object} YouTubeShorts
 * @property {Array<Object>} [clips] - Short clips from the video
 * @property {string} [clips.url] - Clip URL
 * @property {string} [clips.title] - Clip title
 * @property {number} [clips.startTime] - Clip start time in seconds
 * @property {number} [clips.duration] - Clip duration in seconds
 */

/**
 * @typedef {Object} YouTubeChapter
 * @property {string} title - Chapter title
 * @property {number} startTime - Chapter start time in seconds
 * @property {number} [endTime] - Chapter end time in seconds
 */

/**
 * @typedef {Object} YouTubeCard
 * @property {string} type - Card type (video, playlist, link, donation)
 * @property {string} [videoId] - Video ID for video cards
 * @property {string} [playlistId] - Playlist ID for playlist cards
 * @property {string} [url] - URL for link cards
 * @property {string} [timing] - Timing (start, end, or time in seconds)
 */

/**
 * @typedef {Object} YouTubeBusiness
 * @property {string} [type] - Business content type
 * @property {string} [price] - Product price
 * @property {string} [availability] - Product availability
 * @property {string} [brand] - Brand name
 * @property {string} [category] - Product/service category
 */

/**
 * @typedef {Object} YouTubeConfig
 * @property {string} title - Video title
 * @property {string} description - Video description
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [url] - Canonical video URL
 * @property {YouTubeVideo} [video] - Video information
 * @property {YouTubeContentDetails} [contentDetails] - Content details
 * @property {YouTubeStatistics} [statistics] - Video/channel statistics
 * @property {YouTubeChannel} [channel] - Channel information
 * @property {YouTubeMonetization} [monetization] - Monetization information
 * @property {YouTubeLiveStreaming} [liveStreaming] - Live streaming details
 * @property {YouTubeLocalization} [localization] - Localization information
 * @property {YouTubeSEO} [seo] - SEO optimization data
 * @property {YouTubeEngagement} [engagement] - Engagement metrics
 * @property {YouTubePlaylist} [playlist] - Playlist information
 * @property {YouTubeShorts} [shorts] - Shorts integration
 * @property {YouTubeChapter[]} [chapters] - Video chapters
 * @property {Object} [cards] - Cards configuration
 * @property {YouTubeCard[]} [cards.endScreens] - End screen cards
 * @property {YouTubeCard[]} [cards.infoCards] - Info cards
 * @property {YouTubeBusiness} [business] - Business information
 * @property {'educational'|'entertainment'|'live'|'business'|'tutorial'} [contentType] - Content type for defaults
 */

/**
 * Intelligent content-type aware defaults for YouTube SEO optimization.
 *
 * @param {string} contentType - Content type identifier
 * @returns {Object} Default configuration based on content type
 */
const getContentTypeDefaults = (contentType) => {
  switch (contentType) {
    case "educational":
      return {
        contentDetails: { caption: true, licensedContent: false },
        seo: { category: "Education", tags: ["tutorial", "how-to", "learn"] },
        localization: {},
        chapters: [],
      };

    case "entertainment":
      return {
        contentDetails: { caption: false },
        seo: { category: "Entertainment", tags: ["fun", "viral", "entertainment"] },
        shorts: { clips: [] },
        cards: { endScreens: [] },
      };

    case "live":
      return {
        video: { isLive: true },
        liveStreaming: { chatEnabled: true },
        contentDetails: { caption: true },
        seo: { category: "Entertainment" },
      };

    case "business":
      return {
        monetization: { isMonetized: true },
        business: { type: "product" },
        contentDetails: { licensedContent: true },
        seo: { category: "Howto & Style" },
      };

    default:
      return {
        contentDetails: { caption: true },
        seo: { category: "Howto & Style", tags: ["tutorial", "guide"] },
        chapters: [],
      };
  }
};

/**
 * Generates comprehensive YouTube SEO optimization with progressive enhancement.
 *
 * **Tier 1: Basic Video Integration** - Open Graph video foundation for YouTube compatibility
 * **Tier 2: Enhanced Video Content** - Rich metadata, statistics, and playlist integration
 * **Tier 3: Business & Monetization** - Channel info, sponsorships, and revenue optimization
 * **Tier 4: Advanced YouTube Features** - Live streaming, localization, and full ecosystem integration
 *
 * Each configuration option unlocks increasingly sophisticated YouTube-specific optimization
 * without redundancy. Missing options generate no corresponding markup.
 *
 * @param {YouTubeConfig} config - Progressive YouTube configuration
 * @returns {string} Generated YouTube HTML markup
 *
 * @example
 * // Tier 1: Basic video sharing
 * youtube({
 *   title: "Amazing Tutorial",
 *   description: "Learn something incredible",
 *   video: {
 *     url: "/tutorial.mp4",
 *     thumbnail: "/thumbnail.jpg"
 *   }
 * });
 * // → Basic Open Graph video tags for YouTube compatibility
 *
 * @example
 * // Tier 2: Rich video metadata
 * youtube({
 *   title: "Advanced Tutorial",
 *   description: "Complete guide",
 *   video: {
 *     url: "/tutorial.mp4",
 *     thumbnail: "/thumbnail.jpg",
 *     duration: 1800,
 *     quality: "HD",
 *     width: 1920,
 *     height: 1080
 *   },
 *   contentDetails: {
 *     definition: "HD",
 *     caption: true,
 *     licensedContent: false
 *   },
 *   statistics: {
 *     viewCount: 150000,
 *     likeCount: 8500
 *   }
 * });
 * // → Rich video metadata with engagement signals
 *
 * @example
 * // Tier 3: Monetization integration
 * youtube({
 *   title: "Premium Course Preview",
 *   description: "Exclusive content",
 *   video: { url: "/preview.mp4" },
 *   channel: {
 *     title: "Premium Education",
 *     subscriberCount: 250000
 *   },
 *   monetization: {
 *     isMonetized: true,
 *     sponsorships: [
 *       { brand: "TechCorp", disclosure: "Sponsored by TechCorp" }
 *     ]
 *   }
 * });
 * // → Channel and monetization optimization
 *
 * @example
 * // Tier 4: Full YouTube ecosystem
 * youtube({
 *   title: "Live Masterclass",
 *   description: "Interactive session",
 *   video: {
 *     url: "/masterclass.mp4",
 *     isLive: true,
 *     actualStartTime: "2024-01-15T20:00:00Z"
 *   },
 *   liveStreaming: {
 *     concurrentViewers: 12500,
 *     chatEnabled: true
 *   },
 *   localization: {
 *     defaultLanguage: "en",
 *     title: { es: "Clase en Vivo" }
 *   },
 *   seo: {
 *     tags: ["tutorial", "education"],
 *     category: "Education"
 *   },
 *   chapters: [
 *     { title: "Introduction", startTime: 0 },
 *     { title: "Main Content", startTime: 300 }
 *   ]
 * });
 * // → Complete YouTube ecosystem integration
 */
/**
 * @param {YouTubeConfig} config - Progressive YouTube configuration
 * @returns {string} Generated YouTube HTML markup
 */
export const youtube = (/** @type {YouTubeConfig} */ config) => {
  if (!config || typeof config !== "object") return "";
  const { title, description, contentType } = /** @type {any} */ (config);

  if (!title || !description) return "";

  // Escape HTML entities
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  // Apply content-type specific defaults
  const defaults = getContentTypeDefaults(contentType);
  const finalConfig = { ...defaults, ...config };

  // Determine canonical URL
  let canonicalUrl;
  if (finalConfig.url) {
    canonicalUrl = normalizeUrl(finalConfig.url, finalConfig.domain || "youtube.com");
  } else if (finalConfig.domain) {
    canonicalUrl = `https://${finalConfig.domain}`;
  }

  // Tier 1: Basic Open Graph video tags (always present)
  let markup = html`
		<meta property="og:title" content="${escapedTitle}" />
		<meta property="og:description" content="${escapedDescription}" />
		<meta property="og:type" content="video.other" />
		<meta property="og:site_name" content="YouTube" />
	`;

  if (canonicalUrl) {
    markup += html`<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`;
  }

  // Handle video information with YouTube optimization
  if (finalConfig.video) {
    if (finalConfig.video.url) {
      const videoUrl = finalConfig.domain
        ? normalizeUrl(finalConfig.video.url, finalConfig.domain)
        : finalConfig.video.url;
      markup += html`<meta property="og:video" content="${videoUrl}" />`;
      markup += html`<meta property="og:video:type" content="video/mp4" />`;
    }

    if (finalConfig.video.thumbnail) {
      const thumbnailUrl = finalConfig.domain
        ? normalizeUrl(finalConfig.video.thumbnail, finalConfig.domain)
        : finalConfig.video.thumbnail;
      markup += html`<meta property="og:image" content="${thumbnailUrl}" />`;
      markup += html`<meta property="og:image:alt" content="${escapedTitle} on YouTube" />`;
    }

    if (finalConfig.video.width != null) {
      markup += html`<meta property="og:video:width" content="${finalConfig.video.width}" />`;
    }

    if (finalConfig.video.height != null) {
      markup += html`<meta property="og:video:height" content="${finalConfig.video.height}" />`;
    }

    if (finalConfig.video.duration != null) {
      markup += html`<meta property="og:video:duration" content="${finalConfig.video.duration}" />`;
    }

    if (finalConfig.video.isLive === true) {
      markup += html`<meta property="og:video:tag" content="live" />`;
    }
  }

  // Tier 2: Enhanced video content
  if (finalConfig.contentDetails) {
    const { definition, caption, licensedContent, projection, dimension } = finalConfig.contentDetails;

    if (definition != null) {
      markup += html`<meta property="video:definition" content="${definition}" />`;
    }

    if (caption != null) {
      markup += html`<meta property="video:caption" content="${caption ? "true" : "false"}" />`;
    }

    if (licensedContent != null) {
      markup += html`<meta property="video:licensed_content" content="${licensedContent ? "true" : "false"}" />`;
    }

    if (projection != null) {
      markup += html`<meta property="video:projection" content="${projection}" />`;
    }

    if (dimension != null) {
      markup += html`<meta property="video:dimension" content="${dimension}" />`;
    }
  }

  if (finalConfig.statistics) {
    const { viewCount, likeCount, commentCount, subscriberCount } = finalConfig.statistics;

    if (viewCount != null) {
      markup += html`<meta property="video:view_count" content="${viewCount}" />`;
    }

    if (likeCount != null) {
      markup += html`<meta property="video:like_count" content="${likeCount}" />`;
    }

    if (commentCount != null) {
      markup += html`<meta property="video:comment_count" content="${commentCount}" />`;
    }

    if (subscriberCount != null) {
      markup += html`<meta property="channel:subscriber_count" content="${subscriberCount}" />`;
    }
  }

  if (finalConfig.playlist) {
    const { title: playlistTitle, description: playlistDesc, position, totalVideos } = finalConfig.playlist;

    if (playlistTitle) {
      markup += html`<meta property="playlist:title" content="${escapeHtml(playlistTitle)}" />`;
    }

    if (playlistDesc) {
      markup += html`<meta property="playlist:description" content="${escapeHtml(playlistDesc)}" />`;
    }

    if (position !== undefined) {
      markup += html`<meta property="playlist:position" content="${position}" />`;
    }

    if (totalVideos !== undefined) {
      markup += html`<meta property="playlist:total_videos" content="${totalVideos}" />`;
    }
  }

  // Tier 3: Business and monetization features
  if (finalConfig.channel) {
    const {
      title: channelTitle,
      description: channelDesc,
      customUrl,
      publishedAt,
      country,
      statistics: channelStats,
    } = finalConfig.channel;

    if (channelTitle) {
      markup += html`<meta property="channel:title" content="${escapeHtml(channelTitle)}" />`;
    }

    if (channelDesc) {
      markup += html`<meta property="channel:description" content="${escapeHtml(channelDesc)}" />`;
    }

    if (customUrl) {
      markup += html`<meta property="channel:custom_url" content="${customUrl}" />`;
    }

    if (publishedAt) {
      markup += html`<meta property="channel:published_at" content="${publishedAt}" />`;
    }

    if (country) {
      markup += html`<meta property="channel:country" content="${country}" />`;
    }

    // Handle subscriber count from either channel.statistics or directly on channel
    const subscriberCount = channelStats?.subscriberCount || /** @type {any} */ (finalConfig.channel).subscriberCount;
    if (subscriberCount !== undefined) {
      markup += html`<meta property="channel:subscriber_count" content="${subscriberCount}" />`;
    }
  }

  if (finalConfig.monetization) {
    const { isMonetized, adsEnabled, sponsorships, merchandise } = finalConfig.monetization;

    if (isMonetized !== undefined) {
      markup += html`<meta property="video:monetized" content="${isMonetized ? "true" : "false"}" />`;
    }

    if (adsEnabled !== undefined) {
      markup += html`<meta property="video:ads_enabled" content="${adsEnabled ? "true" : "false"}" />`;
    }

    if (sponsorships && sponsorships.length > 0) {
      for (const sponsorship of sponsorships.slice(0, 5)) {
        if (/** @type {any} */ (sponsorship).brand && /** @type {any} */ (sponsorship).disclosure) {
          markup += html`<meta property="video:sponsorship" content="${escapeHtml(/** @type {any} */ (sponsorship).brand)}" />`;
          markup += html`<meta property="video:sponsorship_disclosure" content="${escapeHtml(/** @type {any} */ (sponsorship).disclosure)}" />`;
        }
      }
    }

    if (merchandise?.available) {
      markup += html`<meta property="channel:merchandise_available" content="true" />`;
      if (merchandise.url) {
        const merchUrl = finalConfig.domain ? normalizeUrl(merchandise.url, finalConfig.domain) : merchandise.url;
        markup += html`<meta property="channel:merchandise_url" content="${merchUrl}" />`;
      }
    }
  }

  if (finalConfig.business) {
    const { type, price, availability, brand, category } = finalConfig.business;

    if (type !== undefined) {
      markup += html`<meta property="business:type" content="${type}" />`;
    }

    if (price !== undefined) {
      markup += html`<meta property="business:price" content="${price}" />`;
    }

    if (availability !== undefined) {
      markup += html`<meta property="business:availability" content="${availability}" />`;
    }

    if (brand !== undefined) {
      markup += html`<meta property="business:brand" content="${escapeHtml(brand)}" />`;
    }

    if (category !== undefined) {
      markup += html`<meta property="business:category" content="${escapeHtml(category)}" />`;
    }
  }

  // Tier 4: Advanced YouTube features
  if (finalConfig.liveStreaming) {
    const { concurrentViewers, totalViewers, chatEnabled, donationsEnabled, superChats } = finalConfig.liveStreaming;

    if (concurrentViewers !== undefined) {
      markup += html`<meta property="live:concurrent_viewers" content="${concurrentViewers}" />`;
    }

    if (totalViewers !== undefined) {
      markup += html`<meta property="live:total_viewers" content="${totalViewers}" />`;
    }

    if (chatEnabled !== undefined) {
      markup += html`<meta property="live:chat_enabled" content="${chatEnabled ? "true" : "false"}" />`;
    }

    if (donationsEnabled !== undefined) {
      markup += html`<meta property="live:donations_enabled" content="${donationsEnabled ? "true" : "false"}" />`;
    }

    if (superChats && superChats.length > 0) {
      for (const superChat of superChats.slice(0, 10)) {
        if (
          /** @type {any} */ (superChat).amount &&
          /** @type {any} */ (superChat).currency &&
          /** @type {any} */ (superChat).message
        ) {
          markup += html`<meta property="live:super_chat" content="${/** @type {any} */ (superChat).amount} ${/** @type {any} */ (superChat).currency}: ${escapeHtml(/** @type {any} */ (superChat).message)}" />`;
        }
      }
    }
  }

  if (finalConfig.localization) {
    const {
      defaultLanguage,
      defaultAudioLanguage,
      title: localizedTitle,
      description: localizedDesc,
    } = finalConfig.localization;

    if (defaultLanguage) {
      markup += html`<meta property="video:default_language" content="${defaultLanguage}" />`;
    }

    if (defaultAudioLanguage) {
      markup += html`<meta property="video:default_audio_language" content="${defaultAudioLanguage}" />`;
    }

    if (localizedTitle) {
      for (const [lang, localized] of Object.entries(localizedTitle).slice(0, 10)) {
        markup += html`<meta property="video:title:${lang}" content="${escapeHtml(localized)}" />`;
      }
    }

    if (localizedDesc) {
      for (const [lang, localized] of Object.entries(localizedDesc).slice(0, 10)) {
        markup += html`<meta property="video:description:${lang}" content="${escapeHtml(localized)}" />`;
      }
    }
  }

  if (finalConfig.seo) {
    const { tags, category, recordingDate, keywords } = finalConfig.seo;

    if (tags && tags.length > 0) {
      for (const tag of tags.slice(0, 15)) {
        markup += html`<meta property="video:tag" content="${escapeHtml(tag)}" />`;
      }
    }

    if (category) {
      markup += html`<meta property="video:category" content="${escapeHtml(category)}" />`;
    }

    if (recordingDate) {
      markup += html`<meta property="video:recording_date" content="${recordingDate}" />`;
    }

    if (keywords && keywords.length > 0) {
      for (const keyword of keywords.slice(0, 10)) {
        markup += html`<meta property="video:keyword" content="${escapeHtml(keyword)}" />`;
      }
    }
  }

  if (finalConfig.engagement) {
    const { likes, comments, shares, subscriptions, watchLater } = finalConfig.engagement;

    if (likes !== undefined) {
      markup += html`<meta property="engagement:likes" content="${likes}" />`;
    }

    if (comments !== undefined) {
      markup += html`<meta property="engagement:comments" content="${comments}" />`;
    }

    if (shares !== undefined) {
      markup += html`<meta property="engagement:shares" content="${shares}" />`;
    }

    if (subscriptions !== undefined) {
      markup += html`<meta property="engagement:subscriptions" content="${subscriptions}" />`;
    }

    if (watchLater !== undefined) {
      markup += html`<meta property="engagement:watch_later" content="${watchLater}" />`;
    }
  }

  if (finalConfig.shorts?.clips && finalConfig.shorts.clips.length > 0) {
    for (const clip of finalConfig.shorts.clips.slice(0, 5)) {
      if (
        /** @type {any} */ (clip).url &&
        /** @type {any} */ (clip).title &&
        /** @type {any} */ (clip).startTime !== undefined &&
        /** @type {any} */ (clip).duration !== undefined
      ) {
        const clipUrl = finalConfig.domain
          ? normalizeUrl(/** @type {any} */ (clip).url, finalConfig.domain)
          : /** @type {any} */ (clip).url;
        markup += html`<meta property="shorts:clip" content="${clipUrl}" />`;
        markup += html`<meta property="shorts:clip_title" content="${escapeHtml(/** @type {any} */ (clip).title)}" />`;
        markup += html`<meta property="shorts:clip_start" content="${/** @type {any} */ (clip).startTime}" />`;
        markup += html`<meta property="shorts:clip_duration" content="${/** @type {any} */ (clip).duration}" />`;
      }
    }
  }

  if (finalConfig.chapters && finalConfig.chapters.length > 0) {
    for (const chapter of finalConfig.chapters.slice(0, 20)) {
      if (chapter.title && chapter.startTime !== undefined) {
        markup += html`<meta property="chapter:title" content="${escapeHtml(chapter.title)}" />`;
        markup += html`<meta property="chapter:start_time" content="${chapter.startTime}" />`;
        if (chapter.endTime !== undefined) {
          markup += html`<meta property="chapter:end_time" content="${chapter.endTime}" />`;
        }
      }
    }
  }

  if (finalConfig.cards) {
    const { endScreens, infoCards } = finalConfig.cards;

    if (endScreens && endScreens.length > 0) {
      for (const card of endScreens.slice(0, 5)) {
        if (card.type && card.timing) {
          markup += html`<meta property="card:end_screen:${card.type}" content="${card.timing}" />`;
          if (card.videoId) {
            markup += html`<meta property="card:end_screen:video_id" content="${card.videoId}" />`;
          }
          if (card.playlistId) {
            markup += html`<meta property="card:end_screen:playlist_id" content="${card.playlistId}" />`;
          }
          if (card.url) {
            const cardUrl = finalConfig.domain ? normalizeUrl(card.url, finalConfig.domain) : card.url;
            markup += html`<meta property="card:end_screen:url" content="${cardUrl}" />`;
          }
        }
      }
    }

    if (infoCards && infoCards.length > 0) {
      for (const card of infoCards.slice(0, 5)) {
        if (card.type && card.timing !== undefined) {
          markup += html`<meta property="card:info:${card.type}" content="${card.timing}" />`;
          if (card.url) {
            const cardUrl = finalConfig.domain ? normalizeUrl(card.url, finalConfig.domain) : card.url;
            markup += html`<meta property="card:info:url" content="${cardUrl}" />`;
          }
        }
      }
    }
  }

  return markup;
};
