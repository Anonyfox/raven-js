# Cortex Relay

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Lean, provider‑agnostic chat abstraction for OpenAI, Anthropic, and xAI with schema‑validated structured outputs. No deps.

## Install

```bash
npm install @raven-js/cortex
```

## Quick start

```javascript
import { genText } from "@raven-js/cortex/relay";

// ENV: API_KEY_OPENAI, API_KEY_ANTHROPIC, API_KEY_XAI
const text = await genText("Hello there!", { system: "Be brief.", model: "gpt-4o-mini" });
console.log(text);
```

## Structured data (Schema)

```javascript
import { genData } from "@raven-js/cortex/relay";
import { Schema } from "@raven-js/cortex/structures";

class FlightPlan extends Schema {
  summer = Schema.field("", { description: "Where to fly in summer" });
  winter = Schema.field("", { description: "Where to fly in winter" });
}

const data = await genData("Where should Nevermore fly?", new FlightPlan());
console.log(data.summer.value);
```

## Multi‑step chat

```javascript
const chat = new Chat("gpt-4o-mini");
chat.addSystemMessage("Act as Edgar Allan Poe.");
const reply = await chat.generateText("While I pondered weak and weary...");
```

## Tools & Agents

Subclass `Tool`, register instances with `chat.addTool()`, and the model will autonomously invoke them via tool-calling.

```javascript
import { Chat, Tool } from "@raven-js/cortex/relay";
import { Schema } from "@raven-js/cortex/structures";

class WeatherArgs extends Schema {
  city = Schema.field("", { description: "City name" });
}

class GetWeather extends Tool {
  constructor() {
    super({ name: "getWeather", description: "Return weather for a city", parameters: new WeatherArgs() });
  }
  async execute({ args }) {
    return { forecast: `Sunny in ${args.city}` };
  }
}

const chat = new Chat("gpt-4o-mini").addTool(new GetWeather());
chat.addSystemMessage("Use tools to answer precisely.");
const answer = await chat.generateText("What's the weather in Berlin?");
```

## Provider control

- **Activation**: A provider is active if its API key env var is set.
- **Auto‑detect** by `model`: `gpt*` → OpenAI, `claude*` → Anthropic, `grok*` → xAI.
- **Per‑call override**:

```javascript
await chat.generateText("hello", { provider: "anthropic" });
await chat.generateData("give json", schema, { provider: "xai" });
```

## API

- **Class `Message`**

  - `new Message(role, content)` where `role` is `"system"|"user"|"assistant"`
  - `toJSON()`, `static fromJSON(obj)`

- **Class `Chat`**

  - `constructor(model = "gpt-4o-mini")`
  - `addSystemMessage(str)`, `addUserMessage(str)`, `addAssistantMessage(str)`
  - `generateText(prompt, opts?)` → `Promise<string>`
  - `generateData(prompt, schema, opts?)` → `Promise<schema>`
  - `static genText(prompt, system?, opts?)`
  - `static genData(prompt, schema, system?, opts?)`
  - `toJSON()` → `string`, `fromJSON(json)`

- **Call options**
  - `provider?: "openai"|"anthropic"|"xai"`
  - `timeoutMs?: number` (default: 120_000)
  - `retries?: number` (default: 3)

## Environment variables

- `API_KEY_OPENAI` — OpenAI
- `API_KEY_ANTHROPIC` — Anthropic
- `API_KEY_XAI` — xAI

Keys are required for the provider to be considered active. Missing key → explicit error.

## Behavior

- Uses native `fetch`; zero dependencies.
- JSON mode enforced where supported; code fences stripped before validation.
- Structured outputs are validated via `Schema.validate()` then applied via `Schema.fromJSON()`.
- Per‑call provider override or auto‑detection by model; strategy hook available via subclassing `selectProviderStrategy`.

## Example: strategy mix‑and‑match

```javascript
class AlternatingChat extends Chat {
  selectProviderStrategy({ callIndex, active }) {
    const round = ["openai", "anthropic", "xai"].filter(p => active.includes(p));
    return round.length ? /** @type {any} */ (round[callIndex % round.length]) : null;
  }
}
```

## Requirements

- Node.js 22.5+
- ESM modules

## Notes

- Secrets are never accepted via parameters; only environment variables are used.
