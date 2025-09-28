import assert from "node:assert";
import { describe, it } from "node:test";
import { extractLinksFromHtml } from "./extract-links-from-html.js";

describe("extractLinksFromHtml", () => {
  it("extracts only anchors and applies rel filter and scope", () => {
    const html = `<!doctype html><base href="https://a.com"><a href="/x">x</a><a href="https://b.com/y" rel="nofollow">y</a>`;
    const all = extractLinksFromHtml(html);
    assert.ok(all instanceof Set);
    const internal = extractLinksFromHtml(html, { base: "https://a.com", scope: "internal" });
    for (const u of internal) assert.equal(u instanceof URL ? u.origin : new URL(u).origin, "https://a.com");
    const filtered = extractLinksFromHtml(html, { relFilter: ["nofollow"] });
    const hrefs = new Set(Array.from(filtered).map((u) => (u instanceof URL ? u.href : String(u))));
    assert.ok([...hrefs].some((h) => h.endsWith("/x")));
    assert.ok(![...hrefs].some((h) => h.includes("/y")));
  });
});
