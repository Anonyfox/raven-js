/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Intelligence section component - core selling points for seasoned developers
 */

import { html } from "@raven-js/beak";

/**
 * Intelligence section showcasing core value propositions
 * @returns {string} Intelligence section HTML
 */
export const Intelligence = () => html`
  <!-- Intelligence Section -->
  <section id="intelligence" class="py-5 bg-white">
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div class="text-center mb-5">
            <h2 class="display-6 fw-light text-dark mb-4">Why Ravens Dominate</h2>
            <p class="lead text-muted mb-0">
              Built by developers who remember every ecosystem collapse.
              Angular 2's genocide. React's migrations. The left-pad apocalypse. Never again.
            </p>
          </div>

          <div class="row g-4 mt-4">
            <div class="col-lg-4">
              <div class="border-start border-dark border-3 ps-4 h-100">
                <h5 class="fw-bold text-dark mb-3">Future-Proof Immunity</h5>
                <p class="text-muted mb-0">
                  Zero runtime dependencies as unbreakable guarantee. No supply chain attacks, no framework migrations.
                  While others chase trends, your code survives on platform primitives that don't break.
                </p>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="border-start border-dark border-3 ps-4 h-100">
                <h5 class="fw-bold text-dark mb-3">Performance Without Compromise</h5>
                <p class="text-muted mb-0">
                  V8-optimized primitives. Zero runtime overhead. Pure functions you won't hate few months later.
                  Fast, clean building blocks that don't slow you down.
                </p>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="border-start border-dark border-3 ps-4 h-100">
                <h5 class="fw-bold text-dark mb-3">Solo Developer Superpower</h5>
                <p class="text-muted mb-0">
                  Everything needed to compete with 20+ developer teams.
                  While others coordinate frameworks and teams, you ship faster alone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
