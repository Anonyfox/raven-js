/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JSDoc file tag model.
 *
 * Ravens test territorial claim documentation with methodical precision.
 * Verifies file-level description parsing, validation, and output generation.
 */

import { strictEqual } from "node:assert";
import { test } from "node:test";
import { JSDocFileTag } from "./jsdoc-file-tag.js";

test("JSDocFileTag - basic file description", () => {
	const tag = new JSDocFileTag(
		"Main application entry point with configuration setup",
	);

	strictEqual(
		tag.description,
		"Main application entry point with configuration setup",
		"Should parse description correctly",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocFileTag - multi-line description", () => {
	const tag = new JSDocFileTag(
		"User authentication module handling login, logout, and session management.\nIncludes JWT token processing and password validation utilities.",
	);

	strictEqual(
		tag.description,
		"User authentication module handling login, logout, and session management.\nIncludes JWT token processing and password validation utilities.",
		"Should preserve multi-line content",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocFileTag - detailed module description", () => {
	const tag = new JSDocFileTag(
		"Core router implementation providing HTTP request routing and middleware support. Handles path matching, parameter extraction, and response generation for web applications.",
	);

	strictEqual(
		tag.description,
		"Core router implementation providing HTTP request routing and middleware support. Handles path matching, parameter extraction, and response generation for web applications.",
		"Should handle detailed descriptions",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocFileTag - configuration file description", () => {
	const tag = new JSDocFileTag(
		"Application configuration settings for development and production environments",
	);

	strictEqual(
		tag.description,
		"Application configuration settings for development and production environments",
		"Should parse config description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocFileTag - utility module description", () => {
	const tag = new JSDocFileTag(
		"Collection of utility functions for string manipulation, validation, and data transformation",
	);

	strictEqual(
		tag.description,
		"Collection of utility functions for string manipulation, validation, and data transformation",
		"Should parse utility description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocFileTag - empty content", () => {
	const tag = new JSDocFileTag("");

	strictEqual(tag.description, "", "Should handle empty content");
	strictEqual(tag.isValid(), false, "Should be invalid without description");
});

test("JSDocFileTag - whitespace handling", () => {
	const spacedTag = new JSDocFileTag(
		"   Database connection and query utilities   ",
	);

	strictEqual(
		spacedTag.description,
		"Database connection and query utilities",
		"Should trim whitespace",
	);
	strictEqual(spacedTag.isValid(), true, "Should be valid");
});

test("JSDocFileTag - only whitespace", () => {
	const tag = new JSDocFileTag("   \n\t  ");

	strictEqual(tag.description, "", "Should handle whitespace-only content");
	strictEqual(tag.isValid(), false, "Should be invalid with whitespace only");
});

test("JSDocFileTag - library description", () => {
	const tag = new JSDocFileTag(
		"High-performance HTTP server implementation with middleware support and clustering capabilities",
	);

	strictEqual(
		tag.description,
		"High-performance HTTP server implementation with middleware support and clustering capabilities",
		"Should parse library description",
	);
	strictEqual(tag.isValid(), true, "Should be valid");
});

test("JSDocFileTag - serialization", () => {
	const tag = new JSDocFileTag(
		"Template engine for generating HTML from JavaScript template literals",
	);
	const json = tag.toJSON();

	strictEqual(json.__type, "file", "Should have correct type");
	strictEqual(
		json.__data.description,
		"Template engine for generating HTML from JavaScript template literals",
		"Should serialize description",
	);
	strictEqual(
		json.__data.rawContent,
		tag.rawContent,
		"Should serialize raw content",
	);
});

test("JSDocFileTag - HTML output", () => {
	const tag = new JSDocFileTag("Data validation and sanitization utilities");

	strictEqual(
		tag.toHTML(),
		'<div class="file-info"><strong class="file-label">File:</strong> Data validation and sanitization utilities</div>',
		"Should generate correct HTML",
	);
});

test("JSDocFileTag - Markdown output", () => {
	const tag = new JSDocFileTag("API response formatting and error handling");

	strictEqual(
		tag.toMarkdown(),
		"**File:** API response formatting and error handling",
		"Should generate correct Markdown",
	);
});

test("JSDocFileTag - complex technical description", () => {
	const tag = new JSDocFileTag(
		"WebSocket connection manager implementing reconnection logic, message queuing, and event-driven communication patterns for real-time applications",
	);

	strictEqual(tag.isValid(), true, "Should be valid");
	strictEqual(
		tag.description.includes("WebSocket connection manager"),
		true,
		"Should contain technical details",
	);
});

test("JSDocFileTag - architectural description", () => {
	const tag = new JSDocFileTag(
		"Main application bootstrap file that initializes dependency injection container, loads configuration, and starts the server process",
	);

	strictEqual(tag.isValid(), true, "Should be valid");
	strictEqual(
		tag.description.includes("bootstrap"),
		true,
		"Should handle architectural descriptions",
	);
});

test("JSDocFileTag - edge cases", () => {
	// Very long description
	const longTag = new JSDocFileTag(
		"This is a comprehensive module that handles multiple aspects of user management including authentication, authorization, profile management, password reset functionality, email verification, two-factor authentication setup, session management, and integration with external identity providers for enterprise single sign-on capabilities",
	);
	strictEqual(longTag.isValid(), true, "Should handle long descriptions");

	// Single word
	const shortTag = new JSDocFileTag("Constants");
	strictEqual(shortTag.description, "Constants", "Should handle single word");
	strictEqual(shortTag.isValid(), true, "Should be valid");

	// Special characters
	const specialTag = new JSDocFileTag(
		"Utilities for parsing & formatting JSON/XML data with error handling (v2.0)",
	);
	strictEqual(specialTag.isValid(), true, "Should handle special characters");
});
