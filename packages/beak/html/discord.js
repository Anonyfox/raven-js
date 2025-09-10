/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive Discord integration generator with advanced SEO optimization tiers.
 *
 * Generates comprehensive Discord meta tags that scale from basic link previews
 * to enterprise-level Discord ecosystem integration. Each tier unlocks increasingly
 * sophisticated Discord community and automation features.
 */

import { html } from "./index.js";
import { normalizeUrl } from "./url.js";

/**
 * @typedef {Object} DiscordConfig
 * @property {string} title - Page title for Discord preview
 * @property {string} description - Page description for Discord preview
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [url] - Pre-constructed canonical URL
 * @property {string} [image] - Primary image URL for Discord embed
 * @property {string} [invite] - Discord server invite code/URL
 * @property {Object} [server] - Discord server integration details
 * @property {string} [server.id] - Discord server ID
 * @property {string} [server.name] - Server name
 * @property {number} [server.memberCount] - Total member count
 * @property {number} [server.onlineCount] - Online member count
 * @property {string[]} [channels] - Featured server channels
 * @property {string[]} [roles] - Featured server roles
 * @property {Object} [embed] - Rich embed customization
 * @property {string} [embed.theme] - Embed theme (light/dark)
 * @property {string} [embed.accentColor] - Accent color in hex
 * @property {Object} [embed.media] - Media configuration
 * @property {string} [embed.media.image] - Primary embed image
 * @property {string} [embed.media.video] - Video embed URL
 * @property {string} [embed.media.thumbnail] - Thumbnail image
 * @property {Object} [embed.interactive] - Interactive elements
 * @property {string[]} [embed.interactive.buttons] - Action buttons
 * @property {string[]} [embed.interactive.reactions] - Default reactions
 * @property {Object} [enterprise] - Enterprise Discord features
 * @property {string[]} [enterprise.webhooks] - Webhook URLs for integration
 * @property {string[]} [enterprise.bots] - Bot usernames for mentions
 * @property {Object} [enterprise.analytics] - Analytics integration
 * @property {string} [enterprise.analytics.serverId] - Server analytics ID
 * @property {string} [enterprise.analytics.trackingId] - Tracking identifier
 * @property {Object} [enterprise.localization] - Multi-language support
 */

/**
 * Generates progressive Discord integration markup with advanced SEO optimization tiers.
 *
 * **Tier 1 (Smart Discord):** Intelligent URL normalization and optimized Discord tags
 * **Tier 2 (Community Integration):** Server, channels, and role integration
 * **Tier 3 (Rich Embed):** Advanced media and interactive embed features
 * **Tier 4 (Enterprise Discord):** Webhook, bot, and analytics integration
 *
 * Each configuration option unlocks additional Discord-specific markup without redundancy.
 * Missing options generate no corresponding markup, ensuring clean output.
 *
 * @param {DiscordConfig} config - Progressive Discord configuration
 * @returns {string} Generated Discord HTML markup
 *
 * @example
 * // Tier 1: Smart Discord tags with URL normalization
 * discord({
 *   domain: 'example.com',
 *   path: '/community',
 *   title: 'Join Our Discord',
 *   description: 'Connect with developers worldwide'
 * });
 * // → Optimized Discord meta tags with normalized URLs
 *
 * @example
 * // Tier 2: Community integration with server details
 * discord({
 *   domain: 'example.com',
 *   path: '/community',
 *   title: 'Developer Community',
 *   server: {
 *     id: '123456789',
 *     name: 'Dev Community',
 *     memberCount: 50000,
 *     onlineCount: 1200
 *   },
 *   channels: ['general', 'help', 'projects'],
 *   roles: ['Developer', 'Designer']
 * });
 * // → Server integration + channel/role tags
 *
 * @example
 * // Tier 3: Rich embed with media and interaction
 * discord({
 *   domain: 'example.com',
 *   path: '/project',
 *   title: 'Amazing Project',
 *   embed: {
 *     theme: 'dark',
 *     accentColor: '#5865F2',
 *     media: {
 *       image: '/project-banner.webp',
 *       video: '/demo-video.mp4',
 *       thumbnail: '/project-icon.png'
 *     },
 *     interactive: {
 *       buttons: ['Join Server', 'View Docs'],
 *       reactions: ['🚀', '⭐']
 *     }
 *   }
 * });
 * // → Complete rich embed with media and interactive elements
 *
 * @example
 * // Tier 4: Enterprise Discord with webhooks and bots
 * discord({
 *   domain: 'example.com',
 *   path: '/integration',
 *   title: 'Discord Integration',
 *   enterprise: {
 *     webhooks: ['https://discord.com/api/webhooks/123/token'],
 *     bots: ['@HelperBot#1234', '@ModeratorBot#5678'],
 *     analytics: {
 *       serverId: '123456789',
 *       trackingId: 'discord_analytics_001'
 *     },
 *     localization: {
 *       'en': 'English Support',
 *       'es': 'Soporte Español'
 *     }
 *   }
 * });
 * // → Enterprise Discord features with webhooks, bots, and analytics
 */
