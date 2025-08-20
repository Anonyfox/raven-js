/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Type definitions for validation module - data structure contracts.
 *
 * Pure type definitions with zero dependencies, establishing contracts
 * for all validation data structures used across the module ecosystem.
 */

/**
 * @typedef {Object} CodeEntity
 * @property {string} type - Entity type (function, class, variable)
 * @property {string} name - Entity name
 * @property {number} line - Line number where entity is defined
 * @property {boolean} exported - Whether entity is exported
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} type - Issue type identifier
 * @property {string} message - Human-readable issue description
 * @property {number} line - Line number where issue occurs
 * @property {string} severity - Issue severity (error, warning, info)
 * @property {string} entity - Entity name associated with issue
 */

/**
 * @typedef {Object} JSDocComment
 * @property {string} description - Main description text
 * @property {any} tags - JSDoc tags and their content
 * @property {number} startLine - Starting line number
 * @property {number} endLine - Ending line number
 */

/**
 * @typedef {Object} ValidationReport
 * @property {Object[]} files - Per-file analysis results
 * @property {Object} summary - Overall report summary
 */
