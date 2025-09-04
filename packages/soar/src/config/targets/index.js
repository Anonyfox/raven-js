/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Deployment targets module exports.
 *
 * Exports only the concrete product classes and their config types.
 * Provider-level classes (Cloudflare, DigitalOcean) are internal abstractions.
 */

export { CloudflarePages } from "./cloudflare-pages.js";
export { selectTarget } from "./select.js";

// TODO: Export other concrete product classes as they're implemented
// export { CloudflareWorkers } from "./cloudflare-workers.js";
// export { DigitalOceanDroplet } from "./digitalocean-droplet.js";
// export { DigitalOceanFunctions } from "./digitalocean-functions.js";

/**
 * @typedef {import('./cloudflare-pages.js').CloudflarePagesConfig} CloudflarePagesConfig
 */
