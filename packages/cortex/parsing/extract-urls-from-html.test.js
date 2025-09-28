import assert from "node:assert";
import { describe, it } from "node:test";
import { extractUrlsFromHtml } from "./extract-urls-from-html.js";

describe("extractUrlsFromHtml", () => {
  const html = `<!doctype html><html><head>
    <base href="https://example.com">
    <link rel="stylesheet" href="/style.css">
    <meta property="og:image" content="/images/og.jpg">
  </head><body>
    <a href="/a">A</a>
    <a href="https://ext.com/x">X</a>
    <img src="/img.png" srcset="/img2.png 2x, /img3.png 3x">
    <script src="/app.js"></script>
    <style>body{background:url('/bg.jpg')}</style>
  </body></html>`;

  it("extracts and normalizes all urls", () => {
    const urls = extractUrlsFromHtml(html);
    assert.ok(urls instanceof Set);
    // At least a few distinct URLs
    const hrefs = new Set(Array.from(urls).map((u) => (u instanceof URL ? u.href : String(u))));
    assert.ok([...hrefs].some((h) => h.includes("/a")));
    assert.ok([...hrefs].some((h) => h.includes("/style.css")));
    assert.ok([...hrefs].some((h) => h.includes("/img.png")));
    assert.ok([...hrefs].some((h) => h.includes("/images/og.jpg")));
  });

  it("filters internal scope", () => {
    const urls = extractUrlsFromHtml(html, { base: "https://example.com", scope: "internal" });
    for (const u of urls) assert.equal(u instanceof URL ? u.origin : new URL(u).origin, "https://example.com");
  });

  it("filters external scope", () => {
    const urls = extractUrlsFromHtml(html, { base: "https://example.com", scope: "external" });
    for (const u of urls) assert.notEqual(u instanceof URL ? u.origin : new URL(u).origin, "https://example.com");
  });
});
