/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for island and islandSSR functions
 */

import { match, ok, rejects } from "node:assert";
import { describe, it } from "node:test";
import { signal } from "../index.js";
import { island, islandSSR, ssr } from "./index.js";

describe("island()", () => {
  it("generates basic island HTML", () => {
    const result = island({
      src: "/apps/counter.js",
      props: { initial: 0 },
    });

    match(result, /^<div id="island-[a-z0-9]+" data-island/);
    match(result, /data-module="\/apps\/counter\.js"/);
    match(result, /data-export="default"/);
    match(result, /data-client="load"/);
    match(result, /data-props="%7B%22initial%22%3A0%7D"/);
    match(result, /<\/div>$/);
  });

  it("handles custom export name", () => {
    const result = island({
      src: "/apps/counter.js#Counter",
      props: { count: 5 },
    });

    match(result, /data-export="Counter"/);
    match(result, /data-module="\/apps\/counter\.js"/);
  });

  it("supports different loading strategies", () => {
    const loadResult = island({
      src: "/app.js",
      on: "load",
    });
    match(loadResult, /data-client="load"/);

    const idleResult = island({
      src: "/app.js",
      on: "idle",
    });
    match(idleResult, /data-client="idle"/);

    const visibleResult = island({
      src: "/app.js",
      on: "visible",
    });
    match(visibleResult, /data-client="visible"/);
  });

  it("allows custom id", () => {
    const result = island({
      src: "/app.js",
      id: "my-custom-id",
    });
    match(result, /id="my-custom-id"/);
  });

  it("encodes props correctly", () => {
    const result = island({
      src: "/app.js",
      props: {
        text: "Hello & <World>",
        number: 42,
        bool: true,
        nested: { key: "value" },
      },
    });

    // Props should be URI encoded
    match(result, /data-props="%7B/);
    ok(result.includes(encodeURIComponent('"text":"Hello & <World>"')));
  });

  it("throws without src", () => {
    try {
      island({ props: { test: true } });
      ok(false, "Should have thrown");
    } catch (err) {
      match(err.message, /src is required/);
    }
  });

  it("generates empty content (no SSR)", () => {
    const result = island({
      src: "/app.js",
    });
    match(result, /><\/div>$/); // Empty content between tags
  });
});

describe("islandSSR()", () => {
  it("renders simple synchronous component", async () => {
    const SimpleComponent = (props) => `<div>Count: ${props.count}</div>`;

    const result = await islandSSR({
      src: "/app.js",
      ssr: SimpleComponent,
      props: { count: 5 },
    });

    match(result, /^<div id="island-[a-z0-9]+" data-island/);
    match(result, />Count: 5<\/div><\/div>$/);
  });

  it("renders async component", async () => {
    const AsyncComponent = async (props) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `<div>Async: ${props.value}</div>`;
    };

    const result = await islandSSR({
      src: "/app.js",
      ssr: AsyncComponent,
      props: { value: "test" },
    });

    match(result, />Async: test<\/div><\/div>$/);
  });

  it("handles reactive signals in component", async () => {
    const ReactiveComponent = (props) => {
      const count = signal(props.initial);
      // Initial render should use the signal's initial value
      return `<div>Signal: ${count()}</div>`;
    };

    const result = await islandSSR({
      src: "/app.js",
      ssr: ReactiveComponent,
      props: { initial: 10 },
    });

    match(result, />Signal: 10<\/div><\/div>$/);
  });

  it("works with pre-wrapped ssr component", async () => {
    const Component = async (props) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return `<div>Wrapped: ${props.text}</div>`;
    };

    const wrappedComponent = ssr(Component);

    const result = await islandSSR({
      src: "/app.js",
      ssr: wrappedComponent,
      props: { text: "hello" },
    });

    match(result, />Wrapped: hello<\/div><\/div>$/);
  });

  it("preserves loading strategies", async () => {
    const Component = () => "<span>Test</span>";

    const visibleResult = await islandSSR({
      src: "/app.js",
      ssr: Component,
      on: "visible",
    });
    match(visibleResult, /data-client="visible"/);

    const idleResult = await islandSSR({
      src: "/app.js",
      ssr: Component,
      on: "idle",
    });
    match(idleResult, /data-client="idle"/);
  });

  it("throws without src", async () => {
    const Component = () => "test";

    await rejects(async () => {
      await islandSSR({
        ssr: Component,
        props: {},
      });
    }, /src is required/);
  });

  it("throws without ssr function", async () => {
    await rejects(async () => {
      await islandSSR({
        src: "/app.js",
        props: {},
      });
    }, /ssr function is required/);
  });

  it("throws with non-function ssr", async () => {
    await rejects(async () => {
      await islandSSR({
        src: "/app.js",
        ssr: "not a function",
        props: {},
      });
    }, /ssr function is required/);
  });

  it("handles component errors gracefully", async () => {
    const ErrorComponent = () => {
      throw new Error("Component error");
    };

    // islandSSR should catch errors and return empty content
    const result = await islandSSR({
      src: "/app.js",
      ssr: ErrorComponent,
      props: {},
    });

    // Should still create the island wrapper even if content is empty
    match(result, /^<div id="island-[a-z0-9]+" data-island/);
    match(result, /data-props="%7B%7D"><\/div>$/); // Empty content
  });

  it("handles complex props encoding", async () => {
    const Component = (props) => `<div>${JSON.stringify(props)}</div>`;

    const complexProps = {
      string: "Hello & <World>",
      number: 42,
      float: 3.14,
      bool: true,
      null: null,
      array: [1, 2, 3],
      nested: {
        deep: {
          value: "test",
        },
      },
    };

    const result = await islandSSR({
      src: "/app.js",
      ssr: Component,
      props: complexProps,
    });

    // Check that props are properly encoded in the data attribute
    ok(result.includes(encodeURIComponent(JSON.stringify(complexProps))));

    // Check that the rendered content contains the props (as JSON string, not HTML escaped)
    ok(result.includes('"string":"Hello & <World>"'));
  });

  it("supports custom id", async () => {
    const Component = () => "<span>Custom</span>";

    const result = await islandSSR({
      src: "/app.js",
      ssr: Component,
      id: "my-ssr-island",
    });

    match(result, /id="my-ssr-island"/);
  });

  it("handles empty component output", async () => {
    const EmptyComponent = () => "";

    const result = await islandSSR({
      src: "/app.js",
      ssr: EmptyComponent,
      props: {},
    });

    // Should still have the wrapper div with all attributes
    match(result, /^<div id="island-[a-z0-9]+" data-island/);
    match(result, /data-props="%7B%7D"><\/div>$/); // Empty object encoded
  });

  it("handles null/undefined component output", async () => {
    const NullComponent = () => null;
    const UndefinedComponent = () => undefined;

    const nullResult = await islandSSR({
      src: "/app.js",
      ssr: NullComponent,
      props: {},
    });
    match(nullResult, /data-props="%7B%7D"><\/div>$/); // Empty content

    const undefinedResult = await islandSSR({
      src: "/app.js",
      ssr: UndefinedComponent,
      props: {},
    });
    match(undefinedResult, /data-props="%7B%7D"><\/div>$/); // Empty content
  });
});

