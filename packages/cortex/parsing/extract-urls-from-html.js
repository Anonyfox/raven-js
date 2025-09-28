/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Extract all URLs from HTML without a DOM.
 *
 * Pure, deterministic, zero-dependency parser for URLs across anchors,
 * images, scripts, stylesheets, media, embeds, inline CSS, and meta tags.
 */

/**
 * @typedef {object} ExtractUrlsOptions
 * @property {string|URL} [base] Base URL for normalization and classification
 * @property {"all"|"internal"|"external"} [scope="all"] Filter by origin relative to base
 * @property {boolean} [normalize=true] Return URL instances (false => raw strings)
 * @property {boolean} [dedupe=true] Remove duplicates
 * @property {boolean} [includeDataUrls=false] Include data: urls
 * @property {boolean} [includeHashOnly=false] Include hash-only links like "#section"
 * @property {boolean} [respectBaseTag=true] Use <base href> if base option not provided
 */

/**
 * Extract all URLs from HTML content.
 *
 * @param {string} html
 * @param {ExtractUrlsOptions} [options]
 * @returns {Set<URL>|Set<string>}
 */
export function extractUrlsFromHtml(html, options = {}) {
  if (typeof html !== "string") throw new TypeError("Expected html to be a string");
  const cfg = normalizeOptions(options);

  const baseFromTag = cfg.respectBaseTag && !cfg.base ? readBaseHref(html) : null;
  const baseUrl = cfg.base ? new URL(String(cfg.base)) : baseFromTag ? new URL(baseFromTag) : null;

  /** @type {Set<string>} */
  const hrefs = new Set();

  // Extractors
  runPattern(hrefs, html, /<a[^>]+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);
  runPattern(hrefs, html, /<img[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);
  runPattern(hrefs, html, /<script[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);
  runPattern(hrefs, html, /<link[^>]+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);
  runPattern(hrefs, html, /<(?:video|audio)[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);
  runPattern(
    hrefs,
    html,
    /<(?:iframe|embed|source|track|object)[^>]+(?:src|data)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi
  );

  // srcset in <img> and <source>
  const srcsetRe = /<(?:img|source)[^>]+srcset\s*=\s*("([^"]*)"|'([^']*)')/gi;
  forEachMatch(srcsetRe, html, (m) => {
    const list = (m[2] ?? m[3] ?? "").split(",").map((s) => s.trim());
    for (const candidate of list) {
      const url = candidate.split(/\s+/)[0];
      if (url) hrefs.add(url);
    }
  });

  // Inline CSS in <style> and style=""
  const cssBlocks = collectCssBlocks(html);
  for (const css of cssBlocks) {
    forEachMatch(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]+))\s*\)/gi, css, (m) => {
      const u = m[1] ?? m[2] ?? m[3] ?? "";
      if (u) hrefs.add(u);
    });
  }

  // Meta tags (canonical, og:image, etc.)
  const metaContentAttrs = ["property", "name"]; // support both
  for (const attr of metaContentAttrs) {
    const re = new RegExp(
      `<meta[^>]+${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)')[^>]*content\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
      "gi"
    );
    forEachMatch(re, html, (m) => {
      const key = (m[1] ?? m[2] ?? "").toLowerCase();
      if (
        key.includes("canonical") ||
        key.includes("og:image") ||
        key.includes("og:url") ||
        key.includes("twitter:image")
      ) {
        const val = m[3] ?? m[4] ?? "";
        if (val) hrefs.add(val);
      }
    });
  }

  // Normalize, filter, and scope
  /** @type {Set<string>} */
  const normalized = new Set();
  for (const raw of hrefs) {
    const clean = raw.trim();
    if (!clean) continue;
    if (!cfg.includeHashOnly && clean[0] === "#") continue;
    const scheme = getScheme(clean);
    if (scheme && !isHttpLike(scheme)) {
      if (scheme === "data" && cfg.includeDataUrls) normalized.add(clean);
      continue;
    }
    let urlObj;
    try {
      urlObj = baseUrl ? new URL(clean, baseUrl) : new URL(clean, "http://localhost");
    } catch {
      continue;
    }
    if (!cfg.includeDataUrls && urlObj.protocol === "data:") continue;
    if (cfg.scope !== "all" && baseUrl) {
      const same = urlObj.origin === baseUrl.origin;
      if (cfg.scope === "internal" && !same) continue;
      if (cfg.scope === "external" && same) continue;
    }
    // Remove fake origin if we used localhost fallback without a real base
    if (!cfg.base && !baseFromTag && urlObj.origin === "http://localhost") {
      normalized.add(urlObj.pathname + urlObj.search + urlObj.hash);
    } else {
      normalized.add(urlObj.href);
    }
  }

  // Return as URL objects or strings
  if (cfg.normalize) {
    const out = new Set();
    for (const href of normalized) {
      try {
        out.add(new URL(href, baseUrl ?? undefined));
      } catch {
        // If not absolute, try as-is only when base present
        if (baseUrl) out.add(new URL(href, baseUrl));
      }
    }
    return out;
  }
  return normalized;
}

/**
 * @param {ExtractUrlsOptions} o
 */
function normalizeOptions(o) {
  return {
    base: o.base,
    scope: o.scope === "internal" || o.scope === "external" ? o.scope : "all",
    normalize: o.normalize !== false,
    dedupe: o.dedupe !== false,
    includeDataUrls: o.includeDataUrls === true,
    includeHashOnly: o.includeHashOnly === true,
    respectBaseTag: o.respectBaseTag !== false,
  };
}

/**
 * @param {string} s
 * @returns {string}
 */
function getScheme(s) {
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(s);
  return m ? m[1].toLowerCase() : "";
}

/**
 * @param {string} scheme
 * @returns {boolean}
 */
function isHttpLike(scheme) {
  return scheme === "http" || scheme === "https" || scheme === "";
}

/**
 * @param {string} html
 * @returns {string|null}
 */
function readBaseHref(html) {
  const m = /<base[^>]+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/i.exec(html);
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
}

/**
 * @param {Set<string>} out
 * @param {string} s
 * @param {RegExp} re
 */
function runPattern(out, s, re) {
  forEachMatch(re, s, (m) => {
    const val = m[1] ?? m[2] ?? m[3] ?? "";
    if (val) out.add(val);
  });
}

/**
 * @param {RegExp} re
 * @param {string} s
 * @param {(m: RegExpExecArray) => void} cb
 */
function forEachMatch(re, s, cb) {
  re.lastIndex = 0;
  for (;;) {
    const m = re.exec(s);
    if (!m) break;
    cb(m);
    if (re.lastIndex === m.index) re.lastIndex += 1;
  }
}

/**
 * Collect CSS blocks from <style> and style="" attributes.
 * @param {string} html
 * @returns {string[]}
 */
function collectCssBlocks(html) {
  /** @type {string[]} */
  const blocks = [];
  forEachMatch(/<style[^>]*>([\s\S]*?)<\/style>/gi, html, (m) => {
    blocks.push(m[1] ?? "");
  });
  // style attributes
  forEachMatch(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, html, (m) => {
    blocks.push((m[2] ?? m[3] ?? "").replace(/^[\s;]+|[\s;]+$/g, ""));
  });
  return blocks;
}
