/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Extract navigational links (<a href>) from HTML without a DOM.
 */

/**
 * @typedef {object} ExtractLinksOptions
 * @property {string|URL} [base]
 * @property {"all"|"internal"|"external"} [scope="all"]
 * @property {boolean} [normalize=true]
 * @property {boolean} [dedupe=true]
 * @property {boolean} [respectBaseTag=true]
 * @property {Array<"nofollow"|"noopener"|"ugc"|"sponsored">} [relFilter=[]]
 * @property {boolean} [allowHashLinks=false]
 */

/**
 * Extract only <a href> links.
 * @param {string} html
 * @param {ExtractLinksOptions} [options]
 * @returns {Set<URL>|Set<string>}
 */
export function extractLinksFromHtml(html, options = {}) {
  if (typeof html !== "string") throw new TypeError("Expected html to be a string");
  const cfg = normalizeOptions(options);
  const baseFromTag = cfg.respectBaseTag && !cfg.base ? readBaseHref(html) : null;
  const baseUrl = cfg.base ? new URL(String(cfg.base)) : baseFromTag ? new URL(baseFromTag) : null;

  /** @type {Set<string>} */
  const hrefs = new Set();
  const linkRe = /<a\b([^>]*)>/gi;
  let m;
  for (;;) {
    m = linkRe.exec(html);
    if (!m) break;
    const attrs = m[1] || "";
    // rel filtering
    if (cfg.relFilter.length) {
      const relM = /\brel\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
      const relVal = relM ? (relM[2] ?? relM[3] ?? relM[4] ?? "").toLowerCase() : "";
      const relParts = relVal.split(/\s+/).filter(Boolean);
      if (relParts.some((r) => cfg.relFilter.includes(/** @type {any} */ (r)))) continue;
    }
    const hrefM = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const raw = hrefM ? (hrefM[2] ?? hrefM[3] ?? hrefM[4] ?? "") : "";
    if (!raw) continue;
    const clean = raw.trim();
    if (!cfg.allowHashLinks && clean[0] === "#") continue;
    const scheme = getScheme(clean);
    if (scheme && !isHttpLike(scheme)) continue;
    let urlObj;
    try {
      urlObj = baseUrl ? new URL(clean, baseUrl) : new URL(clean, "http://localhost");
    } catch {
      continue;
    }
    if (cfg.scope !== "all" && baseUrl) {
      const same = urlObj.origin === baseUrl.origin;
      if (cfg.scope === "internal" && !same) continue;
      if (cfg.scope === "external" && same) continue;
    }
    if (!cfg.base && !baseFromTag && urlObj.origin === "http://localhost")
      hrefs.add(urlObj.pathname + urlObj.search + urlObj.hash);
    else hrefs.add(urlObj.href);
  }

  if (cfg.normalize) {
    const out = new Set();
    for (const href of hrefs) {
      try {
        out.add(new URL(href, baseUrl ?? undefined));
      } catch {
        if (baseUrl) out.add(new URL(href, baseUrl));
      }
    }
    return out;
  }
  return hrefs;
}

/**
 * @param {ExtractLinksOptions} o
 */
function normalizeOptions(o) {
  return {
    base: o.base,
    scope: o.scope === "internal" || o.scope === "external" ? o.scope : "all",
    normalize: o.normalize !== false,
    dedupe: o.dedupe !== false,
    respectBaseTag: o.respectBaseTag !== false,
    relFilter: Array.isArray(o.relFilter) ? o.relFilter : [],
    allowHashLinks: o.allowHashLinks === true,
  };
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
 * @param {string} s
 */
function getScheme(s) {
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(s);
  return m ? m[1].toLowerCase() : "";
}

/**
 * @param {string} scheme
 */
function isHttpLike(scheme) {
  return scheme === "http" || scheme === "https" || scheme === "";
}
