/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Homepage - simple hello world page
 */

import { md } from "@raven-js/beak/md";

/**
 * Homepage title
 */
export const title = "RavenJS - Swift Web Development Toolkit";

/**
 * Homepage description
 */
export const description =
  "RavenJS is a swift web development toolkit - a set of libraries and tools that are versatile and useful standalone.";

/**
 * Homepage content
 */
export const body = md`
<!-- Fixed background for hero -->
<div class="hero-bg"></div>

<!-- Hero Section -->
<section class="hero-section text-white">
  <div class="container py-5">
    <div class="row justify-content-center text-center">
      <div class="col-lg-8">
        <div class="mb-4">
          <img src="/raven-logo.webp" alt="RavenJS" class="img-fluid mb-3" style="max-height: 120px; filter: brightness(0) invert(1);">
        </div>
        <h1 class="display-4 fw-light mb-4 text-white">
          Zero-dependency JS/ESM toolkit for experienced developers
        </h1>
        <p class="lead mb-5 text-light fs-5">
          Pure JavaScript. Modern platform primitives. Surgical precision.<br>
          <em>Built by developers who remember the framework wars.</em>
        </p>
        <div class="d-flex justify-content-center gap-3 flex-wrap">
          <a href="https://github.com/Anonyfox/ravenjs" class="btn btn-outline-light btn-lg px-4 py-3">
            View on GitHub
          </a>
          <a href="#intelligence" class="btn btn-light btn-lg px-4 py-3 text-dark">
            <strong>Learn More</strong>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Intelligence Section -->
<section id="intelligence" class="py-5 bg-white">
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <div class="text-center mb-5">
          <h2 class="display-6 fw-light text-dark mb-4">Institutional Memory</h2>
          <p class="lead text-muted mb-0">
            We've encoded every framework collapse into our collective intelligence.
            Angular 2's ecosystem genocide. React's breaking migrations. The left-pad apocalypse.
          </p>
        </div>

        <div class="row g-4 mt-4">
          <div class="col-md-6">
            <div class="border-start border-dark border-3 ps-4 h-100">
              <h5 class="fw-bold text-dark mb-3">Algorithm over patches</h5>
              <p class="text-muted mb-0">
                Step back and refactor logic flow rather than conditional bandaids.
                Every bug becomes an opportunity to simplify.
              </p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="border-start border-dark border-3 ps-4 h-100">
              <h5 class="fw-bold text-dark mb-3">Platform mastery</h5>
              <p class="text-muted mb-0">
                Build from Node 22+ built-ins and modern browser APIs.
                Use modern JavaScript to solve problems better than ever solved before.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Fixed background for arsenal -->
<div class="arsenal-bg"></div>

<!-- Packages Section -->
<section id="packages" class="arsenal-section text-white">
  <div class="container py-5">
    <div class="text-center mb-5">
      <h2 class="display-6 fw-light text-white mb-4">The Arsenal</h2>
      <p class="lead text-light">Surgical tools. Zero dependencies. Pick what you need.</p>
    </div>

      <!-- Libraries -->
      <div class="mb-5">
        <h4 class="fw-bold text-white mb-4">Libraries <small class="text-light fs-6">npm install</small></h4>
        <div class="row g-3">
          <div class="col-lg-3 col-md-6">
            <div class="card border-2 border-light bg-white bg-opacity-95 shadow h-100">
              <div class="card-body p-4">
                <h6 class="card-title fw-bold text-dark">Wings</h6>
                <p class="card-text small text-muted mb-2">HTTP server & routing</p>
                <code class="small text-success">@raven-js/wings</code>
              </div>
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <div class="card border-2 border-light bg-white bg-opacity-95 shadow h-100">
              <div class="card-body p-4">
                <h6 class="card-title fw-bold text-dark">Beak</h6>
                <p class="card-text small text-muted mb-2">JSX-style templating</p>
                <code class="small text-success">@raven-js/beak</code>
              </div>
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <div class="card border-2 border-light bg-white bg-opacity-95 shadow h-100">
              <div class="card-body p-4">
                <h6 class="card-title fw-bold text-dark">Reflex</h6>
                <p class="card-text small text-muted mb-2">Signals-based reactivity</p>
                <code class="small text-success">@raven-js/reflex</code>
              </div>
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <div class="card border-2 border-light bg-white bg-opacity-95 shadow h-100">
              <div class="card-body p-4">
                <h6 class="card-title fw-bold text-dark">Cortex</h6>
                <p class="card-text small text-muted mb-2">ML & AI in pure JS</p>
                <code class="small text-warning">In Development</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tools -->
      <div>
        <h4 class="fw-bold text-white mb-4">Tools <small class="text-light fs-6">npx run</small></h4>
        <div class="row g-3">
          <div class="col-lg-3 col-md-6">
            <div class="card border-2 border-light bg-white bg-opacity-95 shadow h-100">
              <div class="card-body p-4">
                <h6 class="card-title fw-bold text-dark">Fledge</h6>
                <p class="card-text small text-muted mb-2">Build & bundle</p>
                <code class="small text-success">@raven-js/fledge</code>
              </div>
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <div class="card border-2 border-light bg-white bg-opacity-95 shadow h-100">
              <div class="card-body p-4">
                <h6 class="card-title fw-bold text-dark">Glean</h6>
                <p class="card-text small text-muted mb-2">JSDoc tools & MCP</p>
                <code class="small text-success">@raven-js/glean</code>
              </div>
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <div class="card border-2 border-light bg-white bg-opacity-95 shadow h-100">
              <div class="card-body p-4">
                <h6 class="card-title fw-bold text-dark">Hatch</h6>
                <p class="card-text small text-muted mb-2">Bootstrap new apps</p>
                <code class="small text-warning">In Development</code>
              </div>
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <div class="card border-2 border-light bg-white bg-opacity-95 shadow h-100">
              <div class="card-body p-4">
                <h6 class="card-title fw-bold text-dark">Soar</h6>
                <p class="card-text small text-muted mb-2">Deploy anywhere</p>
                <code class="small text-warning">In Development</code>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</section>

<!-- Philosophy Section -->
<section class="py-5 bg-white border-top">
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8 text-center">
        <blockquote class="blockquote">
          <p class="mb-4 fs-5 text-muted fst-italic">
            "Everything exceptional is killed by common people. I stand against that.
            RavenJS aims to be best in industry—the sharp knife Unix philosophy doesn't just serve experienced developers.
            It actually allows junior developers to get up and running immediately, because there's no framework complexity to learn."
          </p>
          <footer class="blockquote-footer mt-3">
            <cite title="Source Title" class="text-dark fw-bold">Anonyfox</cite>
          </footer>
        </blockquote>

        <div class="mt-5">
          <p class="lead text-muted mb-4">
            <em>In a world obsessed with the next shiny framework, ravens build what endures.</em>
          </p>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            <a href="https://github.com/Anonyfox/ravenjs" class="btn btn-dark btn-lg px-4">
              Start Building
            </a>
            <a href="https://docs.ravenjs.dev" class="btn btn-outline-dark btn-lg px-4">
              Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
`;
