/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak package overview page - template literals without the template engine
 */

import { html } from "@raven-js/beak";
import { ContentAsCode } from "./content-as-code.js";
import { Hero } from "./hero.js";
import { HighlightSection } from "./highlight-section.js";
import { LanguageShowcase } from "./language-showcase.js";
import { MarkdownDemo } from "./markdown-demo.js";
import { Problem } from "./problem.js";

/**
 * Beak page title
 */
export const title = "Beak - Template Literals Without the Template Engine | RavenJS";

/**
 * Beak page description
 */
export const description =
  "Your IDE thinks template literals are just strings. We taught it 7 languages. HTML, CSS, SQL, Markdown, XML—full syntax highlighting, autocomplete, error detection.";

/**
 * Beak page content
 */
export const body = html`
  <div class="spine-wrapper position-relative">
    <div class="spine d-none d-md-block"></div>
    ${Hero()}
    ${Problem()}
    <section class="py-2 bg-white">
      <div class="container text-center">
        <div class="text-muted small text-uppercase" style="letter-spacing: 0.12em;">One beak. Seven voices.</div>
    </div>
  </section>
    ${LanguageShowcase()}
    <section class="py-2 bg-white">
      <div class="container text-center">
        <div class="text-muted small fst-italic">Everything evolves together.</div>
    </div>
  </section>
    ${ContentAsCode()}
    <section class="py-2 bg-white">
      <div class="container text-center">
        <div class="text-uppercase text-muted small" style="letter-spacing: 0.12em;">Perfect mimicry. Zero training.</div>
    </div>
  </section>
    ${MarkdownDemo()}
    <section class="py-2 bg-white">
      <div class="container text-center">
        <div class="text-muted small fst-italic">Semantics over style. Power without ceremony.</div>
    </div>
  </section>
    ${HighlightSection()}
  </div>

  <!-- TL;DR Offcanvas Drawer -->
  <div class="offcanvas offcanvas-end" tabindex="-1" id="tldrOffcanvas" aria-labelledby="tldrOffcanvasLabel">
    <div class="offcanvas-header border-bottom">
      <h5 class="offcanvas-title fw-bold d-flex align-items-center" id="tldrOffcanvasLabel">
        <img src="/raven-logo-beak.webp" alt="Beak" class="me-2" style="height: 24px;">
        TL;DR: Beak
      </h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body">
      <div class="mb-4">
        <div class="mb-4">
          <h6 class="fw-bold text-dark mb-2 d-flex align-items-center">
            <i class="bi bi-gear me-2 text-muted"></i>What is it?
          </h6>
          <p class="text-dark mb-0 lh-sm">
            Tagged template literals + IDE plugin = native syntax highlighting for HTML/CSS/SQL in JS strings.
          </p>
        </div>

        <div class="mb-4">
          <h6 class="fw-bold text-dark mb-2 d-flex align-items-center">
            <i class="bi bi-lightning me-2 text-muted"></i>How it works
          </h6>
          <ul class="text-dark mb-0 lh-sm small">
            <li class="mb-1">Custom tag functions handle context-aware serialization</li>
            <li class="mb-1">VSCode plugin treats <code>html\`...\`</code> as actual HTML files</li>
            <li class="mb-1">Optimal string concat based on data shapes</li>
            <li class="mb-0">Zero bundler configuration needed</li>
          </ul>
        </div>

        <div class="mb-4">
          <h6 class="fw-bold text-dark mb-2 d-flex align-items-center">
            <i class="bi bi-target me-2 text-muted"></i>Why care
          </h6>
          <ul class="text-dark mb-0 lh-sm small">
            <li class="mb-1">No webpack loaders for HTML/CSS/SQL files</li>
            <li class="mb-1">Full IntelliSense in template literals</li>
            <li class="mb-1">Arrays auto-join, objects auto-serialize</li>
            <li class="mb-0">Deploy pure JS anywhere</li>
          </ul>
        </div>

        <div class="bg-light rounded p-3 mb-4">
          <div class="d-flex align-items-start">
            <i class="bi bi-lightbulb text-warning me-2 mt-1 flex-shrink-0"></i>
            <div>
              <div class="fw-semibold text-dark small mb-1">The insight</div>
              <div class="text-dark small lh-sm">
                All your non-JS assets become JS strings again. No build pipeline. No bundler plugins. Just JavaScript.
              </div>
            </div>
          </div>
        </div>

        <div class="bg-dark rounded p-3 mb-4">
          <pre class="mb-0 text-light small"><code>import { html, css, sql } from "@raven-js/beak"

const page = html\`<div class="hero">Hello</div>\`
const styles = css\`body { margin: 0; }\`
const query = sql\`SELECT * FROM users\`

// Arrays join, objects serialize, strings escape.
// IDE highlights, autocompletes, validates.
// Deploy anywhere. Zero config.</code></pre>
        </div>

        <div class="d-grid">
          <a href="https://www.npmjs.com/package/@raven-js/beak" class="btn btn-dark btn-lg fw-semibold" target="_blank">
            <i class="bi bi-download me-2"></i>npm install @raven-js/beak
          </a>
        </div>
      </div>
    </div>
  </div>

  <style>
    .spine-wrapper { isolation: isolate; }
    .spine-wrapper .spine {
      position: absolute;
      left: 2rem;
      top: 0;
      bottom: 0;
      width: 1px;
      background: rgba(0,0,0,0.08);
      z-index: 0;
    }
    .spine-dot {
      position: absolute;
      left: calc(2rem - 4px);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(0,0,0,0.35);
      transform: translateY(2px);
      z-index: 1;
    }
    .bg-dark .spine-dot { background: rgba(255,255,255,0.4); }
    .section-kicker {
      letter-spacing: 0.14em;
    }
  </style>
`;
