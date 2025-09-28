/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Convert HTML to plain text using a zero-dependency streaming tokenizer.
 *
 * Pure, deterministic transformation suitable for logs, previews, classification,
 * and search indexing. It preserves essential structure by inserting newlines at
 * block boundaries, handles entities, and provides a few high-impact options.
 */

/**
 * @typedef {object} HtmlToTextOptions
 * @property {"fragment"|"document"} [mode="fragment"] How to treat the input. Document mode ignores head content.
 * @property {"text"|"inline"|"remove"} [links="text"] How to render anchors.
 * @property {"alt"|"remove"} [images="alt"] How to render images.
 * @property {boolean} [collapseWhitespace=true] Collapse consecutive whitespace outside preserved tags.
 * @property {number} [maxNewlines=2] Maximum consecutive newlines allowed after compaction.
 * @property {number|null} [wrap=null] Optional hard-wrap column; disabled by default. Does not wrap inside preserved tags.
 * @property {"tab"|"space"} [tableCellSeparator="tab"] Separator between table cells.
 * @property {string[]} [excludeTags] Tags to exclude entirely with their contents.
 * @property {boolean} [decodeEntities=true] Decode HTML entities.
 * @property {string[]} [preserveTags] Tags whose internal whitespace is preserved.
 * @property {boolean} [trim=true] Trim leading/trailing whitespace.
 */

/**
 * Convert an HTML string to plain text.
 *
 * @param {string} html HTML string (fragment or full document)
 * @param {HtmlToTextOptions} [options]
 * @returns {string}
 */
