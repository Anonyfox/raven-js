import { Middleware } from "../core/middleware.js";

/**
 * RavenJS color palette for terminal output
 * Designed for readability with black backgrounds and proper contrast
 */
const COLORS = {
	reset: "\x1b[0m",

	// Text colors
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	white: "\x1b[37m",
	black: "\x1b[30m",

	// Method with black backgrounds for perfect readability
	methodGet: "\x1b[92m\x1b[40m",    // Bright green on black
	methodPost: "\x1b[94m\x1b[40m",   // Bright blue on black
	methodPut: "\x1b[93m\x1b[40m",    // Bright yellow on black
	methodDelete: "\x1b[91m\x1b[40m", // Bright red on black
	methodPatch: "\x1b[95m\x1b[40m",  // Bright magenta on black
	methodOther: "\x1b[97m\x1b[40m",  // Bright white on black

	// Status with black backgrounds and colored text
	statusSuccess: "\x1b[92m\x1b[40m",     // Bright green on black
	statusRedirect: "\x1b[96m\x1b[40m",    // Bright cyan on black
	statusClientError: "\x1b[93m\x1b[40m", // Bright yellow on black
	statusServerError: "\x1b[91m\x1b[40m", // Bright red on black
	statusOther: "\x1b[97m\x1b[40m",       // Bright white on black

	// Performance highlighting (black background, bright colors)
	perfExcellent: "\x1b[92m\x1b[40m",     // Bright green on black
	perfGood: "\x1b[96m\x1b[40m",          // Bright cyan on black
	perfSlow: "\x1b[93m\x1b[40m",          // Bright yellow on black
	perfVerySlow: "\x1b[91m\x1b[40m",      // Bright red on black

	// Path and other elements
	path: "\x1b[96m",        // Bright cyan
	time: "\x1b[90m",        // Gray
	requestId: "\x1b[90m",   // Gray
};

/**
 * Generate a unique request ID for traceability
 * @returns {string} A unique request identifier
 */
export function generateRequestId() {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}



/**
 * Get status code color with background for terminal output
 * @param {number} statusCode - HTTP status code
 * @returns {string} ANSI color code with background
 */
export function getStatusColor(statusCode) {
	if (statusCode >= 200 && statusCode < 300) return COLORS.statusSuccess;
	if (statusCode >= 300 && statusCode < 400) return COLORS.statusRedirect;
	if (statusCode >= 400 && statusCode < 500) return COLORS.statusClientError;
	if (statusCode >= 500 && statusCode < 600) return COLORS.statusServerError;
	return COLORS.statusOther;
}

/**
 * Get HTTP method color with background for terminal output
 * @param {string} method - HTTP method
 * @returns {string} ANSI color code with background
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
 * Format duration with performance indicators that POP visually
 * @param {number} duration - Duration in milliseconds
 * @returns {string} High-contrast duration string with performance indicator
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
		unit = "s ";  // Extra space for visual alignment with µs/ms
		icon = "⚠";
		color = COLORS.perfVerySlow;
	}

	// Format: icon + space + right-aligned 3-digit number + space + unit
	const formattedValue = value.toString().padStart(3);
	return `${color}${icon} ${formattedValue} ${unit}${COLORS.reset}`;
}

/**
 * Collect all log data from context and timing information
 * @param {import('../core/context.js').Context} ctx - Request context
 * @param {number} startTime - Request start time from performance.now()
 * @param {string} requestId - Generated request ID
 * @param {Date} timestamp - Request timestamp
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
 * }} Collected log data
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
 * Create structured JSON log entry compliant with SOC2, ISO 27001, and GDPR
 * @param {Object} params - Log parameters
 * @param {string} params.method - HTTP method
 * @param {string} params.path - Request path
 * @param {number} params.statusCode - HTTP status code
 * @param {number} params.duration - Request duration in milliseconds
 * @param {string|null} params.userAgent - User agent string
 * @param {string|null} params.referrer - Referrer URL
 * @param {string} params.requestId - Unique request identifier
 * @param {Date} params.timestamp - Request timestamp
 * @param {string} params.ip - Client IP address
 * @param {string|null} params.userIdentity - User identity (from auth headers)
 * @param {Error[]} [params.errors] - Array of errors that occurred during request processing
 * @returns {{
 *   timestamp: string,
 *   level: string,
 *   message: string,
 *   user: {identity: string, ipAddress: string|null, userAgent: string|null},
 *   action: {method: string, path: string, referrer: string|null},
 *   result: {success: boolean, statusCode: number, duration: string, performance: string},
 *   audit: {requestId: string, source: string, environment: string},
 *   compliance: Object,
 *   metadata: Object,
 *   errors?: Array<{index: number, message: string, stack: string, name: string}>,
 *   errorCount?: number
 * }} Structured log entry
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
	const isSuccess = statusCode >= 200 && statusCode < 400 && errors.length === 0;

	const logEntry = {
		// SOC2 CC5.1: Control Activities - Timestamp in UTC/ISO format
		// GDPR Art. 30: Records of processing activities
		timestamp: timestamp.toISOString(),
		level: isSuccess ? "info" : "error",
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
			duration: duration < 1 ? `${Math.round(duration * 1000)}µs` : `${Math.round(duration)}ms`,
			performance:
				duration < 10 ? "excellent" : duration < 100 ? "good" : "slow",
		},

		// ISO 27001 A.12.4.1: Event logging with traceability
		audit: {
			requestId,
			source: "wings-server",
			environment: process.env.NODE_ENV || "development",
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
			service: "wings-server",
			version: "1.0.0",
			complianceReady: true,
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
 * Format timestamp for development log output
 * @param {Date} timestamp - Timestamp to format
 * @returns {string} Formatted time string (HH:MM:SS)
 */
