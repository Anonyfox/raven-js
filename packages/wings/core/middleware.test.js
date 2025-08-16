import assert from "node:assert";
import { describe, test } from "node:test";
import { Context } from "./context.js";
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

	test("constructor with empty string identifier", () => {
		const handler = (_current) => {};
		const middleware = new Middleware(handler, "");

		assert.strictEqual(middleware.handler, handler);
		assert.strictEqual(middleware.identifier, "");
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

		assert.throws(() => {
			new Middleware({});
		}, /Handler must be a function/);

		assert.throws(() => {
			new Middleware([]);
		}, /Handler must be a function/);
	});

	test("constructor with non-string identifier", () => {
		const handler = (_current) => {};

		// Should accept numbers, objects, etc. as identifiers (converted to string)
		const middleware1 = new Middleware(handler, 123);
		assert.strictEqual(middleware1.identifier, "123");

		const middleware2 = new Middleware(handler, {});
		assert.strictEqual(middleware2.identifier, "[object Object]");

		const middleware3 = new Middleware(handler, []);
		assert.strictEqual(middleware3.identifier, "");
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

	test("hasSameIdentifier with empty string identifiers", () => {
		const handler1 = (_current) => {};
		const handler2 = (_current) => {};

		const middleware1 = new Middleware(handler1, "");
		const middleware2 = new Middleware(handler2, "");

		assert.strictEqual(middleware1.hasSameIdentifier(middleware2), true);
		assert.strictEqual(middleware2.hasSameIdentifier(middleware1), true);
	});

	test("hasSameIdentifier with null parameter", () => {
		const handler = (_current) => {};
		const middleware = new Middleware(handler, "test-id");

		assert.strictEqual(middleware.hasSameIdentifier(null), false);
	});

	test("hasSameIdentifier with undefined parameter", () => {
		const handler = (_current) => {};
		const middleware = new Middleware(handler, "test-id");

		assert.strictEqual(middleware.hasSameIdentifier(undefined), false);
	});

	test("hasSameIdentifier with non-Middleware object", () => {
		const handler = (_current) => {};
		const middleware = new Middleware(handler, "test-id");

		assert.strictEqual(middleware.hasSameIdentifier({}), false);
		assert.strictEqual(middleware.hasSameIdentifier("not middleware"), false);
		assert.strictEqual(middleware.hasSameIdentifier(123), false);
		assert.strictEqual(middleware.hasSameIdentifier([]), false);
	});

	test("execute calls the handler function", async () => {
		let called = false;
		const handler = (_ctx) => {
			called = true;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await middleware.execute(ctx);

		assert.strictEqual(called, true);
	});

	test("execute passes context to handler", async () => {
		let receivedCtx = null;
		const handler = (ctx) => {
			receivedCtx = ctx;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/api/users");
		const ctx = new Context("POST", url, new Headers());

		await middleware.execute(ctx);

		assert.strictEqual(receivedCtx, ctx);
	});

	test("execute handles async handler", async () => {
		let resolved = false;
		const handler = async (_ctx) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			resolved = true;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await middleware.execute(ctx);

		assert.strictEqual(resolved, true);
	});

	test("execute handles handler that returns promise", async () => {
		let resolved = false;
		const handler = (_ctx) => {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolved = true;
					resolve();
				}, 10);
			});
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await middleware.execute(ctx);

		assert.strictEqual(resolved, true);
	});

	test("execute handles handler that returns value", async () => {
		const handler = (_ctx) => {
			return "some value";
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		// Should not throw, even though handler returns a value
		await middleware.execute(ctx);
	});

	test("execute handles handler that returns async value", async () => {
		const handler = async (_ctx) => {
			return "some async value";
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		// Should not throw, even though handler returns a value
		await middleware.execute(ctx);
	});

	test("execute propagates handler errors", async () => {
		const error = new Error("Handler error");
		const handler = (_ctx) => {
			throw error;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await assert.rejects(async () => {
			await middleware.execute(ctx);
		}, error);
	});

	test("execute propagates async handler errors", async () => {
		const error = new Error("Async handler error");
		const handler = async (_ctx) => {
			throw error;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await assert.rejects(async () => {
			await middleware.execute(ctx);
		}, error);
	});

	test("execute propagates TypeError from handler", async () => {
		const handler = (_ctx) => {
			throw new TypeError("Type error in handler");
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await assert.rejects(async () => {
			await middleware.execute(ctx);
		}, TypeError);
	});

	test("execute propagates ReferenceError from handler", async () => {
		const handler = (_ctx) => {
			throw new ReferenceError("Reference error in handler");
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await assert.rejects(async () => {
			await middleware.execute(ctx);
		}, ReferenceError);
	});

	test("execute with null context throws error", async () => {
		const handler = (_ctx) => {};
		const middleware = new Middleware(handler);

		await assert.rejects(async () => {
			await middleware.execute(null);
		}, /Context must be a Context instance/);
	});

	test("execute with undefined context throws error", async () => {
		const handler = (_ctx) => {};
		const middleware = new Middleware(handler);

		await assert.rejects(async () => {
			await middleware.execute(undefined);
		}, /Context must be a Context instance/);
	});

	test("execute with non-Context object throws error", async () => {
		const handler = (_ctx) => {};
		const middleware = new Middleware(handler);

		await assert.rejects(async () => {
			await middleware.execute({});
		}, /Context must be a Context instance/);

		await assert.rejects(async () => {
			await middleware.execute("not a context");
		}, /Context must be a Context instance/);

		await assert.rejects(async () => {
			await middleware.execute(123);
		}, /Context must be a Context instance/);
	});

	test("execute allows handler to modify context", async () => {
		const handler = (ctx) => {
			ctx.responseStatusCode = 404;
			ctx.responseBody = "Modified by middleware";
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await middleware.execute(ctx);

		assert.strictEqual(ctx.responseStatusCode, 404);
		assert.strictEqual(ctx.responseBody, "Modified by middleware");
	});

	test("execute allows async handler to modify context", async () => {
		const handler = async (ctx) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			ctx.responseStatusCode = 500;
			ctx.responseBody = "Modified by async middleware";
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await middleware.execute(ctx);

		assert.strictEqual(ctx.responseStatusCode, 500);
		assert.strictEqual(ctx.responseBody, "Modified by async middleware");
	});

	test("execute with handler that throws string error", async () => {
		const handler = (_ctx) => {
			throw "String error";
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await assert.rejects(
			async () => {
				await middleware.execute(ctx);
			},
			(error) => error === "String error",
		);
	});

	test("execute with handler that throws number error", async () => {
		const handler = (_ctx) => {
			throw 42;
		};

		const middleware = new Middleware(handler);
		const url = new URL("http://localhost/test");
		const ctx = new Context("GET", url, new Headers());

		await assert.rejects(
			async () => {
				await middleware.execute(ctx);
			},
			(error) => error === 42,
		);
	});
});
