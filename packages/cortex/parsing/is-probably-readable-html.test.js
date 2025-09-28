import assert from "node:assert";
import { describe, it } from "node:test";
import { isProbablyReadableHtml } from "./is-probably-readable-html.js";

describe("isProbablyReadableHtml", () => {
  it("validates input and rejects tiny docs", () => {
    assert.throws(() => isProbablyReadableHtml(123), /Expected html to be a string/);
    assert.equal(isProbablyReadableHtml("<html></html>"), false);
  });

  it("detects readable article-like HTML quickly", () => {
    const html = `<!doctype html>
      <html><head><title>News</title></head><body>
      <article>
        <h1>Breaking News</h1>
        <p>This is a reasonably long paragraph that contains meaningful information about the event in question.</p>
        <p>Another paragraph that continues the story with additional context and details for the reader to digest.</p>
        <p>Final paragraph summarizing the content and providing conclusions for the audience.</p>
      </article>
      </body></html>
    `;
    assert.equal(isProbablyReadableHtml(html), true);
  });

  it("rejects utility/error/search/login pages", () => {
    const login = `<!doctype html><html><body><h1>Login</h1><form><input><input></form></body></html>`;
    assert.equal(isProbablyReadableHtml(login), false);
    const error = `<!doctype html><html><body><h1>404 Not Found</h1></body></html>`;
    assert.equal(isProbablyReadableHtml(error), false);
    const search = `<!doctype html><html><body><h1>Search Results</h1><p>query</p></body></html>`;
    assert.equal(isProbablyReadableHtml(search), false);
  });

  it("handles div+br clusters as positive signal", () => {
    const brDiv = `<!doctype html>
      <html><body>
      <div><br><br><br></div>
      <p>Some content paragraph that is decently long and informative for a reader.</p>
      <p>Another paragraph that offers additional details and explanations on the topic.</p>
      <p>Yet another paragraph ensuring we cross thresholds for readability detection.</p>
      </body></html>
    `;
    assert.equal(isProbablyReadableHtml(brDiv), true);
  });

  it("rejects script/style heavy pages", () => {
    const heavy = `<!doctype html><html><body>
      <script>${"x".repeat(5000)}</script>
      <style>${"y".repeat(5000)}</style>
      <p>tiny</p>
    </body></html>`;
    assert.equal(isProbablyReadableHtml(heavy), false);
  });

  it("table-heavy vs paragraphs lowers score and can reject", () => {
    const tablePage = `<!doctype html><html><body>
      <table><tr><td>1</td></tr></table>
      <table><tr><td>2</td></tr></table>
      <p>short</p>
      <p>short</p>
    </body></html>`;
    assert.equal(isProbablyReadableHtml(tablePage), false);
  });
});
