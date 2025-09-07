# Eye: Reconnaissance Intelligence Library

Ravens circle overhead, cataloging every detail before the strike. Eye embodies this predatory intelligence—surgical reconnaissance that extracts maximum insight from minimal exposure. Pure JavaScript reconnaissance that delivers concrete intelligence, not abstract metadata.

## Library Architecture

Eye operates through surgical module separation, each domain isolated and composable. Zero dependencies, browser-native APIs, explicit return types. No framework bloat, no abstraction layers—just ruthless intelligence extraction.

```javascript
import * as dns from '@raven-js/eye/dns';
import * as http from '@raven-js/eye/http';
import * as security from '@raven-js/eye/security';
import * as tech from '@raven-js/eye/tech';
import * as assets from '@raven-js/eye/assets';
import * as apis from '@raven-js/eye/apis';
import * as intel from '@raven-js/eye/intel';
```

## Core Principles

**Security First**: Always check critical security issues—exposed `.env`, `.git`, debug artifacts. Real vulnerability discovery, not just metadata collection.

**Explicit Intelligence**: Every function returns concrete data. `findExposedFiles()` returns actual file contents, not boolean existence checks.

**Institutional Memory**: Decades of security researcher knowledge encoded into `CRITICAL_PATHS`. While others reinvent reconnaissance, Eye embodies collective intelligence.

**Performance Reconnaissance**: Parallel checks, minimal requests, maximum intelligence per HTTP call. Ravens don't waste energy on redundant flights.

**Zero Boundaries**: Check what needs checking for security assessment, regardless of robots.txt or permission theater.

## Critical Path Intelligence

```javascript
const CRITICAL_PATHS = [
  '/.env', '/.env.local', '/.env.production',
  '/.git/config', '/.git/HEAD',
  '/wp-config.php.bak', '/config.json',
  '/package.json', '/.DS_Store',
  '/debug.log', '/error.log',
  '/.vscode/settings.json',
  '/api/swagger.json', '/api-docs',
  '/.well-known/security.txt'
];
```

These paths represent every critical exposure pattern discovered across decades of security research. Each path checked represents potential system compromise, credential exposure, or architectural intelligence.

## DNS Module

**What**: Domain Name System reconnaissance for complete infrastructure mapping and subdomain discovery.

**Why**: DNS records reveal hosting architecture, email providers, forgotten subdomains, and development environments. Certificate transparency logs expose the complete attack surface that traditional scanning misses.

**How**: DNS-over-HTTPS queries to public resolvers, certificate transparency log mining, WHOIS correlation, and email configuration analysis.

```javascript
import * as dns from '@raven-js/eye/dns';

// Complete DNS record enumeration
const records = await dns.getAllRecords('example.com');
// Returns: { a: string[], aaaa: string[], mx: Object[], txt: string[], ns: string[], cname: string }

// Subdomain discovery via certificate transparency
const subdomains = await dns.findSubdomains('example.com');
// Returns: string[] - All discovered subdomains from CT logs

// Hosting provider identification
const hosting = await dns.getHostingInfo('example.com');
// Returns: { provider: string, nameservers: string[], soa: Object }

// Email security configuration
const email = await dns.getEmailConfig('example.com');
// Returns: { spf: string, dmarc: string, dkim: string[], mxProvider: string }
```

**Intelligence Value**: Reveals forgotten staging servers, development environments, internal naming conventions. Email configuration exposes security posture and provider relationships. Hosting detection enables infrastructure cost analysis and vendor lock-in assessment.

**Implementation**: DoH queries to `1.1.1.1` and `8.8.8.8`, CT log APIs (`crt.sh`, `censys.io`), correlation with WHOIS data for complete infrastructure mapping.

## HTTP Module

**What**: HTTP protocol analysis for server fingerprinting, security posture assessment, and infrastructure detection.

**Why**: HTTP headers reveal server software, security implementations, CDN usage, and architectural decisions. Response timing exposes backend behavior patterns and potential attack vectors. TLS analysis reveals certificate management and security maturity.

**How**: Comprehensive header analysis, timing attack detection, TLS certificate inspection, infrastructure fingerprinting through response patterns.

```javascript
import * as http from '@raven-js/eye/http';

// Server identification and fingerprinting
const headers = await http.getServerHeaders('https://example.com');
// Returns: { server: string, poweredBy: string, via: string[], custom: Object }

// Security header comprehensive analysis
const security = await http.getSecurityHeaders('https://example.com');
// Returns: { hsts: Object, csp: Object, cors: Object, xframe: string, referrer: string }

// Cookie security and session management
const cookies = await http.analyzeCookies('https://example.com');
// Returns: { cookies: Object[], issues: string[] }

// Infrastructure detection (CDN, WAF, load balancers)
const infrastructure = await http.detectInfrastructure('https://example.com');
// Returns: { cdn: string, waf: string, loadBalancer: string, proxy: boolean }

// Performance and timing analysis
const timing = await http.measureTiming('https://example.com');
// Returns: { ttfb: number, dns: number, tcp: number, tls: number, download: number }

// TLS certificate and security analysis
const tls = await http.getTLSInfo('https://example.com');
// Returns: { cert: Object, issuer: string, expiry: Date, sans: string[], wildcard: boolean }
```

