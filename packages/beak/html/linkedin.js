/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive LinkedIn integration generator with advanced professional SEO optimization tiers.
 *
 * Generates comprehensive LinkedIn meta tags that scale from basic professional sharing
 * to enterprise-level career development and networking optimization. Each tier unlocks
 * increasingly sophisticated professional networking and content features.
 */

import { escapeHtml, html } from "./index.js";
import { normalizeUrl } from "./url.js";

/**
 * @typedef {Object} LinkedInConfig
 * @property {string} title - Page title for LinkedIn preview
 * @property {string} description - Page description for LinkedIn preview
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [path] - Path for URL construction
 * @property {string} [url] - Pre-constructed canonical URL
 * @property {string} [image] - Primary image URL for LinkedIn preview
 * @property {string} [owner] - LinkedIn profile URL of content owner
 * @property {string} [company] - LinkedIn company page URL
 * @property {string} [contentType] - Type of professional content (article, job, course, event)
 * @property {Object} [jobDetails] - Job posting specific details
 * @property {string} [jobDetails.type] - Job type (full-time, part-time, contract)
 * @property {string} [jobDetails.location] - Job location
 * @property {string} [jobDetails.salary] - Salary range
 * @property {string[]} [jobDetails.skills] - Required skills
 * @property {string} [jobDetails.experience] - Experience level required
 * @property {Object} [courseDetails] - Course/certification specific details
 * @property {string} [courseDetails.duration] - Course duration
 * @property {string[]} [courseDetails.prerequisites] - Prerequisites
 * @property {string[]} [courseDetails.outcomes] - Learning outcomes
 * @property {string} [courseDetails.provider] - Course provider
 * @property {Object} [eventDetails] - Event specific details
 * @property {string} [eventDetails.date] - Event date
 * @property {string} [eventDetails.location] - Event location
 * @property {string[]} [eventDetails.speakers] - Event speakers
 * @property {string} [eventDetails.type] - Event type (conference, webinar, workshop)
 * @property {Object} [company] - Company information for enterprise content
 * @property {string} [company.id] - LinkedIn company page URL
 * @property {string} [company.name] - Company name
 * @property {string} [company.industry] - Company industry
 * @property {string} [company.size] - Company size range
 * @property {string} [company.location] - Company headquarters location
 * @property {string[]} [company.culture] - Company culture keywords
 * @property {Object} [team] - Team member information
 * @property {string[]} [team.members] - LinkedIn URLs of team members
 * @property {string[]} [team.departments] - Company departments
 * @property {Object} [networking] - Professional networking features
 * @property {string[]} [networking.connections] - Key professional connections
 * @property {string[]} [networking.groups] - LinkedIn groups
 * @property {string[]} [networking.hashtags] - Relevant hashtags
 * @property {Object} [analytics] - Professional analytics integration
 * @property {string} [analytics.trackingId] - LinkedIn analytics tracking ID
 * @property {string[]} [analytics.conversionGoals] - Conversion goals to track
 * @property {Object} [syndication] - Content syndication information
 * @property {string} [syndication.originalSource] - Original LinkedIn source
 * @property {string[]} [syndication.partners] - Syndication partner URLs
 * @property {Object} [localization] - Multi-language professional content
 */

/**
 * Detects content type from URL patterns and content.
 *
 * @param {string} url - URL to analyze
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @returns {string} Detected content type
 */
