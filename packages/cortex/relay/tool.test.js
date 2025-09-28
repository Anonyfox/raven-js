import assert from "node:assert";
import { describe, it } from "node:test";
import { Schema } from "../structures/schema.js";
import { schemaToJsonObject, Tool } from "./tool.js";

class Args extends Schema {
  x = Schema.field(0, { description: "x" });
}

describe("relay/Tool", () => {
  it("constructs and exports schema json", () => {
    const t = new Tool({ name: "noop", parameters: new Args() });
    assert.equal(t.name, "noop");
    const json = schemaToJsonObject(t.parameters);
    assert.equal(json.type, "object");
  });

  it("enforces execute abstract", async () => {
    const t = new Tool({ name: "noop", parameters: new Args() });
    await assert.rejects(() => t.execute({ args: {} }));
  });
});
