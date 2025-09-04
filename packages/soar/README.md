# @raven-js/soar 🦅

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![npm](https://img.shields.io/npm/v/@raven-js/soar.svg)](https://www.npmjs.com/package/@raven-js/soar)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

<div align="center">
  <img src="./media/logo.webp" alt="Soar Logo" width="200" height="200" />
</div>

> **Surgical precision deployment** - Zero-dependency deployment tool for modern JavaScript applications

Soar provides surgical precision deployment capabilities for any artifact to any target. Built with zero external dependencies and leveraging modern Node.js primitives, it offers the sharp tools needed to deploy static sites, scripts, and binaries with the intelligence and efficiency ravens are known for.

## Quick Start

```bash
# Install
npm install -D @raven-js/soar

# Deploy static site to Cloudflare Workers (no config needed!)
npx soar deploy --static ./dist --cloudflare-workers my-app

# Or use a config file
npx soar deploy raven.soar.js

# Plan deployment first (dry-run)
npx soar plan --static ./dist --cf-workers my-app --verbose
```

## Artifact Types

Soar is **tech-agnostic** and can deploy any type of build output:

### 🗂️ **Static Sites**

Deploy pre-built static files (HTML, CSS, JS, assets).

**Perfect for:**

- **Fledge** SSG output (`fledge build`)
- React/Vue/Angular builds (`npm run build`)
- Vite/Webpack/Parcel bundles
- Jekyll/Hugo/Gatsby sites
- Any static file collection

**Example:**

```javascript
// raven.soar.js
export default {
  artifact: {
    type: "static",
    path: "./dist",
    exclude: ["*.map", "node_modules/**"],
  },
  target: {
    name: "cloudflare-workers",
    scriptName: "my-site",
  },
};
```

### 📦 **Script Bundles** _(Coming Soon)_

Deploy server-side JavaScript applications and functions.

**Perfect for:**

- Node.js applications
- Serverless functions
- API endpoints
- Background workers

### 🔧 **Binary Artifacts** _(Coming Soon)_

Deploy compiled binaries and executables.

**Perfect for:**

- Go/Rust/C++ applications
- Container images
- System services
- CLI tools

## Deployment Targets

### ☁️ **Cloudflare Workers** _(Current)_

Deploy static sites using Cloudflare Workers Static Assets.

**Features:**

- ✅ **Free tier friendly** - 100,000 requests/day
- ✅ **Global CDN** - 300+ edge locations
- ✅ **Custom domains** - Bring your own domain
- ✅ **HTTPS by default** - Automatic SSL certificates
- ✅ **Zero config** - Works out of the box

**Setup:**

1. Get API token: [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Set environment variables:
   ```bash
   export CF_API_TOKEN="your-api-token"
   export CF_ACCOUNT_ID="your-account-id"
   ```
3. Deploy:
   ```bash
   npx soar deploy --static ./dist --cf-workers my-site
   ```

### 🌊 **AWS S3 + CloudFront** _(Coming Soon)_

Deploy to AWS with global CDN distribution.

### 🐙 **DigitalOcean** _(Coming Soon)_

Deploy to Spaces (static) and Droplets (servers).

### 🚀 **Custom VPS** _(Coming Soon)_

Deploy to any Linux server via SSH.

## CLI Usage

Soar follows **Unix philosophy** with multiple input methods:

### 🔧 **Flag-Based (No Config File)**

```bash
# Static to Cloudflare Workers
soar deploy --static ./dist --cloudflare-workers my-app

# With custom settings
soar deploy --static ./dist --cf-workers my-app \
  --cf-account $CF_ACCOUNT_ID \
  --cf-token $CF_API_TOKEN
```

### 📄 **Config File**

```bash
# Default config
soar deploy

# Specific config file
soar deploy raven.soar.js

# Named export (environments)
soar deploy raven.soar.js:production
```

### 🔄 **Piped Input (Unix Style)**

```bash
# Generate config dynamically
echo "export default {
  artifact: { type: 'static', path: './dist' },
  target: { name: 'cloudflare-workers', scriptName: 'my-app' }
}" | soar deploy
```

### 📋 **Planning (Dry-Run)**

```bash
# Plan deployment without executing
soar plan --static ./dist --cf-workers my-app --verbose

# Plan with config file
soar plan raven.soar.js:staging
```

## Configuration

### Basic Config

```javascript
// raven.soar.js
export default {
  artifact: {
    type: "static",
    path: "./dist",
  },
  target: {
    name: "cloudflare-workers",
    scriptName: "my-production-site",
    accountId: process.env.CF_ACCOUNT_ID,
    apiToken: process.env.CF_API_TOKEN,
    compatibilityDate: "2024-01-01",
  },
};
```

### Multi-Environment Config

```javascript
// raven.soar.js
const base = {
  artifact: { type: "static", path: "./dist" },
};

export default {
  ...base,
  target: {
    name: "cloudflare-workers",
    scriptName: "my-site-dev",
  },
};

export const production = {
  ...base,
  target: {
    name: "cloudflare-workers",
    scriptName: "my-site-prod",
    dispatchNamespace: "production",
  },
};

export const staging = {
  ...base,
  target: {
    name: "cloudflare-workers",
    scriptName: "my-site-staging",
  },
};
```

### Advanced Static Config

```javascript
// raven.soar.js
export default {
  artifact: {
    type: "static",
    path: "./dist",
    exclude: [
      "*.map", // Source maps
      "*.md", // Markdown files
      "node_modules/**", // Dependencies
      ".env*", // Environment files
    ],
  },
  target: {
    name: "cloudflare-workers",
    scriptName: "my-optimized-site",
    compatibilityDate: "2024-01-01",
  },
};
```

## Programmatic API

```javascript
import { deploy, plan } from "@raven-js/soar";

// Deploy with config object
const result = await deploy({
  artifact: { type: "static", path: "./dist" },
  target: { name: "cloudflare-workers", scriptName: "my-app" },
});

console.log(`✅ Deployed to: ${result.url}`);

// Plan deployment (dry-run)
const deploymentPlan = await plan("./raven.soar.js");
console.log(`📊 Files: ${deploymentPlan.artifact.manifest.fileCount}`);
console.log(
  `📦 Size: ${Math.round(deploymentPlan.artifact.manifest.totalSize / 1024)}KB`
);

// Deploy with named export
const prodResult = await deploy("./raven.soar.js", "production");
```

## Integration with Fledge

Soar works seamlessly with [Fledge](https://github.com/Anonyfox/ravenjs/tree/main/packages/fledge) static site generator:

```javascript
// raven.fledge.js
export default {
  server: "http://localhost:3000",
  routes: ["/", "/about", "/contact"],
  output: "./dist",
  discover: true,
};
```

```javascript
// raven.soar.js
export default {
  artifact: {
    type: "static",
    path: "./dist", // Fledge output directory
  },
  target: {
    name: "cloudflare-workers",
    scriptName: "my-fledge-site",
  },
};
```

```bash
# Build and deploy pipeline
fledge static && soar deploy
```

## Environment Variables

```bash
# Cloudflare Workers
CF_API_TOKEN="your-cloudflare-api-token"
CF_ACCOUNT_ID="your-cloudflare-account-id"

# Debug mode
DEBUG=1  # Show detailed error information
```

## Commands

```bash
# Deployment
soar deploy [config] [options]     # Deploy artifact to target
soar plan [config] [options]       # Plan deployment (dry-run)

# Information
soar version                       # Show version
soar help [command]               # Show help

# Coming Soon
soar validate [config]            # Validate configuration
soar list [--provider <name>]     # List deployed resources
soar show <resource-name>         # Show resource details
soar destroy <resource-name>      # Destroy specific resource
```

## Roadmap

### 🚀 **Next Release (v0.5)**

- **Script deployment** - Deploy Node.js functions to serverless platforms
- **AWS S3 + CloudFront** - Static site deployment with global CDN
- **Binary deployment** - Deploy compiled applications to VPS

### 🌟 **Future Releases**

- **DigitalOcean integration** - Spaces and Droplets support
- **Custom VPS deployment** - SSH-based deployment to any Linux server
- **Docker container deployment** - Container registry and orchestration
- **Resource management** - List, inspect, and destroy deployed resources
- **Rollback capabilities** - Quick rollback to previous deployments
- **Deployment analytics** - Performance and usage insights

## Philosophy

Soar embodies the **RavenJS CODEX** principles:

- 🎯 **Surgical Precision** - Minimal, focused, efficient deployments
- ⚡ **Zero Dependencies** - No supply chain vulnerabilities
- 🔧 **Platform Mastery** - Built on Node.js primitives and native APIs
- 🧠 **Algorithm Over Patches** - Clean solutions, not quick fixes
- 📐 **Lean Architecture** - One file per concept, testable functions

## Examples

See the [`examples/`](./examples/) directory for complete deployment examples:

- **[Static Site](./examples/static/)** - Complete Cloudflare Workers deployment
- **Script Bundle** _(Coming Soon)_ - Serverless function deployment
- **Binary Application** _(Coming Soon)_ - VPS deployment example

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE](./LICENSE) file for details.

---

<div align="center">

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

</div>
