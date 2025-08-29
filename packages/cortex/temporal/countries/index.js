/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Country-specific holiday definitions for tree-shakable imports.
 *
 * This module provides clean re-exports of all supported country holiday definitions,
 * enabling users to import only the countries they need for optimal bundle size.
 * Each country follows ISO 3166-1 alpha-2 country codes for consistency.
 *
 * @example
 * // Import only German holidays (tree-shakable)
 * import { DE } from '@raven-js/cortex/temporal/countries/DE';
 *
 * @example
 * // Import multiple countries
 * import { DE, US, FR } from '@raven-js/cortex/temporal/countries';
 *
 * @example
 * // Use with calculation function
 * import { calculateHolidaysOfYear } from '@raven-js/cortex/temporal';
 * import { DE } from '@raven-js/cortex/temporal/countries/DE';
 *
 * const holidays = calculateHolidaysOfYear(DE, {
 *   year: 2024,
 *   region: 'BY'
 * });
 */

export { DE } from "./DE.js";

// Future country exports will be added here:
// export { US } from "./US.js";
// export { FR } from "./FR.js";
// export { GB } from "./GB.js";
// export { IT } from "./IT.js";
// export { ES } from "./ES.js";
// export { AT } from "./AT.js";
// export { CH } from "./CH.js";
// export { NL } from "./NL.js";
// export { BE } from "./BE.js";
// export { CA } from "./CA.js";
// export { AU } from "./AU.js";
// export { JP } from "./JP.js";
