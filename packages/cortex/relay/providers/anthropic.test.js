import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { anthropicHeaders, buildAnthropicRequest, extractAnthropicText } from "./anthropic.js";
import { PROVIDERS } from "./detect.js";

describe("relay/providers/anthropic", () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env };
    process.env[PROVIDERS.anthropic.envKey] = "y";
  });

  it("moves system to top-level", () => {
    const req = buildAnthropicRequest({
      model: "claude",
      messages: [
        { role: "system", content: "s" },
        { role: "user", content: "u" },
      ],
    });
    assert.equal(req.system, "s");
    assert.equal(req.messages.length, 1);
  });

  it("extracts text", () => {
    const text = extractAnthropicText({ content: [{ text: " hi " }] });
    assert.equal(text, "hi");
  });

  it("headers require env", () => {
    const h = anthropicHeaders();
    assert.equal(h["anthropic-version"], "2023-06-01");
  });
});
