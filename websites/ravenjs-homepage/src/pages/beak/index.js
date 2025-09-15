/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak package overview page - template literals without the template engine
 */

import { html } from "@raven-js/beak";
import {
  highlightCSS,
  highlightHTML,
  highlightJS,
  highlightShell,
  highlightSQL,
  highlightXML,
} from "@raven-js/beak/highlight";

/**
 * Beak page title
 */
export const title = "Beak - Template Literals Without the Template Engine | RavenJS";

/**
 * Beak page description
 */
export const description =
  "Your IDE thinks template literals are just strings. We taught it 7 languages. HTML, CSS, SQL, Markdown, XML—full syntax highlighting, autocomplete, error detection.";

/**
 * Beak page content
 */
export const body = html`
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

  <!-- Problem Section -->
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

  <!-- Language Showcase -->
  <section class="py-5">
    <div class="container py-5">
      <div class="text-center mb-5">
        <h2 class="display-6 mb-4">Seven Languages, One Import</h2>
        <p class="lead text-muted">
          Each language solves real problems with surgical precision.
        </p>
      </div>

      <div class="accordion" id="languageAccordion">
        <!-- HTML -->
        <div class="accordion-item">
          <h3 class="accordion-header">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#htmlCollapse">
              <div class="d-flex align-items-center">
                <span class="badge bg-dark me-3">HTML</span>
                <div>
                  <strong>XSS Protection & Progressive SEO</strong>
                  <div class="text-muted small">Automatic escaping, event binding, enterprise meta tags</div>
                </div>
              </div>
            </button>
          </h3>
          <div id="htmlCollapse" class="accordion-collapse collapse show" data-bs-parent="#languageAccordion">
            <div class="accordion-body">
              <div class="row">
                <div class="col-lg-8">
                  <div class="bg-light rounded p-3 border mb-3" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-dark">
                      <span class="text-muted">// Trusted content - maximum performance</span><br>
                      <span class="text-dark">const</span> <span class="text-info">nav</span> <span class="text-warning">=</span> <span class="text-info">html</span><span class="text-secondary">\`</span><br>
                      &nbsp;&nbsp;<span class="text-warning">&lt;</span><span class="text-dark">nav</span> <span class="text-info">class</span><span class="text-warning">=</span><span class="text-success">"\${isActive ? 'active' : 'inactive'}"</span><span class="text-warning">&gt;</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-secondary">\${menuItems.map(item => html\`</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-warning">&lt;</span><span class="text-dark">a</span> <span class="text-info">href</span><span class="text-warning">=</span><span class="text-success">"\${item.href}"</span><span class="text-warning">&gt;</span><span class="text-secondary">\${item.label}</span><span class="text-warning">&lt;/</span><span class="text-dark">a</span><span class="text-warning">&gt;</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-secondary">\`)}</span><br>
                      &nbsp;&nbsp;<span class="text-warning">&lt;/</span><span class="text-dark">nav</span><span class="text-warning">&gt;</span><br>
                      <span class="text-secondary">\`</span>
                    </div>
                  </div>
                  <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-dark">
                      <span class="text-muted">// Untrusted content - automatic XSS protection</span><br>
                      <span class="text-dark">const</span> <span class="text-info">comment</span> <span class="text-warning">=</span> <span class="text-info">safeHtml</span><span class="text-secondary">\`</span><br>
                      &nbsp;&nbsp;<span class="text-warning">&lt;</span><span class="text-dark">div</span><span class="text-warning">&gt;</span><span class="text-secondary">\${userInput}</span><span class="text-warning">&lt;/</span><span class="text-dark">div</span><span class="text-warning">&gt;</span><br>
                      <span class="text-secondary">\`</span>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body">
                      <h6 class="text-dark mb-3">Key Features</h6>
                      <ul class="list-unstyled small">
                        <li class="mb-2"><i class="bi bi-shield-check text-success me-2"></i>Automatic XSS protection</li>
                        <li class="mb-2"><i class="bi bi-lightning text-warning me-2"></i>Event binding without registration</li>
                        <li class="mb-2"><i class="bi bi-graph-up text-info me-2"></i>Progressive SEO generators</li>
                        <li class="mb-2"><i class="bi bi-speedometer text-dark me-2"></i>0.337μs per template</li>
                      </ul>
                      <div class="text-muted small">
                        <strong>Performance:</strong> Competitive with fastest engines while solving XSS and SEO problems others ignore.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CSS -->
        <div class="accordion-item">
          <h3 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cssCollapse">
              <div class="d-flex align-items-center">
                <span class="badge bg-secondary me-3">CSS</span>
                <div>
                  <strong>Object-to-CSS Transformation</strong>
                  <div class="text-muted small">Automatic camelCase→kebab-case, array flattening, minification</div>
                </div>
              </div>
            </button>
          </h3>
          <div id="cssCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
            <div class="accordion-body">
              <div class="row">
                <div class="col-lg-8">
                  <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-dark">
                      <span class="text-dark">const</span> <span class="text-info">styles</span> <span class="text-warning">=</span> <span class="text-info">css</span><span class="text-secondary">\`</span><br>
                      &nbsp;&nbsp;<span class="text-warning">.</span><span class="text-info">card</span> <span class="text-secondary">{</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-secondary">\${{</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-info">backgroundColor</span><span class="text-secondary">:</span> <span class="text-success">"#ffffff"</span><span class="text-secondary">,</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-info">borderRadius</span><span class="text-secondary">:</span> <span class="text-secondary">[</span><span class="text-warning">4</span><span class="text-secondary">,</span> <span class="text-warning">8</span><span class="text-secondary">],</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-info">WebkitTransform</span><span class="text-secondary">:</span> <span class="text-success">"scale(1.02)"</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-secondary">}}</span><br>
                      &nbsp;&nbsp;<span class="text-secondary">}</span><br>
                      <span class="text-secondary">\`</span><br><br>
                      <span class="text-muted">// → ".card{ background-color:#ffffff; border-radius:4 8; -webkit-transform:scale(1.02); }"</span>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body">
                      <h6 class="text-info mb-3">Key Features</h6>
                      <ul class="list-unstyled small">
                        <li class="mb-2"><i class="bi bi-arrow-repeat text-success me-2"></i>camelCase → kebab-case</li>
                        <li class="mb-2"><i class="bi bi-list-ul text-warning me-2"></i>Array space-separation</li>
                        <li class="mb-2"><i class="bi bi-speedometer2 text-info me-2"></i>Single-line minification</li>
                        <li class="mb-2"><i class="bi bi-cpu text-dark me-2"></i>V8-optimized processing</li>
                      </ul>
                      <div class="text-muted small">
                        <strong>Performance:</strong> 300KB+ bundles process in ~7ms with zero build tools.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SQL -->
        <div class="accordion-item">
          <h3 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sqlCollapse">
              <div class="d-flex align-items-center">
                <span class="badge bg-dark me-3 text-warning">SQL</span>
                <div>
                  <strong>Injection Prevention</strong>
                  <div class="text-muted small">Character-level escaping, string literal protection</div>
                </div>
              </div>
            </button>
          </h3>
          <div id="sqlCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
            <div class="accordion-body">
              <div class="row">
                <div class="col-lg-8">
                  <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-dark">
                      <span class="text-dark">const</span> <span class="text-info">query</span> <span class="text-warning">=</span> <span class="text-info">sql</span><span class="text-secondary">\`</span><br>
                      &nbsp;&nbsp;<span class="text-dark">SELECT</span> <span class="text-info">p</span><span class="text-warning">.*</span><span class="text-secondary">,</span> <span class="text-info">u</span><span class="text-warning">.</span><span class="text-info">username</span> <span class="text-dark">FROM</span> <span class="text-info">posts</span> <span class="text-info">p</span><br>
                      &nbsp;&nbsp;<span class="text-dark">JOIN</span> <span class="text-info">users</span> <span class="text-info">u</span> <span class="text-dark">ON</span> <span class="text-info">p</span><span class="text-warning">.</span><span class="text-info">user_id</span> <span class="text-warning">=</span> <span class="text-info">u</span><span class="text-warning">.</span><span class="text-info">id</span><br>
                      &nbsp;&nbsp;<span class="text-dark">WHERE</span> <span class="text-info">p</span><span class="text-warning">.</span><span class="text-info">title</span> <span class="text-dark">LIKE</span> <span class="text-success">'\%\${searchTerm}\%'</span><br>
                      &nbsp;&nbsp;<span class="text-dark">AND</span> <span class="text-info">p</span><span class="text-warning">.</span><span class="text-info">published</span> <span class="text-warning">=</span> <span class="text-secondary">\${isPublished}</span><br>
                      <span class="text-secondary">\`</span><br><br>
                      <span class="text-muted">// Input: searchTerm="O'Connor" → Safely escaped to "O''Connor"</span>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body">
                      <h6 class="text-warning mb-3">Security Features</h6>
                      <ul class="list-unstyled small">
                        <li class="mb-2"><i class="bi bi-shield-lock text-success me-2"></i>String literal escaping</li>
                        <li class="mb-2"><i class="bi bi-bug text-muted me-2"></i>Binary injection prevention</li>
                        <li class="mb-2"><i class="bi bi-speedometer text-info me-2"></i>O(n) character scanning</li>
                        <li class="mb-2"><i class="bi bi-exclamation-triangle text-warning me-2"></i>Use parameterized queries for complete protection</li>
                      </ul>
                      <div class="text-muted small">
                        <strong>Security Boundary:</strong> Prevents string breakouts, not logical injection.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Markdown -->
        <div class="accordion-item">
          <h3 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#markdownCollapse">
              <div class="d-flex align-items-center">
                <span class="badge bg-secondary me-3">Markdown</span>
                <div>
                  <strong>GitHub Flavored Composition</strong>
                  <div class="text-muted small">Context-aware formatting, HTML conversion, text extraction</div>
                </div>
              </div>
            </button>
          </h3>
          <div id="markdownCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
            <div class="accordion-body">
              <div class="row">
                <div class="col-lg-8">
                  <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-dark">
                      <span class="text-dark">const</span> <span class="text-info">doc</span> <span class="text-warning">=</span> <span class="text-info">md</span><span class="text-secondary">\`</span><br>
                      &nbsp;&nbsp;<span class="text-warning"># \${title}</span><br><br>
                      &nbsp;&nbsp;<span class="text-secondary">\${description}</span><br><br>
                      &nbsp;&nbsp;<span class="text-warning">## Features</span><br>
                      &nbsp;&nbsp;<span class="text-secondary">\${features.map(f => \`- \${f}\`)}</span><br><br>
                      &nbsp;&nbsp;<span class="text-secondary">\${table({</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-info">headers</span><span class="text-secondary">:</span> <span class="text-secondary">["Feature", "Support"],</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-info">rows</span><span class="text-secondary">:</span> <span class="text-info">features</span><span class="text-secondary">.map(f => [f.name, f.ok ? "✅" : "❌"])</span><br>
                      &nbsp;&nbsp;<span class="text-secondary">})}</span><br>
                      <span class="text-secondary">\`</span><br><br>
                      <span class="text-muted">// Convert to HTML or extract plain text</span><br>
                      <span class="text-dark">const</span> <span class="text-info">html</span> <span class="text-warning">=</span> <span class="text-info">markdownToHTML</span><span class="text-secondary">(doc)</span>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body">
                      <h6 class="text-success mb-3">Key Features</h6>
                      <ul class="list-unstyled small">
                        <li class="mb-2"><i class="bi bi-markdown text-success me-2"></i>GitHub Flavored Markdown</li>
                        <li class="mb-2"><i class="bi bi-table text-info me-2"></i>Automatic table generation</li>
                        <li class="mb-2"><i class="bi bi-link text-dark me-2"></i>Reference link management</li>
                        <li class="mb-2"><i class="bi bi-file-text text-warning me-2"></i>Clean text extraction</li>
                      </ul>
                      <div class="text-muted small">
                        <strong>Performance:</strong> 69K+ ops/sec HTML conversion with single-pass AST construction.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- XML -->
        <div class="accordion-item">
          <h3 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#xmlCollapse">
              <div class="d-flex align-items-center">
                <span class="badge bg-dark me-3">XML</span>
                <div>
                  <strong>RSS/Sitemap Generators</strong>
                  <div class="text-muted small">Well-formed XML, progressive feed generation, enterprise sitemaps</div>
                </div>
              </div>
            </button>
          </h3>
          <div id="xmlCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
            <div class="accordion-body">
              <div class="row">
                <div class="col-lg-8">
                  <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-dark">
                      <span class="text-muted">// RSS feed generation</span><br>
                      <span class="text-dark">const</span> <span class="text-info">rssFeed</span> <span class="text-warning">=</span> <span class="text-info">feed</span><span class="text-secondary">({</span><br>
                      &nbsp;&nbsp;<span class="text-info">title</span><span class="text-secondary">:</span> <span class="text-success">'My Blog'</span><span class="text-secondary">,</span><br>
                      &nbsp;&nbsp;<span class="text-info">description</span><span class="text-secondary">:</span> <span class="text-success">'Latest posts'</span><span class="text-secondary">,</span><br>
                      &nbsp;&nbsp;<span class="text-info">link</span><span class="text-secondary">:</span> <span class="text-success">'https://blog.example.com'</span><span class="text-secondary">,</span><br>
                      &nbsp;&nbsp;<span class="text-info">items</span><span class="text-secondary">:</span> <span class="text-info">posts</span><span class="text-secondary">.map(post => ({</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-info">title</span><span class="text-secondary">:</span> <span class="text-info">post</span><span class="text-secondary">.</span><span class="text-info">title</span><span class="text-secondary">,</span><br>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span class="text-info">content</span><span class="text-secondary">:</span> <span class="text-info">post</span><span class="text-secondary">.</span><span class="text-info">content</span><br>
                      &nbsp;&nbsp;<span class="text-secondary">}))</span><br>
                      <span class="text-secondary">})</span><br><br>
                      <span class="text-muted">// XML sitemap generation</span><br>
                      <span class="text-dark">const</span> <span class="text-info">sitemap</span> <span class="text-warning">=</span> <span class="text-info">sitemap</span><span class="text-secondary">({</span><br>
                      &nbsp;&nbsp;<span class="text-info">domain</span><span class="text-secondary">:</span> <span class="text-success">'example.com'</span><span class="text-secondary">,</span><br>
                      &nbsp;&nbsp;<span class="text-info">pages</span><span class="text-secondary">:</span> <span class="text-info">posts</span><span class="text-secondary">.map(p => ({ path: p.slug, priority: 0.8 }))</span><br>
                      <span class="text-secondary">})</span>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body">
                      <h6 class="text-secondary mb-3">Key Features</h6>
                      <ul class="list-unstyled small">
                        <li class="mb-2"><i class="bi bi-rss text-warning me-2"></i>RSS/Atom feed generation</li>
                        <li class="mb-2"><i class="bi bi-diagram-2 text-info me-2"></i>XML sitemap generation</li>
                        <li class="mb-2"><i class="bi bi-shield-check text-success me-2"></i>Complete entity escaping</li>
                        <li class="mb-2"><i class="bi bi-arrow-repeat text-dark me-2"></i>camelCase → kebab-case attributes</li>
                      </ul>
                      <div class="text-muted small">
                        <strong>Progressive:</strong> From basic feeds to enterprise content ecosystems.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- JavaScript & Shell -->
        <div class="accordion-item">
          <h3 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#jsShellCollapse">
              <div class="d-flex align-items-center">
                <span class="badge bg-dark me-2">JS</span>
                <span class="badge bg-secondary me-3">Shell</span>
                <div>
                  <strong>Script Generation & Syntax Highlighting</strong>
                  <div class="text-muted small">Dynamic script tags, command composition, Bootstrap semantic highlighting</div>
                </div>
              </div>
            </button>
          </h3>
          <div id="jsShellCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
            <div class="accordion-body">
              <div class="row">
                <div class="col-lg-8">
                  <div class="bg-light rounded p-3 border mb-3" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-dark">
                      <span class="text-muted">// JavaScript generation</span><br>
                      <span class="text-dark">import</span> <span class="text-secondary">{</span> <span class="text-info">js</span><span class="text-secondary">,</span> <span class="text-info">stringify</span> <span class="text-secondary">}</span> <span class="text-dark">from</span> <span class="text-success">"@raven-js/beak/js"</span><br><br>
                      <span class="text-dark">const</span> <span class="text-info">config</span> <span class="text-warning">=</span> <span class="text-info">js</span><span class="text-secondary">\`</span><br>
                      &nbsp;&nbsp;<span class="text-dark">const</span> <span class="text-info">settings</span> <span class="text-warning">=</span> <span class="text-secondary">\${stringify(userSettings)}</span><span class="text-secondary">;</span><br>
                      &nbsp;&nbsp;<span class="text-info">initApp</span><span class="text-secondary">(</span><span class="text-info">settings</span><span class="text-secondary">);</span><br>
                      <span class="text-secondary">\`</span>
                    </div>
                  </div>
                  <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-dark">
                      <span class="text-muted">// Shell command composition</span><br>
                      <span class="text-dark">import</span> <span class="text-secondary">{</span> <span class="text-info">sh</span> <span class="text-secondary">}</span> <span class="text-dark">from</span> <span class="text-success">"@raven-js/beak/sh"</span><br><br>
                      <span class="text-dark">const</span> <span class="text-info">deploy</span> <span class="text-warning">=</span> <span class="text-info">sh</span><span class="text-secondary">\`</span><br>
                      &nbsp;&nbsp;<span class="text-info">docker</span> <span class="text-warning">build</span> <span class="text-warning">-t</span> <span class="text-secondary">\${imageName}</span> <span class="text-secondary">.</span><br>
                      &nbsp;&nbsp;<span class="text-info">docker</span> <span class="text-warning">push</span> <span class="text-secondary">\${registry}/\${imageName}</span><br>
                      <span class="text-secondary">\`</span>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body">
                      <h6 class="text-dark mb-3">Plus Syntax Highlighting</h6>
                      <ul class="list-unstyled small">
                        <li class="mb-2"><i class="bi bi-palette text-dark me-2"></i>Bootstrap semantic classes</li>
                        <li class="mb-2"><i class="bi bi-code-square text-info me-2"></i>7 language support</li>
                        <li class="mb-2"><i class="bi bi-eye text-success me-2"></i>Zero custom CSS needed</li>
                        <li class="mb-2"><i class="bi bi-speedometer text-warning me-2"></i>Fast token-based parsing</li>
                      </ul>
                      <div class="text-muted small">
                        <strong>IDE Integration:</strong> VS Code plugin provides full syntax highlighting for all template types.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Content-as-Code Manifesto -->
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

  <!-- Developer Experience -->
  <section class="py-5">
    <div class="container py-5">
      <div class="row align-items-center">
        <div class="col-lg-6">
          <h2 class="display-6 fw-bold mb-4">Finally, Template Literals That Aren't Just Strings</h2>
          <div class="mb-4">
            <h5 class="text-dark mb-3">Zero Configuration</h5>
            <p class="text-muted">
              Install the VS Code plugin, get instant IntelliSense for HTML, CSS, SQL, Markdown, XML, JavaScript, and Shell.
              No configuration files, no setup complexity.
            </p>
          </div>
          <div class="mb-4">
            <h5 class="text-dark mb-3">Full IDE Support</h5>
            <p class="text-muted">
              Syntax highlighting, autocomplete, error detection, and formatting across all 7 languages.
              Your template literals become first-class citizens in your editor.
            </p>
          </div>
          <div class="d-flex gap-3 flex-wrap">
            <a href="https://www.npmjs.com/package/@raven-js/beak" class="btn btn-dark btn-lg">
              <i class="bi bi-download me-2"></i>Install Beak
            </a>
            <a href="#" class="btn btn-outline-dark btn-lg">
              <i class="bi bi-puzzle me-2"></i>Try VS Code Plugin
            </a>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card border-0 shadow-lg">
            <div class="card-body p-0">
              <div class="bg-light text-dark p-4 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;">
                <div class="d-flex align-items-center mb-3">
                  <div class="d-flex gap-2">
                    <div class="rounded-circle bg-secondary" style="width: 12px; height: 12px;"></div>
                    <div class="rounded-circle bg-secondary" style="width: 12px; height: 12px;"></div>
                    <div class="rounded-circle bg-secondary" style="width: 12px; height: 12px;"></div>
                  </div>
                  <div class="text-muted small ms-3">VS Code with Beak Plugin</div>
                </div>
                <div style="font-size: 14px;">
                  <div class="text-muted">// HTML with full IntelliSense</div>
                  <div><span class="text-dark">const</span> <span class="text-info">page</span> <span class="text-warning">=</span> <span class="text-info">html</span><span class="text-secondary">\`</span></div>
                  <div>&nbsp;&nbsp;<span class="text-warning">&lt;</span><span class="text-dark">div</span> <span class="text-info">class</span><span class="text-warning">=</span><span class="text-success">"container"</span><span class="text-warning">&gt;</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-warning">&lt;</span><span class="text-dark">h1</span><span class="text-warning">&gt;</span><span class="text-secondary">\${title}</span><span class="text-warning">&lt;/</span><span class="text-dark">h1</span><span class="text-warning">&gt;</span></div>
                  <div>&nbsp;&nbsp;<span class="text-warning">&lt;/</span><span class="text-dark">div</span><span class="text-warning">&gt;</span></div>
                  <div><span class="text-secondary">\`</span></div><br>
                  <div class="text-muted">// CSS with object IntelliSense</div>
                  <div><span class="text-dark">const</span> <span class="text-info">styles</span> <span class="text-warning">=</span> <span class="text-info">css</span><span class="text-secondary">\`</span></div>
                  <div>&nbsp;&nbsp;<span class="text-warning">.</span><span class="text-info">button</span> <span class="text-secondary">{</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-secondary">\${{ backgroundColor: </span><span class="text-success">"#007bff"</span> <span class="text-secondary">}}</span></div>
                  <div>&nbsp;&nbsp;<span class="text-secondary">}</span></div>
                  <div><span class="text-secondary">\`</span></div><br>
                  <div class="text-muted">// SQL with syntax validation</div>
                  <div><span class="text-dark">const</span> <span class="text-info">query</span> <span class="text-warning">=</span> <span class="text-info">sql</span><span class="text-secondary">\`</span></div>
                  <div>&nbsp;&nbsp;<span class="text-dark">SELECT</span> <span class="text-warning">*</span> <span class="text-dark">FROM</span> <span class="text-info">users</span></div>
                  <div>&nbsp;&nbsp;<span class="text-dark">WHERE</span> <span class="text-info">name</span> <span class="text-warning">=</span> <span class="text-success">'\${userName}'</span></div>
                  <div><span class="text-secondary">\`</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
