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

export { AT } from "./AT.js";
// Oceania
export { AU } from "./AU.js";
export { BE } from "./BE.js";
// North America
export { CA } from "./CA.js";
export { CH } from "./CH.js";
// Asian Countries
export { CN } from "./CN.js";
export { CZ } from "./CZ.js";
// Central Europe
export { DE } from "./DE.js";
// Nordic Countries
export { DK } from "./DK.js";
// Southern Europe
export { ES } from "./ES.js";
export { FI } from "./FI.js";
// Western Europe
export { FR } from "./FR.js";
// British Isles
export { GB } from "./GB.js";
export { ID } from "./ID.js";
export { IE } from "./IE.js";
export { IN } from "./IN.js";
export { IT } from "./IT.js";
export { JP } from "./JP.js";
export { KR } from "./KR.js";
export { LU } from "./LU.js";
export { MX } from "./MX.js";
export { MY } from "./MY.js";
export { NL } from "./NL.js";
export { NO } from "./NO.js";
export { NZ } from "./NZ.js";
export { PH } from "./PH.js";
// Eastern Europe
export { PL } from "./PL.js";
export { PT } from "./PT.js";
export { SE } from "./SE.js";
export { SG } from "./SG.js";
export { TH } from "./TH.js";
export { US } from "./US.js";
export { VN } from "./VN.js";

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