export function htmlToText(html, options = {}) {
  if (typeof html !== "string") {
    throw new TypeError("Expected html to be a string");
  }

  const settings = normalizeOptions(options);

  // Fast path: empty input
  if (html.length === 0) {
    return "";
  }

  // Sets and constants for classification
  const preservedTagSet = toSet(settings.preserveTags);
  const excludedTagSet = toSet(settings.excludeTags.concat(settings.mode === "document" ? ["head"] : []));
  const blockTagSet = BLOCK_TAG_SET;

  // Table state
  let insideTable = 0;
  /** @type {string[]} */
  let cellBuffer = [];
  const cellSep = settings.tableCellSeparator === "tab" ? "\t" : " ";

  // Stack state
  /** @type {string[]} */
  const tagStack = [];
  let preserveWhitespace = false;
  let excludeDepth = 0;

  // Link/image context
  /** @type {string | null} */
  let currentAnchorHref = null;
  let inAnchor = false;
  let anchorHasText = false;

  // Output buffer
  /** @type {string[]} */
  const out = [];

  // Simple streaming tokenizer
  const length = html.length;
  let i = 0;
  while (i < length) {
    const ch = html.charCodeAt(i);
    if (ch === 60 /* < */) {
      // Parse tag
      const tagStart = i;
      const end = html.indexOf(">", tagStart + 1);
      if (end === -1) {
        // Malformed tail: treat as text
        emitText(html.slice(i), out, settings, preserveWhitespace);
        break;
      }
      const rawTag = html.slice(tagStart + 1, end);
      i = end + 1;
      const isClosing = rawTag[0] === "/";
      const tagBody = isClosing ? rawTag.slice(1) : rawTag;
      const spaceIdx = indexOfSpace(tagBody);
      const tagName = (spaceIdx === -1 ? tagBody : tagBody.slice(0, spaceIdx)).toLowerCase();

      if (isClosing) {
        // Closing tag
        handleTagClose(tagName);
      } else {
        // Opening or self-closing tag
        const selfClosing = rawTag.endsWith("/") || SELF_CLOSING_TAG_SET.has(tagName);
        const attrs = spaceIdx === -1 ? "" : tagBody.slice(spaceIdx + 1);
        handleTagOpen(tagName, attrs, selfClosing);
      }
      continue;
    }

    // Text node
    const nextTag = html.indexOf("<", i);
    const text = nextTag === -1 ? html.slice(i) : html.slice(i, nextTag);
    i = nextTag === -1 ? length : nextTag;

    if (excludeDepth > 0) {
      continue;
    }

    if (insideTable > 0) {
      // Accumulate raw text for the current cell
      cellBuffer.push(text);
    } else {
      if (inAnchor && /\S/.test(text)) anchorHasText = true;
      emitText(text, out, settings, preserveWhitespace);
    }
  }

  let result = out.join("");

  if (settings.collapseWhitespace) {
    result = collapseWhitespace(result, settings.maxNewlines);
  }

  if (settings.wrap != null && settings.wrap > 0) {
    result = hardWrap(result, settings.wrap);
  }

  if (settings.trim) {
    result = result.trim();
  }

  return result;

  // --- helpers ---

  /**
   * @param {string} name
   */
  function pushTag(name) {
    tagStack.push(name);
    if (preservedTagSet.has(name)) preserveWhitespace = true;
    if (excludedTagSet.has(name)) excludeDepth += 1;
    if (name === "table") insideTable += 1;
  }

  /**
   * @param {string} name
   */
  function popTag(name) {
    // Pop until matching name (best-effort against malformed HTML)
    for (let idx = tagStack.length - 1; idx >= 0; idx -= 1) {
      const t = tagStack[idx];
      tagStack.length = idx;
      if (preservedTagSet.has(t)) preserveWhitespace = false;
      if (excludedTagSet.has(t)) excludeDepth = Math.max(0, excludeDepth - 1);
      if (t === "table") insideTable = Math.max(0, insideTable - 1);
      if (t === name) break;
    }
  }

  /**
   * @param {string} tagName
   * @param {string} attrs
   * @param {boolean} selfClosing
   */
  function handleTagOpen(tagName, attrs, selfClosing) {
    if (excludedTagSet.has(tagName)) {
      pushTag(tagName);
      return;
    }

    if (tagName === "br") {
      out.push("\n");
      return;
    }

    // Do not insert newline on open; we prefer boundary at close to avoid leading newlines

    if (tagName === "a") {
      currentAnchorHref = extractAttr(attrs, "href");
      inAnchor = true;
      anchorHasText = false;
      pushTag(tagName);
      if (selfClosing) handleTagClose(tagName);
      return;
    }

    if (tagName === "img") {
      if (settings.images === "alt") {
        const alt = extractAttr(attrs, "alt");
        if (alt) emitText(alt, out, settings, true);
      }
      // If we are between anchors, keep a separating space to avoid collapsing words
      if (inAnchor) out.push(" ");
      return;
    }

    if (tagName === "td" || tagName === "th") {
      if (insideTable > 0) {
        cellBuffer = [];
      }
      pushTag(tagName);
      if (selfClosing) handleTagClose(tagName);
      return;
    }

    if (tagName === "tr") {
      pushTag(tagName);
      if (selfClosing) handleTagClose(tagName);
      return;
    }

    // If entering a whitespace-preserved tag and previous output isn't at line start,
    // insert a newline to separate block context from pre/code content.
    if (preservedTagSet.has(tagName) && tagName !== "code") {
      ensureNewline(out);
    }
    pushTag(tagName);
    if (selfClosing) handleTagClose(tagName);
  }

  /**
   * @param {string} tagName
   */
  function handleTagClose(tagName) {
    if (excludedTagSet.has(tagName)) {
      popTag(tagName);
      return;
    }

    if (tagName === "a") {
      const shouldInline =
        !!currentAnchorHref && (settings.links === "inline" || (!anchorHasText && settings.images === "remove"));
      if (shouldInline && currentAnchorHref) {
        const prev = out.length > 0 ? out[out.length - 1] : "";
        const needSpace = anchorHasText ? prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n") : true;
        if (needSpace) out.push(" ");
        out.push("(", currentAnchorHref, ")");
      }
      currentAnchorHref = null;
      inAnchor = false;
      anchorHasText = false;
      popTag(tagName);
      return;
    }

    if (tagName === "td" || tagName === "th") {
      if (insideTable > 0) {
        const text = cellBuffer.join("");
        const normalized = settings.collapseWhitespace
          ? collapseWhitespace(processText(text, settings, preserveWhitespace), settings.maxNewlines)
          : processText(text, settings, preserveWhitespace);
        // Append separator only if not last cell; we cannot know without context, so defer newline on tr
        out.push(normalized, cellSep);
        cellBuffer = [];
      }
      popTag(tagName);
      return;
    }

    if (tagName === "tr") {
      // Remove trailing cell separator if present
      if (out.length > 0 && out[out.length - 1] === cellSep) {
        out.pop();
      }
      ensureNewline(out);
      popTag(tagName);
      return;
    }

    if (blockTagSet.has(tagName)) {
      ensureNewline(out);
    }
    popTag(tagName);
  }
}

