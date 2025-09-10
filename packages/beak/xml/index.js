/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file XML tagged template literal engine - surgical precision for structured data
 *
 * Generates well-formed XML with automatic escaping, attribute object conversion,
 * and CDATA support. Optimized through platform primitives and tiered processing.
 */

import { escapeCdata } from "./escape-xml.js";
import { processXmlTemplate } from "./template-processor.js";

// Template cache for memoized XML generation
const TEMPLATE_CACHE = new WeakMap();

/**
 * Tagged template literal for XML generation with intelligent value processing.
 *
 * **Use:** RSS/Atom feeds, SVG generation, configuration files, API responses.
 * **Security:** Automatic entity escaping for all interpolated values.
 * **Performance:** WeakMap caching with tiered optimization (0, 1, 2-3, 4+ interpolations).
 *
 * **Value Processing:**
 * - Strings: XML entity-escaped (&, <, >, ", ')
 * - Numbers: Direct conversion
 * - Objects: Converted to attribute pairs with kebab-case names
 * - Arrays: Space-separated values
 * - null/undefined/false: Empty string
 * - true: String "true"
 *
 * @param {TemplateStringsArray} strings - Template literal static parts
 * @param {...any} values - Template literal interpolated values
 * @returns {string} Well-formed XML string
 *
 * @example
 * // Basic XML structure
 * xml`<user id="${userId}" active="${isActive}">${userName}</user>`
 * // → `<user id="123" active="true">John &amp; Jane</user>`
 *
 * @example
 * // Object to attributes
 * const config = { bindHost: "0.0.0.0", maxConnections: 100 };
 * xml`<server ${config}/>`
 * // → `<server bind-host="0.0.0.0" max-connections="100"/>`
 *
 * @example
 * // Array processing
 * const features = ["fast", "lean", "secure"];
 * xml`<features>${features}</features>`
 * // → `<features>fast lean secure</features>`
 *
 * @example
 * // Nested composition
 * const items = users.map(u => xml`<user id="${u.id}">${u.name}</user>`);
 * xml`<users>${items}</users>`
 */
export function xml(strings, ...values) {
  // Check cache for compiled template
  let fn = TEMPLATE_CACHE.get(strings);
  if (!fn) {
    // Create a bound version that passes through the template strings
    /**
     * @param {...any} vals
     * @returns {string}
     */
    fn = (...vals) => processXmlTemplate(strings, ...vals);
    TEMPLATE_CACHE.set(strings, fn);
  }

  return fn(...values);
}

/**
 * Generate CDATA section with automatic escape sequence protection.
 *
 * **Use:** HTML content in XML, pre-formatted text, script blocks.
 * **Security:** Automatically handles CDATA termination sequence (]]>).
 * **Performance:** Fast path when no problematic sequences detected.
 *
 * Inside CDATA sections, only "]]>" needs escaping - no entity processing required.
 *
 * @param {any} content - Content to wrap in CDATA section
 * @returns {string} Complete CDATA section
 *
 * @example
 * cdata(`<script>alert("Hello & goodbye");</script>`);
 * // → `<![CDATA[<script>alert("Hello & goodbye");</script>]]>`
 *
 * @example
 * cdata("Content with ]]> terminator");
 * // → `<![CDATA[Content with ]]]]><![CDATA[> terminator]]>`
 *
 * @example
 * // Usage in XML templates
 * xml`
 *   <item>
 *     <title>${title}</title>
 *     <description>${cdata(htmlContent)}</description>
 *   </item>
 * `
 */
export function cdata(content) {
  const stringContent = content == null ? "" : String(content);
  const safeContent = escapeCdata(stringContent);
  return `<![CDATA[${safeContent}]]>`;
}

// Re-export XML utilities
export { sitemap } from "./sitemap.js";
