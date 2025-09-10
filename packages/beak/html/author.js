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
 *
 * // TIER 1: Always Required - Core Attribution
 * @property {string} name - Author's full name
 *
 * // TIER 2: Professional Identity (unlocks structured data Person schema)
 * @property {string} [email] - Author's email for structured data and reply-to meta
 * @property {string} [jobTitle] - Professional title for structured data
 * @property {string} [organization] - Organization/company name for structured data
 * @property {string} [website] - Personal website URL for Person schema
 *
 * // TIER 3: Social Verification (unlocks platform verification links)
 * @property {Object} [profiles] - Social media profile URLs for verification
 * @property {string} [profiles.github] - GitHub profile URL (generates rel="me" link)
 * @property {string} [profiles.twitter] - Twitter profile URL (generates rel="me" link)
 * @property {string} [profiles.linkedin] - LinkedIn profile URL (generates rel="me" link)
 * @property {string} [profiles.website] - Personal website URL (generates rel="author" link)
 *
 * // TIER 4: Rich Profile (unlocks enhanced schema)
 * @property {string} [photo] - Author photo/avatar URL for structured data
 * @property {string} [bio] - Short biography for structured data
 * @property {string} [location] - Geographic location for structured data
 * @property {string} [language] - Primary language code (ISO 639-1) for structured data
 * @property {string[]} [credentials] - Professional credentials/titles for structured data
 */

/**
 * Creates base Person schema object for structured data.
 *
 * @param {AuthorConfig} config - Author configuration
 * @returns {Object} Base Person schema object
 */
const createBasePersonSchema = (config) => {
  const { name, jobTitle, organization, email, website } = config;

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    ...(jobTitle && { jobTitle }),
    ...(organization && {
      worksFor: {
        "@type": "Organization",
        name: organization,
      },
    }),
    ...(email && { email }),
    ...(website && { url: website }),
  };
};

/**
 * Enhances Person schema with rich profile properties.
 *
 * @param {Object} baseSchema - Base Person schema to enhance
 * @param {AuthorConfig} config - Author configuration
 * @returns {Object} Enhanced Person schema object
 */
const enhancePersonSchema = (baseSchema, config) => {
  const { photo, bio, location, language, credentials } = config;

  return {
    ...baseSchema,
    ...(photo && { image: photo }),
    ...(bio && { description: bio }),
    ...(location && { address: { "@type": "PostalAddress", addressLocality: location } }),
    ...(language && { knowsLanguage: language }),
    ...(credentials &&
      credentials.length > 0 && {
        hasCredential: credentials.map((credential) => ({
          "@type": "EducationalOccupationalCredential",
          name: credential,
        })),
      }),
  };
};

/**
 * Generates basic author meta tags (Tier 1).
 *
 * @param {AuthorConfig} config - Author configuration
 * @returns {string} Basic meta tag markup
 */
const generateBasicMeta = (config) => {
  const { name, email } = config;

  let markup = html`
    <meta name="author" content="${name}" />
  `;

  if (email) {
    markup += html`
      <meta name="reply-to" content="${email}" />
    `;
  }

  return markup;
};

/**
 * Generates Person schema markup (Tier 2).
 *
 * @param {AuthorConfig} config - Author configuration
 * @returns {string} Person schema markup
 */
const generatePersonSchemaMarkup = (config) => {
  const { jobTitle, organization } = config;

  if (!jobTitle && !organization) return "";

  const schema = createBasePersonSchema(config);

  return html`
    <script type="application/ld+json">
      ${JSON.stringify(schema, null, 2)}
    </script>
  `;
};

/**
 * @typedef {Object} AuthorProfiles
 * @property {string} [github] - GitHub profile URL
 * @property {string} [twitter] - Twitter profile URL
 * @property {string} [linkedin] - LinkedIn profile URL
 * @property {string} [website] - Personal website URL
 */

/**
 * Generates social verification markup (Tier 3).
 *
 * @param {AuthorProfiles} [profiles] - Social media profiles
 * @returns {string} Social verification markup
 */
const generateSocialVerificationMarkup = (profiles) => {
  if (!profiles) return "";

  const { github, twitter, linkedin, website } = profiles;
  let markup = "";

  if (github) {
    markup += html`<link rel="me" href="${github}" />`;
  }

  if (twitter) {
    markup += html`<link rel="me" href="${twitter}" />`;
  }

  if (linkedin) {
    markup += html`<link rel="me" href="${linkedin}" />`;
  }

  if (website) {
    markup += html`<link rel="author" href="${website}" />`;
  }

  return markup;
};

/**
 * Generates rich profile markup (Tier 4).
 *
 * @param {AuthorConfig} config - Author configuration
 * @returns {string} Rich profile markup
 */
const generateRichProfileMarkup = (config) => {
  const { photo, bio, location, language, credentials } = config;

  // Only generate markup if there's rich profile data for structured data
  if (!photo && !bio && !location && !language && !credentials) return "";

  const baseSchema = createBasePersonSchema(config);
  const richSchema = enhancePersonSchema(baseSchema, config);

  return html`
    <script type="application/ld+json">
      ${JSON.stringify(richSchema, null, 2)}
    </script>
  `;
};

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
 * // Tier 4: Rich profile with structured data
 * author({
 *   name: 'Anonyfox',
 *   photo: '/images/authors/anonyfox.jpg',
 *   bio: 'Creator of RavenJS - zero-dependency toolkit',
 *   location: 'Berlin, Germany',
 *   credentials: ['Google Developer Expert']
 * });
 * // → Complete markup with enhanced Person schema including images, bio, location, and credentials
 */
/**
 * Generates progressive author markup with SEO optimization tiers.
 *
 * @param {AuthorConfig} config - Progressive author configuration
 * @returns {string} Generated author HTML markup
 */
export const author = (config) => {
  if (!config || typeof config !== "object") return "";
  const { name } = config;
  if (!name || typeof name !== "string") return "";

  // Clean orchestration through pure functions
  let markup = generateBasicMeta(config);
  markup += generatePersonSchemaMarkup(config);
  markup += generateSocialVerificationMarkup(config.profiles);
  markup += generateRichProfileMarkup(config);

  return markup;
};