/**
 * @param {HtmlToTextOptions} o
 */
function normalizeOptions(o) {
  return {
    mode: o.mode === "document" ? "document" : "fragment",
    links: o.links === "inline" || o.links === "remove" ? o.links : "text",
    images: o.images === "remove" ? "remove" : "alt",
    collapseWhitespace: o.collapseWhitespace !== false,
    maxNewlines: typeof o.maxNewlines === "number" && o.maxNewlines >= 1 ? o.maxNewlines : 2,
    wrap: typeof o.wrap === "number" && o.wrap > 0 ? Math.floor(o.wrap) : null,
    tableCellSeparator: o.tableCellSeparator === "space" ? "space" : "tab",
    excludeTags: Array.isArray(o.excludeTags)
      ? o.excludeTags.map(toLower)
      : ["script", "style", "noscript", "template", "svg", "canvas"],
    decodeEntities: o.decodeEntities !== false,
    preserveTags: Array.isArray(o.preserveTags) ? o.preserveTags.map(toLower) : ["pre", "code", "textarea"],
    trim: o.trim !== false,
  };
}

/**
 * @param {string[]} arr
 */
function toSet(arr) {
  const s = new Set();
  for (let i = 0; i < arr.length; i += 1) s.add(arr[i]);
  return s;
}

/**
 * @param {unknown} x
 * @returns {string}
 */
function toLower(x) {
  return String(x).toLowerCase();
}

/**
 * Emit text with optional entity decoding and whitespace handling.
 * @param {string} text
 * @param {string[]} out
 * @param {ReturnType<typeof normalizeOptions>} settings
 * @param {boolean} preserveWhitespace
 */
function emitText(text, out, settings, preserveWhitespace) {
  if (text.length === 0) return;
  const processed = processText(text, settings, preserveWhitespace);
  out.push(processed);
}

/**
 * @param {string} text
 * @param {ReturnType<typeof normalizeOptions>} settings
 * @param {boolean} preserveWhitespace
 */
function processText(text, settings, preserveWhitespace) {
  let t = text;
  if (settings.decodeEntities) t = decodeEntities(t);
  if (preserveWhitespace) {
    // Mark region to bypass global collapse
    return PRESERVE_OPEN + t + PRESERVE_CLOSE;
  }
  if (settings.collapseWhitespace) t = t.replace(/[\t\f\v\r ]+/g, " ");
  return t;
}

/** Ensure a single newline token, but not at start; compaction happens later. */
/**
 * @param {string[]} out
 * @returns {void}
 */
function ensureNewline(out) {
  if (out.length === 0) {
    return;
  }
  const last = out[out.length - 1];
  if (last.endsWith("\n")) return;
  out.push("\n");
}

/** Collapse whitespace and limit consecutive newlines to maxNewlines. */
/**
 * @param {string} input
 * @param {number} maxNewlines
 * @returns {string}
 */
