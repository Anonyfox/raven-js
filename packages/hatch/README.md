# @raven-js/hatch 🦅

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![npm](https://img.shields.io/npm/v/@raven-js/hatch.svg)](https://www.npmjs.com/package/@raven-js/hatch)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

<div align="center">
  <img src="./media/logo.webp" alt="Hatch Logo" width="200" height="200" />
</div>

> **Raven's nest builder** - Zero-dependency app bootstrapping and tutorial CLI for modern JavaScript

Hatch provides surgical precision for project creation and developer guidance. Built with zero dependencies and modern JavaScript, it offers the sharp tools needed to bootstrap new applications and guide developers through the RavenJS ecosystem with the intelligence and efficiency ravens are known for.

## Installation

```bash
npm install -g @raven-js/hatch
```

## Usage

```bash
# Create new application
hatch create my-app

# Start interactive tutorial
hatch tutorial

# Get recommendations for next steps
hatch guide
```

```javascript
import { create, tutorial } from "@raven-js/hatch";

// Programmatic app creation
await create({
  name: "my-app",
  template: "minimal",
  features: ["wings", "beak"],
});

// Interactive tutorial system
await tutorial.start("getting-started");
```

## Philosophy

Hatch embodies the Raven philosophy of surgical precision in project bootstrapping:

- **Zero dependencies** - No supply chain vulnerabilities
- **Modern JavaScript** - ESNext features, no transpilation
- **Platform-native** - Built on Node.js built-ins and native APIs
- **Intelligent guidance** - Smart recommendations for RavenJS ecosystem

---

<div align="center">

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

</div>
