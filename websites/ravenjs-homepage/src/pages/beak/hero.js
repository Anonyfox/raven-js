/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak hero section component
 */

import { html } from "@raven-js/beak";
import { highlightJS } from "@raven-js/beak/highlight";

/**
 * Hero section for Beak page
 */
export const Hero = () => html`
  <section class="py-5 bg-dark text-white">
    <div class="container py-5">
      <div class="row align-items-center">
        <div class="col-lg-6">
          <div class="mb-4">
            <img src="/raven-logo-beak.webp" alt="Beak Logo" class="mb-4" style="width: 120px; height: 120px; filter: brightness(0) invert(1);">
          </div>
          <h1 class="display-5 fw-bold mb-4 text-white">
            Your IDE thinks template literals are just strings
          </h1>
          <p class="lead mb-4 text-light">
            We taught it 7 languages. HTML, CSS, SQL, Markdown, XML—full syntax highlighting, autocomplete, error detection.
          </p>
          <div class="d-flex gap-3 flex-wrap">
            <a href="https://www.npmjs.com/package/@raven-js/beak" class="btn btn-light btn-lg">
              <i class="bi bi-download me-2"></i>Install Beak
            </a>
            <a href="#problem" class="btn btn-outline-light btn-lg">
              See the Problem
            </a>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card bg-white bg-opacity-10 border-0 shadow-lg">
            <div class="card-body p-4">
              <h6 class="text-light mb-3">Before: Just gray strings</h6>
              <div class="bg-light rounded p-3 mb-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                <div class="text-muted">
                  const query = \`SELECT * FROM users WHERE name = '\${name}'\`
                </div>
              </div>
              <h6 class="text-light mb-3">After: Full SQL syntax highlighting</h6>
              <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                ${highlightJS("const query = sql`SELECT * FROM users WHERE name = '${name}'`")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
