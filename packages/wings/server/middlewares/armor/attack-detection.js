/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Attack pattern detection using regex pattern matching
 *
 * Efficient attack detection through pre-compiled regex patterns.
 * Non-blocking detection logs security events without interrupting request flow.
 * Pattern matching optimized for common attack vectors while minimizing false positives.
 *
 * **Performance**: O(n×m) where n = test string length, m = pattern count
 * **Memory**: Pre-compiled regex patterns cached at module load
 * **False Positives**: Patterns tuned for low FP rate - some sophisticated attacks may bypass
 * **Security**: First-line defense - combine with WAF and input validation for complete protection
 */

/**
 * SQL injection detection patterns targeting common attack vectors.
 * Patterns ordered by frequency to optimize performance in production.
 *
 * **Coverage**: Classic injection, boolean-based blind, union-based, time-based
 * **Limitations**: Does not detect second-order SQL injection or advanced obfuscation
 *
 * @type {RegExp[]}
 */
export const SQL_INJECTION_PATTERNS = [
	// Classic SQL injection keywords (with optional spaces)
	/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)(\s|$)/i,
	// SQL comments
	/--|\*\/|\*\*/,
	// String concatenation attempts and quotes
	/'\s*\+\s*'|"\s*\+\s*"|'\s*=\s*'|"\s*=\s*"/,
	// SQL functions
	/\b(concat|char|ascii|substring|length|database|version|user)\s*\(/i,
	// Boolean-based blind SQL injection (more permissive)
	/\b(and|or)\s+('?\d+'?\s*[=<>]\s*'?\d+'?|'[^']*'\s*=\s*'[^']*')/i,
	// Time-based SQL injection
	/\b(sleep|waitfor|delay)(\s*\(|\s+)/i,
	// UNION-based injection
	/union\s+(all\s+)?select/i,
	// Common SQL injection indicators
	/('\s*(or|and)\s*'?\d*'?\s*=\s*'?\d*'?)|('\s*(or|and)\s*[^=]*=)/i,
];

/**
 * XSS (Cross-Site Scripting) detection patterns for reflected and stored XSS.
 * Focuses on script execution vectors and event handlers.
 *
 * **Coverage**: Script tags, event handlers, javascript: protocol, data URLs
 * **Limitations**: Does not detect DOM-based XSS or advanced encoding bypasses
 *
 * @type {RegExp[]}
 */
export const XSS_PATTERNS = [
	// Script tags
	/<script[^>]*>.*?<\/script>/i,
	// Event handlers
	/on(load|error|click|mouseover|focus|blur|submit|change)=/i,
	// Javascript: protocol
	/javascript:/i,
	// Data URLs with script
	/data:text\/html[^>]*>/i,
	// Expression() in CSS
	/expression\s*\(/i,
];

/**
 * Path traversal detection patterns for directory traversal attacks.
 * Detects encoded and double-encoded traversal sequences.
 *
 * **Coverage**: ../ sequences, URL encoding, double encoding, mixed encodings
 * **Performance**: Case-insensitive matching for encoded variants
 *
 * @type {RegExp[]}
 */
export const PATH_TRAVERSAL_PATTERNS = [
	// Directory traversal (more permissive)
	/\.\.[/\\]|\.\.%2f|\.\.%5c/i,
	// URL encoded traversal (including partial encoding)
	/%(2e|2f|5c)/i,
	// Double URL encoding
	/%(25)/i,
	// Alternative encodings
	/\.\/%2e\.|%2e%2e/i,
];

/**
 * Miscellaneous attack patterns for command injection and template exploits.
 * Broad pattern matching for less common but dangerous attack vectors.
 *
 * **Coverage**: Command injection, LDAP injection, XML injection, template injection
 * **Trade-off**: Higher false positive rate for broader attack detection
 *
 * @type {RegExp[]}
 */
export const SUSPICIOUS_PATTERNS = [
	// Command injection attempts
	/[;&|`$(){}]/,
	// LDAP injection
	/[()&|!]/,
	// XML injection
	/<!entity|<!\[cdata\[/i,
	// Server-side template injection
	/\{\{.*?\}\}|\$\{.*?\}/,
];

/**
 * Detect SQL injection patterns in request path, query parameters, and headers.
 * Tests critical request components against compiled regex patterns.
 *
 * **Test Scope**: URL path, all query parameters, suspicious headers (User-Agent, Referer, X-Forwarded-For)
 * **Error Handling**: Gracefully handles malformed request data without failing
 * **Performance**: Early exit on first pattern match
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @returns {string|null} Attack description if detected, null if clean
 */
export function checkSQLInjection(ctx) {
	const testStrings = [];

	// Check query parameters
	if (ctx.queryParams && typeof ctx.queryParams.entries === "function") {
		try {
			for (const [key, value] of ctx.queryParams.entries()) {
				testStrings.push(key, value);
			}
		} catch (_error) {
			// Ignore errors in malformed queryParams
		}
	}

	// Check path
	if (ctx.path) {
		testStrings.push(ctx.path);
	}

	// Check headers (common attack vectors)
	if (ctx.requestHeaders && typeof ctx.requestHeaders.get === "function") {
		const suspiciousHeaders = ["user-agent", "referer", "x-forwarded-for"];
		for (const header of suspiciousHeaders) {
			try {
				const value = ctx.requestHeaders.get(header);
				if (value) {
					testStrings.push(value);
				}
			} catch (_error) {
				// Ignore errors in malformed headers
			}
		}
	}

	// Test all collected strings against SQL injection patterns
	for (const str of testStrings) {
		if (typeof str === "string") {
			for (const pattern of SQL_INJECTION_PATTERNS) {
				if (pattern.test(str)) {
					return `SQL injection attempt detected in: ${str.slice(0, 50)}...`;
				}
			}
		}
	}

	return null;
}

/**
 * Detect XSS attack patterns in request data.
 * Focuses on script execution and event handler injection vectors.
 *
 * **Test Scope**: URL path and all query parameters
 * **Detection Strategy**: Pattern matching for common XSS payloads
 * **Limitations**: Cannot detect context-aware XSS or sophisticated encoding
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @returns {string|null} Attack description if detected, null if clean
 */
export function checkXSSAttempt(ctx) {
	const testStrings = [];

	// Check query parameters
	if (ctx.queryParams && typeof ctx.queryParams.entries === "function") {
		try {
			for (const [key, value] of ctx.queryParams.entries()) {
				testStrings.push(key, value);
			}
		} catch (_error) {
			// Ignore errors in malformed queryParams
		}
	}

	// Check path
	if (ctx.path) {
		testStrings.push(ctx.path);
	}

	// Test all collected strings against XSS patterns
	for (const str of testStrings) {
		if (typeof str === "string") {
			for (const pattern of XSS_PATTERNS) {
				if (pattern.test(str)) {
					return `XSS attempt detected in: ${str.slice(0, 50)}...`;
				}
			}
		}
	}

	return null;
}

/**
 * Detect path traversal attacks targeting file system access.
 * Scans path and query parameters for directory traversal sequences.
 *
 * **Primary Target**: URL path (most common attack vector)
 * **Secondary**: Query parameters containing file paths
 * **Encoding Detection**: Handles URL encoding and double encoding
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @returns {string|null} Attack description if detected, null if clean
 */
export function checkPathTraversal(ctx) {
	const testStrings = [];

	// Check path
	if (ctx.path) {
		testStrings.push(ctx.path);
	}

	// Check query parameters
	if (ctx.queryParams && typeof ctx.queryParams.entries === "function") {
		try {
			for (const [key, value] of ctx.queryParams.entries()) {
				testStrings.push(key, value);
			}
		} catch (_error) {
			// Ignore errors in malformed queryParams
		}
	}

	// Test all collected strings against path traversal patterns
	for (const str of testStrings) {
		if (typeof str === "string") {
			for (const pattern of PATH_TRAVERSAL_PATTERNS) {
				if (pattern.test(str)) {
					return `Path traversal attempt detected in: ${str.slice(0, 50)}...`;
				}
			}
		}
	}

	return null;
}

/**
 * Detect miscellaneous attack patterns including command injection and template exploits.
 * Broader pattern matching for less common but dangerous attack vectors.
 *
 * **Trade-off**: Higher false positive rate for comprehensive coverage
 * **Use Case**: Detection of sophisticated attacks that bypass specific pattern matching
 * **Logging**: All detections logged for security monitoring and pattern refinement
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @returns {string|null} Attack description if detected, null if clean
 */
export function checkSuspiciousPatterns(ctx) {
	const testStrings = [];

	// Check query parameters
	if (ctx.queryParams && typeof ctx.queryParams.entries === "function") {
		try {
			for (const [key, value] of ctx.queryParams.entries()) {
				testStrings.push(key, value);
			}
		} catch (_error) {
			// Ignore errors in malformed queryParams
		}
	}

	// Check path
	if (ctx.path) {
		testStrings.push(ctx.path);
	}

	// Test all collected strings against suspicious patterns
	for (const str of testStrings) {
		if (typeof str === "string") {
			for (const pattern of SUSPICIOUS_PATTERNS) {
				if (pattern.test(str)) {
					return `Suspicious pattern detected in: ${str.slice(0, 50)}...`;
				}
			}
		}
	}

	return null;
}

/**
 * Execute comprehensive attack detection across all enabled pattern types.
 * Runs detection checks in order of severity and likelihood.
 *
 * **Execution Order**: SQL injection → XSS → Path traversal → Suspicious patterns
 * **Early Exit**: Returns immediately on first detection (optimization for clean requests)
 * **Configuration**: Individual detection types can be disabled via config
 * **Non-blocking**: Detection failures do not interrupt request processing
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @param {Partial<import('./config.js').AttackDetectionConfig>} [config={}] - Detection type configuration
 * @returns {string|null} First attack detected (with description) or null if clean
 */
export function detectAttacks(ctx, config = {}) {
	const {
		sqlInjection = true,
		xss = true,
		pathTraversal = true,
		suspiciousPatterns = true,
	} = config;

	// Run detection checks in order of severity/commonality
	if (sqlInjection) {
		const sqlResult = checkSQLInjection(ctx);
		if (sqlResult) return sqlResult;
	}

	if (xss) {
		const xssResult = checkXSSAttempt(ctx);
		if (xssResult) return xssResult;
	}

	if (pathTraversal) {
		const pathResult = checkPathTraversal(ctx);
		if (pathResult) return pathResult;
	}

	if (suspiciousPatterns) {
		const suspiciousResult = checkSuspiciousPatterns(ctx);
		if (suspiciousResult) return suspiciousResult;
	}

	return null; // No attacks detected
}