function collapseWhitespace(input, maxNewlines) {
  if (input.indexOf(PRESERVE_OPEN) === -1) {
    return collapseWhitespaceGlobal(input, maxNewlines);
  }
  let result = "";
  let idx = 0;
  while (idx < input.length) {
    const open = input.indexOf(PRESERVE_OPEN, idx);
    if (open === -1) {
      result += collapseWhitespaceGlobal(input.slice(idx), maxNewlines);
      break;
    }
    result += collapseWhitespaceGlobal(input.slice(idx, open), maxNewlines);
    const close = input.indexOf(PRESERVE_CLOSE, open + 1);
    if (close === -1) {
      // Unmatched: treat rest as normal
      result += collapseWhitespaceGlobal(input.slice(open + 1), maxNewlines);
      break;
    }
    // Append preserved content as-is
    result += input.slice(open + 1, close);
    idx = close + 1;
  }
  return result;
}

/**
 * @param {string} input
 * @param {number} maxNewlines
 * @returns {string}
 */
function collapseWhitespaceGlobal(input, maxNewlines) {
  let s = input.replace(/[\u00A0]/g, " "); // nbsp → space early
  // Normalize CRLF/CR to LF
  s = s.replace(/\r\n?|\u2028|\u2029/g, "\n");
  // Collapse multiple spaces around newlines
  s = s.replace(/[ \t\f\v]+\n/g, "\n");
  s = s.replace(/\n[ \t\f\v]+/g, "\n");
  // Limit newline runs
  const re = new RegExp(`\\n{${maxNewlines + 1},}`, "g");
  s = s.replace(re, "\n".repeat(maxNewlines));
  // Collapse remaining horizontal whitespace
  s = s.replace(/[ \t\f\v]{2,}/g, " ");
  return s;
}

/** Hard wrap lines at the given column without touching pre/code blocks (already preserved). */
/**
 * @param {string} input
 * @param {number} width
 * @returns {string}
 */
function hardWrap(input, width) {
  const lines = input.split("\n");
  const wrapped = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.length <= width) {
      wrapped.push(line);
      continue;
    }
    let start = 0;
    while (start < line.length) {
      const end = Math.min(start + width, line.length);
      wrapped.push(line.slice(start, end));
      start = end;
    }
  }
  return wrapped.join("\n");
}

/**
 * Decode numeric entities and a curated set of named entities.
 * @param {string} s
 */
function decodeEntities(s) {
  // Numeric (decimal and hex)
  s = s.replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(Number(d)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeFromCodePoint(parseInt(h, 16)));
  // Common named entities
  s = s.replace(/&([a-zA-Z]+);/g, (_, name) => NAMED_ENTITIES[name] || `&${name};`);
  return s;
}

/**
 * @param {number} cp
 * @returns {string}
 */
function safeFromCodePoint(cp) {
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return "";
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
}

/**
 * Extract attribute value by name from a raw attribute string.
 * @param {string} attrs
 * @param {string} name
 */
function extractAttr(attrs, name) {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  if (!m) return null;
  const val = m[2] ?? m[3] ?? m[4] ?? "";
  return decodeEntities(val);
}

/**
 * @param {string} s
 * @returns {number}
 */
function indexOfSpace(s) {
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c === 32 || c === 9 || c === 10 || c === 12 || c === 13) return i;
  }
  return -1;
}

// --- classification sets ---

const BLOCK_TAG_SET = toSet([
  "p",
  "div",
  "section",
  "article",
  "header",
  "footer",
  "main",
  "nav",
  "aside",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  // Note: tr/td/th handled explicitly to control separators/newlines
  "blockquote",
  "figure",
  "figcaption",
  "hr",
]);

const SELF_CLOSING_TAG_SET = toSet(["br", "img", "hr", "meta", "link", "input", "source", "track", "wbr"]);

// Markers for preserved regions in collapse pass
const PRESERVE_OPEN = "\u2418"; // symbol for record separator visualization (any rare char)
const PRESERVE_CLOSE = "\u2419";

/** @type {Record<string,string>} */
const NAMED_ENTITIES = Object.freeze({
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
  copy: "\u00A9",
  reg: "\u00AE",
  trade: "\u2122",
  laquo: "\u00AB",
  raquo: "\u00BB",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  euro: "\u20AC",
  middot: "\u00B7",
  bull: "\u2022",
});
