/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file HTML section component for Beak language showcase
 */

import { html } from "@raven-js/beak";
import { highlightHTML, highlightJS } from "@raven-js/beak/highlight";
import { js } from "@raven-js/beak/js";

/**
 * HTML language section for Beak showcase
 */
export const HtmlSection = () => {
  // HTML Examples with narrative flow
  const htmlImport = js`import { html, safeHtml, escapeHtml } from "@raven-js/beak/html";`;

  const htmlTrustedExample = js`// Trusted content - maximum performance (0.337μs)
const nav = html\`
  <nav class="\${isActive ? 'active' : 'inactive'}" onclick=\${handleClick}>
    \${menuItems.map(item => html\`
      <a href="\${item.href}">\${item.label}</a>
    \`)}
  </nav>
\`;`;

  const htmlSafeExample = js`// Untrusted content - automatic XSS protection
const comment = safeHtml\`
  <div class="comment">
    <h3>\${author.name}</h3>
    <p>\${userInput}</p>
  </div>
\`;`;

  const htmlEventExample = js`// Functions become DOM events transparently
const TodoItem = (todo) => html\`
  <li onclick=\${() => toggleTodo(todo.id)} class="item">
    \${todo.text}
  </li>
\`;`;

  const htmlOutput = js`<nav class="active" onclick="handleClick(event)">
  <a href="/home">Home</a>
  <a href="/about">About</a>
</nav>`;

  return html`
    <div class="accordion-item border-0 mb-3 shadow-lg" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#htmlCollapse" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border: 1px solid #dee2e6;">
          <span class="badge bg-dark text-white me-3 shadow-sm">HTML</span>
          <span class="text-dark">Dual-Path Architecture</span>
          <span class="text-muted ms-2">• XSS Protection & Event Binding</span>
        </button>
      </h2>
      <div id="htmlCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
        <div class="accordion-body p-4" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
          <div class="row">
            <div class="col-lg-8">
              <!-- Opening Hook -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(htmlImport)}</code></pre>
                </div>
                <p class="text-dark mb-4 fw-medium">Most template engines force you to choose: performance or security. <span class="text-dark fw-bold">Beak gives you both paths explicitly.</span></p>
              </div>

              <!-- Trusted Path -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(htmlTrustedExample)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">When you control the data, go fast.</span> Zero escaping, maximum performance.</p>
              </div>

              <!-- Safe Path -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(htmlSafeExample)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">User input? API responses?</span> Automatic escaping prevents XSS without thinking about it.</p>
              </div>

              <!-- The Magic Moment -->
              <div class="mb-4">
                <div class="border-start border-dark border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">Here's where it gets interesting.</p>
                  <p class="text-muted mb-0">Functions become DOM events transparently:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(htmlEventExample)}</code></pre>
                </div>
                <p class="text-muted small mb-0">No addEventListener, no framework binding, no build step required.</p>
              </div>

              <!-- Output Proof -->
              <div class="mb-0">
                <div class="bg-light rounded p-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Output:</div>
                  <pre><code>${highlightHTML(htmlOutput)}</code></pre>
                </div>
                <p class="text-muted small mt-2 mb-0"><span class="text-dark fw-semibold">Functions auto-register globally.</span> Events work in SSR and client-side.</p>
              </div>
            </div>

            <div class="col-lg-4">
              <!-- Key Features -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-lightning-charge me-2"></i>Key Features
                  </h6>
                  <ul class="list-unstyled mb-0">
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-shield-check text-dark me-2"></i>
                      <span class="text-dark fw-medium">XSS Protection</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-lightning text-dark me-2"></i>
                      <span class="text-dark fw-medium">Event Binding</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-search text-dark me-2"></i>
                      <span class="text-dark fw-medium">Progressive SEO</span>
                    </li>
                    <li class="d-flex align-items-center">
                      <i class="bi bi-speedometer2 text-dark me-2"></i>
                      <span class="text-dark fw-medium">WeakMap Caching</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Performance Metrics -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #212529 0%, #343a40 100%);">
                <div class="card-body">
                  <h6 class="text-white mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-speedometer me-2"></i>Performance
                  </h6>
                  <div class="row text-center">
                    <div class="col-6">
                      <div class="text-white fw-bold fs-5">0.337μs</div>
                      <div class="text-light small">per template</div>
                    </div>
                    <div class="col-6">
                      <div class="text-white fw-bold fs-5">3x</div>
                      <div class="text-light small">faster secure</div>
                    </div>
                  </div>
                  <hr class="border-secondary my-3">
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-1 text-light"><i class="bi bi-cpu me-2"></i>WeakMap cached compilation</li>
                    <li class="mb-1 text-light"><i class="bi bi-graph-up me-2"></i>V8 optimized processing</li>
                    <li class="text-light"><i class="bi bi-arrow-repeat me-2"></i>Specialized function generation</li>
                  </ul>
                </div>
              </div>

              <!-- Technical Advantages -->
              <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-gear me-2"></i>Technical Edge
                  </h6>
                  <ul class="list-unstyled mb-3 small">
                    <li class="mb-2"><i class="bi bi-check-circle text-dark me-2"></i><span class="text-dark fw-medium">Zero build step</span> required</li>
                    <li class="mb-2"><i class="bi bi-globe text-dark me-2"></i><span class="text-dark fw-medium">Isomorphic</span> (Node.js + Browser)</li>
                    <li class="mb-2"><i class="bi bi-shield text-dark me-2"></i><span class="text-dark fw-medium">Circular reference</span> protection</li>
                    <li class="mb-2"><i class="bi bi-x-octagon text-dark me-2"></i><span class="text-dark fw-medium">Protocol blocking</span> (javascript:, data:)</li>
                    <li class="mb-2"><i class="bi bi-list-nested text-dark me-2"></i><span class="text-dark fw-medium">Array flattening</span> with recursion</li>
                    <li><i class="bi bi-scissors text-dark me-2"></i><span class="text-dark fw-medium">Surgical escaping</span> (fast probe)</li>
                  </ul>
                  <div class="border-top border-secondary pt-3">
                    <p class="text-muted small mb-0 fst-italic">
                      <span class="text-dark fw-semibold">"Competitive with manual string concatenation</span> while solving XSS and event binding problems others ignore."
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
