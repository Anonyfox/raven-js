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
import { ContentAsCode } from "./content-as-code.js";
import { Hero } from "./hero.js";
import { HighlightSection } from "./highlight-section.js";
import { LanguageShowcase } from "./language-showcase.js";
import { MarkdownDemo } from "./markdown-demo.js";
import { Problem } from "./problem.js";

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
  <div class="spine-wrapper position-relative">
    <div class="spine d-none d-md-block"></div>
    ${Hero()}
    ${Problem()}
    <section class="py-2 bg-white">
      <div class="container text-center">
        <div class="text-muted small text-uppercase" style="letter-spacing: 0.12em;">One import. Seven languages.</div>
    </div>
  </section>
    ${LanguageShowcase()}
    <section class="py-2 bg-white">
      <div class="container text-center">
        <div class="text-muted small fst-italic">Everything evolves together.</div>
    </div>
  </section>
    ${ContentAsCode()}
    <section class="py-2 bg-white">
      <div class="container text-center">
        <div class="text-uppercase text-muted small" style="letter-spacing: 0.12em;">One language. Infinite possibilities.</div>
    </div>
  </section>
    ${MarkdownDemo()}
    <section class="py-2 bg-white">
      <div class="container text-center">
        <div class="text-muted small fst-italic">Semantics over style. Power without ceremony.</div>
    </div>
  </section>
    ${HighlightSection()}
      </div>

  <style>
    .spine-wrapper { isolation: isolate; }
    .spine-wrapper .spine {
      position: absolute;
      left: 2rem;
      top: 0;
      bottom: 0;
      width: 1px;
      background: rgba(0,0,0,0.08);
      z-index: 0;
    }
    .spine-dot {
      position: absolute;
      left: calc(2rem - 4px);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(0,0,0,0.35);
      transform: translateY(2px);
      z-index: 1;
    }
    .bg-dark .spine-dot { background: rgba(255,255,255,0.4); }
    .section-kicker {
      letter-spacing: 0.14em;
    }
  </style>
`;
