/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Provider detection and activation based on environment variables.
 */

export const PROVIDERS = {
  openai: {
    name: "OpenAI",
    signature: "gpt",
    envKey: "API_KEY_OPENAI",
  },
  anthropic: {
    name: "Anthropic",
    signature: "claude",
    envKey: "API_KEY_ANTHROPIC",
  },
  xai: {
    name: "xAI",
    signature: "grok",
    envKey: "API_KEY_XAI",
  },
};

/**
 * List active providers based on env presence.
 * @returns {Array<keyof typeof PROVIDERS>}
 */
export function activeProviders() {
  /** @type {Array<keyof typeof PROVIDERS>} */
  const list = [];
  for (const key of /** @type {Array<keyof typeof PROVIDERS>} */ (Object.keys(PROVIDERS))) {
    const env = process.env[PROVIDERS[key].envKey];
    if (typeof env === "string" && env.length > 0) list.push(key);
  }
  return list;
}

/**
 * Detect provider by model id.
 * @param {string} model
 * @returns {keyof typeof PROVIDERS | null}
 */
export function detectProviderByModel(model) {
  const lower = model.toLowerCase();
  for (const key of /** @type {Array<keyof typeof PROVIDERS>} */ (Object.keys(PROVIDERS))) {
    if (lower.includes(PROVIDERS[key].signature)) return key;
  }
  return null;
}

/**
 * Assert provider is active.
 * @param {keyof typeof PROVIDERS} key
 */
export function assertProviderActive(key) {
  const envKey = PROVIDERS[key].envKey;
  const val = process.env[envKey];
  if (!val) {
    throw new Error(`${PROVIDERS[key].name} is not active (missing ${envKey})`);
  }
}