export function formatTimestamp(timestamp) {
	return timestamp.toISOString().split("T")[1].split(".")[0];
}

/**
 * Format request ID for development log output
 * @param {string} requestId - Full request ID
 * @returns {string} Clean, short request ID
 */
export function formatRequestId(requestId) {
	return requestId.split("-")[1];
}

/**
 * Create clean development log line with RavenJS styling
 * @param {Object} logData - Log data object
 * @param {string} logData.method - HTTP method
 * @param {string} logData.path - Request path
 * @param {number} logData.statusCode - HTTP status code
 * @param {number} logData.duration - Request duration
 * @param {string} logData.requestId - Request ID
 * @param {Date} logData.timestamp - Request timestamp
 * @returns {string} Clean, readable log line
 */
export function createDevelopmentLogLine(logData) {
	const methodColor = getMethodColor(logData.method);
	const statusColor = getStatusColor(logData.statusCode);
	const durationStr = formatDuration(logData.duration);
	const timeStr = formatTimestamp(logData.timestamp);

	// Extract the performance color to apply to parentheses
	const perfColor = durationStr.match(/\x1b\[\d+m\x1b\[\d+m/)?.[0] || "";
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
 * Log production JSON output
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
 */
export function logProduction(logData, errors = []) {
	const logEntry = createStructuredLog({ ...logData, errors });
	console.log(JSON.stringify(logEntry));
}

/**
 * Format error message for development output with red color and full details
 * @param {Error} error - Error object to format
 * @param {number} index - Error index (for multiple errors)
 * @param {number} total - Total number of errors
 * @returns {string[]} Array of formatted error lines with indentation
 */
export function formatErrorForDevelopment(error, index, total) {
	const errorPrefix = total > 1 ? `[Error ${index + 1}/${total}]` : '[Error]';
	const lines = [];

	// Main error line with type and message
	const errorType = error.name || 'Error';
	const errorMessage = error.message || 'Unknown error';
	lines.push(`  ${COLORS.statusServerError}${errorPrefix} ${errorType}${COLORS.reset}: ${errorMessage}`);

	// Stack trace (formatted for readability)
	if (error.stack) {
		const stackLines = error.stack.split('\n');
		// Skip the first line as it's usually just the error message we already showed
		const relevantStack = stackLines.slice(1).filter(line => line.trim());

		if (relevantStack.length > 0) {
			lines.push(`  ${COLORS.dim}Stack trace:${COLORS.reset}`);
			relevantStack.forEach((line, i) => {
				const trimmedLine = line.trim();
				if (trimmedLine) {
					// Highlight the actual error location (usually the first non-node_modules line)
					const isUserCode = !trimmedLine.includes('node_modules') && !trimmedLine.includes('node:internal');
					const color = isUserCode ? COLORS.statusServerError : COLORS.dim;
					const prefix = i === 0 && isUserCode ? '→ ' : '  ';
					lines.push(`    ${color}${prefix}${trimmedLine}${COLORS.reset}`);
				}
			});
		}
	}

	// Additional error properties (if any)
	const errorProps = Object.getOwnPropertyNames(error).filter(
		prop => !['name', 'message', 'stack'].includes(prop)
	);
	if (errorProps.length > 0) {
		lines.push(`  ${COLORS.dim}Additional properties:${COLORS.reset}`);
		errorProps.forEach(prop => {
			/** @type {any} */ const errorObj = error;
			const value = errorObj[prop];
			lines.push(`    ${COLORS.dim}${prop}:${COLORS.reset} ${String(value)}`);
		});
	}

	return lines;
}

/**
 * Log clean development output (no clutter)
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
 * Logger middleware for Wings framework
 *
 * Provides both colored terminal output for development and structured JSON logging
 * for production environments. **Compliance-ready out of the box** with SOC2, ISO 27001, and GDPR standards.
 *
 * **Compliance Standards:**
 * - **SOC2** (CC5.1, CC5.2): Control Activities, Success/Failure Indicators
 * - **ISO 27001** (A.12.4.1): Event Logging
 * - **GDPR** (Art. 30): Records of Processing Activities
 *
 * **Required Fields Automatically Captured:**
 * - Timestamp (UTC/ISO format)
 * - User identity (from Authorization header)
 * - Action performed (HTTP method + path)
 * - Source IP address
 * - Success/failure indicator
 *
 * @example
 * ```javascript
 * import { Logger } from './logger.js';
 * import { Router } from '../core/router.js';
 *
 * const router = new Router();
 *
 * // Development mode - modern colored terminal output
 * router.useEarly(new Logger());
 *
 * // Production mode - structured JSON logging (compliance-ready)
 * router.useEarly(new Logger({
 *   production: true,
 *   includeHeaders: false
 * }));
 * ```
 */
export class Logger extends Middleware {
	/**
	 * Create a new Logger middleware instance
	 * @param {Object} options - Logger configuration options
	 * @param {boolean} [options.production=false] - Enable production mode (JSON logging)
	 * @param {boolean} [options.includeHeaders=true] - Include request headers in logs
	 * @param {boolean} [options.includeBody=false] - Include request body in logs (development only)
	 * @param {string} [options.identifier='@raven-js/wings/logger'] - Middleware identifier
	 */
	constructor(options = {}) {
		const {
			production = false,
			includeHeaders = true,
			includeBody = false,
			identifier = "@raven-js/wings/logger",
		} = options;

		super(async (ctx) => {
			const startTime = performance.now();
			const requestId = generateRequestId();
			const timestamp = new Date();

			// Store request ID in context for other middleware/handlers
			ctx.data.requestId = requestId;
			ctx.data.loggerStartTime = startTime;

			// Add after callback to log response
			ctx.addAfterCallback(
				new Middleware((ctx) => {
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
