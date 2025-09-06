# RavenJS SSG - Strategic Development Roadmap

**Content As Code evolution path - from static to full-stack with surgical precision.**

Ravens build what conquers. Each feature preserves zero dependencies, maintains platform-native design, and supports seamless evolution from static generation to dynamic applications.

---

## Phase 1: Routing Evolution (High Priority)

### 1.1 File-Based Routing with Dynamic Parameters

**What:** Automatic route generation from filesystem structure with support for dynamic segments.

**Why:**

- Eliminates manual `routes.js` maintenance for simple cases
- Matches developer expectations from Next.js/Nuxt/SvelteKit
- Reduces cognitive overhead for content-heavy sites
- Enables dynamic routes for collections (blog posts, docs)

**How:**

- Scan `src/pages/**/*.js` during build/dev startup
- Generate route manifest: `src/pages/blog/[slug]/index.js` → `/blog/:slug`
- Support nested dynamic routes: `[category]/[slug]` → `/:category/:slug`
- Preserve explicit `routes.js` for complex routing logic
- Emit `.raven/routes.mjs` for dev server consumption

**Success Criteria:**

- Zero config routing for 80% of use cases
- Dynamic params accessible in page `load()` functions
- Backward compatibility with manual routing

---

## Phase 2: Content Infrastructure (Medium Priority)

### 2.1 Collections API for Structured Content

**What:** Define and query collections of related content (posts, docs, products) with schema validation.

**Why:**

- Blog sites need post listings, pagination, taxonomies
- Documentation needs section organization and navigation
- E-commerce needs product catalogs with filtering
- Type safety for content structure prevents runtime errors

**How:**

- `defineCollection(name, schema)` in config for content validation
- `getCollection(name, options)` for querying with filter/sort/limit
- Auto-discovery of collection items from filesystem
- Build-time validation of content against schemas
- Generate collection index pages and pagination

**Success Criteria:**

- Blog with post listings and tags works out of box
- Documentation with auto-generated navigation
- Type-safe content queries with JSDoc annotations

### 2.2 Build-Time Data Loading

**What:** `load()` function hook for pages to fetch data during build process.

**Why:**

- Static sites need external data (APIs, databases, files)
- Build-time fetching enables truly static output
- Centralized data loading prevents scattered fetch logic
- Enables content validation and transformation

**How:**

- `export async function load({ params, fetch, env })` in page modules
- Execute during build, pass results as props to page component
- Cache results with dependency tracking for incremental builds
- Dev server mirrors build-time behavior for consistency
- Support for environment-specific data sources

**Success Criteria:**

- External API data rendered statically
- Fast dev server with cached data loading
- Clear error messages for failed data fetches

---

## Phase 3: Islands Architecture (High Priority)

### 3.1 Declarative Client-Side Hydration

**What:** `island()` helper for selective client-side interactivity with loading strategies.

**Why:**

- Hand-rolled `<script>` tags are brittle and CSP-unfriendly
- Performance optimization through selective hydration
- Better developer experience with declarative API
- Automatic preloading and dependency management

**How:**

- `island(Component, props, { client: 'load|idle|visible', target })` API
- Generate static HTML placeholder during build
- Auto-inject module preloads and hydration scripts
- Support intersection observer for `visible` strategy
- Event delegation for CSP compliance

**Success Criteria:**

- Zero-JS by default, interactive components opt-in
- Automatic performance optimizations (preloading, lazy loading)
- Clean separation between static and dynamic content

### 3.2 Enhanced Component Integration

**What:** Seamless component embedding in markdown with props and children.

**Why:**

- MDX-like power without compilation complexity
- Type-safe component usage in content
- Reusable UI patterns across pages
- Better content author experience

**How:**

- Enhanced tagged template processing for component calls
- Props validation and transformation
- Support for component children and composition
- Auto-completion and type hints in editors
- Error boundaries for component failures

**Success Criteria:**

- Components work identically in static and dynamic contexts
- Clear error messages for component usage issues
- Smooth content author workflow

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
