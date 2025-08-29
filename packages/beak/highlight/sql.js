/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file SQL syntax highlighter using Bootstrap semantic classes
 *
 * Transforms SQL source code into semantically highlighted HTML using Bootstrap
 * color classes. Handles keywords, functions, literals, comments, and operators
 * with zero dependencies and optimal performance. Supports standard SQL and
 * common dialect variations.
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
const escapeHtml = (text) =>
	text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

/**
 * Wrap text in Bootstrap class span
 * @param {string} text - Text to wrap
 * @param {string} className - Bootstrap class name
 * @returns {string} Wrapped HTML span
 */
const wrapToken = (text, className) =>
	`<span class="${className}">${escapeHtml(text)}</span>`;

/**
 * SQL token types and their Bootstrap classes
 */
const TOKEN_TYPES = {
	COMMENT: "text-muted",
	KEYWORD: "text-primary",
	FUNCTION: "text-info",
	DATATYPE: "text-info",
	STRING: "text-success",
	NUMBER: "text-warning",
	OPERATOR: "text-secondary",
	PUNCTUATION: "text-secondary",
	IDENTIFIER: "text-body",
	WHITESPACE: /** @type {null} */ (null), // No highlighting
};

/**
 * SQL keywords (case-insensitive)
 */
const KEYWORDS = new Set([
	// DQL - Data Query Language
	"select",
	"from",
	"where",
	"order",
	"by",
	"group",
	"having",
	"distinct",
	"limit",
	"offset",
	"top",
	"with",
	"union",
	"intersect",
	"except",
	"all",
	"any",
	"some",
	"exists",
	"in",
	"between",
	"like",
	"ilike",
	"glob",
	"regexp",
	"match",
	"escape",
	// DML - Data Manipulation Language
	"insert",
	"into",
	"values",
	"update",
	"set",
	"delete",
	"merge",
	"upsert",
	// DDL - Data Definition Language
	"create",
	"alter",
	"drop",
	"truncate",
	"rename",
	"table",
	"view",
	"index",
	"sequence",
	"database",
	"schema",
	"constraint",
	"primary",
	"foreign",
	"key",
	"references",
	"unique",
	"check",
	"default",
	"auto_increment",
	"identity",
	// DCL - Data Control Language
	"grant",
	"revoke",
	"deny",
	// TCL - Transaction Control Language
	"begin",
	"commit",
	"rollback",
	"savepoint",
	"transaction",
	// Joins
	"join",
	"inner",
	"left",
	"right",
	"full",
	"outer",
	"cross",
	"natural",
	"on",
	"using",
	// Logical operators
	"and",
	"or",
	"not",
	"is",
	"null",
	"true",
	"false",
	// Conditionals
	"case",
	"when",
	"then",
	"else",
	"end",
	"if",
	"elsif",
	"elseif",
	// Misc
	"as",
	"alias",
	"asc",
	"desc",
	"over",
	"partition",
	"window",
	"rows",
	"range",
	"preceding",
	"following",
	"unbounded",
	"current",
	"row",
	"cast",
	"convert",
	"extract",
	"collate",
]);

/**
 * SQL functions and built-ins
 */
const FUNCTIONS = new Set([
	// Aggregate functions
	"count",
	"sum",
	"avg",
	"min",
	"max",
	"std",
	"stddev",
	"variance",
	"var_pop",
	"var_samp",
	"group_concat",
	"string_agg",
	"array_agg",
	"listagg",
	// String functions
	"length",
	"len",
	"char_length",
	"character_length",
	"upper",
	"lower",
	"trim",
	"ltrim",
	"rtrim",
	"substring",
	"substr",
	"concat",
	"concat_ws",
	"replace",
	"translate",
	"reverse",
	"left",
	"right",
	"position",
	"locate",
	"instr",
	"charindex",
	"split_part",
	"regexp_replace",
	"regexp_substr",
	"soundex",
	"difference",
	// Numeric functions
	"abs",
	"ceil",
	"ceiling",
	"floor",
	"round",
	"trunc",
	"truncate",
	"mod",
	"power",
	"sqrt",
	"exp",
	"log",
	"log10",
	"ln",
	"sin",
	"cos",
	"tan",
	"asin",
	"acos",
	"atan",
	"atan2",
	"pi",
	"rand",
	"random",
	"sign",
	"greatest",
	"least",
	// Date/time functions
	"now",
	"current_date",
	"current_time",
	"current_timestamp",
	"getdate",
	"getutcdate",
	"date",
	"time",
	"datetime",
	"timestamp",
	"year",
	"month",
	"day",
	"hour",
	"minute",
	"second",
	"dayofweek",
	"dayofyear",
	"weekday",
	"dayname",
	"monthname",
	"quarter",
	"week",
	"date_add",
	"date_sub",
	"adddate",
	"subdate",
	"date_diff",
	"datediff",
	"date_format",
	"str_to_date",
	"from_unixtime",
	"unix_timestamp",
	// Conditional functions
	"coalesce",
	"nullif",
	"isnull",
	"ifnull",
	"nvl",
	"nvl2",
	"decode",
	// Window functions
	"row_number",
	"rank",
	"dense_rank",
	"percent_rank",
	"cume_dist",
	"ntile",
	"lag",
	"lead",
	"first_value",
	"last_value",
	"nth_value",
	// Type conversion
	"cast",
	"convert",
	"to_char",
	"to_date",
	"to_number",
	"to_timestamp",
	// JSON functions (modern SQL)
	"json_extract",
	"json_value",
	"json_query",
	"json_array",
	"json_object",
	"json_arrayagg",
	"json_objectagg",
]);

