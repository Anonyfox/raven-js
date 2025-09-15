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

/**
 * Content-as-Code manifesto section for Beak page
 */
export const ContentAsCode = () => html`
  <section class="py-5 bg-dark text-white">
    <div class="container py-5">
      <div class="row justify-content-center text-center">
        <div class="col-lg-8">
          <h2 class="display-6 fw-bold mb-4">Everything Becomes Programmable JavaScript</h2>
          <div class="row g-4 mb-5">
            <div class="col-md-6">
              <div class="card bg-white bg-opacity-10 border-0 h-100">
                <div class="card-body p-4">
                  <i class="bi bi-x-circle fs-1 text-muted mb-3"></i>
                  <h5 class="text-white mb-3">Traditional Approach</h5>
                  <ul class="list-unstyled text-light small text-start">
                    <li class="mb-2">• Multiple file types to coordinate</li>
                    <li class="mb-2">• Separate build pipelines</li>
                    <li class="mb-2">• Complex deployment configurations</li>
                    <li class="mb-2">• Tool-specific syntax learning</li>
                    <li>• Framework lock-in</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card bg-white bg-opacity-10 border-0 h-100">
                <div class="card-body p-4">
                  <i class="bi bi-check-circle fs-1 text-white mb-3"></i>
                  <h5 class="text-white mb-3">Content-as-Code</h5>
                  <ul class="list-unstyled text-light small text-start">
                    <li class="mb-2">• Single JavaScript file</li>
                    <li class="mb-2">• No transpilation needed</li>
                    <li class="mb-2">• Templates evolve with the platform</li>
                    <li class="mb-2">• Zero external dependencies</li>
                    <li>• Framework independence</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="alert alert-light border-0" role="alert">
            <div class="d-flex align-items-center justify-content-center text-dark">
              <i class="bi bi-quote fs-4 me-3"></i>
              <div>
                <strong>The Raven Insight:</strong> While others build increasingly complex toolchains, ravens use platform primitives that don't break.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
