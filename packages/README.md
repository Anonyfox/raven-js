# 🦅 The RavenJS Flock

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/Documentation-Online-blue.svg)](https://docs.ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)

## Why This Flock Is Organized the Way It Is

RavenJS is not another "all-or-nothing" framework.
It's a **toolkit of sharp, standalone parts** (capabilities) and **focused movements** (activities) you can drop into _any_ modern JavaScript project — plus a full framework (`@raven-js/raven`) that stitches them together when you want the whole bird.

- **Capabilities** — the raven's **body parts**: direct, in-app features you import into your own codebase. Standalone, zero bloat, tree-shakable.
- **Activities** — the raven's **movements**: operational steps you run _with_ your apps/packages — building, bundling, shipping.
- **Identity & habitat** — the raven itself, its nest, and its call: the glue and tooling that make the ecosystem feel seamless.

> Everything here is designed so you can pick only what you need, without carrying dead weight.
> Every package (except the full `raven` framework and workspace tools) is valuable on its own.

---

## 📦 Capabilities — The Raven's Body Parts (Standalone)

**Capabilities** are drop-in functionalities you `npm install` and use directly in your application code. These are dependency-free standalone utilities that become part of your application's runtime. Think of them as the raven's body parts - each one provides a specific function you can import and use immediately. They're designed to be lightweight, focused, and tree-shakable, so you only bundle what you actually use.

### 🦜 Beak — _Templating_

<div align="center">
  <img src="../media/raven-logo-beak.png" alt="Beak Logo" width="120" height="120">
</div>

The raven's voice and craft: zero-dep HTML/CSS/SQL rendering.

**Status:** ✅ **Complete** - Ready for production use

**Features:**

- [x] HTML templating with XSS protection
- [x] CSS-in-JS with automatic optimization
- [x] SQL query building with injection prevention
- [x] Markdown parsing and rendering
- [x] JavaScript code generation
- [x] Component architecture support
- [x] VS Code extension with syntax highlighting

**Roadmap:**

- [ ] Optional terminal output utilities (tables, progress, spinners)

---

### 🦅 Wings — _Routing_

<div align="center">
  <img src="../media/raven-logo-wings.png" alt="Wings Logo" width="120" height="120">
</div>

Your app's flight control: isomorphic router with submodules for **SPA** (pushState), **Server** (HTTP routing), and **CLI** (route patterns → commands). A single route is a **Feather** — light, movable, composable.

**Status:** 🚧 **In Development**

**Features:**

- [ ] Isomorphic routing (SPA, Server, CLI)
- [ ] Lightweight route definitions (Feathers)
- [ ] PushState navigation for SPAs
- [ ] HTTP routing for server-side apps
- [ ] CLI command routing
- [ ] Route composition and nesting
- [ ] Middleware support

---

### 👁️ Eye — _Logging & Tracing_

<div align="center">
  <img src="../media/raven-logo-eye.png" alt="Eye Logo" width="120" height="120">
</div>

Sharp vision: structured logs and lightweight tracing spans.

**Status:** 📋 **Planned**

**Features:**

- [ ] Structured logging with levels
- [ ] Lightweight tracing spans
- [ ] Performance monitoring
- [ ] Error tracking and reporting
- [ ] Log formatting and output
- [ ] Integration with external monitoring

---

### 🧠 Cortex — _Data Generation & Handling_

<div align="center">
  <img src="../media/raven-logo-cortex.png" alt="Cortex Logo" width="120" height="120">
</div>

The raven's brain: submodules for **AI** (structured LLM output), **SQLite** (native Node 22.5+ helpers), and **Data** (format utilities, transforms). Zero deps, TS-ready.

**Status:** 📋 **Planned**

**Features:**

- [ ] AI submodule (structured LLM output)
- [ ] SQLite helpers for Node 22.5+
- [ ] Data format utilities and transforms
- [ ] Schema validation and processing
- [ ] Type-safe data handling
- [ ] Integration with external AI services

---

### 🕶️ Shades — _Testing Utilities_

<div align="center">
  <img src="../media/raven-logo-shades.png" alt="Shades Logo" width="120" height="120">
</div>

See into the dark: mocks, doubles, spies, fake timers, and request stubs.

**Status:** 📋 **Planned**

**Features:**

- [ ] Mock objects and doubles
- [ ] Spy functions and call tracking
- [ ] Fake timers and date manipulation
- [ ] Request stubs and HTTP mocking
- [ ] Test data generators
- [ ] Assertion utilities
- [ ] Integration with testing frameworks

---

### ⚡ Reflex — _SPA Reactivity & DOM_

<div align="center">
  <img src="../media/raven-logo-reflex.png" alt="Reflex Logo" width="120" height="120">
</div>

Quick reflexes: tiny signals/stores, DOM mount/patch, effect scheduling. Plays best with Wings/Beak, but never required.

**Status:** 📋 **Planned**

**Features:**

- [ ] Tiny signals and stores
- [ ] DOM mounting and patching
- [ ] Effect scheduling and cleanup
- [ ] Reactive state management
- [ ] Component lifecycle hooks
- [ ] Integration with Wings and Beak
- [ ] Performance optimizations

---

## 🛠 Activities — The Raven's Movements (Standalone)

**Activities** are tooling packages you use in your Node.js/npm project to do something with your whole application. They might have a few handpicked dependencies but won't interfere with your app code itself. These can be used directly with runners like `npx` without needing local installation. Think of them as the raven's movements - they help you build, bundle, deploy, and manage your projects from the outside, not as part of your application's runtime.

### 🐣 Fledge — _Build & Bundle_

<div align="center">
  <img src="../media/raven-logo-fledge.png" alt="Fledge Logo" width="120" height="120">
</div>

From nestling to flight-ready. Modes: **standalone binary**, **script blob**, **static folder** (SSG).

**Status:** 📋 **Planned**

**Features:**

- [ ] Standalone binary generation
- [ ] Script blob bundling
- [ ] Static site generation (SSG)
- [ ] Asset optimization and compression
- [ ] Development server with hot reload
- [ ] Production build optimization
- [ ] Multiple output formats

---

### 🦅 Soar — _Deploy_

<div align="center">
  <img src="../media/raven-logo-soar.png" alt="Soar Logo" width="120" height="120">
</div>

Take to the sky: clean submodule exports for **cloudflare**, **aws-lambda**, **do-droplet**, and more.

**Status:** 📋 **Planned**

**Features:**

- [ ] Cloudflare Workers deployment
- [ ] AWS Lambda packaging
- [ ] DigitalOcean Droplet deployment
- [ ] Vercel and Netlify integration
- [ ] Docker containerization
- [ ] Environment-specific builds
- [ ] Deployment automation

---

## 🏠 Identity & Habitat — The Bird & Its Home (Ecosystem Glue)

### 🦅 Raven — _Application Framework_

<div align="center">
  <img src="../media/raven-logo-original.png" alt="Raven Logo" width="120" height="120">
</div>

The full bird: bootable/extendable framework that composes all capabilities into a seamless developer experience.

**Status:** 📋 **Planned**

**Features:**

- [ ] Framework bootstrapping
- [ ] Capability composition
- [ ] Developer experience tooling
- [ ] Configuration management
- [ ] Plugin system
- [ ] Application lifecycle management
- [ ] Integration with all RavenJS packages

---

### 🪺 Nest — _Monorepo Automation_

<div align="center">
  <img src="../media/raven-logo-simple.png" alt="Nest Logo" width="120" height="120">
</div>

The janitor and automation tool for the RavenJS monorepo itself. Handles package validation, testing, documentation generation, version management, and release workflows. This is internal tooling that keeps the RavenJS ecosystem clean and organized.

**Status:** 🚧 **In Development**

**Features:**

- [x] Package validation and testing across the monorepo
- [x] Documentation generation and management
- [x] Version management and semver bumping
- [x] Task runner for monorepo operations
- [x] Workspace package discovery and management
- [ ] Release workflows and automation
- [ ] Repository maintenance and cleanup
- [ ] Monorepo health monitoring and reporting

---

### 🎯 CLI — _Command-Line Interface_

<div align="center">
  <img src="../media/raven-logo-simple.png" alt="CLI Logo" width="120" height="120">
</div>

The standard companion tool for framework usage: create new app skeletons, scaffold components, and bootstrap RavenJS projects. Installed globally as `raven`, it provides the familiar developer experience you expect from modern frameworks.

**Status:** 📋 **Planned**

**Features:**

- [ ] Create new RavenJS applications (`raven create my-app`)
- [ ] Generate components, pages, and utilities (`raven generate component Button`)
- [ ] Scaffold project structure and configurations
- [ ] Interactive project setup with guided prompts
- [ ] Template generation for common patterns
- [ ] Integration with Nest, Fledge, and Soar workflows
- [ ] Project migration and upgrade assistance

---

## Legend

- ✅ **Complete** - Ready for production use
- 🚧 **In Development** - Actively being built
- 📋 **Planned** - On the roadmap, not yet started

---

<div align="center">

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

</div>
