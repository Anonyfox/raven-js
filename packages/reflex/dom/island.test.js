/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test island function
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { island } from "./index.js";

describe("island() function", () => {
  it("generates HTML with data attributes", () => {
    const html = island({ src: "/apps/counter.js#Counter", props: { initial: 0 } });

    ok(html.includes("data-island"));
    ok(html.includes('data-module="/apps/counter.js"'));
    ok(html.includes('data-export="Counter"'));
    ok(html.includes('data-client="load"'));
    ok(html.includes("data-props="));
    ok(html.startsWith('<div id="'));
    ok(html.endsWith("</div>"));
  });

  it("with SSR content", () => {
    const mockComponent = (props) => `<span>Count: ${props.initial}</span>`;
    const html = island({
      src: "/apps/counter.js#Counter",
      ssr: mockComponent,
      props: { initial: 42 },
    });

    ok(html.includes("Count: 42"));
    ok(html.includes("data-island"));
    ok(html.includes("<span>Count: 42</span>"));
  });

  it("with loading strategy", () => {
    const html = island({ src: "/apps/counter.js", on: "visible" });

    ok(html.includes('data-client="visible"'));
  });

  it("requires src parameter", () => {
    throws(() => island({}), /src is required/);
    throws(() => island({ props: {} }), /src is required/);
    throws(() => island({ on: "load" }), /src is required/);
  });

  it("handles default export name", () => {
    const html = island({ src: "/apps/counter.js" });
    ok(html.includes('data-export="default"'));
  });

  it("handles explicit export name", () => {
    const html = island({ src: "/apps/counter.js#MyComponent" });
    ok(html.includes('data-export="MyComponent"'));
  });

  it("handles empty props", () => {
    const html = island({ src: "/apps/counter.js" });
    ok(html.includes('data-props="%7B%7D"')); // URI-encoded {}
  });

  it("encodes props correctly", () => {
    const props = { count: 42, name: "test", nested: { a: 1 } };
    const html = island({ src: "/apps/counter.js", props });

    const match = html.match(/data-props="([^"]+)"/);
    ok(match, "Should have data-props attribute");

    const decoded = JSON.parse(decodeURIComponent(match[1]));
    deepStrictEqual(decoded, props);
  });

  it("handles special characters in props", () => {
    const props = { message: "Hello & <world>", script: "</script>" };
    const html = island({ src: "/apps/counter.js", props });

    const match = html.match(/data-props="([^"]+)"/);
    const decoded = JSON.parse(decodeURIComponent(match[1]));
    deepStrictEqual(decoded, props);
  });

  it("generates unique IDs", () => {
    const html1 = island({ src: "/apps/counter.js" });
    const html2 = island({ src: "/apps/counter.js" });

    const id1 = html1.match(/id="([^"]+)"/)?.[1];
    const id2 = html2.match(/id="([^"]+)"/)?.[1];

    ok(id1 && id2, "Should have IDs");
    ok(id1 !== id2, "IDs should be unique");
    ok(id1.startsWith("island-"), "ID should have prefix");
  });

  it("accepts custom ID", () => {
    const html = island({ src: "/apps/counter.js", id: "my-custom-id" });
    ok(html.includes('id="my-custom-id"'));
  });

  it("handles all loading strategies", () => {
    const strategies = ["load", "idle", "visible"];

    for (const strategy of strategies) {
      const html = island({ src: "/apps/counter.js", on: strategy });
      ok(html.includes(`data-client="${strategy}"`));
    }
  });

  it("defaults to load strategy", () => {
    const html = island({ src: "/apps/counter.js" });
    ok(html.includes('data-client="load"'));
  });

  it("handles SSR function errors gracefully", () => {
    const errorComponent = () => {
      throw new Error("SSR error");
    };

    const html = island({ src: "/apps/counter.js", ssr: errorComponent });

    // Should not throw, should render empty content
    ok(html.includes("data-island"));
    ok(!html.includes("Error"));
    ok(html.includes("></div>")); // Empty content
  });

  it("handles SSR function returning null/undefined", () => {
    const nullComponent = () => null;
    const undefinedComponent = () => undefined;

    const html1 = island({ src: "/apps/counter.js", ssr: nullComponent });
    const html2 = island({ src: "/apps/counter.js", ssr: undefinedComponent });

    ok(html1.includes("></div>"));
    ok(html2.includes("></div>"));
  });

  it("handles non-function SSR parameter", () => {
    const html = island({ src: "/apps/counter.js", ssr: "not a function" });
    ok(html.includes("></div>")); // Should render empty
  });

  it("escapes HTML in attributes", () => {
    const html = island({ src: '/apps/"evil".js' });

    // Should not break HTML structure
    ok(html.includes('data-module="/apps/&quot;evil&quot;.js"') || html.includes('data-module="/apps/"evil".js"'));
  });

  it("handles complex module paths", () => {
    const paths = [
      "/apps/counter.js",
      "./relative/path.js#Component",
      "../parent/component.js#default",
      "/deep/nested/path/component.js#NamedExport",
    ];

    for (const path of paths) {
      const html = island({ src: path });
      ok(html.includes("data-island"));
      ok(html.includes(`data-module="${path.split("#")[0]}"`));
    }
  });

  it("handles edge case export names", () => {
    const exports = ["default", "Component", "MyComponent123", "_private", "$special"];

    for (const exportName of exports) {
      const html = island({ src: `/apps/counter.js#${exportName}` });
      ok(html.includes(`data-export="${exportName}"`));
    }
  });

  it("produces valid HTML structure", () => {
    const html = island({
      src: "/apps/counter.js#Counter",
      ssr: () => "<span>content</span>",
      props: { test: true },
      on: "visible",
      id: "test-island",
    });

    // Should be well-formed HTML
    ok(html.startsWith("<div"));
    ok(html.endsWith("</div>"));
    ok(html.includes('id="test-island"'));
    ok(html.includes("data-island"));
    ok(html.includes("<span>content</span>"));

    // Count opening/closing tags
    const openDivs = (html.match(/<div/g) || []).length;
    const closeDivs = (html.match(/<\/div>/g) || []).length;
    strictEqual(openDivs, closeDivs, "Should have matching div tags");
  });
});
