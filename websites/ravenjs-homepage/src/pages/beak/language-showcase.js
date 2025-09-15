/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak language showcase component
 */

import { html } from "@raven-js/beak";
import { highlightJS } from "@raven-js/beak/highlight";

/**
 * Language showcase section for Beak page
 */
export const LanguageShowcase = () => html`
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
                  <div class="bg-light rounded p-3 mb-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    ${highlightJS("// Trusted content - maximum performance\nconst nav = html`\n  <nav class=\"${isActive ? 'active' : 'inactive'}\">\n    ${menuItems.map(item => html`\n      <a href=\"${item.href}\">${item.label}</a>\n    `)}\n  </nav>\n`")}
                  </div>
                  <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    ${highlightJS("// Untrusted content - automatic XSS protection\nconst comment = safeHtml`\n  <div>${userInput}</div>\n`")}
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
                    ${highlightJS('const styles = css`\n  .card {\n    \\${{  \n      backgroundColor: "#ffffff",\n      borderRadius: [4, 8],\n      WebkitTransform: "scale(1.02)"\n    }}\n  }\n`\n\n// → ".card{ background-color:#ffffff; border-radius:4 8; -webkit-transform:scale(1.02); }"')}
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
                    ${highlightJS("const query = sql`\n  SELECT p.*, u.username FROM posts p\n  JOIN users u ON p.user_id = u.id\n  WHERE p.title LIKE '%${searchTerm}%'\n  AND p.published = ${isPublished}\n`\n\n// Input: searchTerm=\"O'Connor\" → Safely escaped to \"O''Connor\"")}
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
                    ${highlightJS('const doc = md`\n  # \\${title}\n\n  \\${description}\n\n  ## Features\n  \\${features.map(f => `- \\${f}`)}\n\n  \\${table({\n    headers: ["Feature", "Support"],\n    rows: features.map(f => [f.name, f.ok ? "✅" : "❌"])\n  })}\n`\n\n// Convert to HTML or extract plain text\nconst html = markdownToHTML(doc)')}
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
                    ${highlightJS("// RSS feed generation\nconst rssFeed = feed({\n  title: 'My Blog',\n  description: 'Latest posts',\n  link: 'https://blog.example.com',\n  items: posts.map(post => ({\n    title: post.title,\n    content: post.content\n  }))\n})\n\n// XML sitemap generation\nconst sitemap = sitemap({\n  domain: 'example.com',\n  pages: posts.map(p => ({ path: p.slug, priority: 0.8 }))\n})")}
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
                  <div class="bg-light rounded p-3 mb-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    ${highlightJS('// JavaScript generation\nimport { js, stringify } from "@raven-js/beak/js"\n\nconst config = js`\n  const settings = \\${stringify(userSettings)};\n  initApp(settings);\n`')}
                  </div>
                  <div class="bg-light rounded p-3 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px;">
                    <div class="text-muted small mb-2"># Shell command composition</div>
                    <div class="text-dark">
                      <div>docker build -t <span class="text-secondary">\${imageName}</span> .</div>
                      <div>docker push <span class="text-secondary">\${registry}/\${imageName}</span></div>
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
`;