**Intelligence Value**: Server headers reveal technology stack and version information. Security headers indicate implementation maturity and potential bypass vectors. Timing patterns expose database query behavior and caching strategies. Infrastructure detection reveals operational costs and architectural decisions.

**Implementation**: Navigation Timing API for performance metrics, comprehensive header parsing, TLS certificate analysis via browser APIs, response pattern correlation for infrastructure detection.

## Security Module

**What**: Vulnerability discovery and security posture assessment through exposed file detection, debug artifact analysis, and attack surface mapping.

**Why**: Exposed development artifacts represent immediate system compromise vectors. Debug information reveals internal architecture and potential exploitation paths. Authentication analysis exposes access control weaknesses and session management flaws.

**How**: Systematic probing of critical exposure paths, debug artifact enumeration, authentication mechanism fingerprinting, attack surface correlation.

```javascript
import * as security from '@raven-js/eye/security';

// Critical file exposure detection with content extraction
const leaks = await security.findExposedFiles('https://example.com');
// Returns: { exposed: string[], content: Object } - Actually fetches .env, .git, etc.

// Debug artifact and development leak detection
const debug = await security.findDebugArtifacts('https://example.com');
// Returns: { maps: string[], debug: boolean, traces: string[] }

// Complete attack surface enumeration
const attack = await security.mapAttackSurface('https://example.com');
// Returns: { paths: string[], methods: string[], inputs: Object[] }

// Authentication mechanism analysis
const auth = await security.analyzeAuthentication('https://example.com');
// Returns: { type: string, implementation: Object, weaknesses: string[] }

// Comprehensive security issue identification
const issues = await security.findSecurityIssues('https://example.com');
// Returns: { critical: string[], high: string[], medium: string[], low: string[] }
```

**Intelligence Value**: Exposed `.env` files reveal database credentials, API keys, and internal configurations. Source maps expose original source code and internal logic. Debug artifacts reveal development practices and potential backdoors. Authentication analysis identifies session fixation, CSRF vulnerabilities, and access control bypasses.

**Implementation**: Systematic HTTP probing of `CRITICAL_PATHS`, JavaScript source map parsing, error message analysis for stack traces, authentication flow fingerprinting through response pattern analysis.

## Tech Module

**What**: Technology stack detection and platform identification through framework fingerprinting, build tool analysis, and infrastructure recognition.

**Why**: Technology choices reveal team capabilities, operational costs, and architectural constraints. Framework versions indicate security patch levels and technical debt. Build tools expose development workflow sophistication and deployment practices.

**How**: JavaScript bundle analysis, framework signature detection, platform fingerprinting through response patterns, infrastructure correlation.

```javascript
import * as tech from '@raven-js/eye/tech';

// Complete technology stack identification
const stack = await tech.detectStack('https://example.com');
// Returns: { frontend: string, version: string, backend: string, server: string }

// Platform and service detection
const platforms = await tech.detectPlatforms('https://example.com');
// Returns: { cms: string, ecommerce: string, analytics: string[], marketing: string[] }

// Frontend architecture and build analysis
const frontend = await tech.analyzeFrontend('https://example.com');
// Returns: { libraries: Object[], build: string, bundler: string, sourceMaps: boolean }

// Infrastructure and hosting detection
const infrastructure = await tech.detectInfrastructure('https://example.com');
// Returns: { cloud: string, cdn: string, hosting: string, serverless: boolean }

// Comprehensive technology enumeration
const everything = await tech.getAllTechnologies('https://example.com');
// Returns: string[] - All detected technologies with versions
```

**Intelligence Value**: Framework versions reveal security patch status and upgrade paths. Build tool signatures indicate development team sophistication. Platform detection exposes operational costs and vendor dependencies. Infrastructure analysis reveals scalability constraints and architectural decisions.

**Implementation**: JavaScript bundle parsing for library signatures, HTTP header correlation for server identification, response pattern analysis for platform detection, asset URL analysis for CDN and hosting provider identification.

## Assets Module

**What**: Resource discovery and dependency mapping through asset enumeration, size analysis, and optimization assessment.

**Why**: Asset analysis reveals performance optimization strategies, third-party dependencies, and operational costs. Resource sizes indicate bandwidth requirements and user experience priorities. Discovery files expose internal structure and hidden functionality.

**How**: HTML parsing for resource extraction, HTTP HEAD requests for size analysis, dependency tree construction, discovery file enumeration.

```javascript
import * as assets from '@raven-js/eye/assets';

// Complete asset enumeration and categorization
const resources = await assets.getAllAssets('https://example.com');
// Returns: { js: string[], css: string[], images: string[], fonts: string[] }

// Performance impact and size analysis
const sizes = await assets.calculateSizes('https://example.com');
// Returns: { total: number, js: number, css: number, images: number, requests: number }

// Dependency mapping and third-party analysis
const dependencies = await assets.findDependencies('https://example.com');
// Returns: string[] - All internal and external dependencies

// Discovery file analysis and hidden content
const discovery = await assets.getDiscoveryFiles('https://example.com');
// Returns: { robots: Object, sitemap: string[], manifest: Object }
```

