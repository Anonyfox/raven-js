/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { processSQLTemplate } from "./template-processor.js";

/**
 * SQL template literal with automatic escaping and performance optimization.
 *
 * Template tag that builds SQL queries by interpolating values with automatic
 * character escaping. Implements tiered performance optimizations based on
 * interpolation count (0, 1, 2-3, 4+ values).
 *
 * **Security Boundary**: Escapes string literal breakouts and binary injection.
 * Does NOT prevent logical injection patterns. Use parameterized queries for
 * complete protection.
 *
 * **Performance**: Four optimization tiers scale from simple concatenation to
 * pre-sized array joins. Conditional whitespace trimming avoids unnecessary work.
 *
 * @type {typeof import("./template-processor.js").processSQLTemplate}
 *
 * @example
 * // String literal escaping
 * sql`SELECT * FROM users WHERE name = '${userInput}'`
 * // O'Connor → "SELECT * FROM users WHERE name = 'O''Connor'"
 *
 * @example
 * // Dynamic identifiers and values
 * sql`SELECT * FROM ${table} WHERE status = '${status}' LIMIT ${limit}`
 * // → "SELECT * FROM orders WHERE status = 'pending' LIMIT 10"
 *
 * @example
 * // Composed query building
 * const where = conditions.length ? sql`WHERE ${conditions.join(' AND ')}` : '';
 * sql`SELECT * FROM users ${where} ORDER BY created_at`
 *
 * @example
 * // Advanced composition patterns
 * const buildInsert = (table, data) => {
 *   const keys = Object.keys(data).join(', ');
 *   const values = Object.values(data).map(v => `'${v}'`).join(', ');
 *   return sql`INSERT INTO ${table} (${keys}) VALUES (${values})`;
 * };
 *
 * @example
 * // Performance consideration: batch operations
 * const queries = items.map(item => sql`INSERT INTO logs VALUES (${item.id}, '${item.msg}')`);
 * // Each sql`` call optimizes independently - consider direct string building for massive batches
 */
export const sql = processSQLTemplate;
