import assert from "node:assert";
import { describe, it } from "node:test";
import { htmlToText } from "./html-to-text.js";

describe("htmlToText", () => {
  it("validates input and handles trivial cases", () => {
    assert.throws(() => htmlToText(123), /Expected html to be a string/);
    assert.equal(htmlToText(""), "");
  });

  it("strips excluded tags and handles blocks, br, and entities", () => {
    const html = "<div>Hello &amp; world<br>next</div><script>ignore()</script>";
    const text = htmlToText(html);
    assert.equal(text, "Hello & world\nnext");
  });

  it("decodes entities (named, decimal, hex) and can disable decoding", () => {
    const html = "&copy; &#169; &#xA9;";
    assert.equal(htmlToText(html), "© © ©");
    assert.equal(htmlToText(html, { decodeEntities: false }), "&copy; &#169; &#xA9;");
  });

  it("respects preserveTags for whitespace and collapsing elsewhere", () => {
    const html = "<div>a   b</div><pre>  x\n  y</pre><code>  z</code>";
    const text = htmlToText(html);
    assert.equal(text, "a b\n  x\n  y  z");
  });

  it("renders links per mode and images per option", () => {
    const doc = '<a href="https://ravenjs.dev">Raven</a> <a href="https://x.example/"></a> <img alt="logo">';
    assert.equal(htmlToText(doc, { links: "text" }), "Raven logo");
    assert.equal(htmlToText(doc, { links: "inline" }), "Raven (https://ravenjs.dev) (https://x.example/) logo");
    assert.equal(htmlToText(doc, { images: "remove" }), "Raven (https://x.example/)");
  });

  it("handles tables with cell separators and row newlines", () => {
    const html = "<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>";
    const tabbed = htmlToText(html);
    assert.equal(tabbed, "a\tb\nc\td");
    const spaced = htmlToText(html, { tableCellSeparator: "space" });
    assert.equal(spaced, "a b\nc d");
  });

  it("supports document mode (ignores head) and custom excludes", () => {
    const html = "<html><head><title>T</title></head><body>Body</body></html>";
    assert.equal(htmlToText(html, { mode: "document" }), "Body");
    const withCustomExclude = htmlToText("<aside>x</aside><div>y</div>", { excludeTags: ["aside"] });
    assert.equal(withCustomExclude, "y");
  });

  it("wraps lines when width is set, trims and limits newlines", () => {
    const html = "<p>abcdefghi</p><p>\n\n\n</p>";
    const wrapped = htmlToText(html, { wrap: 4 });
    assert.equal(wrapped, "abcd\nefgh\ni");
    const compact = htmlToText("<div>a</div>\n\n\n<div>b</div>", { maxNewlines: 1 });
    assert.equal(compact, "a\nb");
    const noTrim = htmlToText(" <div>x</div> ", { trim: false });
    assert.equal(noTrim, " x\n");
  });

  it("handles malformed tags and self-closing anchors", () => {
    const text1 = htmlToText("<p>open only"); // no closing '>' later → treated as text
    assert.equal(text1, "open only");
    const text2 = htmlToText('<a href="https://ravenjs.dev"/>', { links: "inline" });
    assert.equal(text2, "(https://ravenjs.dev)");
  });
});
