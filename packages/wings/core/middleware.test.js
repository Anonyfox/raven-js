import assert from "node:assert";
import { describe, test } from "node:test";
import { Current } from "./current.js";
import { Middleware } from "./middleware.js";

describe("Middleware", () => {
	test("constructor", () => {
		const handler = (_current) => {};
		const middleware = new Middleware(handler);

		assert.strictEqual(middleware.handler, handler);
		assert.strictEqual(middleware.identifier, null);
	});

	test("constructor with identifier", () => {
		const handler = (_current) => {};
		const identifier = "test-middleware";
		const middleware = new Middleware(handler, identifier);

		assert.strictEqual(middleware.handler, handler);
		assert.strictEqual(middleware.identifier, identifier);
	});

	test("constructor throws error for non-function handler", () => {
		assert.throws(() => {
			new Middleware("not a function");
		}, /Handler must be a function/);

		assert.throws(() => {
			new Middleware(null);
		}, /Handler must be a function/);

		assert.throws(() => {
			new Middleware(undefined);
		}, /Handler must be a function/);

		assert.throws(() => {
			new Middleware(123);
		}, /Handler must be a function/);
	});

	test("hasSameIdentifier with same identifier", () => {
		const handler1 = (_current) => {};
		const handler2 = (_current) => {};
		const identifier = "same-id";

		const middleware1 = new Middleware(handler1, identifier);
		const middleware2 = new Middleware(handler2, identifier);

		assert.strictEqual(middleware1.hasSameIdentifier(middleware2), true);
		assert.strictEqual(middleware2.hasSameIdentifier(middleware1), true);
	});

	test("hasSameIdentifier with different identifiers", () => {
		const handler1 = (_current) => {};
		const handler2 = (_current) => {};

		const middleware1 = new Middleware(handler1, "id1");
		const middleware2 = new Middleware(handler2, "id2");

		assert.strictEqual(middleware1.hasSameIdentifier(middleware2), false);
		assert.strictEqual(middleware2.hasSameIdentifier(middleware1), false);
	});

	test("hasSameIdentifier with null identifiers", () => {
		const handler1 = (_current) => {};
		const handler2 = (_current) => {};

		const middleware1 = new Middleware(handler1);
		const middleware2 = new Middleware(handler2);

		assert.strictEqual(middleware1.hasSameIdentifier(middleware2), false);
		assert.strictEqual(middleware2.hasSameIdentifier(middleware1), false);
	});

	test("hasSameIdentifier with one null identifier", () => {
		const handler1 = (_current) => {};
		const handler2 = (_current) => {};

		const middleware1 = new Middleware(handler1, "id1");
		const middleware2 = new Middleware(handler2);

		assert.strictEqual(middleware1.hasSameIdentifier(middleware2), false);
		assert.strictEqual(middleware2.hasSameIdentifier(middleware1), false);
	});

	test("execute calls the handler function", async () => {
		let called = false;
		const handler = (_current) => {
			called = true;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const current = new Current("GET", url, new Headers());

		await middleware.execute(current);

		assert.strictEqual(called, true);
	});

	test("execute passes current to handler", async () => {
		let receivedCurrent = null;
		const handler = (current) => {
			receivedCurrent = current;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/api/users");
		const current = new Current("POST", url, new Headers());

		await middleware.execute(current);

		assert.strictEqual(receivedCurrent, current);
	});

	test("execute handles async handler", async () => {
		let resolved = false;
		const handler = async (_current) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			resolved = true;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const current = new Current("GET", url, new Headers());

		await middleware.execute(current);

		assert.strictEqual(resolved, true);
	});

	test("execute handles handler that returns promise", async () => {
		let resolved = false;
		const handler = (_current) => {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolved = true;
					resolve();
				}, 10);
			});
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const current = new Current("GET", url, new Headers());

		await middleware.execute(current);

		assert.strictEqual(resolved, true);
	});

	test("execute propagates handler errors", async () => {
		const error = new Error("Handler error");
		const handler = (_current) => {
			throw error;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const current = new Current("GET", url, new Headers());

		await assert.rejects(async () => {
			await middleware.execute(current);
		}, error);
	});

	test("execute propagates async handler errors", async () => {
		const error = new Error("Async handler error");
		const handler = async (_current) => {
			throw error;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const current = new Current("GET", url, new Headers());

		await assert.rejects(async () => {
			await middleware.execute(current);
		}, error);
	});
});
