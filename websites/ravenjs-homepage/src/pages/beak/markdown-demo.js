/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak Markdown demo section (static) — Markdown → HTML and → Text
 */

import { highlightJS } from "@raven-js/beak/highlight";
import { escapeHtml, html } from "@raven-js/beak/html";
import { markdownToHTML, markdownToText } from "@raven-js/beak/md";

// Static sample: Poe's The Raven (short, elegant)
const markdownSample = `# The Raven\n\n> Once upon a midnight dreary, while I pondered, **weak** and _weary_.\n\n- \`"'Tis some visitor,"\` I muttered — tapping at my chamber door.`;

const htmlOutput = markdownToHTML(markdownSample, { escapeHtml: false });
const textOutput = markdownToText(markdownSample);

const usageHtml = `import { markdownToHTML } from '@raven-js/beak/md';
const html = markdownToHTML(markdownSource);`;

const usageText = `import { markdownToText } from '@raven-js/beak/md';
const text = markdownToText(markdownSource);`;

/**
 * Markdown demo section (dark) with magazine spine
 */
export const MarkdownDemo = () => html`
  <section class="py-5 bg-dark text-white position-relative">
    <div class="spine-dot" style="top: 2.25rem;"></div>
    <div class="container py-5">
      <div class="text-center mb-5">
        <div class="text-uppercase text-white-50 small section-kicker mb-1">04 — Markdown</div>
        <h2 class="display-6 mb-2 text-white">Markdown, Three Ways</h2>
        <p class="lead text-light mb-0">Source in the middle. HTML on the left. Plain text on the right.</p>
      </div>

      <div class="row g-4 align-items-stretch md-code">
        <!-- HTML Output (left) -->
        <div class="col-12 col-lg-4 order-2 order-lg-1">
          <div class="bg-dark text-white border-0 rounded-2 h-100 p-3 md-stack">
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Rendered HTML</div>
            <div class="bg-light rounded-1 border p-2 md-box" aria-label="Rendered HTML output">
              <div class="text-dark">${htmlOutput}</div>
            </div>
          </div>
        </div>

        <!-- Markdown Source (center) -->
        <div class="col-12 col-lg-4 order-1 order-lg-2">
          <div class="bg-dark text-white border-0 rounded-2 h-100 p-3 md-stack">
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Source (Markdown)</div>
            <div class="bg-light rounded-1 border p-2 md-box" aria-label="Raw markdown source">
              <pre class="mb-0 text-start"><code class="text-dark">${highlightJS(markdownSample)}</code></pre>
            </div>
          </div>
        </div>

        <!-- Plain Text Output (right) -->
        <div class="col-12 col-lg-4 order-3 order-lg-3">
          <div class="bg-dark text-white border-0 rounded-2 h-100 p-3 md-stack">
            <div class="text-uppercase small text-white-50" style="letter-spacing: .08em;">Plain Text</div>
            <div class="bg-light rounded-1 border p-2 md-box" aria-label="Plain text output">
              <pre class="mb-0 text-start"><code class="text-dark">${textOutput}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Lean note instead of code blocks -->
      <div class="row mt-3">
        <div class="col-12">
          <p class="text-center text-light mb-0">
            Powered by <code class="text-white">markdownToHTML()</code> and <code class="text-white">markdownToText()</code> from <code class="text-white">@raven-js/beak/md</code>.
          </p>
        </div>
      </div>
    </div>

    <style>
      .md-code pre { white-space: pre-wrap; word-break: break-word; font-size: .9rem; }
      .md-stack { display: grid; grid-template-rows: auto 1fr; row-gap: .5rem; }
      .md-box { min-height: 0; max-height: 14rem; overflow: auto; color: #212529; }
      @media (min-width: 992px) { .md-box { max-height: 15rem; } }
    </style>
  </section>
`;
