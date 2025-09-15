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
import { DeveloperExperience } from "./developer-experience.js";
import { Hero } from "./hero.js";
import { LanguageShowcase } from "./language-showcase.js";
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
  ${Hero()}
  ${Problem()}
  ${LanguageShowcase()}
  ${ContentAsCode()}
  ${DeveloperExperience()}
`;
