import { html } from "@raven-js/beak";
import { highlightJS } from "@raven-js/beak/highlight";
import { js } from "@raven-js/beak/js";

/**
 * JavaScript language section for Beak showcase
 */
export const JsSection = () => {
  // JavaScript Examples with narrative flow
  const jsImport = js`import { js, script, scriptDefer, scriptAsync } from "@raven-js/beak/js";`;

  const jsValueFiltering = js`// Intelligent falsy filtering (preserves 0, filters the rest)
const config = js\`
  window.config = {
    count: \${userCount},
    name: \${userName || null},
    active: \${isActive},
    debug: \${debugMode || undefined}
  };
\`;`;

  const jsArrayFlattening = js`// Array flattening with join("") - no separators
const imports = ['react', 'lodash', 'axios'];
const moduleCode = js\`
  import { \${imports} } from 'bundle';
  const data = [\${[1, 2, 3]}];
\`;`;

  const jsScriptVariants = js`// Script tag variants with proper loading attributes
const analytics = scriptAsync\`
  gtag('config', '\${trackingId}', {
    page_title: '\${pageTitle}',
    custom_map: { dimension1: '\${userId}' }
  });
\`;

const domReady = scriptDefer\`
  document.getElementById('\${elementId}').focus();
  \${eventHandlers.map(h => \`addListener('\${h.event}', \${h.handler});\`)}
\`;`;

  const jsPerformanceOptimization = js`// 4-tier performance optimization based on value count
// Tier 1: Single value (concat)
const single = js\`const x = \${value};\`;

// Tier 2: 2-3 values (StringBuilder)
const few = js\`config(\${host}, \${port}, \${ssl});\`;

// Tier 3: 4+ values (pre-allocated array)
const many = js\`setup({
  api: \${apiUrl}, db: \${dbUrl}, cache: \${cacheUrl},
  auth: \${authUrl}, cdn: \${cdnUrl}
});\`;`;

  const jsOutput = js`window.config = { count: 42, name: , active: true, debug:  };`;
  const jsArrayOutput = js`import { reactlodashaxios } from 'bundle'; const data = [123];`;

  return html`
    <div class="accordion-item border-0 mb-3 shadow-lg" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#jsCollapse" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border: 1px solid #dee2e6;">
          <span class="badge bg-dark text-white me-3 shadow-sm">JS</span>
          <span class="text-dark">Intelligent Value Processing</span>
          <span class="text-muted ms-2">• Falsy Filtering & 4-Tier Optimization</span>
        </button>
      </h2>
      <div id="jsCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
        <div class="accordion-body p-4" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
          <div class="row">
            <div class="col-lg-8">
              <!-- Opening Hook -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(jsImport)}</code></pre>
                </div>
                <p class="text-dark mb-4 fw-medium">JavaScript generation usually means manual concatenation and inconsistent value handling. <span class="text-dark fw-bold">Beak gives you intelligent filtering with 4-tier performance optimization.</span></p>
              </div>

              <!-- Intelligent Falsy Filtering -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(jsValueFiltering)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Result (preserves 0, filters null/undefined/false):</div>
                  <pre><code>${highlightJS(jsOutput)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Smart falsy logic.</span> Preserves \`0\` while filtering \`null\`, \`undefined\`, \`false\`, empty strings.</p>
              </div>

              <!-- Array Flattening Magic -->
              <div class="mb-4">
                <div class="border-start border-warning border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">Array flattening without separators.</p>
                  <p class="text-muted mb-0">Arrays join with \`""\` for clean JavaScript concatenation:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(jsArrayFlattening)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Output:</div>
                  <pre><code>${highlightJS(jsArrayOutput)}</code></pre>
                </div>
                <p class="text-muted small mb-0">Perfect for imports, arrays, and dynamic code generation.</p>
              </div>

              <!-- Script Tag Intelligence -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(jsScriptVariants)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Script loading strategies.</span> \`async\` for non-blocking, \`defer\` for DOM-ready execution.</p>
              </div>

              <!-- Performance Optimization -->
              <div class="mb-0">
                <div class="border-start border-success border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">4-tier performance optimization.</p>
                  <p class="text-muted mb-0">Different algorithms based on interpolation count:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(jsPerformanceOptimization)}</code></pre>
                </div>
                <p class="text-muted small mb-0">Pre-allocation intelligence: counts valid values first, allocates exact array size.</p>
              </div>
            </div>

            <div class="col-lg-4">
              <!-- Value Processing -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-funnel me-2"></i>Smart Filtering
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-success fw-medium">Preserves</span>
                      <code class="text-muted">0</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-danger fw-medium">Filters</span>
                      <code class="text-muted">null</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-danger fw-medium">Filters</span>
                      <code class="text-muted">undefined</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-danger fw-medium">Filters</span>
                      <code class="text-muted">false</code>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span class="text-danger fw-medium">Filters</span>
                      <code class="text-muted">""</code>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Performance Tiers -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #212529 0%, #343a40 100%);">
                <div class="card-body">
                  <h6 class="text-white mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-speedometer me-2"></i>4-Tier Optimization
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-light">0 values</span>
                      <span class="text-white fw-medium">Direct trim</span>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-light">1 value</span>
                      <span class="text-white fw-medium">Concat</span>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-light">2-3 values</span>
                      <span class="text-white fw-medium">StringBuilder</span>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span class="text-light">4+ values</span>
                      <span class="text-white fw-medium">Pre-allocated</span>
                    </li>
                  </ul>
                  <hr class="border-secondary my-3">
                  <p class="text-light small mb-0"><i class="bi bi-cpu me-2"></i>V8-optimized monomorphic processing</p>
                </div>
              </div>

              <!-- Technical Excellence -->
              <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-gear-wide-connected me-2"></i>Engineering Edge
                  </h6>
                  <ul class="list-unstyled mb-3 small">
                    <li class="mb-2"><i class="bi bi-lightning text-dark me-2"></i><span class="text-dark fw-medium">Fast-path validation</span> (extracted function)</li>
                    <li class="mb-2"><i class="bi bi-list-nested text-dark me-2"></i><span class="text-dark fw-medium">Array flattening</span> (join with no separator)</li>
                    <li class="mb-2"><i class="bi bi-memory text-dark me-2"></i><span class="text-dark fw-medium">Pre-allocation</span> (exact size calculation)</li>
                    <li class="mb-2"><i class="bi bi-code-slash text-dark me-2"></i><span class="text-dark fw-medium">Script variants</span> (defer/async attributes)</li>
                    <li class="mb-2"><i class="bi bi-scissors text-dark me-2"></i><span class="text-dark fw-medium">Whitespace trimming</span> (automatic)</li>
                    <li><i class="bi bi-type text-dark me-2"></i><span class="text-dark fw-medium">Type safety</span> (consistent String() conversion)</li>
                  </ul>
                  <div class="border-top border-secondary pt-3">
                    <p class="text-muted small mb-0 fst-italic">
                      <span class="text-dark fw-semibold">"Intelligent value processing</span> with performance-engineered template optimization."
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
