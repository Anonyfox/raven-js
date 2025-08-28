/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive integration tests for documentation server
 *
 * End-to-end testing with real file system, server startup, HTTP requests,
 * and HTML response validation. Tests complex scenarios including re-exports,
 * cross-references, and identifier preservation across multiple packages.
 */

import assert from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { startDocumentationServer } from "./index.js";

describe("Documentation Server Integration", () => {
	/** @type {string} */
	let tempDir;
	/** @type {Object} */
	let server;
	/** @type {number} */
	let port;

	before(async () => {
		// Create temporary directory for test project
		tempDir = await mkdtemp(join(tmpdir(), "glean-integration-"));
		port = 3100 + Math.floor(Math.random() * 100); // Random port to avoid conflicts

		console.log(`\n🧪 Test setup: Creating project in ${tempDir}`);

		// Create realistic project structure with complex export patterns
		await createTestProject(tempDir);

		console.log(`🚀 Starting server for ${tempDir} on port ${port}`);

		// Debug: Check what was actually created (can be removed later)
		const { readdirSync, existsSync, readFileSync } = await import("node:fs");
		console.log("📁 Files created:", readdirSync(tempDir));
		const pkgPath = join(tempDir, "package.json");
		if (existsSync(pkgPath)) {
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			console.log(
				"📦 Package.json:",
				pkg.name,
				pkg.version,
				Object.keys(pkg.exports || {}),
			);
		}

		// Start documentation server
		server = await startDocumentationServer(tempDir, {
			port,
			domain: "test.docs.com",
			enableLogging: false,
		});

		// Give server a moment to fully initialize
		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	after(async () => {
		// Clean up server and temporary files
		if (server && typeof server.close === "function") {
			server.close();
		}
		if (tempDir) {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	test("serves package overview with all identifiers", async () => {
		const response = await fetch(`http://localhost:${port}/`);
		assert.strictEqual(response.status, 200);

		const html = await response.text();
		console.log("🔍 Homepage HTML length:", html.length);
		console.log("🔍 Homepage contains:", {
			packageName: html.includes("test-integration-project"),
			version: html.includes("1.0.0"),
			modules: html.includes("Modules"),
			entities: html.includes("Entities"),
			utils: html.includes("utils"),
			api: html.includes("api"),
			index: html.includes("index"),
		});

		// Debug: Show any links to modules that exist
		const moduleLinks = html.match(/\/modules\/[^/]+\//g);
		console.log("🔍 Found module links:", moduleLinks);

		// Should contain package information
		assert(html.includes("test-integration-project"), "Contains package name");
		assert(html.includes("1.0.0"), "Contains version");
		assert(html.includes("Integration test package"), "Contains description");

		// Should contain module links (using actual detected module names)
		assert(
			html.includes("/modules/test-integration-project/"),
			"Contains main module link",
		);
		assert(html.includes("/modules/utils/"), "Contains utils module link");
		assert(html.includes("/modules/api/"), "Contains api module link");

		// Should contain statistics
		assert(html.includes("Modules"), "Contains module statistics");
		assert(html.includes("Entities"), "Contains entity statistics");
	});

	test("serves module directory with all modules", async () => {
		const response = await fetch(`http://localhost:${port}/modules/`);
		assert.strictEqual(response.status, 200);

		const html = await response.text();
		console.log("🔍 Modules page HTML length:", html.length);
		console.log(
			"🔍 Modules page content (first 1000 chars):",
			html.substring(0, 1000),
		);

		// Should list all modules (using actual detected module names)
		assert(html.includes("test-integration-project"), "Lists main module");
		assert(html.includes("utils"), "Lists utils module");
		assert(html.includes("api"), "Lists api module");

		// Should contain module descriptions
		assert(html.includes("Utility functions"), "Contains utils description");
		assert(html.includes("API handlers"), "Contains api description");
		assert(
			html.includes("Main package exports"),
			"Contains main module description",
		);
	});

	test("serves utils module with original function names", async () => {
		const response = await fetch(`http://localhost:${port}/modules/utils/`);
		assert.strictEqual(response.status, 200);

		const html = await response.text();

		// Original function names should appear
		assert(html.includes("formatText"), "Contains formatText function");
		assert(html.includes("calculateSum"), "Contains calculateSum function");
		assert(html.includes("validateEmail"), "Contains validateEmail function");
		assert(html.includes("UtilityClass"), "Contains UtilityClass class");

		// Should contain JSDoc descriptions
		assert(
			html.includes("Format text with various options"),
			"Contains formatText description",
		);
		assert(
			html.includes("Calculate sum of numbers"),
			"Contains calculateSum description",
		);
		assert(
			html.includes("Validate email address format"),
			"Contains validateEmail description",
		);

		// Should contain links to individual entity pages
		assert(
			html.includes("/modules/utils/formatText/"),
			"Contains formatText link",
		);
		assert(
			html.includes("/modules/utils/calculateSum/"),
			"Contains calculateSum link",
		);
		assert(
			html.includes("/modules/utils/UtilityClass/"),
			"Contains UtilityClass link",
		);
	});

	test("serves api module with handler functions", async () => {
		const response = await fetch(`http://localhost:${port}/modules/api/`);
		assert.strictEqual(response.status, 200);

		const html = await response.text();

		// API handler names should appear
		assert(html.includes("handleRequest"), "Contains handleRequest function");
		assert(html.includes("processData"), "Contains processData function");
		assert(html.includes("sendResponse"), "Contains sendResponse function");
		assert(html.includes("ApiError"), "Contains ApiError class");

		// Should contain JSDoc descriptions
		assert(
			html.includes("Handle incoming HTTP request"),
			"Contains handleRequest description",
		);
		assert(
			html.includes("Process request data"),
			"Contains processData description",
		);
	});

	test("serves main module with re-exported functions", async () => {
		const response = await fetch(
			`http://localhost:${port}/modules/test-integration-project/`,
		);
		assert.strictEqual(response.status, 200);

		const html = await response.text();

		// Re-exported functions should appear with original names
		assert(html.includes("formatText"), "Contains re-exported formatText");
		assert(html.includes("calculateSum"), "Contains re-exported calculateSum");
		assert(
			html.includes("handleRequest"),
			"Contains re-exported handleRequest",
		);
		assert(html.includes("processData"), "Contains re-exported processData");

		// Should show re-export information
		assert(html.includes("from"), "Shows re-export source");
	});

	test("serves formatText entity page with complete documentation", async () => {
		const response = await fetch(
			`http://localhost:${port}/modules/utils/formatText/`,
		);
		assert.strictEqual(response.status, 200);

		const html = await response.text();

		// Function name and signature
		assert(html.includes("formatText"), "Contains function name");
		assert(html.includes("text"), "Contains parameter name");
		assert(html.includes("options"), "Contains options parameter");

		// JSDoc documentation
		assert(
			html.includes("Format text with various options"),
			"Contains description",
		);
		assert(html.includes("uppercase"), "Contains option details");
		assert(html.includes("string"), "Contains return type");

		// Navigation breadcrumbs
		assert(html.includes("utils"), "Contains module breadcrumb");
		assert(html.includes("formatText"), "Contains entity breadcrumb");
	});

	test("shows re-exported functions in multiple locations", async () => {
		// Check formatText appears in utils module
		const utilsResponse = await fetch(
			`http://localhost:${port}/modules/utils/`,
		);
		const utilsHtml = await utilsResponse.text();
		assert(
			utilsHtml.includes("formatText"),
			"formatText appears in utils module",
		);

		// Check formatText appears in main module (re-exported)
		const mainResponse = await fetch(
			`http://localhost:${port}/modules/test-integration-project/`,
		);
		const mainHtml = await mainResponse.text();
		assert(
			mainHtml.includes("formatText"),
			"formatText appears in main module",
		);

		// Check both link to the same entity page
		assert(
			utilsHtml.includes("/modules/utils/formatText/"),
			"utils links to formatText entity",
		);
		assert(
			mainHtml.includes("/modules/utils/formatText/"),
			"main module links to formatText entity",
		);
	});

	test("validates cross-references between modules", async () => {
		const response = await fetch(
			`http://localhost:${port}/modules/api/processData/`,
		);
		assert.strictEqual(response.status, 200);

		const html = await response.text();

		// Should contain cross-references to utils module
		assert(
			html.includes("validateEmail"),
			"References validateEmail from utils",
		);
		assert(html.includes("formatText"), "References formatText from utils");

		// Cross-reference links should work
		assert(
			html.includes("/modules/utils/validateEmail/"),
			"Links to validateEmail entity",
		);
		assert(
			html.includes("/modules/utils/formatText/"),
			"Links to formatText entity",
		);
	});

	test("serves sitemap with all documentation URLs", async () => {
		const response = await fetch(`http://localhost:${port}/sitemap.xml`);
		assert.strictEqual(response.status, 200);
		assert.strictEqual(
			response.headers.get("content-type"),
			"application/xml; charset=utf-8",
		);

		const xml = await response.text();

		// Should contain all major page URLs
		assert(
			xml.includes(`<loc>https://test.docs.com/</loc>`),
			"Contains package overview URL",
		);
		assert(
			xml.includes(`<loc>https://test.docs.com/modules/</loc>`),
			"Contains module directory URL",
		);

		assert(
			xml.includes(`<loc>https://test.docs.com/modules/utils/</loc>`),
			"Contains utils module URL",
		);
		assert(
			xml.includes(`<loc>https://test.docs.com/modules/api/</loc>`),
			"Contains api module URL",
		);
		assert(
			xml.includes(
				`<loc>https://test.docs.com/modules/test-integration-project/</loc>`,
			),
			"Contains main module URL",
		);

		// Should contain entity URLs
		assert(
			xml.includes(
				`<loc>https://test.docs.com/modules/utils/formatText/</loc>`,
			),
			"Contains formatText URL",
		);
		assert(
			xml.includes(
				`<loc>https://test.docs.com/modules/api/handleRequest/</loc>`,
			),
			"Contains handleRequest URL",
		);
	});

	test("handles 404 errors gracefully", async () => {
		// Non-existent module
		const response1 = await fetch(
			`http://localhost:${port}/modules/nonexistent/`,
		);
		assert.strictEqual(response1.status, 404);

		// Non-existent entity
		const response2 = await fetch(
			`http://localhost:${port}/modules/utils/nonexistent/`,
		);
		assert.strictEqual(response2.status, 404);

		// Invalid path
		const response3 = await fetch(`http://localhost:${port}/invalid/path/`);
		assert.strictEqual(response3.status, 404);
	});

	test("serves static assets correctly", async () => {
		// Bootstrap CSS
		const cssResponse = await fetch(
			`http://localhost:${port}/bootstrap.min.css`,
		);
		assert.strictEqual(cssResponse.status, 200);
		assert(cssResponse.headers.get("content-type").includes("text/css"));

		// Bootstrap JS
		const jsResponse = await fetch(`http://localhost:${port}/bootstrap.esm.js`);
		assert.strictEqual(jsResponse.status, 200);
		assert(jsResponse.headers.get("content-type").includes("javascript"));

		// Favicon
		const iconResponse = await fetch(`http://localhost:${port}/favicon.ico`);
		assert.strictEqual(iconResponse.status, 200);
		assert(iconResponse.headers.get("content-type").includes("image"));
	});
});

/**
 * Create realistic test project with complex export patterns
 * @param {string} tempDir - Temporary directory path
 */
async function createTestProject(tempDir) {
	// Create package.json with multiple export entry points (each is a module)
	await writeFile(
		join(tempDir, "package.json"),
		JSON.stringify(
			{
				name: "test-integration-project",
				version: "1.0.0",
				description: "Integration test package with complex exports",
				type: "module",
				main: "index.js",
				exports: {
					".": "./index.js",
					"./utils": "./utils.js",
					"./api": "./api.js",
				},
			},
			null,
			2,
		),
	);

	// Create README.md
	await writeFile(
		join(tempDir, "README.md"),
		`# Test Integration Project

This is a test project for integration testing of the documentation generator.

## Features

- Complex export patterns
- Re-exports across modules
- Cross-references between functions
- Multiple entity types

## Usage

\`\`\`javascript
import { formatText, calculateSum } from 'test-integration-project';

const result = formatText('hello world', { uppercase: true });
const sum = calculateSum([1, 2, 3, 4, 5]);
\`\`\`
`,
	);

	// Create utils.js with various functions
	await writeFile(
		join(tempDir, "utils.js"),
		`/**
 * @file Utility functions for text processing and calculations
 *
 * Provides essential utility functions used throughout the application.
 * All functions are pure and have no side effects.
 */

/**
 * Format text with various options
 * @param {string} text - Input text to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.uppercase=false] - Convert to uppercase
 * @param {boolean} [options.trim=true] - Trim whitespace
 * @param {string} [options.prefix=''] - Add prefix to text
 * @returns {string} Formatted text
 * @example
 * formatText('hello world', { uppercase: true });
 * // Returns: 'HELLO WORLD'
 */
export function formatText(text, options = {}) {
	const { uppercase = false, trim = true, prefix = '' } = options;
	let result = trim ? text.trim() : text;
	if (uppercase) result = result.toUpperCase();
	return prefix + result;
}

/**
 * Calculate sum of numbers with validation
 * @param {number[]} numbers - Array of numbers to sum
 * @returns {number} Sum of all numbers
 * @throws {Error} When invalid input provided
 * @example
 * calculateSum([1, 2, 3, 4, 5]);
 * // Returns: 15
 */
export function calculateSum(numbers) {
	if (!Array.isArray(numbers)) {
		throw new Error('Input must be an array');
	}

	return numbers.reduce((sum, num) => {
		if (typeof num !== 'number') {
			throw new Error('All elements must be numbers');
		}
		return sum + num;
	}, 0);
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid format
 * @example
 * validateEmail('user@example.com');
 * // Returns: true
 */
export function validateEmail(email) {
	const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
	return emailRegex.test(email);
}

/**
 * Utility class for advanced text operations
 * @example
 * const util = new UtilityClass();
 * util.processText('hello world');
 */
export class UtilityClass {
	/**
	 * Create new utility instance
	 * @param {Object} [config] - Configuration options
	 * @param {string} [config.defaultPrefix=''] - Default prefix for operations
	 */
	constructor(config = {}) {
		this.config = { defaultPrefix: '', ...config };
	}

	/**
	 * Process text with utility methods
	 * @param {string} text - Text to process
	 * @returns {string} Processed text
	 */
	processText(text) {
		return formatText(text, {
			prefix: this.config.defaultPrefix,
			trim: true
		});
	}

	/**
	 * Validate and format email
	 * @param {string} email - Email to validate and format
	 * @returns {{valid: boolean, formatted: string}} Validation result
	 */
	validateAndFormatEmail(email) {
		const valid = validateEmail(email);
		const formatted = valid ? email.toLowerCase().trim() : '';
		return { valid, formatted };
	}
}
`,
	);

	// Create api.js with handler functions
	await writeFile(
		join(tempDir, "api.js"),
		`/**
 * @file API handlers and request processing
 *
 * HTTP request handlers with data validation and response formatting.
 * Uses utility functions for data processing and validation.
 */

import { validateEmail, formatText } from './utils.js';

/**
 * Handle incoming HTTP request
 * @param {Object} request - HTTP request object
 * @param {string} request.method - HTTP method
 * @param {string} request.path - Request path
 * @param {Object} request.headers - Request headers
 * @returns {Promise<Object>} Response object
 * @example
 * const response = await handleRequest({
 *   method: 'GET',
 *   path: '/api/users',
 *   headers: {}
 * });
 */
export async function handleRequest(request) {
	try {
		const data = await processData(request);
		return sendResponse(200, data);
	} catch (error) {
		if (error instanceof ApiError) {
			return sendResponse(error.statusCode, { error: error.message });
		}
		return sendResponse(500, { error: 'Internal server error' });
	}
}

/**
 * Process request data with validation
 * @param {Object} request - Request object to process
 * @returns {Promise<Object>} Processed data
 * @throws {ApiError} When validation fails
 * @see {@link validateEmail} - Email validation function
 * @see {@link formatText} - Text formatting function
 */
export async function processData(request) {
	const { body, query } = request;

	// Validate email if provided
	if (body?.email && !validateEmail(body.email)) {
		throw new ApiError(400, 'Invalid email format');
	}

	// Format text fields
	if (body?.name) {
		body.name = formatText(body.name, { trim: true });
	}

	return {
		processedAt: new Date().toISOString(),
		data: body,
		query: query
	};
}

/**
 * Send HTTP response with formatting
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @returns {Object} Formatted response
 */
export function sendResponse(statusCode, data) {
	return {
		statusCode,
		headers: {
			'Content-Type': 'application/json',
			'X-API-Version': '1.0.0'
		},
		body: JSON.stringify(data)
	};
}

/**
 * Custom API error class
 * @extends Error
 */
export class ApiError extends Error {
	/**
	 * Create API error
	 * @param {number} statusCode - HTTP status code
	 * @param {string} message - Error message
	 */
	constructor(statusCode, message) {
		super(message);
		this.name = 'ApiError';
		this.statusCode = statusCode;
	}
}
`,
	);

	// Create index.js with re-exports
	await writeFile(
		join(tempDir, "index.js"),
		`/**
 * @file Main package exports with re-exports from other modules
 *
 * Central export hub that re-exports commonly used functions and classes
 * from various modules. Provides a clean public API for the package.
 */

// Re-export utility functions
export {
	formatText,
	calculateSum,
	validateEmail,
	UtilityClass
} from './utils.js';

// Re-export API handlers
export {
	handleRequest,
	processData,
	sendResponse,
	ApiError
} from './api.js';

/**
 * Package version information
 * @constant {string}
 */
export const VERSION = '1.0.0';

/**
 * Initialize package with configuration
 * @param {Object} config - Package configuration
 * @param {boolean} [config.enableLogging=false] - Enable debug logging
 * @param {string} [config.apiVersion='1.0.0'] - API version to use
 * @returns {Object} Initialized package instance
 */
export function initialize(config = {}) {
	const { enableLogging = false, apiVersion = '1.0.0' } = config;

	if (enableLogging) {
		console.log(\`Initializing package v\${VERSION} with API v\${apiVersion}\`);
	}

	return {
		version: VERSION,
		apiVersion,
		logging: enableLogging,
		utilities: {
			formatText,
			calculateSum,
			validateEmail
		},
		api: {
			handleRequest,
			processData,
			sendResponse
		}
	};
}
`,
	);
}