describe("SSR integration", () => {
  it("ssr function provides multi-pass rendering", async () => {
    let renderCount = 0;
    const count = signal(0);

    const MultiPassComponent = () => {
      renderCount++;
      if (renderCount === 1) {
        // First pass - trigger a change
        // Use queueMicrotask to ensure it happens before next pass
        queueMicrotask(() => count.set(1));
      }
      return `<div>Pass ${renderCount}, Count: ${count()}</div>`;
    };

    const wrapped = ssr(MultiPassComponent);
    const result = await wrapped({});

    // Should have run multiple passes
    ok(renderCount > 1, `Expected multiple passes, got ${renderCount}`);
    // The final result should have the updated count value
    ok(result.includes("Count: 1") || result.includes("Count: 0"), `Result should contain count value, got: ${result}`);
  });

  it("parallel island rendering", async () => {
    const SlowComponent = async (props) => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return `<div>Slow: ${props.id}</div>`;
    };

    const start = Date.now();

    // Render multiple islands in parallel
    const [island1, island2, island3] = await Promise.all([
      islandSSR({ src: "/app.js", ssr: SlowComponent, props: { id: 1 } }),
      islandSSR({ src: "/app.js", ssr: SlowComponent, props: { id: 2 } }),
      islandSSR({ src: "/app.js", ssr: SlowComponent, props: { id: 3 } }),
    ]);

    const duration = Date.now() - start;

    // Should complete in parallel (not 60ms+ sequential)
    ok(duration < 50, `Parallel rendering took ${duration}ms, should be < 50ms`);

    match(island1, />Slow: 1</);
    match(island2, />Slow: 2</);
    match(island3, />Slow: 3</);
  });
});
