/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file CSS section component for Beak language showcase
 */

import { html } from "@raven-js/beak";
import { highlightCSS, highlightJS } from "@raven-js/beak/highlight";
import { js } from "@raven-js/beak/js";

/**
 * CSS language section for Beak showcase
 */
export const CssSection = () => {
  // CSS Examples with narrative flow
  const cssImport = js`import { css, style } from "@raven-js/beak/css";`;

  const cssObjectMagic = js`// Objects become CSS properties automatically
const theme = css\`
  .button {
    \${{ backgroundColor: "#007bff", fontSize: "16px", borderRadius: "4px" }}
    \${isActive && { boxShadow: "0 0 10px rgba(0,123,255,0.5)" }}
  }
\`;`;

  const cssArrayFlattening = js`// Arrays become space-separated values
const responsive = css\`
  .grid {
    margin: \${[10, 20, 15]}px;
    grid-template-columns: \${["1fr", "2fr", "1fr"]};
    box-shadow: \${[
      "0 2px 4px rgba(0,0,0,0.1)",
      "0 4px 8px rgba(0,0,0,0.15)"
    ]};
  }
\`;`;

  const cssVendorPrefix = js`// Vendor prefixes work automatically
const animation = css\`
  .transform {
    \${{ WebkitTransform: "scale(1.02)", MozTransform: "rotate(5deg)" }}
  }
\`;`;

  const cssConditional = js`// Conditional styling with clean syntax
const dynamic = css\`
  .component {
    color: \${darkMode ? "#fff" : "#333"};
    \${mobile && { padding: "8px", fontSize: "14px" }}
    \${!loading && "cursor: pointer;"}
  }
\`;`;

  const cssOutput = js`.button{ background-color:#007bff; font-size:16px; border-radius:4px; box-shadow:0 0 10px rgba(0,123,255,0.5); }`;

  return html`
    <div class="accordion-item border-0 mb-3 shadow-lg" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#cssCollapse" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border: 1px solid #dee2e6;">
          <span class="badge bg-dark text-white me-3 shadow-sm">CSS</span>
          <span class="text-dark">CSS-in-JS Without the Baggage</span>
          <span class="text-muted ms-2">• Object Transform & Array Flattening</span>
        </button>
      </h2>
      <div id="cssCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
        <div class="accordion-body p-4" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
          <div class="row">
            <div class="col-lg-8">
              <!-- Opening Hook -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(cssImport)}</code></pre>
                </div>
                <p class="text-dark mb-4 fw-medium">CSS-in-JS usually means runtime overhead, build steps, or architectural lock-in. <span class="text-dark fw-bold">Beak gives you the power without the baggage.</span></p>
              </div>

              <!-- Object Magic -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(cssObjectMagic)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Objects become CSS properties.</span> camelCase converts to kebab-case automatically.</p>
              </div>

              <!-- Array Flattening -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(cssArrayFlattening)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Arrays become space-separated values.</span> Perfect for margins, shadows, grid templates.</p>
              </div>

              <!-- The Vendor Prefix Moment -->
              <div class="mb-4">
                <div class="border-start border-dark border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">Vendor prefixes? Handled.</p>
                  <p class="text-muted mb-0">WebkitTransform automatically becomes -webkit-transform:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(cssVendorPrefix)}</code></pre>
                </div>
                <p class="text-muted small mb-0">No autoprefixer, no build step, just works.</p>
              </div>

              <!-- Conditional Power -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(cssConditional)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Conditional styling feels natural.</span> Boolean false becomes empty string for clean conditionals.</p>
              </div>

              <!-- Output Proof -->
              <div class="mb-0">
                <div class="bg-light rounded p-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Minified Output (7ms for 300KB+):</div>
                  <pre><code>${highlightCSS(cssOutput)}</code></pre>
                </div>
                <p class="text-muted small mt-2 mb-0"><span class="text-dark fw-semibold">Single-pass optimization.</span> Pre-compiled regex patterns, V8 optimized paths.</p>
              </div>
            </div>

            <div class="col-lg-4">
              <!-- Key Features -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-magic me-2"></i>Smart Transforms
                  </h6>
                  <ul class="list-unstyled mb-0">
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-arrow-left-right text-dark me-2"></i>
                      <span class="text-dark fw-medium">camelCase → kebab-case</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-list-nested text-dark me-2"></i>
                      <span class="text-dark fw-medium">Array Flattening</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-gear text-dark me-2"></i>
                      <span class="text-dark fw-medium">Vendor Prefixes</span>
                    </li>
                    <li class="d-flex align-items-center">
                      <i class="bi bi-funnel text-dark me-2"></i>
                      <span class="text-dark fw-medium">Null Filtering</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Performance Metrics -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #212529 0%, #343a40 100%);">
                <div class="card-body">
                  <h6 class="text-white mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-lightning me-2"></i>Performance
                  </h6>
                  <div class="row text-center">
                    <div class="col-6">
                      <div class="text-white fw-bold fs-5">7ms</div>
                      <div class="text-light small">300KB+ CSS</div>
                    </div>
                    <div class="col-6">
                      <div class="text-white fw-bold fs-5">0</div>
                      <div class="text-light small">runtime deps</div>
                    </div>
                  </div>
                  <hr class="border-secondary my-3">
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-1 text-light"><i class="bi bi-cpu me-2"></i>Pre-compiled regex patterns</li>
                    <li class="mb-1 text-light"><i class="bi bi-graph-up me-2"></i>Monomorphic value paths</li>
                    <li class="text-light"><i class="bi bi-memory me-2"></i>Minimal object allocation</li>
                  </ul>
                </div>
              </div>

              <!-- Technical Advantages -->
              <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-wrench me-2"></i>Engineering Edge
                  </h6>
                  <ul class="list-unstyled mb-3 small">
                    <li class="mb-2"><i class="bi bi-check-circle text-dark me-2"></i><span class="text-dark fw-medium">Zero build step</span> required</li>
                    <li class="mb-2"><i class="bi bi-arrow-repeat text-dark me-2"></i><span class="text-dark fw-medium">Circular reference</span> protection</li>
                    <li class="mb-2"><i class="bi bi-grid text-dark me-2"></i><span class="text-dark fw-medium">Sparse array</span> handling</li>
                    <li class="mb-2"><i class="bi bi-layers text-dark me-2"></i><span class="text-dark fw-medium">Recursive flattening</span> (deep nesting)</li>
                    <li class="mb-2"><i class="bi bi-filter text-dark me-2"></i><span class="text-dark fw-medium">Smart conditionals</span> (false → empty)</li>
                    <li><i class="bi bi-minecart text-dark me-2"></i><span class="text-dark fw-medium">Single-pass minification</span></li>
                  </ul>
                  <div class="border-top border-secondary pt-3">
                    <p class="text-muted small mb-0 fst-italic">
                      <span class="text-dark fw-semibold">"Processes 300KB+ CSS frameworks</span> faster than most bundlers can even parse them."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
