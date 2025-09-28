import assert from "node:assert";
import { describe, it } from "node:test";
import { htmlToContent } from "./html-to-content.js";

describe("htmlToContent", () => {
  it("validates input and handles empty/non-readable html", () => {
    assert.throws(() => htmlToContent(42), /Expected html to be a string/);
    const res = htmlToContent("<html><body></body></html>");
    assert.equal(res.text, "");
    assert.equal(res.meta.source, "fallback");
  });

  it("extracts title and main text from article-like pages", () => {
    const html = `<!doctype html><html><head><title>Breaking News – Site</title></head><body>
      <article>
        <h1>Breaking News</h1>
        <p>This is a reasonably long paragraph that contains meaningful information about the event in question.</p>
        <p>Another paragraph that continues the story with additional context and details for the reader to digest.</p>
        <p>Final paragraph summarizing the content and providing conclusions for the audience.</p>
        <figure><img src="https://cdn.example.com/img.jpg"></figure>
      </article>
      <footer>Related links</footer>
    </body></html>`;

    const res = htmlToContent(html, { html: false });
    assert.equal(res.title, "Breaking News");
    assert.ok(res.text.includes("reasonably long paragraph"));
    assert.ok(res.text.includes("Another paragraph"));
    assert.ok(res.text.includes("Final paragraph"));
    assert.ok(res.images.length >= 1);
    assert.equal(res.meta.source, "block");
    assert.ok(res.meta.wordCount >= 30);
    assert.ok(res.meta.score > 0);
  });

  it("falls back to plain text on utility pages", () => {
    const html = `<!doctype html><html><body><h1>Login</h1><form><input><input></form></body></html>`;
    const res = htmlToContent(html);
    assert.equal(res.meta.source, "fallback");
    assert.ok(res.text.includes("Login"));
  });

  it("respects html option and returns minimal html when enabled", () => {
    const html = `<!doctype html><html><body>
      <section>
        <h2>Title</h2>
        <p>First paragraph of content with sufficient length to pass thresholds.</p>
        <p>Second paragraph continues the topic with more details for the reader.</p>
      </section>
    </body></html>`;
    const res = htmlToContent(html, { html: true });
    assert.equal(typeof res.html, "string");
    assert.ok((res.html || "").length > 0);
  });
});
