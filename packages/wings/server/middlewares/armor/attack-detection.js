/**
 * @file Attack pattern detection utilities for security monitoring
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * SQL injection detection patterns
 * Common SQL injection indicators and attack vectors
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
 * XSS (Cross-Site Scripting) detection patterns
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
 * Path traversal detection patterns
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
 * Additional suspicious patterns
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
 * Check for SQL injection patterns in request data
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @returns {string | null} Error message if SQL injection detected, null otherwise
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
 * Check for XSS attack patterns in request data
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @returns {string | null} Error message if XSS detected, null otherwise
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
 * Check for path traversal attack patterns
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @returns {string | null} Error message if path traversal detected, null otherwise
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
 * Check for various suspicious patterns that might indicate attacks
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @returns {string | null} Error message if suspicious pattern detected, null otherwise
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
 * Comprehensive attack detection that runs all checks
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @param {{
 *   sqlInjection?: boolean,
 *   xss?: boolean,
 *   pathTraversal?: boolean,
 *   suspiciousPatterns?: boolean
 * }} config - Detection configuration
 * @returns {string | null} First attack detection result, null if no attacks detected
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
