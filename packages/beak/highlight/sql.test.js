/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { highlightSQL } from "./sql.js";

describe("SQL Syntax Highlighter", () => {
	describe("Input Validation", () => {
		it("should throw TypeError for non-string input", () => {
			assert.throws(() => highlightSQL(null), TypeError);
			assert.throws(() => highlightSQL(undefined), TypeError);
			assert.throws(() => highlightSQL(123), TypeError);
			assert.throws(() => highlightSQL({}), TypeError);
		});

		it("should return empty string for empty input", () => {
			assert.strictEqual(highlightSQL(""), "");
			assert.strictEqual(highlightSQL("   "), "");
			assert.strictEqual(highlightSQL("\n\t"), "");
		});
	});

	describe("SQL Keywords", () => {
		it("should highlight basic DQL keywords", () => {
			const sql = "SELECT column FROM table WHERE condition";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-primary">SELECT</span>'));
			assert.ok(result.includes('<span class="text-primary">FROM</span>'));
			assert.ok(result.includes('<span class="text-primary">WHERE</span>'));
		});

		it("should highlight DML keywords", () => {
			const sql =
				"INSERT INTO users VALUES (1, 'John'); UPDATE users SET name = 'Jane'; DELETE FROM users";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-primary">INSERT</span>'));
			assert.ok(result.includes('<span class="text-primary">INTO</span>'));
			assert.ok(result.includes('<span class="text-primary">VALUES</span>'));
			assert.ok(result.includes('<span class="text-primary">UPDATE</span>'));
			assert.ok(result.includes('<span class="text-primary">SET</span>'));
			assert.ok(result.includes('<span class="text-primary">DELETE</span>'));
		});

		it("should highlight DDL keywords", () => {
			const sql = "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(50))";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-primary">CREATE</span>'));
			assert.ok(result.includes('<span class="text-primary">TABLE</span>'));
			assert.ok(result.includes('<span class="text-primary">PRIMARY</span>'));
			assert.ok(result.includes('<span class="text-primary">KEY</span>'));
		});

		it("should highlight JOIN keywords", () => {
			const sql =
				"SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-primary">INNER</span>'));
			assert.ok(result.includes('<span class="text-primary">JOIN</span>'));
			assert.ok(result.includes('<span class="text-primary">ON</span>'));
		});

		it("should highlight logical operators as keywords", () => {
			const sql =
				"WHERE active = TRUE AND deleted IS NOT NULL OR status IN ('active', 'pending')";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-primary">AND</span>'));
			assert.ok(result.includes('<span class="text-primary">OR</span>'));
			assert.ok(result.includes('<span class="text-primary">IS</span>'));
			assert.ok(result.includes('<span class="text-primary">NOT</span>'));
			assert.ok(result.includes('<span class="text-primary">IN</span>'));
			assert.ok(result.includes('<span class="text-primary">TRUE</span>'));
			assert.ok(result.includes('<span class="text-primary">NULL</span>'));
		});

		it("should be case-insensitive for keywords", () => {
			const sql = "select * from users where id = 1";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-primary">select</span>'));
			assert.ok(result.includes('<span class="text-primary">from</span>'));
			assert.ok(result.includes('<span class="text-primary">where</span>'));
		});
	});

	describe("SQL Functions", () => {
		it("should highlight aggregate functions", () => {
			const sql =
				"SELECT COUNT(*), SUM(price), AVG(rating), MAX(created_at), MIN(id) FROM products";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">COUNT</span>'));
			assert.ok(result.includes('<span class="text-info">SUM</span>'));
			assert.ok(result.includes('<span class="text-info">AVG</span>'));
			assert.ok(result.includes('<span class="text-info">MAX</span>'));
			assert.ok(result.includes('<span class="text-info">MIN</span>'));
		});

		it("should highlight string functions", () => {
			const sql =
				"SELECT UPPER(name), LOWER(email), CONCAT(first_name, ' ', last_name), LENGTH(description) FROM users";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">UPPER</span>'));
			assert.ok(result.includes('<span class="text-info">LOWER</span>'));
			assert.ok(result.includes('<span class="text-info">CONCAT</span>'));
			assert.ok(result.includes('<span class="text-info">LENGTH</span>'));
		});

		it("should highlight date/time functions", () => {
			const sql =
				"SELECT NOW(), CURRENT_DATE, YEAR(created_at), DATE_FORMAT(updated_at, '%Y-%m-%d') FROM logs";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">NOW</span>'));
			assert.ok(result.includes('<span class="text-info">CURRENT_DATE</span>'));
			assert.ok(result.includes('<span class="text-info">YEAR</span>'));
			assert.ok(result.includes('<span class="text-info">DATE_FORMAT</span>'));
		});

		it("should highlight window functions", () => {
			const sql =
				"SELECT ROW_NUMBER() OVER (ORDER BY id), RANK() OVER (PARTITION BY category ORDER BY price) FROM products";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">ROW_NUMBER</span>'));
			assert.ok(result.includes('<span class="text-info">RANK</span>'));
			assert.ok(result.includes('<span class="text-primary">OVER</span>'));
			assert.ok(result.includes('<span class="text-primary">PARTITION</span>'));
		});

		it("should highlight conditional functions", () => {
			const sql =
				"SELECT COALESCE(nickname, first_name, 'Unknown'), NULLIF(status, ''), CASE WHEN age >= 18 THEN 'Adult' ELSE 'Minor' END";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">COALESCE</span>'));
			assert.ok(result.includes('<span class="text-info">NULLIF</span>'));
			assert.ok(result.includes('<span class="text-primary">CASE</span>'));
			assert.ok(result.includes('<span class="text-primary">WHEN</span>'));
			assert.ok(result.includes('<span class="text-primary">THEN</span>'));
			assert.ok(result.includes('<span class="text-primary">ELSE</span>'));
			assert.ok(result.includes('<span class="text-primary">END</span>'));
		});
	});

	describe("Data Types", () => {
		it("should highlight common data types", () => {
			const sql =
				"CREATE TABLE users (id INT, name VARCHAR(100), email TEXT, created_at DATETIME, is_active BOOLEAN)";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">INT</span>'));
			assert.ok(result.includes('<span class="text-info">VARCHAR</span>'));
			assert.ok(result.includes('<span class="text-info">TEXT</span>'));
			assert.ok(result.includes('<span class="text-info">DATETIME</span>'));
			assert.ok(result.includes('<span class="text-info">BOOLEAN</span>'));
		});

		it("should highlight numeric data types", () => {
			const sql =
				"CREATE TABLE products (price DECIMAL(10,2), quantity BIGINT, rating FLOAT, weight DOUBLE)";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">DECIMAL</span>'));
			assert.ok(result.includes('<span class="text-info">BIGINT</span>'));
			assert.ok(result.includes('<span class="text-info">FLOAT</span>'));
			assert.ok(result.includes('<span class="text-info">DOUBLE</span>'));
		});

		it("should highlight date/time data types", () => {
			const sql =
				"CREATE TABLE events (start_date DATE, start_time TIME, created_at TIMESTAMP, duration INTERVAL)";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">DATE</span>'));
			assert.ok(result.includes('<span class="text-info">TIME</span>'));
			assert.ok(result.includes('<span class="text-info">TIMESTAMP</span>'));
			assert.ok(result.includes('<span class="text-info">INTERVAL</span>'));
		});

		it("should highlight binary and JSON data types", () => {
			const sql =
				"CREATE TABLE files (data BLOB, metadata JSON, thumbnail BINARY, config JSONB)";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-info">BLOB</span>'));
			assert.ok(result.includes('<span class="text-info">JSON</span>'));
			assert.ok(result.includes('<span class="text-info">BINARY</span>'));
			assert.ok(result.includes('<span class="text-info">JSONB</span>'));
		});
	});

	describe("String Literals", () => {
		it("should highlight single-quoted strings", () => {
			const sql = "SELECT * FROM users WHERE name = 'John Doe'";
			const result = highlightSQL(sql);
			assert.ok(
				result.includes('<span class="text-success">&#39;John Doe&#39;</span>'),
			);
		});

		it("should highlight double-quoted strings", () => {
			const sql = 'SELECT * FROM users WHERE name = "Jane Smith"';
			const result = highlightSQL(sql);
			assert.ok(
				result.includes(
					'<span class="text-success">&quot;Jane Smith&quot;</span>',
				),
			);
		});

		it("should handle escaped quotes in strings", () => {
			const sql = "SELECT * FROM users WHERE bio = 'He said ''Hello'' to me'";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-success">'));
			assert.ok(result.includes("Hello"));
		});

		it("should handle strings with backslash escapes", () => {
			const sql =
				"SELECT * FROM files WHERE path = 'C:\\\\Users\\\\John\\\\Documents'";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-success">'));
			assert.ok(result.includes("Users"));
		});

		it("should handle strings with special characters", () => {
			const sql =
				"INSERT INTO messages VALUES ('Hello\\nWorld\\t!', 'User@domain.com')";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-success">'));
		});
	});

	describe("Numeric Literals", () => {
		it("should highlight integer numbers", () => {
			const sql = "SELECT * FROM users WHERE age = 25 AND id IN (1, 2, 3, 100)";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-warning">25</span>'));
			assert.ok(result.includes('<span class="text-warning">1</span>'));
			assert.ok(result.includes('<span class="text-warning">100</span>'));
		});

		it("should highlight decimal numbers", () => {
			const sql =
				"SELECT * FROM products WHERE price = 19.99 AND discount = 0.15";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-warning">19.99</span>'));
			assert.ok(result.includes('<span class="text-warning">0.15</span>'));
		});

		it("should highlight scientific notation", () => {
			const sql =
				"SELECT * FROM measurements WHERE value = 1.23e-4 AND threshold > 5E+6";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-warning">1.23e-4</span>'));
			assert.ok(result.includes('<span class="text-warning">5E+6</span>'));
		});

		it("should handle numbers starting with decimal point", () => {
			const sql = "SELECT * FROM stats WHERE ratio = .75 AND percentage = .125";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-warning">.75</span>'));
			assert.ok(result.includes('<span class="text-warning">.125</span>'));
		});
	});

	describe("Comments", () => {
		it("should highlight single-line comments", () => {
			const sql = "SELECT * FROM users -- Get all users\nWHERE active = 1";
			const result = highlightSQL(sql);
			assert.ok(
				result.includes('<span class="text-muted">-- Get all users</span>'),
			);
		});

		it("should highlight multi-line comments", () => {
			const sql = `/* This is a
                multi-line comment
                with multiple lines */ SELECT * FROM users`;
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-muted">/*'));
			assert.ok(result.includes("multi-line comment"));
		});

		it("should not highlight SQL inside comments", () => {
			const sql =
				"/* SELECT * FROM users WHERE id = 1 */ SELECT name FROM products";
			const result = highlightSQL(sql);
			const commentSpan = result.match(
				/<span class="text-muted">[^<]*<\/span>/,
			);
			assert.ok(commentSpan);
			assert.ok(
				!commentSpan[0].includes('<span class="text-primary">SELECT</span>'),
			);
		});

		it("should handle comments at end of file", () => {
			const sql = "SELECT * FROM users; -- Final comment";
			const result = highlightSQL(sql);
			assert.ok(
				result.includes('<span class="text-muted">-- Final comment</span>'),
			);
		});
	});

	describe("Operators and Punctuation", () => {
		it("should highlight comparison operators", () => {
			const sql =
				"WHERE age >= 18 AND price <= 100 AND status <> 'inactive' AND id != 0";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-secondary">&gt;=</span>'));
			assert.ok(result.includes('<span class="text-secondary">&lt;=</span>'));
			assert.ok(
				result.includes('<span class="text-secondary">&lt;&gt;</span>'),
			);
			assert.ok(result.includes('<span class="text-secondary">!=</span>'));
		});

		it("should highlight arithmetic operators", () => {
			const sql = "SELECT price * quantity + tax - discount / 100 % 10";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-secondary">*</span>'));
			assert.ok(result.includes('<span class="text-secondary">+</span>'));
			assert.ok(result.includes('<span class="text-secondary">-</span>'));
			assert.ok(result.includes('<span class="text-secondary">/</span>'));
			assert.ok(result.includes('<span class="text-secondary">%</span>'));
		});

		it("should highlight assignment and compound operators", () => {
			const sql =
				"UPDATE products SET price += 10, quantity -= 5, discount *= 0.9";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-secondary">+=</span>'));
			assert.ok(result.includes('<span class="text-secondary">-=</span>'));
			assert.ok(result.includes('<span class="text-secondary">*=</span>'));
		});

		it("should highlight punctuation", () => {
			const sql =
				"SELECT id, name FROM users WHERE id IN (1, 2, 3); CREATE INDEX idx_name ON users (name);";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-secondary">,</span>'));
			assert.ok(result.includes('<span class="text-secondary">(</span>'));
			assert.ok(result.includes('<span class="text-secondary">)</span>'));
			assert.ok(result.includes('<span class="text-secondary">;</span>'));
		});

		it("should highlight specialized SQL operators", () => {
			const sql =
				"SELECT name FROM users WHERE email LIKE '%@gmail.com' AND tags && ARRAY['vip'] AND data->>'status' = 'active'";
			const result = highlightSQL(sql);
			assert.ok(
				result.includes('<span class="text-secondary">&gt;&gt;</span>'),
			);
		});
	});

	describe("Identifiers", () => {
		it("should highlight table and column names as identifiers", () => {
			const sql = "SELECT user_id, first_name, last_name FROM user_profiles";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-body">user_id</span>'));
			assert.ok(result.includes('<span class="text-body">first_name</span>'));
			assert.ok(result.includes('<span class="text-body">last_name</span>'));
			assert.ok(
				result.includes('<span class="text-body">user_profiles</span>'),
			);
		});

		it("should handle quoted identifiers", () => {
			const sql = 'SELECT "user name", `email address` FROM "user table"';
			const result = highlightSQL(sql);
			// Quoted identifiers are treated as strings in our simple implementation
			assert.ok(result.includes('<span class="text-success">'));
		});

		it("should handle identifiers with special characters", () => {
			const sql =
				"SELECT @variable, #temp_table, $parameter FROM my_table_2023";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-body">@variable</span>'));
			assert.ok(result.includes('<span class="text-body">#temp_table</span>'));
			assert.ok(result.includes('<span class="text-body">$parameter</span>'));
			assert.ok(
				result.includes('<span class="text-body">my_table_2023</span>'),
			);
		});
	});

	describe("Complex SQL Examples", () => {
		it("should handle complete SELECT statement with joins", () => {
			const sql = `
                SELECT u.id, u.name, COUNT(o.id) as order_count, SUM(o.total) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                WHERE u.active = TRUE AND u.created_at >= '2023-01-01'
                GROUP BY u.id, u.name
                HAVING COUNT(o.id) > 0
                ORDER BY total_spent DESC
                LIMIT 10
            `;
			const result = highlightSQL(sql);

			// Keywords
			assert.ok(result.includes('<span class="text-primary">SELECT</span>'));
			assert.ok(result.includes('<span class="text-primary">FROM</span>'));
			assert.ok(result.includes('<span class="text-primary">LEFT</span>'));
			assert.ok(result.includes('<span class="text-primary">JOIN</span>'));
			assert.ok(result.includes('<span class="text-primary">WHERE</span>'));
			assert.ok(result.includes('<span class="text-primary">GROUP</span>'));
			assert.ok(result.includes('<span class="text-primary">BY</span>'));
			assert.ok(result.includes('<span class="text-primary">HAVING</span>'));
			assert.ok(result.includes('<span class="text-primary">ORDER</span>'));
			assert.ok(result.includes('<span class="text-primary">LIMIT</span>'));

			// Functions
			assert.ok(result.includes('<span class="text-info">COUNT</span>'));
			assert.ok(result.includes('<span class="text-info">SUM</span>'));

			// Identifiers
			assert.ok(result.includes('<span class="text-body">users</span>'));
			assert.ok(result.includes('<span class="text-body">orders</span>'));
			assert.ok(result.includes('<span class="text-body">order_count</span>'));

			// Literals
			assert.ok(result.includes('<span class="text-primary">TRUE</span>'));
			assert.ok(
				result.includes(
					'<span class="text-success">&#39;2023-01-01&#39;</span>',
				),
			);
			assert.ok(result.includes('<span class="text-warning">10</span>'));
		});

		it("should handle CTE (Common Table Expression)", () => {
			const sql = `
                WITH monthly_sales AS (
                    SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as sales
                    FROM orders
                    WHERE created_at >= '2023-01-01'
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                )
                SELECT month, sales, LAG(sales) OVER (ORDER BY month) as prev_month_sales
                FROM monthly_sales
                ORDER BY month
            `;
			const result = highlightSQL(sql);

			assert.ok(result.includes('<span class="text-primary">WITH</span>'));
			assert.ok(
				result.includes('<span class="text-body">monthly_sales</span>'),
			);
			assert.ok(result.includes('<span class="text-primary">AS</span>'));
			assert.ok(result.includes('<span class="text-info">DATE_FORMAT</span>'));
			assert.ok(result.includes('<span class="text-info">LAG</span>'));
		});

		it("should handle INSERT with subquery", () => {
			const sql = `
                INSERT INTO user_stats (user_id, total_orders, avg_order_value)
                SELECT
                    u.id,
                    COUNT(o.id),
                    AVG(o.total)
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                GROUP BY u.id
            `;
			const result = highlightSQL(sql);

			assert.ok(result.includes('<span class="text-primary">INSERT</span>'));
			assert.ok(result.includes('<span class="text-primary">INTO</span>'));
			assert.ok(result.includes('<span class="text-body">user_stats</span>'));
			assert.ok(result.includes('<span class="text-info">AVG</span>'));
		});

		it("should handle CREATE TABLE with constraints", () => {
			const sql = `
                CREATE TABLE products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    price DECIMAL(10,2) CHECK (price > 0),
                    category_id INTEGER REFERENCES categories(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(name, category_id)
                )
            `;
			const result = highlightSQL(sql);

			assert.ok(result.includes('<span class="text-primary">CREATE</span>'));
			assert.ok(result.includes('<span class="text-primary">TABLE</span>'));
			assert.ok(result.includes('<span class="text-info">SERIAL</span>'));
			assert.ok(result.includes('<span class="text-primary">PRIMARY</span>'));
			assert.ok(result.includes('<span class="text-primary">KEY</span>'));
			assert.ok(result.includes('<span class="text-primary">NOT</span>'));
			assert.ok(result.includes('<span class="text-primary">NULL</span>'));
			assert.ok(result.includes('<span class="text-primary">CHECK</span>'));
			assert.ok(
				result.includes('<span class="text-primary">REFERENCES</span>'),
			);
			assert.ok(result.includes('<span class="text-primary">DEFAULT</span>'));
			assert.ok(result.includes('<span class="text-primary">UNIQUE</span>'));
		});

		it("should handle window functions with complex OVER clause", () => {
			const sql = `
                SELECT
                    name,
                    salary,
                    department,
                    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank,
                    PERCENT_RANK() OVER (ORDER BY salary) as salary_percentile,
                    LAG(salary, 1, 0) OVER (PARTITION BY department ORDER BY hire_date) as prev_salary
                FROM employees
            `;
			const result = highlightSQL(sql);

			assert.ok(result.includes('<span class="text-info">ROW_NUMBER</span>'));
			assert.ok(result.includes('<span class="text-info">PERCENT_RANK</span>'));
			assert.ok(result.includes('<span class="text-info">LAG</span>'));
			assert.ok(result.includes('<span class="text-primary">OVER</span>'));
			assert.ok(result.includes('<span class="text-primary">PARTITION</span>'));
		});
	});

	describe("Edge Cases", () => {
		it("should handle malformed SQL gracefully", () => {
			const sql = "SELECT FROM WHERE; CREATE TABLET";
			const result = highlightSQL(sql);
			assert.ok(typeof result === "string");
			assert.ok(result.length > 0);
		});

		it("should preserve whitespace", () => {
			const sql = "  SELECT   *   FROM   users  ";
			const result = highlightSQL(sql);
			// Should maintain spacing structure
			assert.ok(result.startsWith("  "));
			assert.ok(result.endsWith("  "));
		});

		it("should handle mixed case keywords", () => {
			const sql = "Select * From Users Where Id = 1";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-primary">Select</span>'));
			assert.ok(result.includes('<span class="text-primary">From</span>'));
			assert.ok(result.includes('<span class="text-primary">Where</span>'));
		});

		it("should handle incomplete statements", () => {
			const sql = "SELECT name, FROM users WHERE";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-primary">SELECT</span>'));
			assert.ok(result.includes('<span class="text-primary">FROM</span>'));
			assert.ok(result.includes('<span class="text-primary">WHERE</span>'));
		});

		it("should handle strings with mixed quotes", () => {
			const sql =
				'SELECT \'He said "Hello"\' as greeting, "She\'s here" as status';
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-success">'));
		});

		it("should handle numbers in various contexts", () => {
			const sql =
				"SELECT 1, 2.5, .75, 1e10, 0x1F, user123, table_2023 FROM test";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-warning">1</span>'));
			assert.ok(result.includes('<span class="text-warning">2.5</span>'));
			assert.ok(result.includes('<span class="text-warning">.75</span>'));
			assert.ok(result.includes('<span class="text-warning">1e10</span>'));
			// Hex numbers might not be handled specially in basic SQL
			assert.ok(result.includes('<span class="text-body">user123</span>'));
			assert.ok(result.includes('<span class="text-body">table_2023</span>'));
		});

		it("should handle nested comments", () => {
			const sql =
				"SELECT * FROM users /* outer /* inner */ comment */ WHERE id = 1";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-muted">'));
		});

		it("should handle special characters in identifiers", () => {
			const sql =
				"SELECT @var, #temp, $param, _private, column$ FROM table_name";
			const result = highlightSQL(sql);
			assert.ok(result.includes('<span class="text-body">@var</span>'));
			assert.ok(result.includes('<span class="text-body">#temp</span>'));
			assert.ok(result.includes('<span class="text-body">$param</span>'));
			assert.ok(result.includes('<span class="text-body">_private</span>'));
			assert.ok(result.includes('<span class="text-body">column$</span>'));
		});

		it("should handle doubled quotes in SQL strings (surgical coverage for lines 479-481)", () => {
			const sql = "SELECT 'Don''t stop' AS message";
			const result = highlightSQL(sql);
			assert.ok(
				result.includes('<span class="text-success">&#39;Don&#39;</span>'),
			);
			assert.ok(
				result.includes('<span class="text-success">&#39;t stop&#39;</span>'),
			);
		});

		it("should highlight multi-character SQL operators (surgical coverage for line 547)", () => {
			const sql =
				"SELECT * WHERE a <=> b AND c <> d AND e !< f AND g !> h AND i || j";
			const result = highlightSQL(sql);
			assert.ok(
				result.includes('<span class="text-secondary">&lt;=&gt;</span>'),
			);
			assert.ok(
				result.includes('<span class="text-secondary">&lt;&gt;</span>'),
			);
			assert.ok(result.includes('<span class="text-secondary">!&lt;</span>'));
			assert.ok(result.includes('<span class="text-secondary">!&gt;</span>'));
			// || is rendered as two separate | characters
			assert.ok(
				result.includes(
					'<span class="text-secondary">|</span><span class="text-secondary">|</span>',
				),
			);
		});
	});
});