**Intelligence Value**: Asset sizes reveal performance optimization priorities and bandwidth costs. Third-party dependencies expose vendor relationships and potential supply chain risks. Discovery files reveal internal site structure and hidden functionality. Font and image optimization indicates technical sophistication.

**Implementation**: DOM parsing for asset extraction, parallel HTTP HEAD requests for size calculation, URL analysis for dependency classification, systematic probing of standard discovery paths (`robots.txt`, `sitemap.xml`, `manifest.json`).

## APIs Module

**What**: API endpoint discovery and protocol analysis through JavaScript parsing, GraphQL introspection, and WebSocket detection.

**Why**: API endpoints represent the core attack surface and business logic exposure. GraphQL introspection reveals complete schema and potential data exposure. WebSocket analysis exposes real-time communication channels and authentication mechanisms.

**How**: JavaScript source code parsing for endpoint extraction, GraphQL introspection queries, WebSocket connection analysis, authentication pattern detection.

```javascript
import * as apis from '@raven-js/eye/apis';

// Complete API endpoint discovery
const endpoints = await apis.findEndpoints('https://example.com');
// Returns: string[] - All discovered API endpoints

// API protocol and architecture detection
const type = await apis.detectAPIType('https://example.com');
// Returns: { type: 'rest'|'graphql'|'grpc', version: string, documentation: string }

// GraphQL schema analysis and introspection
const graphql = await apis.analyzeGraphQL('https://example.com');
// Returns: { graphql: boolean, introspection: boolean, schema: Object }

// WebSocket endpoint and protocol detection
const websockets = await apis.findWebSockets('https://example.com');
// Returns: string[] - WebSocket endpoints found

// Authentication mechanism analysis
const auth = await apis.detectAuthentication('https://example.com');
// Returns: { method: string, headers: string[], patterns: Object }
```

**Intelligence Value**: API endpoints reveal business logic structure and data access patterns. GraphQL introspection exposes complete data models and potential information disclosure. WebSocket analysis reveals real-time features and authentication bypass opportunities. Authentication patterns indicate session management and access control implementation.

**Implementation**: JavaScript AST parsing for endpoint extraction, GraphQL introspection query execution, WebSocket connection attempt analysis, HTTP authentication header pattern recognition.

## Intel Module

**What**: High-level intelligence synthesis and comprehensive reporting through correlation of all reconnaissance modules.

**Why**: Individual data points become actionable intelligence through correlation and context. Security issues gain severity through infrastructure understanding. Technology choices reveal operational costs and competitive positioning. Complete reconnaissance reports enable strategic decision-making.

**How**: Multi-module data correlation, risk assessment algorithms, competitive analysis synthesis, comprehensive reporting with actionable recommendations.

```javascript
import * as intel from '@raven-js/eye/intel';

// Complete reconnaissance with correlated intelligence
const report = await intel.fullRecon('https://example.com');
// Returns: {
//   summary: { risk: 'high', technologies: 15, issues: 8 },
//   critical: { exposedEnv: true, debugEnabled: true, sourceMaps: true },
//   stack: { frontend: 'React 18', backend: 'Node.js', server: 'nginx' },
//   security: { score: 45, criticalIssues: [...], recommendations: [...] },
//   performance: { ttfb: 234, totalSize: 2.4, requests: 47 },
//   business: { analytics: 'GA4', payments: 'Stripe', marketing: [...] }
// }

// Security-focused reconnaissance and vulnerability assessment
const security = await intel.securityAudit('https://example.com');
// Returns: { vulnerabilities: Object[], riskScore: number, recommendations: string[] }

// Technology architecture and competitive analysis
const tech = await intel.techAnalysis('https://example.com');
// Returns: { stack: Object, costs: Object, maturity: string, recommendations: string[] }

// Business intelligence and competitive positioning
const competitive = await intel.competitiveIntel('https://example.com');
// Returns: { positioning: Object, costs: Object, advantages: string[], weaknesses: string[] }

// Rapid assessment for immediate decision-making
const quick = await intel.quickScan('https://example.com');
// Returns: { critical: Object[], high: Object[], summary: string }
```

**Intelligence Value**: Correlated data reveals complete target profiles—security posture, technology maturity, operational costs, competitive positioning. Risk scoring prioritizes remediation efforts. Competitive analysis identifies market opportunities and technical advantages. Quick scans enable rapid threat assessment and decision-making.

**Implementation**: Multi-module orchestration with parallel execution, correlation algorithms for data synthesis, risk scoring based on vulnerability severity and exposure, competitive analysis through technology cost modeling and market positioning assessment.

---

_The apex predator advantage: while others gather fragments, ravens synthesize complete digital fingerprints for strategic dominance._
