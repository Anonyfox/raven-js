import { processSQLTemplate } from "./template-processor.js";

/**
 * The main template tag function for creating SQL queries with automatic string sanitization.
 *
 * This function provides a safe and convenient way to build SQL queries using template literals.
 * All dynamic values are automatically sanitized to escape dangerous characters and control bytes,
 * while static parts of the query remain unchanged. The function also handles whitespace normalization.
 *
 * **Key Features:**
 * - 🛡️ **String Sanitization**: Escapes dangerous characters and control bytes
 * - 🚀 **High Performance**: Optimized for common use cases
 * - 📝 **Developer Friendly**: Uses familiar template literal syntax
 * - 🧹 **Whitespace Handling**: Automatically trims leading/trailing whitespace
 * - 🔧 **Type Flexibility**: Accepts any value type (converted to string)
 *
 * **Security Note:** This function sanitizes strings by escaping dangerous characters, but it does
 * not prevent logical SQL injection or validate input. Always validate and sanitize user input
 * before using it in queries. This is primarily for escaping accidental dangerous bytes and
 * characters, not for comprehensive SQL injection prevention.
 *
 * @param {TemplateStringsArray} strings - The static parts of the SQL template
 * @param {...*} values - The dynamic values to be interpolated and sanitized
 * @returns {string} The rendered SQL query as a string
 *
 * @example
 * // Basic usage with simple values
 * import { sql } from '@raven-js/beak';
 *
 * const userId = 42;
 * const query = sql`SELECT * FROM users WHERE id = ${userId}`;
 * // Result: "SELECT * FROM users WHERE id = 42"
 *
 * @example
 * // User input with automatic string sanitization
 * const userInput = "O'Connor"; // Note the apostrophe
 * const query = sql`SELECT * FROM users WHERE name = '${userInput}'`;
 * // Result: "SELECT * FROM users WHERE name = 'O''Connor'"
 * // The apostrophe is escaped to prevent string literal breakouts
 *
 * @example
 * // Complex query with multiple values
 * const table = 'orders';
 * const status = 'pending';
 * const limit = 10;
 * const query = sql`
 *   SELECT * FROM ${table}
 *   WHERE status = '${status}'
 *   ORDER BY created_at DESC
 *   LIMIT ${limit}
 * `;
 * // Result: "SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10"
 *
 * @example
 * // Dynamic table and column names
 * const tableName = 'user_profiles';
 * const columnName = 'email';
 * const searchValue = 'john@example.com';
 * const query = sql`SELECT * FROM ${tableName} WHERE ${columnName} = '${searchValue}'`;
 * // Result: "SELECT * FROM user_profiles WHERE email = 'john@example.com'"
 *
 * @example
 * // Building WHERE clauses dynamically
 * const conditions = [];
 * const params = {};
 *
 * if (searchName) {
 *   conditions.push(sql`name LIKE '%${searchName}%'`);
 * }
 * if (minAge) {
 *   conditions.push(sql`age >= ${minAge}`);
 * }
 *
 * const whereClause = conditions.length > 0 ? sql`WHERE ${conditions.join(' AND ')}` : '';
 * const query = sql`SELECT * FROM users ${whereClause}`;
 *
 * @example
 * // Handling different data types
 * const id = 123;                    // number
 * const name = "John Doe";           // string
 * const isActive = true;             // boolean
 * const lastLogin = null;            // null
 * const tags = ['admin', 'user'];    // array (converted to string)
 *
 * const query = sql`
 *   INSERT INTO users (id, name, is_active, last_login, tags)
 *   VALUES (${id}, '${name}', ${isActive}, ${lastLogin}, '${tags}')
 * `;
 * // Result: "INSERT INTO users (id, name, is_active, last_login, tags) VALUES (123, 'John Doe', true, null, 'admin,user')"
 *
 * @example
 * // Pagination queries
 * const page = 2;
 * const pageSize = 20;
 * const offset = (page - 1) * pageSize;
 *
 * const query = sql`
 *   SELECT * FROM posts
 *   WHERE published = true
 *   ORDER BY created_at DESC
 *   LIMIT ${pageSize} OFFSET ${offset}
 * `;
 * // Result: "SELECT * FROM posts WHERE published = true ORDER BY created BY created_at DESC LIMIT 20 OFFSET 20"
 *
 * @example
 * // JOIN queries with dynamic conditions
 * const userRole = 'admin';
 * const department = 'engineering';
 *
 * const query = sql`
 *   SELECT u.name, u.email, d.name as dept_name
 *   FROM users u
 *   JOIN departments d ON u.dept_id = d.id
 *   WHERE u.role = '${userRole}' AND d.name = '${department}'
 * `;
 * // Result: "SELECT u.name, u.email, d.name as dept_name FROM users u JOIN departments d ON u.dept_id = d.id WHERE u.role = 'admin' AND d.name = 'engineering'"
 *
 * @example
 * // UPDATE queries with dynamic fields
 * const userId = 456;
 * const updates = {
 *   name: 'Jane Smith',
 *   email: 'jane@example.com',
 *   last_updated: new Date().toISOString()
 * };
 *
 * const setClause = Object.entries(updates)
 *   .map(([key, value]) => sql`${key} = '${value}'`)
 *   .join(', ');
 *
 * const query = sql`UPDATE users SET ${setClause} WHERE id = ${userId}`;
 * // Result: "UPDATE users SET name = 'Jane Smith', email = 'jane@example.com', last_updated = '2024-01-15T10:30:00.000Z' WHERE id = 456"
 *
 * @example
 * // DELETE queries with conditions
 * const tableName = 'temp_data';
 * const olderThan = '2024-01-01';
 *
 * const query = sql`DELETE FROM ${tableName} WHERE created_at < '${olderThan}'`;
 * // Result: "DELETE FROM temp_data WHERE created_at < '2024-01-01'"
 */
export const sql = processSQLTemplate;
