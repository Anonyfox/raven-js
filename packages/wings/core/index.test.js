import assert from "node:assert";
import { describe, it } from "node:test";
import * as core from "./index.js";

describe("core/index.js", () => {
	it("should export all expected functions and classes", () => {
		// Context exports
		assert.strictEqual(typeof core.Context, "function");

		// HTTP methods exports
		assert.strictEqual(typeof core.HTTP_METHODS, "object");
		assert.strictEqual(typeof core.isValidHttpMethod, "function");

		// MIME utilities exports
		assert.strictEqual(typeof core.getMimeType, "function");

		// Route exports
		assert.strictEqual(typeof core.Route, "function");

		// Router exports
		assert.strictEqual(typeof core.Router, "function");
	});

	it("should have working Router class", () => {
		const router = new core.Router();
		assert(router instanceof core.Router);
	});

	it("should have working Context class", () => {
		const url = new URL("http://localhost:3000/test");
		const context = new core.Context("GET", url, new Headers());
		assert(context instanceof core.Context);
	});

	it("should have working Route class", () => {
		const route = core.Route.GET("/test", () => {});
		assert(route instanceof core.Route);
	});
});
