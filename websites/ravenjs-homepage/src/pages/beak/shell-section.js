import { html } from "@raven-js/beak";
import { highlightJS, highlightShell } from "@raven-js/beak/highlight";
import { js } from "@raven-js/beak/js";

/**
 * Shell language section for Beak showcase
 */
export const ShellSection = () => {
  // Shell Examples with narrative flow
  const shellImport = js`import { sh } from "@raven-js/beak/sh";`;

  const shellArrayJoining = js`// Array-to-arguments with automatic space joining
const flags = ["-la", "--color=always"];
const files = ["src/", "test/"];
const cmd = sh\`ls \${flags} \${files}\`;`;

  const shellConditionalFlags = js`// Conditional flags with automatic falsy filtering
const verbose = true;
const quiet = false;
const flags = ["-v", verbose && "--debug", quiet && "--quiet"];
const result = sh\`npm install \${flags}\`;`;

  const shellDockerCommand = js`// Complex Docker command assembly
const env = ["NODE_ENV=production", "PORT=3000"];
const mounts = ["-v", "/data:/app/data", "-v", "/logs:/app/logs"];
const dockerCmd = sh\`docker run \${env} \${mounts} -p 3000:3000 myapp:latest\`;`;

  const shellTemplateFormatting = js`// Multi-line template formatting cleanup
const volume = "/data:/app";
const port = "3000:3000";
const cmd = sh\`docker run
  -v \${volume}
  -p \${port}
  nginx\`;`;

  const shellSecurityWarning = js`// ⚠️  NO ESCAPING APPLIED - Developer controls security
const userInput = "'; rm -rf /"; // DANGEROUS!
const dangerous = sh\`echo \${userInput}\`; // You own this risk`;

  const shellOutput1 = js`ls -la --color=always src/ test/`;
  const shellOutput2 = js`npm install -v --debug`;
  const shellOutput3 = js`docker run NODE_ENV=production PORT=3000 -v /data:/app/data -v /logs:/app/logs -p 3000:3000 myapp:latest`;
  const shellOutput4 = js`docker run -v /data:/app -p 3000:3000 nginx`;

  return html`
    <div class="accordion-item border-0 mb-3 shadow-lg" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#shellCollapse" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border: 1px solid #dee2e6;">
          <span class="badge bg-dark text-white me-3 shadow-sm">SH</span>
          <span class="text-dark">Command Assembly Intelligence</span>
          <span class="text-muted ms-2">• Array Joining & Conditional Filtering</span>
        </button>
      </h2>
      <div id="shellCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
        <div class="accordion-body p-4" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
          <div class="row">
            <div class="col-lg-8">
              <!-- Opening Hook -->
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="small text-muted">
                    <a href="https://docs.ravenjs.dev/beak/modules/sh/" class="text-muted me-2" target="_blank" rel="noopener">📖 Docs</a>
                    <a href="https://github.com/Anonyfox/raven-js/tree/main/packages/beak/sh" class="text-muted" target="_blank" rel="noopener">🔗 Source</a>
                  </div>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(shellImport)}</code></pre>
                </div>
                <p class="text-dark mb-4 fw-medium">Shell command construction usually means tedious array joining and conditional flag hell. <span class="text-dark fw-bold">Beak gives you intelligent array processing with developer-controlled security.</span></p>
              </div>

              <!-- Array-to-Arguments Magic -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(shellArrayJoining)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Result:</div>
                  <pre><code>${highlightShell(shellOutput1)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Arrays become space-separated arguments.</span> Recursive processing with automatic joining.</p>
              </div>

              <!-- Conditional Flags Intelligence -->
              <div class="mb-4">
                <div class="border-start border-success border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">Conditional flags just work.</p>
                  <p class="text-muted mb-0">Falsy values filter automatically from arrays:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(shellConditionalFlags)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Result (false values filtered):</div>
                  <pre><code>${highlightShell(shellOutput2)}</code></pre>
                </div>
                <p class="text-muted small mb-0">\`null\`, \`undefined\`, \`false\`, \`""\` become empty - clean conditionals.</p>
              </div>

              <!-- Complex Command Assembly -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(shellDockerCommand)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Docker Command Output:</div>
                  <pre><code>${highlightShell(shellOutput3)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Complex commands stay readable.</span> Multiple arrays join cleanly with intelligent spacing.</p>
              </div>

              <!-- Template Formatting -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(shellTemplateFormatting)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Normalized Output:</div>
                  <pre><code>${highlightShell(shellOutput4)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Multi-line templates normalize.</span> Whitespace collapses to single spaces, edges trimmed.</p>
              </div>

              <!-- Security Warning -->
              <div class="mb-0">
                <div class="alert alert-danger border-0 shadow-sm" style="background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%);">
                  <div class="d-flex align-items-start">
                    <span class="text-danger me-2 mt-1">⚠️</span>
                    <div>
                      <p class="fw-bold mb-2 text-dark">Security By Design (No Magic)</p>
                      <div class="bg-light rounded p-2 mb-2 border">
                        <pre><code class="small">${highlightJS(shellSecurityWarning)}</code></pre>
                      </div>
                      <p class="mb-0 small text-dark">NO escaping applied. <span class="fw-semibold">You own all security decisions.</span> Validate inputs before use with untrusted data.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <!-- Array Processing -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    📋 Array Intelligence
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex align-items-center">
                      ➡️
                      <span class="text-dark fw-medium">Space-separated joining</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      📦
                      <span class="text-dark fw-medium">Falsy value filtering</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      📋
                      <span class="text-dark fw-medium">Recursive processing</span>
                    </li>
                    <li class="d-flex align-items-center">
                      ✅
                      <span class="text-dark fw-medium">Mixed type handling</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Command Patterns -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #212529 0%, #343a40 100%);">
                <div class="card-body">
                  <h6 class="text-white mb-3 fw-bold d-flex align-items-center">
                    💻 DevOps Patterns
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex align-items-center">
                      📦
                      <span class="text-white fw-medium">Docker Commands</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      🌳
                      <span class="text-white fw-medium">Git Operations</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      🖥️
                      <span class="text-white fw-medium">Node.js Execution</span>
                    </li>
                    <li class="d-flex align-items-center">
                      📁
                      <span class="text-white fw-medium">File Operations</span>
                    </li>
                  </ul>
                  <hr class="border-secondary my-3">
                  <p class="text-light small mb-0">⚡ Built for real DevOps workflows</p>
                </div>
              </div>

              <!-- Technical Features -->
              <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    🚀 Performance Engine
                  </h6>
                  <ul class="list-unstyled mb-3 small">
                    <li class="mb-2">📦 <span class="text-dark fw-medium">WeakMap caching</span> (template identity)</li>
                    <li class="mb-2">⚡ <span class="text-dark fw-medium">Static optimization</span> (no interpolations)</li>
                    <li class="mb-2">🔄 <span class="text-dark fw-medium">Whitespace normalization</span> (/\\s+/g)</li>
                    <li class="mb-2">📋 <span class="text-dark fw-medium">Large array handling</span> (1000+ items)</li>
                    <li class="mb-2">🌐 <span class="text-dark fw-medium">Unicode support</span> (international)</li>
                    <li>🛡️ <span class="text-dark fw-medium">No escaping</span> (developer control)</li>
                  </ul>
                  <div class="border-top border-secondary pt-3">
                    <p class="text-muted small mb-0 fst-italic">
                      <span class="text-dark fw-semibold">"Command assembly intelligence</span> without security magic - you own the risk."
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
