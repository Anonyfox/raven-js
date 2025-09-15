/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file SQL section component for Beak language showcase
 */

import { html } from "@raven-js/beak";
import { highlightJS, highlightSQL } from "@raven-js/beak/highlight";
import { js } from "@raven-js/beak/js";

/**
 * SQL language section for Beak showcase
 */
export const SqlSection = () => {
  // SQL Examples with narrative flow
  const sqlImport = js`import { sql } from "@raven-js/beak/sql";`;

  const sqlBasicEscaping = js`// Character-level escaping prevents string literal breakouts
const userQuery = sql\`
  SELECT * FROM users
  WHERE name = '\${userName}' AND status = '\${userStatus}'
\`;`;

  const sqlInjectionAttempt = js`// Real injection attempts get neutralized
const maliciousInput = "'; DROP TABLE users; --";
const safeQuery = sql\`
  SELECT * FROM users WHERE name = '\${maliciousInput}'
\`;`;

  const sqlTieredPerformance = js`// 4 performance tiers: 0, 1, 2-3, 4+ interpolations
const dynamicQuery = sql\`
  SELECT \${columns} FROM \${table}
  WHERE created_at > '\${timestamp}' AND status = '\${status}'
  LIMIT \${limit}
\`;`;

  const sqlComplexQuery = js`// Complex queries with automatic escaping
const searchQuery = sql\`
  SELECT p.*, u.username FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE p.title LIKE '%\${searchTerm}%'
  AND p.published = \${isPublished}
  ORDER BY p.created_at DESC
\`;`;

  const sqlOutput = js`SELECT * FROM users WHERE name = 'O''Connor' AND status = 'active'`;
  const sqlInjectionOutput = js`SELECT * FROM users WHERE name = '''; DROP TABLE users; --'`;

  return html`
    <div class="accordion-item border-0 mb-3 shadow-lg" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#sqlCollapse" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border: 1px solid #dee2e6;">
          <span class="badge bg-dark text-white me-3 shadow-sm">SQL</span>
          <span class="text-dark">Surgical Escaping</span>
          <span class="text-muted ms-2">• Character-Level Protection & Tiered Performance</span>
        </button>
      </h2>
      <div id="sqlCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
        <div class="accordion-body p-4" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
          <div class="row">
            <div class="col-lg-8">
              <!-- Opening Hook -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(sqlImport)}</code></pre>
                </div>
                <p class="text-dark mb-4 fw-medium">SQL query building usually means choosing between speed and security. <span class="text-dark fw-bold">Beak gives you surgical escaping with honest boundaries.</span></p>
              </div>

              <!-- Basic Escaping -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(sqlBasicEscaping)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Character-by-character scanning.</span> O(n) processing with O(1) character lookup.</p>
              </div>

              <!-- The Security Moment -->
              <div class="mb-4">
                <div class="border-start border-danger border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">Real injection attempts? Neutralized.</p>
                  <p class="text-muted mb-0">6 critical characters escaped automatically:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(sqlInjectionAttempt)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Result:</div>
                  <pre><code>${highlightSQL(sqlInjectionOutput)}</code></pre>
                </div>
                <p class="text-muted small mb-0">Single quote escaped, injection neutralized, query structure preserved.</p>
              </div>

              <!-- Performance Tiers -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(sqlTieredPerformance)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Performance scales intelligently.</span> Different algorithms for 0, 1, 2-3, and 4+ interpolations.</p>
              </div>

              <!-- Complex Queries -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(sqlComplexQuery)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">Complex queries stay readable.</span> JOINs, LIKE patterns, dynamic conditions - all automatically protected.</p>
              </div>

              <!-- Honest Security Boundary -->
              <div class="mb-0">
                <div class="alert alert-warning border-0 shadow-sm" style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);">
                  <div class="d-flex align-items-start">
                    <i class="bi bi-exclamation-triangle-fill text-warning me-2 mt-1"></i>
                    <div>
                      <p class="fw-bold mb-2 text-dark">Security Boundary (Honest Engineering)</p>
                      <p class="mb-0 small text-dark">Prevents string literal breakouts and binary injection. <span class="fw-semibold">Does NOT prevent logical injection patterns.</span> Use parameterized queries for complete protection.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <!-- Security Features -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-shield-check me-2"></i>6 Critical Characters
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">Single quote</span>
                      <code class="text-muted">' → ''</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">Backslash</span>
                      <code class="text-muted">\ → \\</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">NULL byte</span>
                      <code class="text-muted">\0 → \\0</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">Newline</span>
                      <code class="text-muted">\n → \\n</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">Carriage return</span>
                      <code class="text-muted">\r → \\r</code>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span class="text-dark fw-medium">EOF/Ctrl+Z</span>
                      <code class="text-muted">\x1a → \\Z</code>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Performance Tiers -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #212529 0%, #343a40 100%);">
                <div class="card-body">
                  <h6 class="text-white mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-speedometer me-2"></i>Tiered Performance
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-light">0 values</span>
                      <span class="text-white fw-medium">Direct return</span>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-light">1 value</span>
                      <span class="text-white fw-medium">Concatenation</span>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-light">2-3 values</span>
                      <span class="text-white fw-medium">StringBuilder</span>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span class="text-light">4+ values</span>
                      <span class="text-white fw-medium">Array join</span>
                    </li>
                  </ul>
                  <hr class="border-secondary my-3">
                  <p class="text-light small mb-0"><i class="bi bi-cpu me-2"></i>Monomorphic functions for V8 JIT optimization</p>
                </div>
              </div>

              <!-- Technical Advantages -->
              <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    <i class="bi bi-gear-wide-connected me-2"></i>Engineering Edge
                  </h6>
                  <ul class="list-unstyled mb-3 small">
                    <li class="mb-2"><i class="bi bi-search text-dark me-2"></i><span class="text-dark fw-medium">Character scanning</span> (not regex)</li>
                    <li class="mb-2"><i class="bi bi-globe text-dark me-2"></i><span class="text-dark fw-medium">Unicode safe</span> (emoji, international)</li>
                    <li class="mb-2"><i class="bi bi-type text-dark me-2"></i><span class="text-dark fw-medium">Type coercion</span> (String() consistent)</li>
                    <li class="mb-2"><i class="bi bi-scissors text-dark me-2"></i><span class="text-dark fw-medium">Smart trimming</span> (boundary detection)</li>
                    <li class="mb-2"><i class="bi bi-shield-x text-dark me-2"></i><span class="text-dark fw-medium">Binary injection</span> prevention</li>
                    <li><i class="bi bi-check-circle text-dark me-2"></i><span class="text-dark fw-medium">Zero dependencies</span></li>
                  </ul>
                  <div class="border-top border-secondary pt-3">
                    <p class="text-muted small mb-0 fst-italic">
                      <span class="text-dark fw-semibold">"Surgical escaping precision</span> without sacrificing query composition flexibility."
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
