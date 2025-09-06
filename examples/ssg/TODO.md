# RavenJS SSG - Strategic Development Roadmap

**Content As Code evolution path - from static to full-stack with surgical precision.**

Ravens build what conquers. Each feature preserves zero dependencies, maintains platform-native design, and supports seamless evolution from static generation to dynamic applications.

---

## Phase 1: Routing Evolution ✅ **ACHIEVED**

**File-based routing with dynamic parameters fully operational.** Wings file-routes automatically discovers `src/pages/**/*.js` structure, generating routes with dynamic segments (`[slug]`, `[category]/[item]`, `[...path]`). Zero-config routing for content sites while preserving explicit `cfg/routes.js` for complex logic. Dynamic parameters accessible via Wings Context in `loadDynamicData()` functions. **Algorithm over patches** - filesystem defines routes, eliminating manual maintenance.

## Phase 2: Content Infrastructure ✅ **ACHIEVED**

**Collections and build-time data loading surgically implemented.** Cortex Dataset provides O(1) content lookups with JSDoc type safety - no schema bloat needed. Collections manually curated as JavaScript modules (blog-posts.js, doc-pages.js) with instant performance eliminating pagination requirements. Build-time data loading via `loadDynamicData(ctx)` leverages Wings Context for external APIs, databases, file reads. **Platform mastery over abstraction layers** - native async functions handle any data source without framework wrapper complexity.

---

## Phase 3: Islands Architecture ✅ **ACHIEVED**

### 3.1 Declarative Client-Side Hydration ✅ **ACHIEVED**

**Selective hydration with loading strategies fully operational.** The `island(Component, props, { client: 'load|idle|visible' })` helper generates static HTML placeholders with auto-injected hydration scripts. Supports `requestIdleCallback` for idle loading, `IntersectionObserver` for visible loading, and immediate loading with browser compatibility fallbacks. Event handler isolation prevents component collision through Beak's enhanced collision detection. **Algorithm over patches** - 20-line helper leveraging existing Reflex mounting, Beak templating, and Fledge bundling without framework complexity.

### 3.2 Enhanced Component Integration ✅ **ACHIEVED**

**Component embedding in markdown with full type safety operational.** Components integrate seamlessly via function calls `${Hero({ title, cta })}` with JSDoc-powered type validation and IDE auto-completion. Children composition supported through `(props, children)` pattern with nested `md` templates when needed. Reusable UI patterns (Hero, FeatureGrid, Layout) work identically across static generation and dynamic contexts. **Platform mastery over abstraction layers** - pure JavaScript function calls provide superior tooling support compared to custom template syntax, achieving MDX-like power without compilation overhead.

---

## Phase 4: Production Polish (Medium Priority)

### 4.1 Asset Pipeline with Content Hashing

**What:** Automatic asset processing, optimization, and cache-busting for production builds.

**Why:**

- Production sites need optimized assets for performance
- Content hashing enables aggressive caching strategies
- Automatic optimization reduces manual build steps
- Better Core Web Vitals scores

**How:**

- Process `public/` and `src/apps/` during build
- Generate content hashes for cache busting
- Auto-inject preload hints for critical resources
- Copy and optimize static assets
- Rewrite asset references in generated HTML

**Success Criteria:**

- Optimal loading performance out of box
- Automatic cache invalidation on content changes
- Minimal configuration required

### 4.2 Image Optimization Pipeline

**What:** Responsive image generation with modern formats and lazy loading.

**Why:**

- Images are largest performance bottleneck on most sites
- Modern formats (WebP, AVIF) significantly reduce bandwidth
- Responsive images improve mobile experience
- Lazy loading reduces initial page load time

**How:**

- `<Image>` component with automatic optimization
- Generate multiple sizes and formats during build
- Inline low-quality placeholders for smooth loading
- Shell to `sharp` when available, graceful fallback otherwise
- Automatic `srcset` and `sizes` attribute generation

**Success Criteria:**

- Dramatically improved image loading performance
- Zero configuration for common use cases
- Graceful degradation when optimization unavailable

### 4.3 SEO and Metadata Generation

**What:** Automatic generation of sitemaps, feeds, and structured metadata.

**Why:**

- SEO is critical for content sites
- Manual metadata management is error-prone
- Search engines expect standard formats
- Social sharing requires Open Graph tags

**How:**

- Auto-generate `sitemap.xml` from route manifest
- RSS/Atom/JSON feeds for collections
- Open Graph and Twitter Card meta tags
- JSON-LD structured data for rich snippets
- Canonical URLs and alternate language links

**Success Criteria:**

- Perfect SEO scores out of box
- Social sharing works beautifully
- Search engine indexing optimized

---

## Phase 5: Developer Experience (Low Priority)

### 5.1 Incremental Build System

**What:** Only rebuild changed pages and their dependencies during development and production builds.

**Why:**

- Large sites become slow to build without incremental updates
- Development feedback loops must stay fast
- Production builds should scale to thousands of pages
- Resource efficiency for CI/CD pipelines

**How:**

- Dependency graph tracking for pages and collections
- File system watching with intelligent invalidation
- Parallel processing of independent build tasks
- Build cache with content-based invalidation
- Progress reporting for large builds

**Success Criteria:**

- Sub-second rebuilds for single page changes
- Linear scaling with site size
- Reliable cache invalidation

### 5.2 Enhanced CLI and Templates

**What:** Streamlined project creation and management commands.

**Why:**

- Lower barrier to entry for new users
- Consistent project structure across teams
- Common patterns should be one command away
- Better onboarding experience

**How:**

- `raven create --template blog|docs|marketing` scaffolding
- `raven dev|build|preview` commands with sensible defaults
- Built-in link checking and accessibility auditing
- Template gallery with real-world examples
- Migration guides from other SSGs

**Success Criteria:**

- New projects start in under 30 seconds
- Common use cases work without configuration
- Clear migration path from existing tools

---

## Implementation Philosophy

**Algorithm over patches.** Each feature should simplify the overall system, not add complexity. If a feature requires significant configuration or breaks the zero-dependency guarantee, reconsider the approach.

**Platform mastery over abstraction layers.** Build on Node.js and browser primitives rather than creating new abstractions. Use modern JavaScript features aggressively.

**Surgical precision.** Each phase can be implemented and shipped independently. No feature should block others or create cascading dependencies.

**Evolution ready.** Every feature must work identically in static generation and future SSR/dynamic modes. The same code should run everywhere.

**Ravens build what conquers.** Focus on features that provide lasting competitive advantage, not feature parity with existing tools.

---

_The murder's collective intelligence guides each decision. Build for the platform, not the framework._
