/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Blog posts collection - Dataset container with O(1) lookups
 */

import { Dataset } from "@raven-js/cortex/structures";

/**
 * @typedef {Object} Package
 * @property {string} slug - Package slug
 * @property {string} title - Package title
 * @property {string} description - Package description
 * @property {string} npmName - Package npm name
 * @property {string} type - Package type
 * @property {string} status - Package status
 * @property {string} logoUrl - Package logo URL
 */

/**
 * Packages data collection with O(1) slug-based lookups
 * @type {Dataset<Package>}
 */
export const packages = new Dataset(
  [
    {
      slug: "beak",
      title: "RavenJS Beak: JSX-style templating",
      description:
        "A raven's beak speaks every language fluently. Precompiled templates deliver V8-optimized performance while eliminating the build coordination circus.",
      npmName: "@raven-js/beak",
      type: "library",
      status: "production",
      logoUrl: "/raven-logo-beak.webp",
    },
    {
      slug: "wings",
      title: "RavenJS Wings: Isomorphic routing",
      description:
        "Flight control for your entire backend. Routing, clustering, SSL, CLI ops - everything you need, zero dependencies.",
      npmName: "@raven-js/wings",
      type: "library",
      status: "production",
      logoUrl: "/raven-logo-wings.webp",
    },
    {
      slug: "reflex",
      title: "RavenJS Reflex: Signals-based reactivity",
      description:
        "Swift signal reflexes with component-scoped precision. Glitch-free reactivity eliminates global state coordination dance. Fetch just works, even in effects during SSR.",
      npmName: "@raven-js/reflex",
      type: "library",
      status: "production",
      logoUrl: "/raven-logo-reflex.webp",
    },
    {
      slug: "cortex",
      title: "RavenJS Cortex: Data Engineering and AI in pure JS",
      description:
        "Raven-grade intelligence for data processing. Harness the murder's browsers while others rent GPUs. Everything from neural nets to holiday calculations.",
      npmName: "@raven-js/cortex",
      status: "development",
      logoUrl: "/raven-logo-cortex.webp",
      type: "library",
    },
    {
      slug: "talons",
      title: "RavenJS Talons: Data interaction patterns",
      description:
        "Surgical grip on data sources. The coming data interaction library for databases, APIs, and data manipulation without dependencies.",
      npmName: "@raven-js/talons",
      status: "development",
      logoUrl: "/raven-logo-talons.webp",
      type: "library",
    },
    {
      slug: "eye",
      title: "RavenJS Eye: Reconnaissance intelligence",
      description:
        "A raven's keen vision for digital reconnaissance. Comprehensive security assessment, vulnerability discovery, and intelligence gathering without dependencies.",
      npmName: "@raven-js/eye",
      status: "development",
      logoUrl: "/raven-logo-eye.webp",
      type: "library",
    },
    {
      slug: "hatch",
      title: "RavenJS Hatch: Bootstrap new apps",
      description:
        "Intelligent nest building for new projects. Smart bootstrapping with guided tutorials and ecosystem recommendations. Zero dependencies, maximum guidance.",
      npmName: "@raven-js/hatch",
      type: "tool",
      status: "development",
      logoUrl: "/raven-logo-hatch.webp",
    },
    {
      slug: "fledge",
      title: "RavenJS Fledge: Build & bundle",
      description:
        "From nestling to flight-ready. Complete build system: static sites, optimized bundles, and standalone binaries. Config-as-code with surgical precision.",
      npmName: "@raven-js/fledge",
      status: "production",
      logoUrl: "/raven-logo-fledge.webp",
      type: "tool",
    },
    {
      slug: "soar",
      title: "RavenJS Soar: Deploy anywhere",
      description:
        "Soar across any deployment target. Universal deployment for static sites, scripts, and binaries - Cloudflare Workers to VPS. Zero dependencies, maximum reach.",
      npmName: "@raven-js/soar",
      status: "development",
      logoUrl: "/raven-logo-soar.webp",
      type: "tool",
    },
    {
      slug: "glean",
      title: "RavenJS Glean: JSDoc tools & MCP",
      description:
        "Glean documentation gold from scattered JSDoc. Complete workflow: parse, validate, generate beautiful sites. Zero dependencies, maximum extraction.",
      npmName: "@raven-js/glean",
      status: "production",
      logoUrl: "/raven-logo-glean.webp",
      type: "tool",
    },
  ],
  {
    keyFn: (pkg) => pkg.slug,
    urlFn: (pkg) => `/packages/${pkg.slug}`,
  }
);

/**
 * Find package by slug (O(1) lookup)
 * @param {string} slug - Package slug
 * @returns {Package|undefined} Package or undefined if not found
 */
export const findPackage = (slug) => {
  return packages.get(slug);
};

/**
 * Get all package URLs for static generation
 * @returns {string[]} Array of package URLs
 */
export const getPackageUrls = () => {
  return packages.urls();
};