/**
 * SQL data types
 */
const DATATYPES = new Set([
	// Numeric types
	"int",
	"integer",
	"smallint",
	"bigint",
	"tinyint",
	"mediumint",
	"serial",
	"bigserial",
	"smallserial",
	"decimal",
	"numeric",
	"float",
	"real",
	"double",
	"money",
	"smallmoney",
	// String types
	"char",
	"varchar",
	"nchar",
	"nvarchar",
	"text",
	"ntext",
	"longtext",
	"mediumtext",
	"tinytext",
	"clob",
	"nclob",
	"character",
	"varying",
	// Binary types
	"binary",
	"varbinary",
	"blob",
	"longblob",
	"mediumblob",
	"tinyblob",
	"bytea",
	"image",
	// Date/time types
	"date",
	"time",
	"datetime",
	"datetime2",
	"smalldatetime",
	"timestamp",
	"timestamptz",
	"interval",
	"year",
	// Boolean
	"bool",
	"boolean",
	"bit",
	// JSON and XML
	"json",
	"jsonb",
	"xml",
	// UUID and spatial
	"uuid",
	"uniqueidentifier",
	"geometry",
	"geography",
	"point",
	"polygon",
	// Array types
	"array",
	"table",
]);

/**
 * Check if character can start an identifier
 * @param {string} char - Character to check
 * @returns {boolean} True if valid identifier start
 */
