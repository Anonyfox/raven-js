/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive author markup generator with SEO optimization tiers.
 *
 * Generates author attribution markup that scales from basic meta tags to comprehensive
 * structured data with social verification. Each configuration tier unlocks additional
 * SEO value while maintaining clean, progressive enhancement.
 */

import { html } from "./index.js";

/**
 * @typedef {Object} AuthorConfig
 * @property {string} name - Author's full name (required)
 * @property {string} [email] - Author's email for reply-to meta tag
 * @property {string} [jobTitle] - Professional title for structured data
 * @property {string} [organization] - Organization/company name
 * @property {string} [website] - Personal website URL (for Person schema)
 * @property {Object} [profiles] - Social media profile URLs
 * @property {string} [profiles.github] - GitHub profile URL
 * @property {string} [profiles.twitter] - Twitter profile URL
 * @property {string} [profiles.linkedin] - LinkedIn profile URL
 * @property {string} [profiles.website] - Personal website URL
 * @property {string} [photo] - Author photo/avatar URL
 * @property {string} [bio] - Short author biography
 * @property {string} [location] - Geographic location
 * @property {string} [language] - Primary language code (ISO 639-1)
 * @property {string[]} [credentials] - Professional credentials/titles
 */

/**
 * Generates progressive author markup with SEO optimization tiers.
 *
 * **Tier 1 (Basic):** Core attribution with meta tags
 * **Tier 2 (Professional):** Adds structured data Person schema
 * **Tier 3 (Social):** Includes platform verification links
 * **Tier 4 (Rich Profile):** Comprehensive markup with images and credentials
 *
 * Each configuration option unlocks additional markup without redundancy.
 * Missing options generate no corresponding markup, ensuring clean output.
 *
 * @param {AuthorConfig} config - Progressive author configuration
 * @returns {string} Generated author HTML markup
 *
 * @example
 * // Tier 1: Basic attribution
 * author({ name: 'Anonyfox' });
 * // → '<meta name="author" content="Anonyfox" />'
 *
 * @example
 * // Tier 2: Professional identity with structured data
 * author({
 *   name: 'Anonyfox',
 *   email: 'max@anonyfox.com',
 *   jobTitle: 'Senior Developer',
 *   organization: 'RavenJS'
 * });
 * // → Meta tags + JSON-LD Person schema with job and organization
 *
 * @example
 * // Tier 3: Social platform verification
 * author({
 *   name: 'Anonyfox',
 *   profiles: {
 *     github: 'https://github.com/Anonyfox',
 *     twitter: 'https://twitter.com/anonyfox'
 *   }
 * });
 * // → Author meta + rel="me" verification links for each platform
 *
 * @example
 * // Tier 4: Rich profile with photo and credentials
 * author({
 *   name: 'Anonyfox',
 *   photo: '/images/authors/anonyfox.jpg',
 *   bio: 'Creator of RavenJS - zero-dependency toolkit',
 *   location: 'Berlin, Germany',
 *   credentials: ['Google Developer Expert']
 * });
 * // → Complete markup with images, bio, location, and credential schema
 */
export const author = (config) => {
  if (!config || typeof config !== "object") return "";
  const { name } = config;
  if (!name || typeof name !== "string") return "";

  // Tier 1: Basic attribution (always present)
  let markup = html`
		<meta name="author" content="${name}" />
	`;

  // Add reply-to if email provided
  if (config.email) {
    markup += html`
			<meta name="reply-to" content="${config.email}" />
		`;
  }

  // Tier 2: Professional identity (structured data)
  if (config.jobTitle || config.organization) {
    const personSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      ...(config.jobTitle && { jobTitle: config.jobTitle }),
      ...(config.organization && {
        worksFor: {
          "@type": "Organization",
          name: config.organization,
        },
      }),
      ...(config.email && { email: config.email }),
      ...(config.website && { url: config.website }),
    };

    markup += html`
			<script type="application/ld+json">
				${JSON.stringify(personSchema, null, 2)}
			</script>
		`;
  }

  // Tier 3: Social platform verification
  if (config.profiles) {
    const { github, twitter, linkedin, website } = config.profiles;

    if (github) {
      markup += html`<link rel="me" href="${github}" />`;
    }
    if (twitter) {
      markup += html`<link rel="me" href="${twitter}" />`;
      markup += html`<meta name="twitter:creator" content="@${twitter.split("/").pop()}" />`;
    }
    if (linkedin) {
      markup += html`<link rel="me" href="${linkedin}" />`;
    }
    if (website) {
      markup += html`<link rel="author" href="${website}" />`;
    }
  }

  // Tier 4: Rich profile enhancements
  if (config.photo || config.bio || config.location || config.language || config.credentials) {
    // Enhanced Person schema for rich profiles
    const richPersonSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      ...(config.photo && { image: config.photo }),
      ...(config.bio && { description: config.bio }),
      ...(config.location && { address: { "@type": "PostalAddress", addressLocality: config.location } }),
      ...(config.language && { knowsLanguage: config.language }),
      ...(config.credentials &&
        config.credentials.length > 0 && {
          hasCredential: config.credentials.map((credential) => ({
            "@type": "EducationalOccupationalCredential",
            name: credential,
          })),
        }),
      ...(config.jobTitle && { jobTitle: config.jobTitle }),
      ...(config.organization && {
        worksFor: {
          "@type": "Organization",
          name: config.organization,
        },
      }),
      ...(config.email && { email: config.email }),
    };

    // Add Open Graph author image
    if (config.photo) {
      markup += html`
				<meta property="og:image" content="${config.photo}" />
				<meta name="twitter:image" content="${config.photo}" />
			`;
    }

    // Add bio as description if no other description exists
    if (config.bio && !config.jobTitle) {
      markup += html`
				<meta name="description" content="${config.bio}" />
				<meta property="og:description" content="${config.bio}" />
				<meta name="twitter:description" content="${config.bio}" />
			`;
    }

    markup += html`
			<script type="application/ld+json">
				${JSON.stringify(richPersonSchema, null, 2)}
			</script>
		`;
  }

  return markup;
};
