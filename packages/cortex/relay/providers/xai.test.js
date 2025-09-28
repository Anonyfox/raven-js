import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { PROVIDERS } from "./detect.js";
import { buildXAIRequest, extractXAIText, xaiHeaders } from "./xai.js";

describe("relay/providers/xai", () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env };
    process.env[PROVIDERS.xai.envKey] = "z";
  });

  it("builds request with json mode", () => {
    const req = buildXAIRequest({ model: "grok-beta", messages: [], forceJson: true });
    assert.equal(req.model, "grok-beta");
    assert.equal(req.response_format.type, "json_object");
  });

  it("extracts text", () => {
    const text = extractXAIText({ choices: [{ message: { content: " hi " } }] });
    assert.equal(text, "hi");
  });

  it("headers require env", () => {
    const h = xaiHeaders();
    assert.ok(h.Authorization?.startsWith("Bearer "));
  });
});
