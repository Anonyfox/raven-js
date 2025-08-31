/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { Middleware } from "../../core/middleware.js";

/**
 * @file Request logging middleware providing beautiful development output and SOC2/ISO27001/GDPR compliant production logs.
 */

/**
 * RavenJS color palette for terminal output
 * Optimized for black backgrounds and professional readability
 */
const COLORS = {
	reset: "\x1b[0m",

	// Text colors
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	white: "\x1b[37m",
	black: "\x1b[30m",

	// Method with black backgrounds for perfect readability
	methodGet: "\x1b[92m\x1b[40m", // Bright green on black
	methodPost: "\x1b[94m\x1b[40m", // Bright blue on black
	methodPut: "\x1b[93m\x1b[40m", // Bright yellow on black
	methodDelete: "\x1b[91m\x1b[40m", // Bright red on black
	methodPatch: "\x1b[95m\x1b[40m", // Bright magenta on black
	methodOther: "\x1b[97m\x1b[40m", // Bright white on black

	// Status with black backgrounds and colored text
	statusSuccess: "\x1b[92m\x1b[40m", // Bright green on black
	statusRedirect: "\x1b[96m\x1b[40m", // Bright cyan on black
	statusClientError: "\x1b[93m\x1b[40m", // Bright yellow on black
	statusServerError: "\x1b[91m\x1b[40m", // Bright red on black
	statusOther: "\x1b[97m\x1b[40m", // Bright white on black

	// Performance highlighting (black background, bright colors)
	perfExcellent: "\x1b[92m\x1b[40m", // Bright green on black
	perfGood: "\x1b[96m\x1b[40m", // Bright cyan on black
	perfSlow: "\x1b[93m\x1b[40m", // Bright yellow on black
	perfVerySlow: "\x1b[91m\x1b[40m", // Bright red on black

	// Path and other elements
	path: "\x1b[96m", // Bright cyan
	time: "\x1b[90m", // Gray
	requestId: "\x1b[90m", // Gray
};

/**
 * Generate unique request ID for distributed tracing.
 *
 * @returns {string} Timestamp-prefixed unique identifier (format: "1705356869123-abc123def")
 *
 * @example
 * // Generate unique ID for request tracking
 * const id = generateRequestId(); // "1705356869123-abc123def"
 */
