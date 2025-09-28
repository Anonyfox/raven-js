import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { PROVIDERS } from "./detect.js";
import { buildOpenAIRequest, extractOpenAIText, openAIHeaders } from "./openai.js";

describe("relay/providers/openai", () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env };
    process.env[PROVIDERS.openai.envKey] = "x";
  });

  it("builds request with json mode", () => {
    const req = buildOpenAIRequest({ model: "gpt-4o", messages: [], forceJson: true });
    assert.equal(req.model, "gpt-4o");
    assert.equal(req.response_format.type, "json_object");
  });

  it("extracts text", () => {
    const text = extractOpenAIText({ choices: [{ message: { content: " hi " } }] });
    assert.equal(text, "hi");
  });

  it("headers require env", () => {
    const h = openAIHeaders("openai");
    assert.ok(h.Authorization?.startsWith("Bearer "));
  });
});
