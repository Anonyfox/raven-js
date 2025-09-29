import assert from "node:assert";
import { describe, it } from "node:test";
import { Schema } from "../structures/schema.js";
import { schemaToJsonObject, Tool } from "./tool.js";

class Args extends Schema {
  x = Schema.field(0, { description: "x" });
}

describe("relay/Tool", () => {
  it("constructs and exports schema json", () => {
    class TestTool extends Tool {
      name = "noop";
      parameters = new Args();
    }
    const t = new TestTool();
    assert.equal(t.name, "noop");
    const json = schemaToJsonObject(t.parameters);
    assert.equal(json.type, "object");
  });

  it("enforces execute abstract", async () => {
    class TestTool extends Tool {
      name = "noop";
      parameters = new Args();
    }
    const t = new TestTool();
    await assert.rejects(() => t.execute({ args: {} }));
  });
});