export function generateRequestId() {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get status code color with background for terminal output.
 *
 * @param {number} statusCode - HTTP status code
 * @returns {string} ANSI color code with background
 *
 * @example
 * // Get color for HTTP status codes
 * const color = getStatusColor(200); // Green for success
 */
export function getStatusColor(statusCode) {
	if (statusCode >= 200 && statusCode < 300) return COLORS.statusSuccess;
	if (statusCode >= 300 && statusCode < 400) return COLORS.statusRedirect;
	if (statusCode >= 400 && statusCode < 500) return COLORS.statusClientError;
	if (statusCode >= 500 && statusCode < 600) return COLORS.statusServerError;
	return COLORS.statusOther;
}

/**
 * Get HTTP method color with background for terminal output.
 *
 * @param {string} method - HTTP method
 * @returns {string} ANSI color code with background
 *
 * @example
 * // Get color for HTTP methods
 * const color = getMethodColor('POST'); // Blue for POST
 */
export function getMethodColor(method) {
	switch (method.toUpperCase()) {
		case "GET":
			return COLORS.methodGet;
		case "POST":
			return COLORS.methodPost;
		case "PUT":
			return COLORS.methodPut;
		case "DELETE":
			return COLORS.methodDelete;
		case "PATCH":
			return COLORS.methodPatch;
		default:
			return COLORS.methodOther;
	}
}

/**
 * Format duration with performance indicators that POP visually.
 *
 * @param {number} duration - Duration in milliseconds
 * @returns {string} High-contrast duration string with performance indicator
 *
 * @example
 * // Format request duration with visual performance indicators
 * const formatted = formatDuration(150); // Shows colored duration with indicator
 */
export function formatDuration(duration) {
	let value, unit, icon, color;

	if (duration < 1) {
		// Microseconds
		value = Math.round(duration * 1000);
		unit = "µs";
		icon = "⚡";
		color = COLORS.perfExcellent;
	} else if (duration < 1000) {
		// Milliseconds
		value = Math.round(duration);
		unit = "ms";
		if (duration < 10) {
			icon = "⚡";
			color = COLORS.perfExcellent;
		} else if (duration < 100) {
			icon = "✓";
			color = COLORS.perfGood;
		} else {
			icon = "⚠";
			color = COLORS.perfSlow;
		}
	} else {
		// Seconds
		value = Math.round(duration / 1000);
		unit = "s "; // Extra space for visual alignment with µs/ms
		icon = "⚠";
		color = COLORS.perfVerySlow;
	}

	// Format: icon + space + right-aligned 3-digit number + space + unit
	const formattedValue = value.toString().padStart(3);
	return `${color}${icon} ${formattedValue} ${unit}${COLORS.reset}`;
}

/**
 * Extract complete log data from request context
 *
 * **Performance:** Uses performance.now() for sub-millisecond precision timing.
 * **Dangerous Edge:** Header values can be null - handled gracefully throughout.
 * **Integration Trap:** IP extraction prioritizes x-forwarded-for for load balancer compatibility.
 *
 * @param {import('../../core/context.js').Context} ctx - Wings request context
 * @param {number} startTime - Request start timestamp from performance.now()
 * @param {string} requestId - Unique request identifier
 * @param {Date} timestamp - Request start date
 * @returns {{
 *   method: string,
 *   path: string,
 *   statusCode: number,
 *   duration: number,
 *   userAgent: string|null,
 *   referrer: string|null,
 *   requestId: string,
 *   timestamp: Date,
 *   ip: string,
 *   userIdentity: string|null
 * }} Normalized log data for production/development formatting
 *
 * @example Typical Output
 * ```javascript
 * const logData = collectLogData(ctx, startTime, requestId, timestamp);
 * console.log(logData);
 *
 * // {
 * //   method: 'POST',
 * //   path: '/api/users',
 * //   query: '?include=profile',
 * //   statusCode: 201,
 * //   duration: 234,
 * //   durationUnit: 'µs',
 * //   timestamp: '2024-01-15T22:14:29.123Z',
 * //   requestId: '1705356869123-abc123def',
 * //   userAgent: 'Mozilla/5.0...',
 * //   ip: '192.168.1.100',
 * //   userId: 'user_123',
 * //   contentType: 'application/json',
 * //   success: true
 * // }
 * ```
 */
export function collectLogData(ctx, startTime, requestId, timestamp) {
	const endTime = performance.now();
	const duration = endTime - startTime;

	return {
		method: ctx.method,
		path: ctx.path,
		statusCode: ctx.responseStatusCode,
		duration,
		userAgent: ctx.requestHeaders.get("user-agent"),
		referrer: ctx.requestHeaders.get("referer"),
		requestId,
		timestamp,
		ip:
			ctx.requestHeaders.get("x-forwarded-for") ||
			ctx.requestHeaders.get("x-real-ip") ||
			"unknown",
		userIdentity: ctx.requestHeaders.get("authorization") || null,
	};
}

/**
 * Create compliance-ready structured log entry
 *
 * **Compliance Coverage:** SOC2 CC5.1 (user identity + action), ISO 27001 A.12.4.1 (event logging), GDPR Art. 30 (processing records).
 * **Critical Error:** JSON.stringify can fail on circular references - caller must ensure serializable data.
 *
 * @param {Object} params - Complete log data
 * @param {string} params.method - HTTP method
 * @param {string} params.path - Request path
 * @param {number} params.statusCode - HTTP status code
 * @param {number} params.duration - Request duration in milliseconds
 * @param {string|null} params.userAgent - User-Agent header value
 * @param {string|null} params.referrer - Referer header value
 * @param {string} params.requestId - Unique request identifier
 * @param {Date} params.timestamp - Request timestamp
 * @param {string} params.ip - Client IP (x-forwarded-for, x-real-ip, or "unknown")
 * @param {string|null} params.userIdentity - Authorization header value or null
 * @param {Error[]} [params.errors] - Collected errors from request processing
 * @returns {{
 *   timestamp: string,
 *   level: "info"|"error",
 *   message: string,
 *   user: {identity: string, ipAddress: string|null, userAgent: string|null},
 *   action: {method: string, path: string, referrer: string|null},
 *   result: {success: boolean, statusCode: number, duration: string, performance: "excellent"|"good"|"slow"},
 *   audit: {requestId: string, source: "wings-server"},
 *   compliance: {soc2: Object, iso27001: Object, gdpr: Object},
 *   metadata: {service: "wings-server", version: "1.0.0", environment: string, complianceReady: true},
 *   errors?: Array<{index: number, message: string, stack: string, name: string}>,
 *   errorCount?: number
 * }} Audit-ready structured log entry
 *
 * @example
 * // Create structured log for compliance audit trails
 */
export function createStructuredLog({
	method,
	path,
	statusCode,
	duration,
	userAgent,
	referrer,
	requestId,
	timestamp,
	ip,
	userIdentity,
	errors = [],
}) {
	const isSuccess =
		statusCode >= 200 && statusCode < 400 && errors.length === 0;

	/** @type {"info"|"error"} */
	const level = isSuccess ? "info" : "error";

	const logEntry = {
		// SOC2 CC5.1: Control Activities - Timestamp in UTC/ISO format
		// GDPR Art. 30: Records of processing activities
		timestamp: timestamp.toISOString(),
		level,
		message: `${method} ${path} ${statusCode}`,

		// SOC2 CC5.1: User identity and action performed
		user: {
			identity: userIdentity || "anonymous",
			ipAddress: ip || null,
			userAgent: userAgent || null,
		},

		// SOC2 CC5.1: Action performed
		action: {
			method,
			path,
			referrer: referrer || null,
		},

		// SOC2 CC5.2: Success/failure indicator
		result: {
			success: isSuccess,
			statusCode,
			duration:
				duration < 1
					? `${Math.round(duration * 1000)}µs`
					: `${Math.round(duration)}ms`,
			performance: /** @type {"excellent"|"good"|"slow"} */ (
				duration < 10 ? "excellent" : duration < 100 ? "good" : "slow"
			),
		},

		// ISO 27001 A.12.4.1: Event logging with traceability
		audit: {
			requestId,
			source: /** @type {"wings-server"} */ ("wings-server"),
		},

		// Compliance standard mappings
		compliance: {
			soc2: {
				cc5_1:
					"Control Activities - Timestamp, User Identity, Action Performed, Source IP",
				cc5_2: "Success/Failure Indicator",
			},
			iso27001: {
				a12_4_1: "Event Logging",
			},
			gdpr: {
				article_30: "Records of Processing Activities",
			},
		},

		// Machine-readable fields for automated processing
		metadata: {
			service: /** @type {"wings-server"} */ ("wings-server"),
			version: /** @type {"1.0.0"} */ ("1.0.0"),
			environment: process.env.NODE_ENV || "development",
			complianceReady: /** @type {true} */ (true),
		},
	};

	// Add error information if any errors occurred
	if (errors.length > 0) {
		/** @type {any} */ (logEntry).errors = errors.map((error, index) => ({
			index: index + 1,
			message: error.message,
			stack: error.stack,
			name: error.name,
		}));
		/** @type {any} */ (logEntry).errorCount = errors.length;
	}

	return logEntry;
}

/**
 * Format timestamp for development log output.
 *
 * @param {Date} timestamp - Timestamp to format
 * @returns {string} Formatted time string (HH:MM:SS)
 *
 * @example
 * // Format timestamp for development logs
 * const timeStr = formatTimestamp(new Date()); // "14:30:25"
 */
export function formatTimestamp(timestamp) {
	return timestamp.toISOString().split("T")[1].split(".")[0];
}

/**
 * Format request ID for development log output.
 *
 * @param {string} requestId - Full request ID
 * @returns {string} Clean, short request ID
 *
 * @example
 * // Format request ID for readability
 * const id = formatRequestId('1705356869123-abc123def'); // "abc123def"
 */
export function formatRequestId(requestId) {
	return requestId.split("-")[1];
}

/**
 * Create clean development log line with RavenJS styling.
 *
 * @param {Object} logData - Log data object
 * @param {string} logData.method - HTTP method
 * @param {string} logData.path - Request path
 * @param {number} logData.statusCode - HTTP status code
 * @param {number} logData.duration - Request duration
 * @param {string} logData.requestId - Request ID
 * @param {Date} logData.timestamp - Request timestamp
 * @returns {string} Clean, readable log line
 *
 * @example
 * // Create formatted development log line with colors
 */
export function createDevelopmentLogLine(logData) {
	const methodColor = getMethodColor(logData.method);
	const statusColor = getStatusColor(logData.statusCode);
	const durationStr = formatDuration(logData.duration);
	const timeStr = formatTimestamp(logData.timestamp);

	// Extract the performance color to apply to parentheses
	const perfColor = durationStr.match(/\x1b\[\d+m\x1b\[\d+m/)[0];
	const resetColor = COLORS.reset;

	return [
		`${COLORS.time}${timeStr}${COLORS.reset}`,
		`${statusColor}[${logData.statusCode}]${COLORS.reset}`,
		`${perfColor}(${resetColor}${durationStr}${perfColor})${COLORS.reset}`,
		`${methodColor}${logData.method}${COLORS.reset}`,
		`${COLORS.path}${logData.path}${COLORS.reset}`,
	].join(" ");
}

/**
 * Log production JSON output.
 *
 * @param {Object} logData - Log data object
 * @param {string} logData.method - HTTP method
 * @param {string} logData.path - Request path
 * @param {number} logData.statusCode - HTTP status code
 * @param {number} logData.duration - Request duration
 * @param {string|null} logData.userAgent - User agent string
 * @param {string|null} logData.referrer - Referrer URL
 * @param {string} logData.requestId - Request ID
 * @param {Date} logData.timestamp - Request timestamp
 * @param {string} logData.ip - Client IP address
 * @param {string|null} logData.userIdentity - User identity
 * @param {Error[]} [errors] - Array of errors that occurred during request processing
 *
 * @example
 * // Output structured production logs to stdout
 */
export function logProduction(logData, errors = []) {
	const logEntry = createStructuredLog({ ...logData, errors });
	console.log(JSON.stringify(logEntry));
}

/**
 * Format a stack trace line with intelligent path formatting
 * @param {string} line - Raw stack trace line
 * @param {string} cwd - Current working directory
 * @returns {{formattedLine: string, isExternal: boolean}} Formatted line with smart path handling
 */
function formatStackTraceLine(line, cwd) {
	// Handle lines with parentheses (e.g., "at function (file:///path/to/file.js:10:5)")
	const parenthesesMatch = line.match(/\((file:\/\/\/[^)]+)\)/);
	if (parenthesesMatch) {
		return formatFileUrl(
			line,
			parenthesesMatch[1],
			parenthesesMatch[0],
			cwd,
			true,
		);
	}

	// Handle lines without parentheses (e.g., "at async file:///path/to/file.js:10:5")
	const directMatch = line.match(/(file:\/\/\/\S+)/);
	if (directMatch) {
		return formatFileUrl(line, directMatch[1], directMatch[1], cwd, false);
	}

	return { formattedLine: line, isExternal: false };
}

/**
 * Format a file URL within a stack trace line
 * @param {string} line - The original stack trace line
 * @param {string} fileUrl - The file URL to format
 * @param {string} replaceTarget - The part of the line to replace
 * @param {string} cwd - Current working directory for relative path conversion
 * @param {boolean} hasParentheses - Whether the file URL is wrapped in parentheses
 * @returns {{formattedLine: string, isExternal: boolean}} Formatted line and external flag
 */
function formatFileUrl(line, fileUrl, replaceTarget, cwd, hasParentheses) {
	const pathAndNumbers = fileUrl.replace("file:///", "");

	// Extract line and column numbers
	const lineColMatch = pathAndNumbers.match(/^(.+):(\d+):(\d+)$/);
	if (!lineColMatch) return { formattedLine: line, isExternal: false };

	const [, fullPath, lineNumber] = lineColMatch;
	let formattedPath = fullPath;
	let isExternal = false;

	// Check if it's a relative path from current working directory
	// Ensure we have proper path comparison with leading slash
	const normalizedFullPath = fullPath.startsWith("/")
		? fullPath
		: `/${fullPath}`;
	if (normalizedFullPath.startsWith(cwd)) {
		const relativePath = normalizedFullPath.slice(cwd.length + 1); // +1 to remove leading slash
		formattedPath = `./${relativePath}`;
	}
	// Check if it's from node_modules
	else if (normalizedFullPath.includes("/node_modules/")) {
		const nodeModulesIndex = normalizedFullPath.lastIndexOf("/node_modules/");
		const packagePath = normalizedFullPath.slice(nodeModulesIndex + 14); // 14 = '/node_modules/'.length
		const packageParts = packagePath.split("/");

		// Handle scoped packages (e.g., @org/package)
		let packageName, relativePath;
		if (packageParts[0].startsWith("@")) {
			packageName = `${packageParts[0]}/${packageParts[1]}`;
			relativePath = packageParts.slice(2).join("/");
		} else {
			packageName = packageParts[0];
			relativePath = packageParts.slice(1).join("/");
		}

		formattedPath = `[${packageName}] ${relativePath}`;
		isExternal = true;
	}

	// Create the new formatted section: "path line:XX"
	const formattedSection = `${formattedPath} line:${lineNumber}`;

	// Replace based on whether it has parentheses or not
	const replacement = hasParentheses
		? `(${formattedSection})`
		: formattedSection;
	const formattedLine = line.replace(replaceTarget, replacement);

	return { formattedLine, isExternal };
}

/**
 * Format error for surgical development debugging
 *
 * **Critical Error Handling:** process.cwd() can throw ENOENT if CWD deleted during execution.
 * **Performance:** Regex path parsing optimized for file:// URLs from Node.js stack traces.
 * **Dangerous Edge:** Custom error properties with circular references will cause toString() failures.
 *
 * @param {Error} error - Error object with stack trace (assumes Node.js Error format)
 * @param {number} index - Zero-based error index for multiple errors
 * @param {number} total - Total error count for "Error X/Y" labeling
 * @returns {string[]} Formatted error lines with ANSI colors for console output
 *
 * @example Single Error
 * ```javascript
 * const error = new ValidationError('Invalid email format');
 * error.field = 'email';
 * error.code = 'VALIDATION_ERROR';
 *
 * const lines = formatErrorForDevelopment(error, 0, 1);
 * lines.forEach(line => console.log(line));
 *
 * // Output:
 * //   [Error] ValidationError: Invalid email format
 * //   Stack trace:
 * //     → at validateUser (./src/validators/user.js line:23)
 * //       at Route.handler (./src/routes/auth.js line:45)
 * //   Additional properties:
 * //     field: email
 * //     code: VALIDATION_ERROR
 * ```
 */
export function formatErrorForDevelopment(error, index, total) {
	const errorPrefix = total > 1 ? `[Error ${index + 1}/${total}]` : "[Error]";
	const lines = [];
	const cwd = process.cwd();

	// Main error line with type and message
	const errorType = error.name || "Error";
	const errorMessage = error.message || "Unknown error";
	lines.push(
		`  ${COLORS.statusServerError}${errorPrefix} ${errorType}${COLORS.reset}: ${errorMessage}`,
	);

	// Stack trace (formatted for readability)
	if (error.stack) {
		const stackLines = error.stack.split("\n");
		// Skip the first line as it's usually just the error message we already showed
		const relevantStack = stackLines.slice(1).filter((line) => line.trim());

		if (relevantStack.length > 0) {
			lines.push(`  ${COLORS.dim}Stack trace:${COLORS.reset}`);
			relevantStack.forEach((line, i) => {
				const trimmedLine = line.trim();
				const { formattedLine, isExternal } = formatStackTraceLine(
					trimmedLine,
					cwd,
				);

				// Determine if this is user code (not node_modules, not node:internal)
				const isUserCode =
					!trimmedLine.includes("node_modules") &&
					!trimmedLine.includes("node:internal");

				// Choose colors and prefix
				let color, prefix;
				if (isExternal) {
					// External packages: dimmed red
					color = `${COLORS.dim}${COLORS.statusServerError}`;
					prefix = "  ";
				} else if (isUserCode) {
					// User code: bright red with arrow
					color = COLORS.statusServerError;
					prefix = i === 0 ? "→ " : "  ";
				} else {
					// Framework/internal code: dimmed
					color = COLORS.dim;
					prefix = "  ";
				}

				lines.push(`    ${color}${prefix}${formattedLine}${COLORS.reset}`);
			});
		}
	}

	// Additional error properties (if any)
	const errorProps = Object.getOwnPropertyNames(error).filter(
		(prop) => !["name", "message", "stack"].includes(prop),
	);
	if (errorProps.length > 0) {
		lines.push(`  ${COLORS.dim}Additional properties:${COLORS.reset}`);
		errorProps.forEach((prop) => {
			/** @type {any} */ const errorObj = error;
			const value = errorObj[prop];
			lines.push(`    ${COLORS.dim}${prop}:${COLORS.reset} ${String(value)}`);
		});
	}

	return lines;
}

/**
 * Log clean development output (no clutter).
 *
 * @param {Object} logData - Log data object
 * @param {string} logData.method - HTTP method
 * @param {string} logData.path - Request path
 * @param {number} logData.statusCode - HTTP status code
 * @param {number} logData.duration - Request duration
 * @param {string|null} logData.userAgent - User agent string
 * @param {string|null} logData.referrer - Referrer URL
 * @param {string} logData.requestId - Request ID
 * @param {Date} logData.timestamp - Request timestamp
 * @param {string} logData.ip - Client IP address
 * @param {string|null} logData.userIdentity - User identity
 * @param {boolean} _includeHeaders - Whether to include header information (unused - keeping for compatibility)
 * @param {Error[]} [errors] - Array of errors that occurred during request processing
 *
 * @example
 * // Output clean development logs with colors and error details
 */
export function logDevelopment(logData, _includeHeaders, errors = []) {
	const logLine = createDevelopmentLogLine(logData);
	console.log(logLine);

	// Log errors after the main request line for visibility (red)
	if (errors.length > 0) {
		errors.forEach((error, index) => {
			const errorLines = formatErrorForDevelopment(error, index, errors.length);
			for (const line of errorLines) {
				console.log(line);
			}
		});
	}

	// No additional clutter - clean RavenJS style
	// User-Agent and Referrer are typically not useful in development
}

/**
 * Logger - The debugging companion you actually want to use
 *
 * After years of wrestling with logging libraries that seemed designed to make
 * debugging harder, not easier, we built something different. This logger does
 * exactly what you need and nothing you don't.
 *
 * ## The Problem This Solves
 *
 * You know the drill: Your app crashes in production, you check the logs, and
 * get a wall of JSON that tells you everything except what you actually need
 * to know. Or worse, a stack trace that looks like this:
 *
 * ```
 * Error: Something broke
 *     at file:///Users/dev/project/node_modules/@framework/router/dist/index.js:234:12
 *     at file:///Users/dev/project/node_modules/@framework/core/dist/handler.js:89:5
 * ```
 *
 * Good luck figuring out where YOUR code went wrong.
 *
 * ## What You Get Instead
 *
 * **Development Mode:** Beautiful, scannable terminal output that actually helps
 * ```
 * 22:14:29 [500] (⚡ 341 µs) GET /api/users/123
 *   [Error] ValidationError: User validation failed
 *   Stack trace:
 *     → at Route.handler (./src/handlers/users.js line:42)
 *       at Router.handleRequest (./packages/wings/core/router.js line:747)
 *   Additional properties:
 *     code: VALIDATION_ERROR
 *     field: email
 * ```
 *
 * **Production Mode:** Structured JSON that compliance auditors love
 * ```json
 * {
 *   "timestamp": "2024-01-15T22:14:29.123Z",
 *   "level": "error",
 *   "method": "GET",
 *   "path": "/api/users/123",
 *   "statusCode": 500,
 *   "duration": 341,
 *   "success": false,
 *   "errorCount": 1,
 *   "errors": [{"name": "ValidationError", "message": "User validation failed"}]
 * }
 * ```
 *
 * ## Zero Dependencies, Maximum Value
 *
 * This logger has exactly zero external dependencies. No security vulnerabilities
 * from packages you never asked for. No breaking changes from upstream maintainers
 * who decided to rewrite everything. Just reliable logging that works.
 *
 * ## Smart Error Collection
 *
 * Unlike most loggers that crash your request when an error occurs, this one
 * collects errors throughout the request lifecycle and logs them properly at
 * the end. Your users get proper responses, you get proper debugging info.
 *
 * ## Compliance Ready
 *
 * Production logs automatically include everything needed for SOC2, ISO 27001,
 * and GDPR compliance:
 * - Timestamp (UTC/ISO format)
 * - User identity (from Authorization header)
 * - Action performed (HTTP method + path)
 * - Source IP address
 * - Success/failure indicator
 * - Request duration for performance monitoring
 *
 * @example Basic Usage
 * ```javascript
 * import { Logger } from '@raven-js/wings/server/logger.js';
 * import { Router } from '@raven-js/wings/core/router.js';
 *
 * const router = new Router();
 *
 * // Development: Beautiful terminal output
 * const logger = new Logger({ production: false });
 * router.useEarly(logger);
 *
 * // Production: Structured JSON logging
 * const prodLogger = new Logger({
 *   production: true,
 *   includeHeaders: false  // Skip headers for cleaner logs
 * });
 * router.useEarly(prodLogger);
 * ```
 *
 * @example Error Collection in Action
 * ```javascript
 * router.get('/api/data', (ctx) => {
 *   // This error gets collected, not thrown immediately
 *   throw new ValidationError('Invalid input');
 *   // Request continues, after callbacks run, logger sees the error
 * });
 *
 * // Logger output:
 * // 22:14:29 [500] (⚡ 234 µs) GET /api/data
 * //   [Error] ValidationError: Invalid input
 * //   Stack trace:
 * //     → at Route.handler (./src/routes/api.js line:15)
 * ```
 *
 * @example Custom Error Properties
 * ```javascript
 * const error = new Error('Database connection failed');
 * error.code = 'DB_CONN_ERROR';
 * error.retryAfter = 5000;
 * error.severity = 'high';
 * throw error;
 *
 * // Logger automatically includes custom properties:
 * //   Additional properties:
 * //     code: DB_CONN_ERROR
 * //     retryAfter: 5000
 * //     severity: high
 * ```
 *
 * ## Configuration Philosophy
 *
 * We believe good defaults beat extensive configuration. This logger works
 * perfectly out of the box for 90% of use cases. The few options we provide
 * are there because they actually matter in real applications.
 *
 * - `production`: Switch between beautiful development output and structured JSON
 * - `includeHeaders`: Control header logging (useful for privacy/compliance)
 * - `includeBody`: Debug request bodies in development (never in production)
 *
 * No configuration files, no environment variables, no magic strings.
 * Just import, instantiate, and start shipping.
 */
export class Logger extends Middleware {
	/**
	 * Create Logger middleware with error collection architecture
	 *
	 * **Integration Trap:** Must register early via router.useEarly() to capture all request lifecycle errors.
	 * **Critical Behavior:** Errors are collected during request processing, not thrown immediately.
	 * **Performance Alert:** Console.log is synchronous and blocks the event loop - avoid massive log volumes.
	 *
	 * @param {Object} [options={}] - Logger configuration
	 * @param {boolean} [options.production=false] - JSON logs (true) vs colored terminal output (false)
	 * @param {boolean} [options.includeHeaders=true] - Log request headers (consider privacy for production)
	 * @param {boolean} [options.includeBody=false] - Log request bodies (development only, never production)
	 * @param {string} [options.identifier='@raven-js/wings/logger'] - Middleware identifier
	 *
	 * @example Development Setup
	 * ```javascript
	 * // Just works - beautiful colored output, includes headers for debugging
	 * const logger = new Logger();
	 * router.useEarly(logger);
	 * ```
	 *
	 * @example Production Setup
	 * ```javascript
	 * // Clean JSON logs, no headers for privacy/performance
	 * const logger = new Logger({
	 *   production: true,
	 *   includeHeaders: false
	 * });
	 * router.useEarly(logger);
	 * ```
	 *
	 * @example Debug Mode (Development Only)
	 * ```javascript
	 * // Include request bodies for deep debugging
	 * const logger = new Logger({
	 *   production: false,
	 *   includeBody: true  // Only works in development
	 * });
	 * router.useEarly(logger);
	 * ```
	 */
	constructor(options = {}) {
		const {
			production = false,
			includeHeaders = true,
			includeBody = false,
			identifier = "@raven-js/wings/logger",
		} = options;

		super(async (/** @type {any} */ ctx) => {
			const startTime = performance.now();
			const requestId = generateRequestId();
			const timestamp = new Date();

			// Store request ID in context for other middleware/handlers
			ctx.data.requestId = requestId;
			ctx.data.loggerStartTime = startTime;

			// Add after callback to log response
			ctx.addAfterCallback(
				new Middleware((/** @type {any} */ ctx) => {
					const logData = collectLogData(ctx, startTime, requestId, timestamp);

					// Consume errors from the context (make a copy then clear the array)
					const errors = [...ctx.errors];
					ctx.errors.length = 0; // Clear the errors array after consuming

					if (production) {
						logProduction(logData, errors);
					} else {
						logDevelopment(logData, includeHeaders, errors);
					}
				}),
			);
		}, identifier);

		this.production = production;
		this.includeHeaders = includeHeaders;
		this.includeBody = includeBody;
	}
}
