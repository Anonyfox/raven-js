/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Extract categorized asset URLs from HTML without a DOM.
 */

/**
 * @typedef {object} ExtractAssetsOptions
 * @property {string|URL} [base]
 * @property {boolean} [normalize=true]
 * @property {boolean} [dedupe=true]
 * @property {boolean} [respectBaseTag=true]
 * @property {boolean} [stripHash=true]
 * @property {Array<'images'|'stylesheets'|'fonts'|'media'|'icons'|'manifest'|'scripts'>} [stripQueryFor=['images','fonts']]
 * @property {"all"|"internal"|"external"} [scope="all"]
 */

/**
 * @param {string} html
 * @param {ExtractAssetsOptions} [options]
 * @returns {{images:Set<URL>|Set<string>,stylesheets:Set<URL>|Set<string>,scripts:Set<URL>|Set<string>,fonts:Set<URL>|Set<string>,media:Set<URL>|Set<string>,icons:Set<URL>|Set<string>,manifest:Set<URL>|Set<string>}}
 */
export function extractAssetsFromHtml(html, options = {}) {
  if (typeof html !== "string") throw new TypeError("Expected html to be a string");
  const cfg = normalizeOptions(options);
  const baseFromTag = cfg.respectBaseTag && !cfg.base ? readBaseHref(html) : null;
  const baseUrl = cfg.base ? new URL(String(cfg.base)) : baseFromTag ? new URL(baseFromTag) : null;

  const buckets = {
    images: new Set(),
    stylesheets: new Set(),
    scripts: new Set(),
    fonts: new Set(),
    media: new Set(),
    icons: new Set(),
    manifest: new Set(),
  };

  // images (img/src, picture/source/srcset, meta og:image)
  collectPattern(buckets.images, html, /<img[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);
  // srcset
  const srcsetRe = /<(?:img|source)[^>]+srcset\s*=\s*("([^"]*)"|'([^']*)')/gi;
  forEachMatch(srcsetRe, html, (/** @type {RegExpExecArray} */ m) => {
    const list = (m[2] ?? m[3] ?? "").split(",").map((s) => s.trim());
    for (const candidate of list) {
      const url = candidate.split(/\s+/)[0];
      if (url) buckets.images.add(url);
    }
  });
  // og:image
  forEachMatch(
    /<meta[^>]+(?:property|name)\s*=\s*(?:"og:image"|'og:image')[^>]*content\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
    html,
    (/** @type {RegExpExecArray} */ m) => {
      buckets.images.add(m[1] ?? m[2] ?? "");
    }
  );

  // stylesheets (link rel=stylesheet) and inline CSS url(...)
  forEachMatch(
    /<link[^>]+rel\s*=\s*(?:"stylesheet"|'stylesheet')[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
    html,
    (m) => {
      buckets.stylesheets.add(m[1] ?? m[2] ?? m[3] ?? "");
    }
  );
  const cssBlocks = collectCssBlocks(html);
  for (const css of cssBlocks) {
    forEachMatch(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]+))\s*\)/gi, css, (/** @type {RegExpExecArray} */ m) => {
      const u = m[1] ?? m[2] ?? m[3] ?? "";
      if (u) {
        const ext = (u.split("?")[0] || "").toLowerCase();
        if (/\.(?:woff2?|ttf|otf)(?:$|[?#])/.test(ext)) buckets.fonts.add(u);
        else buckets.images.add(u);
      }
    });
  }

  // scripts
  collectPattern(buckets.scripts, html, /<script[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);

  // media
  collectPattern(buckets.media, html, /<(?:video|audio)[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);
  collectPattern(buckets.media, html, /<(?:source|track)[^>]+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi);

  // icons and manifest
  forEachMatch(
    /<link[^>]+rel\s*=\s*(?:"(icon|apple-touch-icon|mask-icon|shortcut icon)"|'(icon|apple-touch-icon|mask-icon|shortcut icon)')[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
    html,
    (/** @type {RegExpExecArray} */ m) => {
      buckets.icons.add(m[3] ?? m[4] ?? m[5] ?? "");
    }
  );
  forEachMatch(
    /<link[^>]+rel\s*=\s*(?:"manifest"|'manifest')[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/gi,
    html,
    (/** @type {RegExpExecArray} */ m) => {
      buckets.manifest.add(m[1] ?? m[2] ?? m[3] ?? "");
    }
  );

  // Normalize per bucket
  /** @type {(s:Set<string>)=>Set<URL>|Set<string>} */
  /** @type {(set:Set<string>)=>Set<URL>|Set<string>} */
  const finalize = (set) =>
    normalizeSet(set, {
      baseUrl,
      scope: /** @type {"all"|"internal"|"external"} */ (cfg.scope),
      stripHash: cfg.stripHash,
      stripQueryFor: cfg.stripQueryFor,
      normalize: cfg.normalize,
    });

  return {
    images: finalize(buckets.images),
    stylesheets: finalize(buckets.stylesheets),
    scripts: finalize(buckets.scripts),
    fonts: finalize(buckets.fonts),
    media: finalize(buckets.media),
    icons: finalize(buckets.icons),
    manifest: finalize(buckets.manifest),
  };
}

/**
 * @param {ExtractAssetsOptions} o
 */
function normalizeOptions(o) {
  return {
    base: o.base,
    normalize: o.normalize !== false,
    dedupe: o.dedupe !== false,
    respectBaseTag: o.respectBaseTag !== false,
    stripHash: o.stripHash !== false,
    stripQueryFor: Array.isArray(o.stripQueryFor) ? o.stripQueryFor : ["images", "fonts"],
    scope: o.scope === "internal" || o.scope === "external" ? o.scope : "all",
  };
}

/**
 * Collect CSS blocks from <style> and style attributes.
 * @param {string} html
 * @returns {string[]}
 */
function collectCssBlocks(html) {
  /** @type {string[]} */
  const blocks = [];
  forEachMatch(/<style[^>]*>([\s\S]*?)<\/style>/gi, html, (m) => {
    blocks.push(m[1] ?? "");
  });
  forEachMatch(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, html, (m) => {
    blocks.push((m[2] ?? m[3] ?? "").replace(/^[\s;]+|[\s;]+$/g, ""));
  });
  return blocks;
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
function collectPattern(out, s, re) {
  forEachMatch(re, s, (/** @type {RegExpExecArray} */ m) => {
    const val = m[1] ?? m[2] ?? m[3] ?? "";
    if (val) out.add(val);
  });
}

/**
 * @param {RegExp} re
 * @param {string} s
 * @param {(m: RegExpExecArray)=>void} cb
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
 * @param {Set<string>} rawSet
 * @param {{baseUrl: URL|null, scope: 'all'|'internal'|'external', stripHash: boolean, stripQueryFor: string[], normalize: boolean}} param1
 */
function normalizeSet(rawSet, { baseUrl, scope, stripHash, stripQueryFor, normalize }) {
  /** @type {Set<string>} */
  const hrefs = new Set();
  for (const raw of rawSet) {
    const clean = String(raw).trim();
    if (!clean) continue;
    let urlObj;
    try {
      urlObj = baseUrl ? new URL(clean, baseUrl) : new URL(clean, "http://localhost");
    } catch {
      continue;
    }
    if (scope !== "all" && baseUrl) {
      const same = urlObj.origin === baseUrl.origin;
      if (scope === "internal" && !same) continue;
      if (scope === "external" && same) continue;
    }
    let href = urlObj.href;
    if (stripHash) {
      urlObj.hash = "";
      href = urlObj.href;
    }
    const pathLower = urlObj.pathname.toLowerCase();
    if (
      stripQueryFor.some(
        (t) =>
          (t === "images" && /\.(?:png|jpe?g|gif|webp|avif|svg)$/.test(pathLower)) ||
          (t === "fonts" && /\.(?:woff2?|ttf|otf)$/.test(pathLower))
      )
    ) {
      urlObj.search = "";
      href = urlObj.href;
    }
    hrefs.add(href);
  }
  if (!normalize) return hrefs;
  const out = new Set();
  for (const href of hrefs) {
    try {
      out.add(new URL(href));
    } catch {}
  }
  return out;
}
