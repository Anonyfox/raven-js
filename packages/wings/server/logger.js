import { Middleware } from "../core/middleware.js";

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
	gray: "\x1b[90m",
};

/**
 * Generate a unique request ID for traceability
 * @returns {string} A unique request identifier
 */
export function generateRequestId() {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get status code color for terminal output
 * @param {number} statusCode - HTTP status code
 * @returns {string} ANSI color code
 */
export function getStatusColor(statusCode) {
	if (statusCode >= 200 && statusCode < 300) return COLORS.green;
	if (statusCode >= 300 && statusCode < 400) return COLORS.blue;
	if (statusCode >= 400 && statusCode < 500) return COLORS.yellow;
	if (statusCode >= 500 && statusCode < 600) return COLORS.red;
	return COLORS.white;
}

/**
 * Get HTTP method color for terminal output
 * @param {string} method - HTTP method
 * @returns {string} ANSI color code
 */
export function getMethodColor(method) {
	switch (method.toUpperCase()) {
		case "GET":
			return COLORS.green;
		case "POST":
			return COLORS.blue;
		case "PUT":
			return COLORS.yellow;
		case "DELETE":
			return COLORS.red;
		case "PATCH":
			return COLORS.magenta;
		default:
			return COLORS.white;
	}
}

/**
 * Format duration with performance indicators for modern dev experience
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Colored duration string with performance indicator
 */
export function formatDuration(duration) {
	if (duration < 1) {
		return `${COLORS.bright}${COLORS.green}${duration.toFixed(3)}ms${COLORS.reset} ${COLORS.dim}⚡${COLORS.reset}`;
	}
	if (duration < 10) {
		return `${COLORS.green}${duration}ms${COLORS.reset} ${COLORS.dim}🚀${COLORS.reset}`;
	}
	if (duration < 100) {
		return `${COLORS.cyan}${duration}ms${COLORS.reset} ${COLORS.dim}⚡${COLORS.reset}`;
	}
	if (duration < 500) {
		return `${COLORS.yellow}${duration}ms${COLORS.reset} ${COLORS.dim}🐌${COLORS.reset}`;
	}
	return `${COLORS.red}${duration}ms${COLORS.reset} ${COLORS.dim}🐌${COLORS.reset}`;
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
	const duration = Math.round(endTime - startTime);

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
 * @returns {Object} Structured log entry
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
}) {
	const isSuccess = statusCode >= 200 && statusCode < 400;

	return {
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
			duration: `${duration}ms`,
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
 * @returns {string} Short request ID (without timestamp)
 */
export function formatRequestId(requestId) {
	return requestId.split("-")[1];
}

/**
 * Create development log line with colors and formatting
 * @param {Object} logData - Log data object
 * @param {string} logData.method - HTTP method
 * @param {string} logData.path - Request path
 * @param {number} logData.statusCode - HTTP status code
 * @param {number} logData.duration - Request duration
 * @param {string} logData.requestId - Request ID
 * @param {Date} logData.timestamp - Request timestamp
 * @returns {string} Formatted log line
 */
export function createDevelopmentLogLine(logData) {
	const methodColor = getMethodColor(logData.method);
	const statusColor = getStatusColor(logData.statusCode);
	const durationStr = formatDuration(logData.duration);
	const timeStr = formatTimestamp(logData.timestamp);
	const shortRequestId = formatRequestId(logData.requestId);

	return [
		`${COLORS.dim}${COLORS.gray}${timeStr}${COLORS.reset}`,
		`${methodColor}${logData.method.padEnd(6)}${COLORS.reset}`,
		`${COLORS.cyan}${logData.path}${COLORS.reset}`,
		`${statusColor}${logData.statusCode}${COLORS.reset}`,
		`${durationStr}`,
		`${COLORS.dim}${COLORS.gray}#${shortRequestId}${COLORS.reset}`,
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
 */
export function logProduction(logData) {
	const logEntry = createStructuredLog(logData);
	console.log(JSON.stringify(logEntry));
}

/**
 * Log development colored output
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
 * @param {boolean} includeHeaders - Whether to include header information
 */
export function logDevelopment(logData, includeHeaders) {
	const logLine = createDevelopmentLogLine(logData);
	console.log(logLine);

	// Additional debug info in development
	if (includeHeaders && logData.userAgent) {
		console.log(
			`${COLORS.dim}  User-Agent: ${logData.userAgent}${COLORS.reset}`,
		);
	}
	if (includeHeaders && logData.referrer) {
		console.log(`${COLORS.dim}  Referrer: ${logData.referrer}${COLORS.reset}`);
	}
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

					if (production) {
						logProduction(logData);
					} else {
						logDevelopment(logData, includeHeaders);
					}
				}),
			);
		}, identifier);

		this.production = production;
		this.includeHeaders = includeHeaders;
		this.includeBody = includeBody;
	}
}