const detectContentType = (url, title, description) => {
  const titleLower = title ? title.toLowerCase() : "";
  const descLower = description ? description.toLowerCase() : "";
  const urlLower = url ? url.toLowerCase() : "";

  // Job-related patterns (highest priority)
  if (
    urlLower.includes("/job") ||
    urlLower.includes("/career") ||
    urlLower.includes("/jobs") ||
    urlLower.includes("/hiring") ||
    titleLower.includes("hiring") ||
    titleLower.includes("job") ||
    titleLower.includes("position") ||
    titleLower.includes("opening") ||
    descLower.includes("apply now") ||
    descLower.includes("join our team") ||
    descLower.includes("we're hiring")
  ) {
    return "job";
  }

  // Course/certification patterns
  if (
    urlLower.includes("/course") ||
    urlLower.includes("/certification") ||
    urlLower.includes("/training") ||
    urlLower.includes("/learn") ||
    titleLower.includes("course") ||
    titleLower.includes("certification") ||
    titleLower.includes("training") ||
    titleLower.includes("learn") ||
    titleLower.includes("master") ||
    titleLower.includes("certification") ||
    descLower.includes("learn") ||
    descLower.includes("training") ||
    descLower.includes("become") ||
    descLower.includes("expert")
  ) {
    return "course";
  }

  // Event patterns
  if (
    urlLower.includes("/event") ||
    urlLower.includes("/webinar") ||
    urlLower.includes("/conference") ||
    titleLower.includes("event") ||
    titleLower.includes("conference") ||
    titleLower.includes("webinar") ||
    titleLower.includes("summit") ||
    titleLower.includes("workshop") ||
    descLower.includes("register") ||
    descLower.includes("attend") ||
    descLower.includes("join us") ||
    descLower.includes("free event")
  ) {
    return "event";
  }

  // Company/corporate patterns
  if (
    urlLower.includes("/company") ||
    urlLower.includes("/about") ||
    urlLower.includes("/careers") ||
    urlLower.includes("/team") ||
    titleLower.includes("about us") ||
    titleLower.includes("about our") ||
    titleLower.includes("our team") ||
    titleLower.includes("meet the team") ||
    titleLower.includes("company") ||
    descLower.includes("our mission") ||
    descLower.includes("our values")
  ) {
    return "company";
  }

  return "article"; // Default
};

/**
 * Generates progressive LinkedIn integration markup with advanced professional SEO optimization tiers.
 *
 * **Tier 1 (Smart LinkedIn):** Intelligent content type detection and professional optimization
 * **Tier 2 (Professional Content):** Content type specific optimization (jobs, courses, events)
 * **Tier 3 (Enterprise Integration):** Company and team member integration
 * **Tier 4 (Advanced Professional SEO):** Networking, analytics, and syndication features
 *
 * Each configuration option unlocks additional LinkedIn-specific markup without redundancy.
 * Missing options generate no corresponding markup, ensuring clean output.
 *
 * @param {LinkedInConfig} config - Progressive LinkedIn configuration
 * @returns {string} Generated LinkedIn HTML markup
 *
 * @example
 * // Tier 1: Smart LinkedIn with content type detection
 * linkedin({
 *   domain: 'example.com',
 *   path: '/article',
 *   title: 'Industry Analysis 2024',
 *   description: 'Comprehensive market research and insights'
 * });
 * // → Auto-detects content type + optimized LinkedIn tags
 *
 * @example
 * // Tier 2: Job posting optimization
 * linkedin({
 *   domain: 'example.com',
 *   path: '/jobs/senior-developer',
 *   title: 'Senior Developer Position',
 *   description: 'Join our innovative team',
 *   contentType: 'job',
 *   jobDetails: {
 *     type: 'full-time',
 *     location: 'Remote',
 *     salary: '$120k-150k',
 *     skills: ['React', 'Node.js'],
 *     experience: '5+ years'
 *   }
 * });
 * // → Job-specific LinkedIn optimization + professional tags
 *
 * @example
 * // Tier 3: Enterprise company integration
 * linkedin({
 *   domain: 'example.com',
 *   path: '/careers',
 *   title: 'Join Our Growing Team',
 *   company: {
 *     id: 'linkedin.com/company/techcorp',
 *     name: 'TechCorp',
 *     industry: 'Technology',
 *     size: '500-1000 employees',
 *     culture: ['Innovation', 'Diversity']
 *   },
 *   team: {
 *     members: ['linkedin.com/in/ceo'],
 *     departments: ['Engineering', 'Product']
 *   }
 * });
 * // → Complete company integration + team member profiles
 *
 * @example
 * // Tier 4: Advanced professional networking
 * linkedin({
 *   domain: 'example.com',
 *   path: '/professional-development',
 *   title: 'Career Advancement Guide',
 *   networking: {
 *     connections: ['linkedin.com/in/mentor'],
 *     groups: ['Tech Leaders'],
 *     hashtags: ['#CareerGrowth']
 *   },
 *   analytics: {
 *     trackingId: 'linkedin_analytics_001',
 *     conversionGoals: ['Profile Views']
 *   },
 *   syndication: {
 *     originalSource: 'linkedin.com/company/techcorp',
 *     partners: ['medium.com/@techcorp']
 *   }
 * });
 * // → Professional networking + analytics + syndication tracking
 */
