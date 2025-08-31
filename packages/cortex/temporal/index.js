/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Temporal computation functions for holiday calculations and date manipulation.
 *
 * Exports Easter calculation, holiday computation for 30+ countries, and date classes.
 * Handles fixed dates, Easter-relative holidays, and government-specific regional variations.
 */

export { calculateEasterSunday } from "./calculate-easter-sunday.js";
export { calculateHolidaysOfYear } from "./calculate-holidays-of-year.js";
export { Holiday } from "./holiday.js";
// Export classes for advanced usage (still internal to temporal module)
export { HolidayDefinition } from "./holiday-definition.js";
export { NaiveDateTime } from "./naive-date-time.js";
