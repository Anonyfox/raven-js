import assert from "node:assert";
import { describe, it } from "node:test";
import { extractAssetsFromHtml } from "./extract-assets-from-html.js";

describe("extractAssetsFromHtml", () => {
  const html = `<!doctype html><html><head>
    <base href="https://a.com">
    <link rel="stylesheet" href="/s.css">
    <link rel="icon" href="/favicon.ico">
    <link rel="manifest" href="/manifest.webmanifest">
    <style>@font-face{src:url('/f.woff2')} body{background:url('/b.jpg')}</style>
  </head><body>
    <img src="/i.png" srcset="/i@2x.png 2x">
    <script src="/app.js"></script>
    <video src="/v.mp4"></video>
  </body></html>`;

  it("categorizes assets and normalizes", () => {
    const a = extractAssetsFromHtml(html);
    for (const key of ["images", "stylesheets", "scripts", "fonts", "media", "icons", "manifest"]) {
      assert.ok(a[key] instanceof Set);
    }
    const anyImage = [...a.images][0];
    assert.ok(anyImage instanceof URL);
  });
});
