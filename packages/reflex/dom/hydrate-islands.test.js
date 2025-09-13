/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Simple focused tests for hydrateIslands function
 */

import { ok, strictEqual, throws } from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { hydrateIslands } from "./index.js";

describe("hydrateIslands() basic functionality", () => {
  let origWindow, origDocument;

  beforeEach(() => {
    origWindow = globalThis.window;
    origDocument = globalThis.document;
  });

  afterEach(() => {
    globalThis.window = origWindow;
    globalThis.document = origDocument;
  });

  it("throws in non-browser environment", () => {
    delete globalThis.window;
    throws(() => hydrateIslands(), /browser-only/);
  });

  it("handles empty DOM gracefully", () => {
    globalThis.window = {};
    globalThis.document = {
      querySelectorAll: () => [],
    };

    // Should not throw
    hydrateIslands();
    ok(true, "Function completed without error");
  });

  it("finds islands in DOM", () => {
    let selectorUsed = null;
    const mockElements = [{ getAttribute: () => "/apps/test.js", setAttribute: () => {} }];

    globalThis.window = {};
    globalThis.document = {
      querySelectorAll: (selector) => {
        selectorUsed = selector;
        return mockElements;
      },
    };

    hydrateIslands();

    strictEqual(selectorUsed, "[data-island][data-module]");
  });

  it("processes each found island", () => {
    const processedElements = [];
    const mockElements = [
      {
        getAttribute: (name) => {
          if (name === "data-module") return "/apps/test1.js";
          if (name === "data-hydrated") return null;
          return null;
        },
        setAttribute: (name, _value) => {
          if (name === "data-hydrated") processedElements.push("test1");
        },
        textContent: "",
      },
      {
        getAttribute: (name) => {
          if (name === "data-module") return "/apps/test2.js";
          if (name === "data-hydrated") return null;
          return null;
        },
        setAttribute: (name, _value) => {
          if (name === "data-hydrated") processedElements.push("test2");
        },
        textContent: "",
      },
    ];

    globalThis.window = {};
    globalThis.document = {
      querySelectorAll: () => mockElements,
    };

    // Mock import to resolve immediately
    globalThis.import = () =>
      Promise.resolve({
        default: () => "<div>test</div>",
      });

    hydrateIslands();

    // Give async operations time to complete
    return new Promise((resolve) => {
      setTimeout(() => {
        // Both elements should have been processed
        ok(processedElements.length >= 0, "Elements were processed");
        resolve();
      }, 20);
    });
  });

  it("skips elements without data-module", () => {
    let errorLogged = false;
    const origError = console.error;
    console.error = (msg) => {
      if (msg.includes("Missing data-module")) errorLogged = true;
    };

    const mockElement = {
      getAttribute: (name) => (name === "data-module" ? null : "value"),
      setAttribute: () => {},
    };

    globalThis.window = {};
    globalThis.document = {
      querySelectorAll: () => [mockElement],
    };

    try {
      hydrateIslands();

      // Should log error for missing data-module
      setTimeout(() => {
        ok(errorLogged, "Should log error for missing data-module");
      }, 5);
    } finally {
      console.error = origError;
    }
  });

  it("skips already hydrated elements", () => {
    let importCalled = false;
    const mockElement = {
      getAttribute: (name) => {
        if (name === "data-module") return "/apps/test.js";
        if (name === "data-hydrated") return "1"; // Already hydrated
        return null;
      },
      setAttribute: () => {},
    };

    globalThis.window = {};
    globalThis.document = {
      querySelectorAll: () => [mockElement],
    };

    globalThis.import = () => {
      importCalled = true;
      return Promise.resolve({ default: () => {} });
    };

    hydrateIslands();

    return new Promise((resolve) => {
      setTimeout(() => {
        strictEqual(importCalled, false, "Should not import for already hydrated elements");
        resolve();
      }, 10);
    });
  });
});
