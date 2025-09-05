/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Router tests - Comprehensive test coverage for documentation router creation
 *
 * Tests the createDocumentationRouter function to ensure it creates a properly
 * configured Wings router with all documentation routes, middleware, and assets.
 */

import assert from "node:assert";
import path from "node:path";
import { test } from "node:test";
import { Context } from "@raven-js/wings";
import { createDocumentationRouter } from "./router.js";

const beakPath = path.resolve(process.cwd(), "../beak");

test("createDocumentationRouter creates router with all routes", async () => {
	const router = createDocumentationRouter(beakPath);

	assert.ok(router, "Router should be created");
	assert.equal(
		typeof router.handleRequest,
		"function",
		"Router should have handleRequest method",
	);
});

test("createDocumentationRouter handles homepage route", async () => {
	const router = createDocumentationRouter(beakPath);

	const url = new URL("http://localhost/");
	const ctx = new Context("GET", url, new Headers());

	await router.handleRequest(ctx);

	assert.equal(ctx.responseStatusCode, 200, "Homepage should return 200");
	assert.ok(
		ctx.responseBody.includes("<!DOCTYPE html>"),
		"Homepage should return HTML",
	);
});

test("createDocumentationRouter handles sitemap route", async () => {
	const router = createDocumentationRouter(beakPath);

	const url = new URL("http://localhost/sitemap.xml");
	const ctx = new Context("GET", url, new Headers());

	await router.handleRequest(ctx);

	assert.equal(ctx.responseStatusCode, 200, "Sitemap should return 200");
	assert.ok(ctx.responseBody.includes("<?xml"), "Sitemap should return XML");
});

test("createDocumentationRouter handles modules directory route", async () => {
	const router = createDocumentationRouter(beakPath);

	const url = new URL("http://localhost/modules/");
	const ctx = new Context("GET", url, new Headers());

	await router.handleRequest(ctx);

	assert.equal(
		ctx.responseStatusCode,
		200,
		"Modules directory should return 200",
	);
	assert.ok(
		ctx.responseBody.includes("<!DOCTYPE html>"),
		"Modules directory should return HTML",
	);
});

test("createDocumentationRouter handles 404 for non-existent routes", async () => {
	const router = createDocumentationRouter(beakPath);

	const url = new URL("http://localhost/non-existent");
	const ctx = new Context("GET", url, new Headers());

	await router.handleRequest(ctx);

	assert.equal(
		ctx.responseStatusCode,
		404,
		"Non-existent route should return 404",
	);
});

test("createDocumentationRouter validates packagePath", () => {
	assert.throws(
		() => createDocumentationRouter(""),
		/packagePath is required/,
		"Empty packagePath should throw error",
	);

	assert.throws(
		() => createDocumentationRouter(null),
		/packagePath is required/,
		"Null packagePath should throw error",
	);
});

test("createDocumentationRouter accepts options", () => {
	const router = createDocumentationRouter(beakPath, {
		domain: "example.com",
		enableLogging: false,
	});

	assert.ok(router, "Router should be created with options");
});
