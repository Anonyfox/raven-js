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
 *
 * @type {RegExp[]}
 *
 * @example
 * // Test input against SQL injection patterns
 * const input = "' OR 1=1--";
 * const isMatch = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
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
 *
 * @type {RegExp[]}
 *
 * @example
 * // Test input against XSS patterns
 * const input = "<script>alert('xss')</script>";
 * const isMatch = XSS_PATTERNS.some(pattern => pattern.test(input));
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
 *
 * @type {RegExp[]}
 *
 * @example
 * // Test input against path traversal patterns
 * const input = "../../../etc/passwd";
 * const isMatch = PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
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
 *
 * @type {RegExp[]}
 *
 * @example
 * // Test input against suspicious patterns
 * const input = "${7*7}";
 * const isMatch = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
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
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @returns {string|null} Attack description if detected, null if clean
 *
 * @example
 * // Check for SQL injection in request
 * const result = checkSQLInjection(ctx);
 * if (result) console.log('SQL injection detected:', result);
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
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @returns {string|null} Attack description if detected, null if clean
 *
 * @example
 * // Check for XSS in request
 * const result = checkXSSAttempt(ctx);
 * if (result) console.log('XSS attack detected:', result);
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
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @returns {string|null} Attack description if detected, null if clean
 *
 * @example
 * // Check for path traversal in request
 * const result = checkPathTraversal(ctx);
 * if (result) console.log('Path traversal detected:', result);
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
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @returns {string|null} Attack description if detected, null if clean
 *
 * @example
 * // Check for suspicious patterns in request
 * const result = checkSuspiciousPatterns(ctx);
 * if (result) console.log('Suspicious pattern detected:', result);
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
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with parsed data
 * @param {Partial<import('./config.js').AttackDetectionConfig>} [config={}] - Detection type configuration
 * @returns {string|null} First attack detected (with description) or null if clean
 *
 * @example
 * // Run comprehensive attack detection
 * const result = detectAttacks(ctx, { sqlInjection: true, xss: true });
 * if (result) console.log('Attack detected:', result);
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
