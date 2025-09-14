/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Homepage - composed from dedicated section components
 */

import { html } from "@raven-js/beak";
import { Arsenal } from "../components/arsenal.js";
import { Hero } from "../components/hero.js";
import { Intelligence } from "../components/intelligence.js";
import { Philosophy } from "../components/philosophy.js";

/**
 * Homepage title
 */
export const title = "RavenJS - Web Dev Toolkit for the Post-Framework Era";

/**
 * Homepage description
 */
export const description =
  "Modern ESM libraries for web development. Everything you need in pure JavaScript. Zero dependencies, maximum performance, surgical precision.";

/**
 * Homepage content - composed from section components
 */
export const body = html`
  ${Hero()}
  ${Intelligence()}
  ${Arsenal()}
  ${Philosophy()}
`;
