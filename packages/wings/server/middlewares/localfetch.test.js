/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Context as CtxA } from "../../core/context.js";
import { LocalFetch as LF } from "./localfetch.js";

describe("LocalFetch middleware", () => {
  /** @type {typeof globalThis.fetch} */
  let savedFetch;

  beforeEach(() => {
    savedFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = savedFetch;
  });

  function createCtx(origin = "https://app.example.com/") {
    const url = new URL(origin);
    const headers = new Headers();
    return new CtxA("GET", url, headers);
  }

  it("resolves relative URLs against ctx.origin and leaves absolute URLs untouched", async () => {
    const calls = [];
    // Stub the original fetch BEFORE patching so enhanced fetch delegates to this
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    };

    const ctx = createCtx("https://api.example.com/");
    const mw = new LF();
    await mw.execute(ctx); // patches fetch and sets request context

    // Relative URL → resolved
    await globalThis.fetch("/api/users");
    assert.equal(calls[0].url, "https://api.example.com/api/users");

    // Absolute URL → untouched
    await globalThis.fetch("https://external.example.com/data");
    assert.equal(calls[1].url, "https://external.example.com/data");
  });

  it("forwards Authorization and Cookie headers when not explicitly provided", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response("{}", { status: 200 });
    };

    const url = new URL("https://secure.example.com/");
    const headers = new Headers({ authorization: "Bearer abc", cookie: "sid=123" });
    const ctx = new CtxA("GET", url, headers);

    const mw = new LF();
    await mw.execute(ctx);

    await globalThis.fetch("/private");

    const h = new Headers(calls[0].options?.headers);
    assert.equal(h.get("authorization"), "Bearer abc");
    assert.equal(h.get("cookie"), "sid=123");
  });

  it("does not override explicitly provided headers", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response("{}", { status: 200 });
    };

    const url = new URL("https://secure.example.com/");
    const headers = new Headers({ authorization: "Bearer ctx-token" });
    const ctx = new CtxA("GET", url, headers);

    const mw = new LF();
    await mw.execute(ctx);

    await globalThis.fetch("/override", { headers: { authorization: "Bearer explicit" } });

    const h = new Headers(calls[0].options?.headers);
    assert.equal(h.get("authorization"), "Bearer explicit");
  });

  it("isolates context between requests", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response("{}", { status: 200 });
    };

    const mw = new LF();

    const ctx1 = new CtxA("GET", new URL("https://app1.com/"), new Headers({ authorization: "Bearer one" }));
    await mw.execute(ctx1);
    await globalThis.fetch("/x");

    const ctx2 = new CtxA("GET", new URL("https://app2.com/"), new Headers({ authorization: "Bearer two" }));
    await mw.execute(ctx2);
    await globalThis.fetch("/y");

    assert.equal(calls[0].url, "https://app1.com/x");
    assert.equal(new Headers(calls[0].options?.headers).get("authorization"), "Bearer one");
    assert.equal(calls[1].url, "https://app2.com/y");
    assert.equal(new Headers(calls[1].options?.headers).get("authorization"), "Bearer two");
  });

  it("no context: behaves like original fetch (no resolution)", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response("{}", { status: 200 });
    };

    // No middleware executed → no context store
    await globalThis.fetch("/raw");

    assert.equal(calls[0].url, "/raw");
    assert.equal(calls[0].options, undefined);
  });
});
