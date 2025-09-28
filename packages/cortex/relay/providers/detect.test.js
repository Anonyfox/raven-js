import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { activeProviders, detectProviderByModel, PROVIDERS } from "./detect.js";

describe("relay/providers/detect", () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.API_KEY_OPENAI;
    delete process.env.API_KEY_ANTHROPIC;
    delete process.env.API_KEY_XAI;
  });

  it("detects by model substrings", () => {
    assert.equal(detectProviderByModel("gpt-4o-mini"), "openai");
    assert.equal(detectProviderByModel("claude-3-5"), "anthropic");
    assert.equal(detectProviderByModel("grok-beta"), "xai");
    assert.equal(detectProviderByModel("unknown"), null);
  });

  it("lists active providers via env", () => {
    process.env[PROVIDERS.openai.envKey] = "x";
    process.env[PROVIDERS.xai.envKey] = "y";
    const act = activeProviders();
    assert.ok(act.includes("openai"));
    assert.ok(act.includes("xai"));
    assert.ok(!act.includes("anthropic"));
  });
});
