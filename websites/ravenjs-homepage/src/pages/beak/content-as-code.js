/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak content-as-code manifesto component
 */

import { html } from "@raven-js/beak";
import { highlightJS } from "@raven-js/beak/highlight";

// Editorial Manifesto examples
const manifestoCodeRibbon = `import { html, css, sql } from "@raven-js/beak"

const page = html\`
  <main class="hero">
    <h1>Welcome</h1>
  </main>
\`

const styles = css\`
  .hero { padding: 2rem; }
\`

const query = sql\`
  SELECT id, name FROM users WHERE active = true
\``;

/**
 * Content-as-Code manifesto section - RavenJS electric elegance
 */
export const ContentAsCode = () => html`
  <section class="py-5 bg-white position-relative">
    <div class="spine-dot" style="top: 2.25rem;"></div>
    <div class="container py-5">
      <div class="row g-5">
        <!-- Left: Editorial manifesto content -->
        <div class="col-md-8">
          <header class="mb-4">
            <div class="text-uppercase text-muted small section-kicker mb-1">03 — Manifesto</div>
            <h2 class="display-6 fw-bold text-dark mb-2" style="letter-spacing: 0.01em;">Content-as-Code: One Language, Everything.</h2>
            <p class="text-muted fs-5 mb-0">Refactor content like code. Enforce safety once. Run everywhere.</p>
          </header>

          <!-- Four manifesto blurbs with hairlines and notes -->
          <div class="pt-4 border-top manifesto-blurb">
            <p class="text-dark mb-2">Locality of truth<sup class="text-muted ms-1">1</sup>: content, logic, and constraints co‑resident. Fewer handoffs, fewer surprises. One greppable surface<sup class="text-muted ms-1">2</sup> for diffs and refactors<sup class="text-muted ms-1">10</sup>.</p>
          </div>
          <div class="pt-4 border-top manifesto-blurb">
            <p class="text-dark mb-2">Boundary‑encoded safety<sup class="text-muted ms-1">3</sup>: escaping is policy at the tag; protocols blocked<sup class="text-muted ms-1">4</sup>; HTML/SQL/XML entities normalized<sup class="text-muted ms-1">5</sup>. Audits shrink from everywhere to one place.</p>
          </div>
          <div class="pt-4 border-top manifesto-blurb">
            <p class="text-dark mb-2">Zero‑build portability<sup class="text-muted ms-1">6</sup>: ESM + tagged literals run in Node, browsers, workers, and edge. Deterministic deploys; fewer CI flakes and failure modes<sup class="text-muted ms-1">7</sup>.</p>
          </div>
          <div class="pt-4 border-top manifesto-blurb mb-4">
            <p class="text-dark mb-2">Predictable performance<sup class="text-muted ms-1">8</sup>: precompilable, cacheable, tree‑shakable<sup class="text-muted ms-1">9</sup>. V8‑friendly hot paths; no template‑engine runtime tax.</p>
          </div>

          <!-- Code ribbon proof -->
          <div class="bg-light rounded-1 p-3 mb-4 border code-ribbon">
            <pre class="mb-0 text-start"><code>${highlightJS(manifestoCodeRibbon)}</code></pre>
          </div>

          <!-- Removed micro-proof strips and oversized pull-quote to improve readability on narrow screens -->

        </div>

        <!-- Right: Evidence chips + marginalia -->
        <aside class="col-md-4">
          <div class="d-flex flex-column gap-2 mb-4">
            <span class="badge rounded-pill bg-dark text-white px-3 py-2">Refactorability</span>
            <span class="badge rounded-pill bg-dark text-white px-3 py-2">Safety by default</span>
            <span class="badge rounded-pill bg-dark text-white px-3 py-2">Zero‑build portability</span>
            <span class="badge rounded-pill bg-dark text-white px-3 py-2">Predictable performance</span>
            <span class="badge rounded-pill bg-dark text-white px-3 py-2">Testable content</span>
            <span class="badge rounded-pill bg-dark text-white px-3 py-2">Operational calm</span>
          </div>
          <div class="border-top pt-3">
            <div class="text-muted small mb-2">Notes</div>
            <ol class="small text-muted ps-3 mb-0">
              <li id="note1">Locality of truth = content + logic + constraints in one module.</li>
              <li id="note2">“Greppable surface” = search/imports over file trees; cleaner diffs.</li>
              <li id="note3">Tag boundary enforces XSS; critical characters auto‑escaped.</li>
              <li id="note4">Protocol blocking: javascript:, data:, vbscript: rejected.</li>
              <li id="note5">SQL/XML entity normalization and CDATA protection.</li>
              <li id="note6">ESM everywhere: Node, browser, worker, edge — same code.</li>
              <li id="note7">No loaders/plugins → stable CI; fewer failure modes.</li>
              <li id="note8">Precompilation and caching reduce CPU at runtime.</li>
              <li id="note9">Tree‑shaking removes unused literals; smaller bundles.</li>
              <li id="note10">Deterministic output → lean snapshot tests.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <style>
    .code-ribbon code { font-size: 0.95rem; }
    .manifesto-blurb p { line-height: 1.4; }
  </style>
`;
