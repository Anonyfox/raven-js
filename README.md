<div align="center">
  <img src="media/raven-landscape.png" alt="RavenJS Landscape" style="max-width: 100%; height: auto;">
</div>

# RavenJS 🦅

_Zero-dependency JavaScript libraries for modern web development. Built by developers who've learned that survival comes from platform mastery, not framework dependency._

[![Website](https://img.shields.io/badge/🌐_Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/📚_Docs-Online-blue.svg)](https://docs.ravenjs.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/Modules-ESM_Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

## How Ravens Hunt

```javascript
import { html, css } from "@raven-js/beak";
import { Router, DevServer, Logger, Assets } from "@raven-js/wings";

// Template with zero dependencies
const styles = css`
  .app {
    padding: 2rem;
    color: #333;
  }
  .title {
    font-size: 2rem;
    font-weight: bold;
  }
  .features {
    list-style: none;
    padding: 0;
  }
  .feature {
    padding: 0.5rem 0;
  }
`;

const HomePage = () => {
  const advantages = [
    "Zero dependencies",
    "Platform primitives",
    "AI-native design",
  ];

  return html`
    <style>
      ${styles}
    </style>
    <div class="app">
      <h1 class="title">Ravens build. Others talk.</h1>
      <ul class="features">
        ${advantages.map(
          (feature) => html`<li class="feature">✓ ${feature}</li>`
        )}
      </ul>
    </div>
  `;
};

// Routing with production-ready middlewares
const router = new Router();
router.useEarly(new Logger()); // Request logging
router.use(new Assets({ assetsDir: "public" })); // Static files
router.get("/", (ctx) => ctx.html(HomePage()));

// Server in milliseconds, not minutes
const server = new DevServer(router);
await server.listen(3000);
```

> **Pro tip:** Install the [RavenJS VS Code extension](plugins/vscode/) for intelligent syntax highlighting and IntelliSense in your templates.

<details>
<summary>🚀 <strong>Advanced Production Setup</strong> — Full-scale deployment with clustering, SSL, and complex rendering</summary>

```javascript
import { html, css } from "@raven-js/beak";
import {
  Router,
  ClusteredServer,
  Logger,
  Assets,
  generateSSLCert,
} from "@raven-js/wings";

// Advanced templating with complex data structures
const todos = [
  { id: 1, task: "Master platform primitives", done: true },
  { id: 2, task: "Eliminate dependency vulnerabilities", done: true },
  { id: 3, task: "Achieve apex performance", done: false },
];

const styles = css`
  .todo-app {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  .todo {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 0;
  }
  .done {
    opacity: 0.6;
    text-decoration: line-through;
  }
`;

const TodoApp = () => html`
  <style>
    ${styles}
  </style>
  <div class="todo-app">
    <h2>🦅 Raven Task Manager</h2>
    ${todos.map(
      (todo) => html`
        <div class="todo ${todo.done ? "done" : "pending"}">
          <span>${todo.done ? "✅" : "⭕"}</span>
          <span>${todo.task}</span>
        </div>
      `
    )}
  </div>
`;

// Production-grade router with full middleware stack
const router = new Router();
router.useEarly(new Logger({ production: true, includeHeaders: false }));
router.use(new Assets({ assetsDir: "public", maxAge: "1y" }));
router.get("/", (ctx) => ctx.html(TodoApp()));

// Clustered HTTPS server with auto-generated certificates
const { privateKey, certificate } = await generateSSLCert({
  commonName: "ravenjs.app",
  organization: "Apex Productions",
});

const server = new ClusteredServer(router, {
  sslCertificate: certificate,
  sslPrivateKey: privateKey,
});

await server.listen(443);
```

</details>

**Next in the hunt:** Three key tools complete the predator's arsenal — **Hatch** (CLI to bootstrap new apps instantly), **Fledge** (package apps into various deliverables), and **Soar** (ship directly to cloud platforms).

<div align="center">

🦅 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🦅

</div>

## Raven Intelligence

| 🛡️ **Zero-Dependency Security**                                                                     | ⚡ **Native-Speed Performance**                                                               | 🧠 **AI-Native Intelligence**                                                                           |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Every package is fortress-isolated with no external attack vectors or supply chain vulnerabilities. | Platform primitives deliver millisecond builds and runtime speed without transpilation taxes. | Self-documenting APIs teach both humans and machines, designed for AI collaboration from the ground up. |

## The Flock

### 🦜 [Beak](packages/beak/README.md) — _Templating & Rendering_

Zero-dependency templating for HTML, CSS, SQL, Markdown, and JavaScript. XSS protection built-in. Component architecture without framework overhead.

### 🦅 [Wings](packages/wings/README.md) — _Isomorphic Routing_

Universal routing that works in server, browser, and CLI environments. Same route definitions everywhere. No framework lock-in, no configuration cancer.

<div align="center">

⚡ ─────────────────────── ⚡

</div>

## Territory Expansion

Ravens coordinate through collective intelligence. More packages emerge as the murder grows stronger.

📖 **Read the [RavenJS Codex](CODEX.md)** - The witnessed wisdom of framework wars and survival strategies
🏠 **Explore [the full ecosystem](packages/README.md)** - Complete roadmap of planned territories

---

<div align="center">

## 🔗 Quick Access

**📚 [Documentation](https://docs.ravenjs.dev)** • **🐦 [Codex](CODEX.md)** • **🏠 [Packages](packages/README.md)** • **⚡ [Examples](examples/)**

---

## 🦅 Support Raven Intelligence

If RavenJS sharpens your hunt, consider supporting its evolution:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor_on_GitHub-EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/anonyfox)

**Your sponsorship keeps RavenJS zero-dependency, platform-native, and AI-ready.**

---

**Crafted with predatory precision by [Anonyfox](https://anonyfox.com) • Licensed under [MIT](LICENSE)**

_"In a world obsessed with the next shiny framework, ravens build what endures."_

</div>
