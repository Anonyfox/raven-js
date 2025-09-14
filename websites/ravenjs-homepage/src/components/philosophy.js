/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Philosophy section component - quote and final CTA
 */

import { html } from "@raven-js/beak";

/**
 * Philosophy section with quote and call-to-action
 * @returns {string} Philosophy section HTML
 */
export const Philosophy = () => html`
  <!-- Philosophy Section -->
  <section class="py-5 bg-white border-top">
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-8 text-center">
          <blockquote class="blockquote">
            <p class="mb-4 fs-5 text-muted fst-italic">
              "Everything exceptional is killed by common people. I stand against that.
              RavenJS packages aim to be best in industry — the sharp knife Unix philosophy doesn't just serve experienced developers.
            </p>
            <footer class="blockquote-footer mt-3">
              <cite title="Source Title" class="text-dark fw-bold">Anonyfox</cite>
            </footer>
          </blockquote>

          <div class="mt-5">
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
