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
import { CssSection } from "./css-section.js";
import { HtmlSection } from "./html-section.js";
import { JsSection } from "./js-section.js";
import { MdSection } from "./md-section.js";
import { ShellSection } from "./shell-section.js";
import { SqlSection } from "./sql-section.js";
import { XmlSection } from "./xml-section.js";

/**
 * Language showcase section for Beak page
 */
export const LanguageShowcase = () => {
  return html`
    <section class="py-5 bg-dark text-white position-relative">
      <div class="spine-dot" style="top: 2.25rem;"></div>
      <div class="container py-5">
        <div class="text-center mb-5">
          <div class="text-uppercase text-white-50 small section-kicker mb-1">02 — Languages</div>
          <h2 class="display-6 mb-2 text-white">Seven Languages, One Syntax</h2>
          <p class="lead text-light mb-0">Each module provides first-class syntax handling with zero-dependency deployment.</p>
        </div>

        <div class="accordion" id="languageAccordion">
          ${HtmlSection()}
          ${CssSection()}
          ${SqlSection()}
          ${MdSection()}
          ${XmlSection()}
          ${JsSection()}
          ${ShellSection()}
        </div>
      </div>
    </section>
  `;
};
