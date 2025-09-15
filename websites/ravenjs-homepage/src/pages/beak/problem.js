/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak problem section component
 */

import { html } from "@raven-js/beak";
import { highlightJS } from "@raven-js/beak/highlight";

/**
 * Problem section for Beak page
 */
export const Problem = () => html`
  <section id="problem" class="py-5 bg-light">
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div class="text-center mb-5">
            <h2 class="display-6 mb-4">The Tooling Coordination Hell</h2>
            <p class="lead text-muted">
              Every template language requires its own build pipeline, loader, plugin, and deployment configuration.
            </p>
          </div>

          <div class="row g-4 mb-5">
            <div class="col-md-6">
              <div class="card border-secondary h-100">
                <div class="card-header bg-secondary text-white">
                  <h5 class="mb-0"><i class="bi bi-x-circle me-2"></i>Traditional Approach</h5>
                </div>
                <div class="card-body">
                  <ul class="list-unstyled mb-0">
                    <li class="mb-2"><i class="bi bi-gear text-muted me-2"></i>Webpack loaders</li>
                    <li class="mb-2"><i class="bi bi-gear text-muted me-2"></i>PostCSS plugins</li>
                    <li class="mb-2"><i class="bi bi-gear text-muted me-2"></i>Babel transforms</li>
                    <li class="mb-2"><i class="bi bi-gear text-muted me-2"></i>Build configurations</li>
                    <li class="mb-2"><i class="bi bi-gear text-muted me-2"></i>Deployment pipelines</li>
                    <li><i class="bi bi-gear text-muted me-2"></i>File synchronization</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card border-dark h-100">
                <div class="card-header bg-dark text-white">
                  <h5 class="mb-0"><i class="bi bi-check-circle me-2"></i>Beak Approach</h5>
                </div>
                <div class="card-body d-flex align-items-center">
                  <div>
                    <div class="bg-light rounded p-3 mb-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;">
                      ${highlightJS('import { html, css, sql } from "@raven-js/beak"')}
                    </div>
                    <p class="mb-0 text-dark fw-bold">Deploy anywhere. Zero configuration.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="alert alert-info border-0" role="alert">
            <div class="d-flex">
              <div class="flex-shrink-0">
                <i class="bi bi-lightbulb fs-4 text-info"></i>
              </div>
              <div class="flex-grow-1 ms-3">
                <h5 class="alert-heading">The IDE Problem</h5>
                <p class="mb-0">
                  Template literals are just strings to your editor. No syntax highlighting, no autocomplete, no error detection.
                  <strong>Beak + VS Code plugin</strong> gives you full IDE support for all 7 languages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
