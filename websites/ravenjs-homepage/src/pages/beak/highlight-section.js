/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak Highlight section — Bootstrap‑semantic syntax highlighting
 */

import { highlightCSS, highlightHTML, highlightJS } from "@raven-js/beak/highlight";
import { escapeHtml, html } from "@raven-js/beak/html";

const jsSource = `function quote(name) {
  return \`Nevermore, \${name}.\`;
}`;

const htmlSource = `<article class="poem">
  <h3>The Raven</h3>
  <p>Quoth the Raven — <em>“Nevermore.”</em></p>
</article>`;

const cssSource = `.poem { font-style: italic; }
.poem em { font-weight: 600; }`;

const usageCode = `import { highlightHTML } from '@raven-js/beak/highlight';

const htmlSource = '<div class="poem">Nevermore</div>';
const highlighted = highlightHTML(htmlSource);
// Insert into your UI as HTML (e.g., innerHTML)`;

export const HighlightSection = () => html`
  <section class="py-5 bg-white position-relative">
    <div class="spine-dot" style="top: 2.25rem;"></div>
    <div class="container py-5">
      <div class="text-center mb-5">
        <div class="text-uppercase text-muted small section-kicker mb-1">05 — Highlight</div>
        <h2 class="display-6 fw-bold text-dark mb-2">Bootstrap‑Semantic Highlighting</h2>
        <p class="lead text-muted mb-0">Clean <span class="text-dark">span</span> output with Bootstrap color classes — inherits your theme, no custom CSS required.</p>
      </div>

      <!-- Usage ribbon (full width) -->
      <div class="row g-3 mb-4">
        <div class="col-12">
          <div class="bg-light rounded-1 border p-3">
            <div class="text-uppercase small text-muted mb-2" style="letter-spacing: .08em;">Usage</div>
            <pre class="mb-0 text-start"><code>${highlightJS(usageCode)}</code></pre>
          </div>
        </div>
      </div>

      <div class="row g-4 align-items-stretch hl-code">
        <!-- JavaScript Column -->
        <div class="col-12 col-lg-4">
          <div class="bg-dark text-white border-0 rounded-2 h-100 p-3 hl-stack">
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Raw</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Raw source (JavaScript)">
              <pre class="mb-0 text-start"><code class="text-dark">${escapeHtml(jsSource)}</code></pre>
            </div>
            <div class="hl-arrow" aria-hidden="true">↓</div>
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Markup</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Highlighted markup (visible text)">
              <pre class="mb-0 text-start"><code class="text-dark">${escapeHtml(highlightJS(jsSource))}</code></pre>
            </div>
            <div class="hl-arrow" aria-hidden="true">↓</div>
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Rendered</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Rendered highlighted output">
              <pre class="mb-0 text-start"><code>${highlightJS(jsSource)}</code></pre>
            </div>
          </div>
        </div>

        <!-- HTML Column -->
        <div class="col-12 col-lg-4">
          <div class="bg-dark text-white border-0 rounded-2 h-100 p-3 hl-stack">
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Raw</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Raw source (HTML)">
              <pre class="mb-0 text-start"><code class="text-dark">${escapeHtml(htmlSource)}</code></pre>
            </div>
            <div class="hl-arrow" aria-hidden="true">↓</div>
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Markup</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Highlighted markup (visible text)">
              <pre class="mb-0 text-start"><code class="text-dark">${escapeHtml(highlightHTML(htmlSource))}</code></pre>
            </div>
            <div class="hl-arrow" aria-hidden="true">↓</div>
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Rendered</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Rendered highlighted output">
              <pre class="mb-0 text-start"><code>${highlightHTML(htmlSource)}</code></pre>
            </div>
          </div>
        </div>

        <!-- CSS Column -->
        <div class="col-12 col-lg-4">
          <div class="bg-dark text-white border-0 rounded-2 h-100 p-3 hl-stack">
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Raw</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Raw source (CSS)">
              <pre class="mb-0 text-start"><code class="text-dark">${escapeHtml(cssSource)}</code></pre>
            </div>
            <div class="hl-arrow" aria-hidden="true">↓</div>
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Markup</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Highlighted markup (visible text)">
              <pre class="mb-0 text-start"><code class="text-dark">${escapeHtml(highlightCSS(cssSource))}</code></pre>
            </div>
            <div class="hl-arrow" aria-hidden="true">↓</div>
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Rendered</div>
            <div class="bg-light rounded-1 border p-2 hl-box" aria-label="Rendered highlighted output">
              <pre class="mb-0 text-start"><code>${highlightCSS(cssSource)}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <div class="row justify-content-center mt-4">
        <div class="col-auto">
          <div class="d-flex gap-2 flex-wrap align-items-center small text-muted">
            <span class="badge bg-primary text-white rounded-pill">text-primary = keywords</span>
            <span class="badge bg-success text-white rounded-pill">text-success = strings</span>
            <span class="badge bg-info text-dark rounded-pill">text-info = functions/attrs</span>
            <span class="badge bg-warning text-dark rounded-pill">text-warning = numbers</span>
            <span class="badge bg-secondary text-white rounded-pill">text-muted = comments</span>
          </div>
        </div>
      </div>
      <div class="row justify-content-center mt-3">
        <div class="col-lg-10">
          <p class="text-center text-muted small mb-0">Every code snippet you saw on this page? Highlighted by these exact functions. No magic CSS — just semantic <span class="text-dark">span</span>s that play perfectly with Bootstrap.</p>
        </div>
      </div>
    </div>

    <style>
      .hl-code pre { white-space: pre-wrap; word-break: break-word; font-size: .9rem; }
      .hl-stack { display: grid; grid-template-rows: auto 1fr auto auto 1fr auto auto 1fr; row-gap: .5rem; }
      .hl-box { min-height: 0; max-height: 8rem; overflow: auto; color: #212529; }
      .hl-arrow { text-align: center; color: rgba(255,255,255,0.5); line-height: 1; }
      @media (min-width: 992px) { .hl-box { max-height: 9rem; } }
    </style>
  </section>
`;