const isIdentifierStart = (char) => /[a-zA-Z_@#$]/.test(char);

/**
 * Check if character can continue an identifier
 * @param {string} char - Character to check
 * @returns {boolean} True if valid identifier continuation
 */
const isIdentifierPart = (char) => /[a-zA-Z0-9_@#$]/.test(char);

/**
 * Tokenize SQL source code into semantic tokens
 * @param {string} sourceText - Raw SQL source code
 * @returns {Array<{type: string, value: string, className: string|null}>} Array of {type, value, className} tokens
 */
const tokenizeSQL = (sourceText) => {
	const tokens = [];
	let i = 0;

	while (i < sourceText.length) {
		const char = sourceText[i];
		const nextChar = sourceText[i + 1] || "";

		// Handle single-line comments
		if (char === "-" && nextChar === "-") {
			const start = i;
			i += 2;

			// Find end of line
			while (i < sourceText.length && sourceText[i] !== "\n") {
				i++;
			}

			tokens.push({
				type: "COMMENT",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.COMMENT,
			});
			continue;
		}

		// Handle multi-line comments
		if (char === "/" && nextChar === "*") {
			const start = i;
			i += 2;

			// Find end of comment
			while (
				i < sourceText.length - 1 &&
				!(sourceText[i] === "*" && sourceText[i + 1] === "/")
			) {
				i++;
			}
			i += 2; // Skip */

			tokens.push({
				type: "COMMENT",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.COMMENT,
			});
			continue;
		}

		// Handle string literals
		if (char === "'" || char === '"') {
			const delimiter = char;
			const start = i;
			i++; // Skip opening quote

			// Find end of string
			while (i < sourceText.length && sourceText[i] !== delimiter) {
				if (sourceText[i] === "\\" && i + 1 < sourceText.length) {
					i += 2; // Skip escaped character
					continue;
				}
				// Handle doubled quotes as escapes (SQL standard)
				if (sourceText[i] === delimiter && sourceText[i + 1] === delimiter) {
					i += 2; // Skip doubled delimiter
					continue;
				}
				i++;
			}
			i++; // Skip closing quote

			tokens.push({
				type: "STRING",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.STRING,
			});
			continue;
		}

		// Handle numbers
		if (/\d/.test(char) || (char === "." && /\d/.test(nextChar))) {
			const start = i;

			// Handle decimal numbers
			while (i < sourceText.length && /\d/.test(sourceText[i])) {
				i++;
			}

			// Handle decimal point
			if (sourceText[i] === "." && /\d/.test(sourceText[i + 1])) {
				i++;
				while (i < sourceText.length && /\d/.test(sourceText[i])) {
					i++;
				}
			}

			// Handle scientific notation
			if (
				(sourceText[i] === "e" || sourceText[i] === "E") &&
				i + 1 < sourceText.length
			) {
				const nextCharAfterE = sourceText[i + 1];
				if (
					/\d/.test(nextCharAfterE) ||
					((nextCharAfterE === "+" || nextCharAfterE === "-") &&
						i + 2 < sourceText.length &&
						/\d/.test(sourceText[i + 2]))
				) {
					i++;
					if (sourceText[i] === "+" || sourceText[i] === "-") i++;
					while (i < sourceText.length && /\d/.test(sourceText[i])) {
						i++;
					}
				}
			}

			tokens.push({
				type: "NUMBER",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.NUMBER,
			});
			continue;
		}

		// Handle operators and punctuation
		if (/[<>=!+\-*/%(),;.[\]{}|&^~]/.test(char)) {
			let operatorLength = 1;
			const twoChar = sourceText.slice(i, i + 2);
			const threeChar = sourceText.slice(i, i + 3);

			// Check for multi-character operators (longest first)
			if (["<=>", "<>", "!<", "!>", "||"].includes(threeChar)) {
				operatorLength = 3;
			} else if (
				[
					"<=",
					">=",
					"<>",
					"!=",
					"!<",
					"!>",
					"+=",
					"-=",
					"*=",
					"/=",
					"%=",
					"&=",
					"|=",
					"^=",
					">>",
					"<<",
					"::",
				].includes(twoChar)
			) {
				operatorLength = 2;
			}

			const operator = sourceText.slice(i, i + operatorLength);
			i += operatorLength;

			tokens.push({
				type: "OPERATOR",
				value: operator,
				className: TOKEN_TYPES.OPERATOR,
			});
			continue;
		}

		// Handle whitespace
		if (/\s/.test(char)) {
			const start = i;
			while (i < sourceText.length && /\s/.test(sourceText[i])) {
				i++;
			}
			tokens.push({
				type: "WHITESPACE",
				value: sourceText.slice(start, i),
				className: TOKEN_TYPES.WHITESPACE,
			});
			continue;
		}

		// Handle identifiers and keywords
		if (isIdentifierStart(char)) {
			const start = i;

			while (i < sourceText.length && isIdentifierPart(sourceText[i])) {
				i++;
			}

			const word = sourceText.slice(start, i);
			const lowerWord = word.toLowerCase();
			let tokenType = "IDENTIFIER";
			let className = TOKEN_TYPES.IDENTIFIER;

			// Classify the word
			if (KEYWORDS.has(lowerWord)) {
				tokenType = "KEYWORD";
				className = TOKEN_TYPES.KEYWORD;
			} else if (FUNCTIONS.has(lowerWord)) {
				tokenType = "FUNCTION";
				className = TOKEN_TYPES.FUNCTION;
			} else if (DATATYPES.has(lowerWord)) {
				tokenType = "DATATYPE";
				className = TOKEN_TYPES.DATATYPE;
			}

			tokens.push({
				type: tokenType,
				value: word,
				className,
			});
			continue;
		}

		// Handle any other character
		tokens.push({
			type: "OTHER",
			value: char,
			className: null,
		});
		i++;
	}

	return tokens;
};

/**
 * Highlight SQL source code with Bootstrap semantic classes
 * @param {string} sourceText - Raw SQL source code
 * @returns {string} HTML with syntax highlighting
 */
export const highlightSQL = (sourceText) => {
	if (typeof sourceText !== "string") {
		throw new TypeError("SQL source must be a string");
	}

	if (!sourceText.trim()) {
		return "";
	}

	const tokens = tokenizeSQL(sourceText);

	return tokens
		.map((token) => {
			if (token.className) {
				return wrapToken(token.value, token.className);
			}
			return escapeHtml(token.value);
		})
		.join("");
};