/**
 * @param {LinkedInConfig} config - Progressive LinkedIn configuration
 * @returns {string} Generated LinkedIn HTML markup
 */
export const linkedin = (/** @type {LinkedInConfig} */ config) => {
  if (!config || typeof config !== "object") return "";
  const {
    domain,
    path,
    url,
    title,
    description,
    image,
    owner,
    company,
    contentType,
    jobDetails,
    courseDetails,
    eventDetails,
    team,
    networking,
    analytics,
    syndication,
    localization,
  } = /** @type {any} */ (config);

  if (!title || !description) return "";

  // Escape HTML entities in title and description
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  // Determine canonical URL with LinkedIn optimization
  let canonicalUrl;
  if (url) {
    canonicalUrl = normalizeUrl(url, domain || "example.com");
  } else if (domain && path !== undefined && path !== "") {
    canonicalUrl = normalizeUrl(path, domain);
  }

  // Auto-detect content type if not provided
  const detectedContentType = contentType || detectContentType(canonicalUrl, title, description);

  // Tier 1: Smart LinkedIn tags (always present)
  let markup = html`
		<meta name="linkedin:title" property="linkedin:title" content="${escapedTitle}" />
		<meta name="linkedin:description" property="linkedin:description" content="${escapedDescription}" />
		<meta name="linkedin:content-type" property="linkedin:content-type" content="${detectedContentType}" />
	`;

  // Add URL if available
  if (canonicalUrl) {
    markup += html`
			<meta name="linkedin:url" property="linkedin:url" content="${canonicalUrl}" />
		`;
  }

  // Add image if provided
  if (image) {
    const imageUrl = domain ? normalizeUrl(image, domain) : image;
    markup += html`
			<meta name="linkedin:image" property="linkedin:image" content="${imageUrl}" />
		`;
  }

  // Add owner if provided
  if (owner) {
    markup += html`
			<meta name="linkedin:owner" property="linkedin:owner" content="${owner}" />
		`;
  }

  // Handle company (can be string or object)
  if (company) {
    if (typeof company === "string") {
      markup += html`
				<meta name="linkedin:company" property="linkedin:company" content="${company}" />
			`;
    } else if (typeof company === "object") {
      const { id, name: companyName, industry, size, location, culture } = company;

      if (id) {
        markup += html`
					<meta name="linkedin:company:id" property="linkedin:company:id" content="${id}" />
				`;
      }

      if (companyName) {
        markup += html`
					<meta name="linkedin:company:name" property="linkedin:company:name" content="${companyName}" />
				`;
      }

      if (industry) {
        markup += html`
					<meta name="linkedin:company:industry" property="linkedin:company:industry" content="${industry}" />
				`;
      }

      if (size) {
        markup += html`
					<meta name="linkedin:company:size" property="linkedin:company:size" content="${size}" />
				`;
      }

      if (location) {
        markup += html`
					<meta name="linkedin:company:location" property="linkedin:company:location" content="${location}" />
				`;
      }

      if (culture && culture.length > 0) {
        for (const value of culture) {
          markup += html`
						<meta name="linkedin:company:culture" property="linkedin:company:culture" content="${value}" />
					`;
        }
      }
    }
  }

  // Tier 2: Professional content type optimization
  if (detectedContentType === "job" && jobDetails) {
    const { type, location, salary, skills, experience } = jobDetails;

    if (type) {
      markup += html`
				<meta name="linkedin:job:type" property="linkedin:job:type" content="${type}" />
			`;
    }

    if (location) {
      markup += html`
				<meta name="linkedin:job:location" property="linkedin:job:location" content="${location}" />
			`;
    }

    if (salary) {
      markup += html`
				<meta name="linkedin:job:salary" property="linkedin:job:salary" content="${salary}" />
			`;
    }

    if (experience) {
      markup += html`
				<meta name="linkedin:job:experience" property="linkedin:job:experience" content="${experience}" />
			`;
    }

    if (skills && skills.length > 0) {
      for (const skill of skills) {
        markup += html`
					<meta name="linkedin:job:skill" property="linkedin:job:skill" content="${skill}" />
				`;
      }
    }
  }

  if (detectedContentType === "course" && courseDetails) {
    const { duration, prerequisites, outcomes, provider } = courseDetails;

    if (duration) {
      markup += html`
				<meta name="linkedin:course:duration" property="linkedin:course:duration" content="${duration}" />
			`;
    }

    if (provider) {
      markup += html`
				<meta name="linkedin:course:provider" property="linkedin:course:provider" content="${provider}" />
			`;
    }

    if (prerequisites && prerequisites.length > 0) {
      for (const prereq of prerequisites) {
        markup += html`
					<meta name="linkedin:course:prerequisite" property="linkedin:course:prerequisite" content="${prereq}" />
				`;
      }
    }

    if (outcomes && outcomes.length > 0) {
      for (const outcome of outcomes) {
        markup += html`
					<meta name="linkedin:course:outcome" property="linkedin:course:outcome" content="${outcome}" />
				`;
      }
    }
  }

  if (detectedContentType === "event" && eventDetails) {
    const { date, location, speakers, type } = eventDetails;

    if (date) {
      markup += html`
				<meta name="linkedin:event:date" property="linkedin:event:date" content="${date}" />
			`;
    }

    if (location) {
      markup += html`
				<meta name="linkedin:event:location" property="linkedin:event:location" content="${location}" />
			`;
    }

    if (type) {
      markup += html`
				<meta name="linkedin:event:type" property="linkedin:event:type" content="${type}" />
			`;
    }

    if (speakers && speakers.length > 0) {
      for (const speaker of speakers) {
        markup += html`
					<meta name="linkedin:event:speaker" property="linkedin:event:speaker" content="${speaker}" />
				`;
      }
    }
  }

  // Tier 3: Enterprise integration
  if (team) {
    const { members, departments } = team;

    if (members && members.length > 0) {
      for (const member of members) {
        markup += html`
					<meta name="linkedin:team:member" property="linkedin:team:member" content="${member}" />
				`;
      }
    }

    if (departments && departments.length > 0) {
      for (const department of departments) {
        markup += html`
					<meta name="linkedin:team:department" property="linkedin:team:department" content="${department}" />
				`;
      }
    }
  }

  // Tier 4: Advanced professional SEO
  if (networking) {
    const { connections, groups, hashtags } = networking;

    if (connections && connections.length > 0) {
      for (const connection of connections) {
        markup += html`
					<meta name="linkedin:network:connection" property="linkedin:network:connection" content="${connection}" />
				`;
      }
    }

    if (groups && groups.length > 0) {
      for (const group of groups) {
        markup += html`
					<meta name="linkedin:network:group" property="linkedin:network:group" content="${group}" />
				`;
      }
    }

    if (hashtags && hashtags.length > 0) {
      for (const hashtag of hashtags) {
        markup += html`
					<meta name="linkedin:network:hashtag" property="linkedin:network:hashtag" content="${hashtag}" />
				`;
      }
    }
  }

  if (analytics) {
    const { trackingId, conversionGoals } = analytics;

    if (trackingId) {
      markup += html`
				<meta name="linkedin:analytics:tracking" property="linkedin:analytics:tracking" content="${trackingId}" />
			`;
    }

    if (conversionGoals && conversionGoals.length > 0) {
      for (const goal of conversionGoals) {
        markup += html`
					<meta name="linkedin:analytics:goal" property="linkedin:analytics:goal" content="${goal}" />
				`;
      }
    }
  }

  if (syndication) {
    const { originalSource, partners } = syndication;

    if (originalSource) {
      markup += html`
				<meta name="linkedin:syndication:source" property="linkedin:syndication:source" content="${originalSource}" />
			`;
    }

    if (partners && partners.length > 0) {
      for (const partner of partners) {
        markup += html`
					<meta name="linkedin:syndication:partner" property="linkedin:syndication:partner" content="${partner}" />
				`;
      }
    }
  }

  if (localization && Object.keys(localization).length > 0) {
    for (const [lang, localizedText] of Object.entries(localization)) {
      markup += html`
				<meta name="linkedin:locale:${lang}" property="linkedin:locale:${lang}" content="${localizedText}" />
			`;
    }
  }

  return markup;
};