export const discord = (config) => {
  if (!config || typeof config !== "object") return "";
  const { domain, path, url, title, description, image, invite, server, channels, roles, embed, enterprise } = config;

  if (!title || !description) return "";

  // Determine canonical URL with Discord optimization
  let canonicalUrl;
  if (url) {
    // Normalize pre-provided URL
    canonicalUrl = normalizeUrl(url, domain || "example.com");
  } else if (domain && path !== undefined && path !== "") {
    // Construct from domain and path (only non-empty paths)
    canonicalUrl = normalizeUrl(path, domain);
  }

  // Tier 1: Smart Discord tags (always present)
  let markup = html`
		<meta name="discord:title" property="discord:title" content="${title}" />
		<meta name="discord:description" property="discord:description" content="${description}" />
	`;

  // Add URL if available
  if (canonicalUrl) {
    markup += html`
			<meta name="discord:url" property="discord:url" content="${canonicalUrl}" />
		`;
  }

  // Add image if provided
  if (image) {
    const imageUrl = domain ? normalizeUrl(image, domain) : image;
    markup += html`
			<meta name="discord:image" property="discord:image" content="${imageUrl}" />
		`;
  }

  // Add invite if provided
  if (invite) {
    markup += html`
			<meta name="discord:invite" property="discord:invite" content="${invite}" />
		`;
  }

  // Tier 2: Community integration
  if (server) {
    const { id, name: serverName, memberCount, onlineCount } = server;

    if (id) {
      markup += html`
				<meta name="discord:server:id" property="discord:server:id" content="${id}" />
			`;
    }

    if (serverName) {
      markup += html`
				<meta name="discord:server:name" property="discord:server:name" content="${serverName}" />
			`;
    }

    if (typeof memberCount === "number") {
      markup += html`
				<meta name="discord:server:members" property="discord:server:members" content="${memberCount}" />
			`;
    }

    if (typeof onlineCount === "number") {
      markup += html`
				<meta name="discord:server:online" property="discord:server:online" content="${onlineCount}" />
			`;
    }
  }

  // Add channels if provided
  if (channels && channels.length > 0) {
    for (const channel of channels) {
      markup += html`
				<meta name="discord:channel" property="discord:channel" content="${channel}" />
			`;
    }
  }

  // Add roles if provided
  if (roles && roles.length > 0) {
    for (const role of roles) {
      markup += html`
				<meta name="discord:role" property="discord:role" content="${role}" />
			`;
    }
  }

  // Tier 3: Rich embed features
  if (embed) {
    const { theme, accentColor, media, interactive } = embed;

    // Theme and styling
    if (theme) {
      markup += html`
				<meta name="discord:embed:theme" property="discord:embed:theme" content="${theme}" />
			`;
    }

    if (accentColor) {
      markup += html`
				<meta name="discord:embed:color" property="discord:embed:color" content="${accentColor}" />
			`;
    }

    // Media elements
    if (media) {
      const { image: embedImage, video, thumbnail } = media;

      if (embedImage) {
        const embedImageUrl = domain ? normalizeUrl(embedImage, domain) : embedImage;
        markup += html`
					<meta name="discord:embed:image" property="discord:embed:image" content="${embedImageUrl}" />
				`;
      }

      if (video) {
        const videoUrl = domain ? normalizeUrl(video, domain) : video;
        markup += html`
					<meta name="discord:embed:video" property="discord:embed:video" content="${videoUrl}" />
				`;
      }

      if (thumbnail) {
        const thumbnailUrl = domain ? normalizeUrl(thumbnail, domain) : thumbnail;
        markup += html`
					<meta name="discord:embed:thumbnail" property="discord:embed:thumbnail" content="${thumbnailUrl}" />
				`;
      }
    }

    // Interactive elements
    if (interactive) {
      const { buttons, reactions } = interactive;

      if (buttons && buttons.length > 0) {
        for (const button of buttons) {
          markup += html`
						<meta name="discord:button" property="discord:button" content="${button}" />
					`;
        }
      }

      if (reactions && reactions.length > 0) {
        for (const reaction of reactions) {
          markup += html`
						<meta name="discord:reaction" property="discord:reaction" content="${reaction}" />
					`;
        }
      }
    }
  }

  // Tier 4: Enterprise Discord features
  if (enterprise) {
    const { webhooks, bots, analytics, localization } = enterprise;

    // Webhook integration
    if (webhooks && webhooks.length > 0) {
      for (const webhook of webhooks) {
        markup += html`
					<meta name="discord:webhook" property="discord:webhook" content="${webhook}" />
				`;
      }
    }

    // Bot integration
    if (bots && bots.length > 0) {
      for (const bot of bots) {
        markup += html`
					<meta name="discord:bot" property="discord:bot" content="${bot}" />
				`;
      }
    }

    // Analytics integration
    if (analytics) {
      const { serverId, trackingId } = analytics;

      if (serverId) {
        markup += html`
					<meta name="discord:analytics:server" property="discord:analytics:server" content="${serverId}" />
				`;
      }

      if (trackingId) {
        markup += html`
					<meta name="discord:analytics:tracking" property="discord:analytics:tracking" content="${trackingId}" />
				`;
      }
    }

    // Localization support
    if (localization && Object.keys(localization).length > 0) {
      for (const [lang, localizedText] of Object.entries(localization)) {
        markup += html`
					<meta name="discord:locale:${lang}" property="discord:locale:${lang}" content="${localizedText}" />
				`;
      }
    }
  }

  return markup;
};
