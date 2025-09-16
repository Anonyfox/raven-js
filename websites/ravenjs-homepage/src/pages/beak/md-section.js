/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Markdown section component for Beak language showcase
 */

import { html } from "@raven-js/beak";
import { highlightJS } from "@raven-js/beak/highlight";
import { js } from "@raven-js/beak/js";

/**
 * Markdown language section for Beak showcase
 */
export const MdSection = () => {
  // Markdown Examples with narrative flow
  const mdImport = js`import { md, markdownToHTML, markdownToText, code, ref, table } from "@raven-js/beak/md";`;

  const mdContextAware = js`// Context-aware composition with intelligent joining
const document = md\`
  # \${title}

  \${description}

  ## Features
  \${features.map(feature => md\`- \${feature}\`)}
\`;`;

  const mdHelperFunctions = js`// Specialized helper functions for rich content
const installation = code('npm install @raven-js/beak', 'bash');
const documentation = ref('Documentation', 'https://docs.ravenjs.dev');
const statusTable = table(['Feature', 'Status'], [
  ['Templates', '✅ Complete'],
  ['Parser', '✅ Complete']
]);`;

  const mdDualArchitecture = js`// Dual architecture: composition + conversion
const markdown = md\`# Hello \${name}\`;
const html = markdownToHTML(markdown);     // → <h1>Hello World</h1>
const text = markdownToText(markdown);     // → Hello World`;

  const mdObjectMagic = js`// Objects become definition lists automatically
const config = { name: "RavenJS", version: "1.0.0" };
const result = md\`\${config}\`;
// → **name**: RavenJS
//   **version**: 1.0.0`;

  return html`
    <div class="accordion-item border-0 mb-3 shadow-lg" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#markdownCollapse" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border: 1px solid #dee2e6;">
          <span class="badge bg-dark text-white me-3 shadow-sm">MD</span>
          <span class="text-dark">Context-Aware Composition</span>
          <span class="text-muted ms-2">• Intelligent Templates & Dual Architecture</span>
        </button>
      </h2>
      <div id="markdownCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
        <div class="accordion-body p-4" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
          <div class="row">
            <div class="col-lg-8">
              <!-- Opening Hook -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(mdImport)}</code></pre>
                </div>
                <p class="text-dark mb-4 fw-medium">Markdown generation usually means manual string concatenation and formatting headaches. <span class="text-dark fw-bold">Beak gives you context-aware intelligence with dual architecture.</span></p>
              </div>

              <!-- Context Awareness -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(mdContextAware)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Context detection drives joining strategy.</span> Arrays join differently in LIST vs PARAGRAPH vs ROOT contexts.</p>
              </div>

              <!-- Helper Functions -->
              <div class="mb-4">
                <div class="border-start border-primary border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">Rich content made simple.</p>
                  <p class="text-muted mb-0">Specialized helpers for code blocks, reference links, and tables:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(mdHelperFunctions)}</code></pre>
                </div>
                <p class="text-muted small mb-0">Reference links get automatic numbering and collection.</p>
              </div>

              <!-- Dual Architecture -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(mdDualArchitecture)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Clean separation of concerns.</span> Template composition, HTML rendering, text extraction - distinct operations.</p>
              </div>

              <!-- Object Magic -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(mdObjectMagic)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Objects become definition lists.</span> Automatic **key**: value formatting.</p>
              </div>

              <!-- Performance Note -->
              <div class="mb-0">
                <div class="alert alert-info border-0 shadow-sm" style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);">
                  <div class="d-flex align-items-start">
                    <i class="bi bi-lightning-charge-fill text-info me-2 mt-1"></i>
                    <div>
                      <p class="fw-bold mb-2 text-dark">Performance Intelligence</p>
                      <p class="mb-0 small text-dark">WeakMap template caching, single-pass AST construction, 69K+ ops/sec HTML conversion. <span class="fw-semibold">CommonMark compliant</span> with GitHub extensions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <!-- Context Detection -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-cpu me-2"></i>Context Detection
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">LIST</span>
                      <code class="text-muted">join("\\n")</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">PARAGRAPH</span>
                      <code class="text-muted">join(" ")</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">ROOT</span>
                      <code class="text-muted">join("\\n\\n")</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">CODE</span>
                      <code class="text-muted">preserve</code>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span class="text-dark fw-medium">TABLE</span>
                      <code class="text-muted">structure</code>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Dual Architecture -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #212529 0%, #343a40 100%);">
                <div class="card-body">
                  <h6 class="text-white mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-diagram-3 me-2"></i>Dual Architecture
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-pencil text-light me-2"></i>
                      <span class="text-white fw-medium">Template Composition</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-code-slash text-light me-2"></i>
                      <span class="text-white fw-medium">HTML Conversion</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      <i class="bi bi-type text-light me-2"></i>
                      <span class="text-white fw-medium">Text Extraction</span>
                    </li>
                    <li class="d-flex align-items-center">
                      <i class="bi bi-link text-light me-2"></i>
                      <span class="text-white fw-medium">Reference Management</span>
                    </li>
                  </ul>
                  <hr class="border-secondary my-3">
                  <p class="text-light small mb-0"><i class="bi bi-award me-2"></i>CommonMark compliant + GitHub extensions</p>
                </div>
              </div>

              <!-- Technical Advantages -->
              <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-gear-wide-connected me-2"></i>Engineering Excellence
                  </h6>
                  <ul class="list-unstyled mb-3 small">
                    <li class="mb-2"><i class="bi bi-memory text-dark me-2"></i><span class="text-dark fw-medium">WeakMap caching</span> (template identity)</li>
                    <li class="mb-2"><i class="bi bi-tree text-dark me-2"></i><span class="text-dark fw-medium">Single-pass AST</span> construction</li>
                    <li class="mb-2"><i class="bi bi-scissors text-dark me-2"></i><span class="text-dark fw-medium">Surgical text extraction</span></li>
                    <li class="mb-2"><i class="bi bi-normalize-whitespace text-dark me-2"></i><span class="text-dark fw-medium">Intelligent whitespace</span></li>
                    <li class="mb-2"><i class="bi bi-github text-dark me-2"></i><span class="text-dark fw-medium">GitHub extensions</span></li>
                    <li><i class="bi bi-check-circle text-dark me-2"></i><span class="text-dark fw-medium">Zero dependencies</span></li>
                  </ul>
                  <div class="border-top border-secondary pt-3">
                    <p class="text-muted small mb-0 fst-italic">
                      <span class="text-dark fw-semibold">"Context-aware composition</span> with surgical formatting precision."
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
