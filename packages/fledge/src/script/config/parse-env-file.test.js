/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for parseEnvFile function.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { parseEnvFile } from "./parse-env-file.js";

describe("parseEnvFile", () => {
	describe("basic parsing", () => {
		it("parses simple key=value pairs", () => {
			const content = `
NODE_ENV=production
API_KEY=secret123
PORT=3000
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				NODE_ENV: "production",
				API_KEY: "secret123",
				PORT: "3000",
			});
		});

		it("handles empty content", () => {
			const result = parseEnvFile("");
			assert.deepStrictEqual(result, {});
		});

		it("handles whitespace-only content", () => {
			const result = parseEnvFile("   \n\t\n   ");
			assert.deepStrictEqual(result, {});
		});

		it("handles mixed line endings", () => {
			const content = "KEY1=value1\r\nKEY2=value2\rKEY3=value3\n";
			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				KEY1: "value1",
				KEY2: "value2",
				KEY3: "value3",
			});
		});
	});

	describe("comments", () => {
		it("skips comment lines", () => {
			const content = `
# This is a comment
NODE_ENV=production
# Another comment
API_KEY=secret
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				NODE_ENV: "production",
				API_KEY: "secret",
			});
		});

		it("handles inline comments", () => {
			const content = `
NODE_ENV=production # This is inline
API_KEY=secret# No space before hash
PORT=3000 # With space
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				NODE_ENV: "production",
				API_KEY: "secret",
				PORT: "3000",
			});
		});

		it("preserves hash in quoted values", () => {
			const content = `
PASSWORD="secret#123"
QUERY='SELECT * FROM "users" # comment'
HASH_TAG="Follow us on #social"
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				PASSWORD: "secret#123",
				QUERY: 'SELECT * FROM "users" # comment',
				HASH_TAG: "Follow us on #social",
			});
		});
	});

	describe("quoted values", () => {
		it("handles double quoted values", () => {
			const content = `
MESSAGE="Hello World"
PATH="/usr/local/bin"
EMPTY=""
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				MESSAGE: "Hello World",
				PATH: "/usr/local/bin",
				EMPTY: "",
			});
		});

		it("handles single quoted values", () => {
			const content = `
MESSAGE='Hello World'
QUERY='SELECT * FROM "users"'
EMPTY=''
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				MESSAGE: "Hello World",
				QUERY: 'SELECT * FROM "users"',
				EMPTY: "",
			});
		});

		it("handles escaped characters", () => {
			const content = `
NEWLINE="Line 1\\nLine 2"
TAB="Col1\\tCol2"
QUOTE="Say \\"Hello\\""
BACKSLASH="Path\\\\To\\\\File"
SINGLE='Can\\'t touch this'
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				NEWLINE: "Line 1\nLine 2",
				TAB: "Col1\tCol2",
				QUOTE: 'Say "Hello"',
				BACKSLASH: "Path\\To\\File",
				SINGLE: "Can't touch this",
			});
		});

		it("handles multiline quoted values", () => {
			const content = `
SINGLE_LINE=normal
MULTILINE="This is line 1
This is line 2
This is line 3"
AFTER_MULTI=after
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				SINGLE_LINE: "normal",
				MULTILINE: "This is line 1\nThis is line 2\nThis is line 3",
				AFTER_MULTI: "after",
			});
		});

		it("handles unclosed quotes gracefully", () => {
			const content = `
VALID=normal
UNCLOSED="This quote is never closed
AFTER=should_be_skipped
`;

			const result = parseEnvFile(content);

			// Should get the valid one and the unclosed multiline
			assert.strictEqual(result.VALID, "normal");
			assert.ok(result.UNCLOSED.includes("This quote is never closed"));
		});
	});

	describe("export statements", () => {
		it("handles export statements", () => {
			const content = `
export NODE_ENV=production
export API_KEY="secret123"
NORMAL_VAR=value
export PATH='/usr/bin'
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				NODE_ENV: "production",
				API_KEY: "secret123",
				NORMAL_VAR: "value",
				PATH: "/usr/bin",
			});
		});
	});

	describe("edge cases", () => {
		it("handles empty values", () => {
			const content = `
EMPTY_VAR=
NORMAL=value
ANOTHER_EMPTY=
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				EMPTY_VAR: "",
				NORMAL: "value",
				ANOTHER_EMPTY: "",
			});
		});

		it("handles equals signs in values", () => {
			const content = `
DATABASE_URL=mysql://user:pass@host/db?opt=value
COMPLEX="key=value&another=thing"
EQUATION="x=y+z"
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				DATABASE_URL: "mysql://user:pass@host/db?opt=value",
				COMPLEX: "key=value&another=thing",
				EQUATION: "x=y+z",
			});
		});

		it("handles spaces around keys and values", () => {
			const content = `
  SPACE_KEY  =  space_value
	TAB_KEY	=	tab_value
MIXED = " quoted with spaces "
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				SPACE_KEY: "space_value",
				TAB_KEY: "tab_value",
				MIXED: " quoted with spaces ",
			});
		});

		it("validates variable names", () => {
			const content = `
VALID_VAR=good
123INVALID=bad
invalid-dash=bad
_UNDERSCORE=good
MIXED123=good
VALID_UNDERSCORE_123=good
=no_key
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				VALID_VAR: "good",
				_UNDERSCORE: "good",
				MIXED123: "good",
				VALID_UNDERSCORE_123: "good",
			});
		});

		it("handles malformed lines gracefully", () => {
			const content = `
VALID=good
this_line_has_no_equals
ANOTHER=also_good
=just_equals
key_no_value
FINAL=value
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				VALID: "good",
				ANOTHER: "also_good",
				FINAL: "value",
			});
		});

		it("handles unicode characters", () => {
			const content = `
EMOJI="🚀 Launch ready!"
UNICODE="café naïve résumé"
CHINESE="你好世界"
`;

			const result = parseEnvFile(content);

			assert.deepStrictEqual(result, {
				EMOJI: "🚀 Launch ready!",
				UNICODE: "café naïve résumé",
				CHINESE: "你好世界",
			});
		});
	});

	describe("error handling", () => {
		it("throws error for non-string input", () => {
			assert.throws(() => parseEnvFile(null), {
				name: "Error",
				message: "Environment file content must be a string",
			});

			assert.throws(() => parseEnvFile(123), {
				name: "Error",
				message: "Environment file content must be a string",
			});

			assert.throws(() => parseEnvFile({}), {
				name: "Error",
				message: "Environment file content must be a string",
			});
		});
	});

	describe("real-world examples", () => {
		it("parses complex real-world .env file", () => {
			const content = `
# Application Configuration
NODE_ENV=production
APP_NAME="My Awesome App"
APP_VERSION=1.2.3

# Database Configuration
DATABASE_URL="postgres://user:pass@localhost:5432/mydb?ssl=true"
DB_POOL_SIZE=10
export DB_TIMEOUT=30000

# API Configuration
API_KEY="abc-123-def-456"
API_SECRET='super-secret-key-#!@$%'
API_BASE_URL=https://api.example.com/v1

# Feature Flags
FEATURE_ANALYTICS=true
FEATURE_LOGGING=false
DEBUG_MODE= # Empty but present

# Multiline Configuration
SSL_CERT="-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKr7Xa8S+Tq...
-----END CERTIFICATE-----"

# Complex Values
REDIS_CONFIG='{"host":"localhost","port":6379,"retry":true}'
ALLOWED_ORIGINS="http://localhost:3000,https://app.example.com"

# Special Characters
SPECIAL_CHARS="!@#$%^&*()_+-=[]{}|;:'\\",./<>?"
`;

			const result = parseEnvFile(content);

			assert.strictEqual(result.NODE_ENV, "production");
			assert.strictEqual(result.APP_NAME, "My Awesome App");
			assert.strictEqual(
				result.DATABASE_URL,
				"postgres://user:pass@localhost:5432/mydb?ssl=true",
			);
			assert.strictEqual(result.API_SECRET, "super-secret-key-#!@$%");
			assert.strictEqual(result.DEBUG_MODE, "");
			assert.ok(result.SSL_CERT.includes("BEGIN CERTIFICATE"));
			assert.ok(result.SSL_CERT.includes("END CERTIFICATE"));
			assert.strictEqual(
				result.REDIS_CONFIG,
				'{"host":"localhost","port":6379,"retry":true}',
			);
			assert.strictEqual(
				result.SPECIAL_CHARS,
				"!@#$%^&*()_+-=[]{}|;:'\",./<>?",
			);
		});
	});
});
