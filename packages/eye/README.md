# @raven-js/eye 🦅

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![npm](https://img.shields.io/npm/v/@raven-js/eye.svg)](https://www.npmjs.com/package/@raven-js/eye)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

<div align="center">
  <img src="./media/logo.webp" alt="Eye Logo" width="200" height="200" />
</div>

> **Raven's reconnaissance intelligence** - Zero-dependency digital fingerprinting and security assessment library

Eye provides surgical precision for reconnaissance intelligence - comprehensive digital fingerprinting, security assessment, competitive analysis, and vulnerability discovery. Built with zero dependencies and modern JavaScript, it delivers the sharp reconnaissance tools needed for apex predator intelligence gathering.

## Installation

```bash
npm install @raven-js/eye
```

## Usage

```javascript
import * as dns from "@raven-js/eye/dns";
import * as security from "@raven-js/eye/security";
import * as intel from "@raven-js/eye/intel";

// DNS reconnaissance
const subdomains = await dns.findSubdomains('example.com');
const hosting = await dns.getHostingInfo('example.com');

// Security assessment
const exposedFiles = await security.findExposedFiles('https://example.com');
const vulnerabilities = await security.findSecurityIssues('https://example.com');

// Complete intelligence gathering
const report = await intel.fullRecon('https://example.com');
console.log(report.critical); // Critical security issues found
```

## Reconnaissance Modules

- **DNS** - Subdomain enumeration, hosting detection, email configuration analysis
- **HTTP** - Server fingerprinting, security headers, infrastructure detection
- **Security** - Vulnerability discovery, exposed file detection, attack surface mapping
- **Tech** - Technology stack identification, platform detection, competitive intelligence
- **Assets** - Resource discovery, dependency mapping, performance analysis
- **APIs** - Endpoint discovery, GraphQL introspection, WebSocket detection
- **Intel** - High-level intelligence synthesis and comprehensive reporting

## Philosophy

Eye embodies the Raven philosophy of surgical reconnaissance intelligence:

- **Zero dependencies** - No supply chain vulnerabilities
- **Modern JavaScript** - ESNext features, no transpilation
- **Platform-native** - Built on Node.js and browser APIs
- **Surgical precision** - Maximum intelligence from minimal exposure
- **Institutional memory** - Decades of security research encoded

---

<div align="center">

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

</div>
