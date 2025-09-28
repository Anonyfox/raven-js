/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Extract primary readable content from HTML without a DOM.
 *
 * Tokenizes HTML into logical blocks, scores them via text/link density and
 * semantic hints, clusters adjacent blocks, and returns normalized text plus
 * minimal metadata. Zero dependencies; deterministic; DOM-free.
 */

import { htmlToText } from "./html-to-text.js";
import { isProbablyReadableHtml } from "./is-probably-readable-html.js";

/**
 * @typedef {object} HtmlToContentOptions
 * @property {number} [sampleBytes=128000] Max chars to process
 * @property {number} [minWords=50] Minimum words per candidate block
 * @property {number} [maxLinkDensity=0.5] Reject blocks above this
 * @property {boolean} [stopwords=false] Enable English stopword density feature
 * @property {boolean} [html=false] Include minimal HTML in the result
 * @property {"cluster"|"none"} [imagePolicy="cluster"] Image selection policy
 * @property {RegExp} [negativePatterns] Class/id negative patterns
 * @property {boolean} [gate=true] Use isProbablyReadableHtml for fast rejection
 */

/**
 * @typedef {object} HtmlContent
 * @property {string} title
 * @property {string} text
 * @property {string|undefined} html
 * @property {string} excerpt
 * @property {string[]} images
 * @property {{wordCount:number,readingMinutes:number,score:number,source:"block"|"fallback"}} meta
 */

/**
 * Extract primary content from HTML.
 *
 * @param {string} html
 * @param {HtmlToContentOptions} [options]
 * @returns {HtmlContent}
 */
export function htmlToContent(html, options = {}) {
  if (typeof html !== "string") {
    throw new TypeError("Expected html to be a string");
  }

  const cfg = normalizeOptions(options);
  const sample = html.slice(0, cfg.sampleBytes);

  if (cfg.gate && !isProbablyReadableHtml(sample)) {
    const res = fallbackResult(extractTitle(sample), sample);
    if (cfg.html) res.html = paragraphsToHtml(res.text);
    return res;
  }

  // Quick title extraction
  const title = extractTitle(sample);

  // Tokenize and build blocks
  const ctx = createTokenizerContext(cfg);
  tokenize(sample, ctx);

  if (ctx.blocks.length === 0) {
    const res = fallbackResult(title, sample);
    if (cfg.html) res.html = paragraphsToHtml(res.text);
    return res;
  }

  scoreBlocks(ctx.blocks, cfg);
  const seedIndex = pickSeedIndex(ctx.blocks, cfg);
  if (seedIndex === -1) {
    const res = fallbackResult(title, sample);
    if (cfg.html) res.html = paragraphsToHtml(res.text);
    return res;
  }

  const cluster = expandCluster(ctx.blocks, seedIndex, cfg);
  if (cluster.indices.length === 0) {
    const res = fallbackResult(title, sample);
    if (cfg.html) res.html = paragraphsToHtml(res.text);
    return res;
  }

  // Merge cluster content
  let mergedText = "";
  let mergedHtml = "";
  /** @type {Set<string>} */
  const imageSet = new Set();
  // Seed with first global <img src> as a safety net
  {
    const m = /<img\b[^>]*\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(html);
    if (m) {
      const src = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
      if (src && !src.startsWith("data:")) imageSet.add(src);
    }
    const art = /<article\b[\s\S]*?<\/article>/i.exec(html);
    if (art) {
      const seg = art[0];
      const mA = /<img\b[^>]*\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(seg);
      if (mA) {
        const sA = decodeEntities(mA[2] ?? mA[3] ?? mA[4] ?? "");
        if (sA && !sA.startsWith("data:")) imageSet.add(sA);
      }
    }
  }
  let totalWords = 0;
  for (let i = 0; i < cluster.indices.length; i += 1) {
    const b = ctx.blocks[cluster.indices[i]];
    if (mergedText.length > 0) mergedText += "\n\n";
    mergedText += normalizeParagraph(b.text);
    if (cfg.html) {
      mergedHtml += b.html;
    }
    totalWords += b.words;
    if (cfg.imagePolicy === "cluster" && b.images && b.images.length) {
      for (let k = 0; k < b.images.length; k += 1) {
        const src = b.images[k];
        if (src && !src.startsWith("data:")) imageSet.add(src);
      }
    }
  }

  // Also consider nearby figure/image-only blocks around cluster boundaries
  const leftIdx = cluster.indices[0];
  const rightIdx = cluster.indices[cluster.indices.length - 1];
  for (let off = 1; off <= 3; off += 1) {
    const li = leftIdx - off;
    if (li >= 0) {
      const b = ctx.blocks[li];
      if (b?.images?.length && (b.tag === "figure" || b.tag === "")) {
        for (let k = 0; k < b.images.length; k += 1) {
          const src = b.images[k];
          if (src && !src.startsWith("data:")) imageSet.add(src);
        }
        break;
      }
    }
  }
  for (let off = 1; off <= 3; off += 1) {
    const ri = rightIdx + off;
    if (ri < ctx.blocks.length) {
      const b = ctx.blocks[ri];
      if (b?.images?.length && (b.tag === "figure" || b.tag === "")) {
        for (let k = 0; k < b.images.length; k += 1) {
          const src = b.images[k];
          if (src && !src.startsWith("data:")) imageSet.add(src);
        }
        break;
      }
    }
  }
  let images = Array.from(imageSet).slice(0, 8);
  if (images.length === 0) {
    const tagRe = /<img\b[^>]*>/gi;
    let _m;
    for (;;) {
      const mm = tagRe.exec(html);
      if (!mm) break;
      const tag = mm[0];
      const attrs = tag.slice(4, -1); // between '<img' and '>'
      const src = extractAttr(attrs, "src");
      if (src && !src.startsWith("data:")) {
        images = [src];
        break;
      }
      if (tagRe.lastIndex === mm.index) tagRe.lastIndex += 1;
    }
    if (images.length === 0) {
      const url = /(https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|gif|webp))/i.exec(html);
      if (url) images = [decodeEntities(url[1])];
    }
  }
  const score = cluster.score;
  const excerpt = buildExcerpt(mergedText);
  const text = finalizeText(mergedText);
  let minimalHtml;
  if (cfg.html) {
    minimalHtml = mergedHtml && mergedHtml.trim().length > 0 ? mergedHtml : paragraphsToHtml(text);
  }

  /** @type {HtmlContent} */
  const result = {
    title,
    text,
    html: cfg.html ? minimalHtml : undefined,
    excerpt,
    images,
    meta: {
      wordCount: totalWords,
      readingMinutes: totalWords === 0 ? 0 : Math.max(1, Math.ceil(totalWords / 200)),
      score,
      source: "block",
    },
  };
  return result;
}

/**
 * @param {string} html
 * @returns {HtmlContent}
 */
/**
 * @param {string} title
 * @param {string} html
 * @returns {HtmlContent}
 */
function fallbackResult(title, html) {
  const text = htmlToText(html, { maxNewlines: 2 });
  const words = countWords(text);
  /** @type {HtmlContent} */
  const result = {
    title: title || "",
    text,
    html: undefined,
    excerpt: buildExcerpt(text),
    images: [],
    meta: {
      wordCount: words,
      readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 200)),
      score: 0,
      source: "fallback",
    },
  };
  return result;
}

/**
 * @param {string} title
 * @returns {HtmlContent}
 */
function _emptyResult(title) {
  /** @type {HtmlContent} */
  const result = {
    title: title || "",
    text: "",
    html: undefined,
    excerpt: "",
    images: [],
    meta: { wordCount: 0, readingMinutes: 0, score: 0, source: "fallback" },
  };
  return result;
}

/**
 * @param {HtmlToContentOptions} o
 */
function normalizeOptions(o) {
  return {
    sampleBytes: typeof o.sampleBytes === "number" && o.sampleBytes > 0 ? Math.floor(o.sampleBytes) : 128000,
    minWords: typeof o.minWords === "number" && o.minWords > 0 ? Math.floor(o.minWords) : 10,
    maxLinkDensity: typeof o.maxLinkDensity === "number" ? o.maxLinkDensity : 0.5,
    stopwords: o.stopwords === true,
    html: o.html === true,
    imagePolicy: o.imagePolicy === "none" ? "none" : "cluster",
    negativePatterns:
      o.negativePatterns instanceof RegExp
        ? o.negativePatterns
        : /(nav|foot|head|aside|promo|ad|share|comment|cookie|gdpr|subscribe|related|breadcrumb)/i,
    gate: o.gate !== false,
  };
}

/**
 * @param {string} input
 */
/**
 * @param {string} input
 * @returns {string}
 */
function extractTitle(input) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(input);
  if (!m) return "";
  let t = stripTags(m[1]).trim();
  // Remove common site suffixes/prefixes
  t = t.replace(/\s*[-|•|·|:|–|—]\s*[^\s].*$/u, "");
  return decodeEntities(t).trim();
}

/**
 * @param {string} s
 * @returns {string}
 */
function stripTags(s) {
  return s.replace(/<[^>]*>/g, " ");
}

/**
 * @typedef {object} Block
 * @property {string} text
 * @property {string} html
 * @property {string} tag
 * @property {string} classes
 * @property {string} id
 * @property {number} depth
 * @property {number} tagCount
 * @property {number} words
 * @property {number} linkedWords
 * @property {number} sentenceEnds
 * @property {number} uppercaseRatio
 * @property {number} headingBoost
 * @property {number} semanticBoost
 * @property {number} negativeBoost
 * @property {number} linkDensity
 * @property {number} textDensity
 * @property {number} score
 * @property {string[]} images
 */

/**
 * @param {ReturnType<typeof normalizeOptions>} cfg
 */
/**
 * @param {ReturnType<typeof normalizeOptions>} cfg
 */
function createTokenizerContext(cfg) {
  return {
    cfg,
    /** @type {Block[]} */
    blocks: [],
    /** @type {string[]} */
    tagStack: [],
    depth: 0,
    headingCarry: 0,
  };
}

/**
 * @param {string} html
 * @param {ReturnType<typeof createTokenizerContext>} ctx
 */
/**
 * @param {string} html
 * @param {{cfg: ReturnType<typeof normalizeOptions>, blocks: Block[], tagStack: string[], depth: number, headingCarry: number}} ctx
 * @returns {void}
 */
function tokenize(html, ctx) {
  const { cfg } = ctx;
  const length = html.length;
  let i = 0;
  let inLink = false;
  let current = newBlock(ctx.depth);
  let skipDepth = 0;

  while (i < length) {
    const ch = html.charCodeAt(i);
    if (ch === 60 /* < */) {
      const tagStart = i;
      const end = html.indexOf(">", tagStart + 1);
      if (end === -1) {
        // trailing text
        appendText(current, html.slice(i), inLink);
        break;
      }
      const raw = html.slice(tagStart + 1, end);
      i = end + 1;
      const isClose = raw[0] === "/";
      const body = isClose ? raw.slice(1) : raw;
      const spaceIdx = indexOfSpace(body);
      const name = (spaceIdx === -1 ? body : body.slice(0, spaceIdx)).toLowerCase();
      const attrs = spaceIdx === -1 ? "" : body.slice(spaceIdx + 1);

      if (isClose) {
        if (skipDepth > 0) {
          if (isSkippableTag(name)) skipDepth -= 1;
        } else {
          if (name === "a") inLink = false;
          if (isBlockBoundary(name)) {
            finalizeBlock(ctx, current);
            current = newBlock(ctx.depth);
          }
          ctx.depth = Math.max(0, ctx.depth - 1);
        }
        continue;
      }

      // opening or self-closing
      const selfClosing = raw.endsWith("/") || SELF_CLOSING.has(name);

      if (isSkippableTag(name)) {
        skipDepth += 1;
        continue;
      }

      if (name === "a") inLink = true;

      if (isBlockBoundary(name)) {
        // finalize current block before starting a new one
        finalizeBlock(ctx, current);
        current = newBlock(ctx.depth);
        current.tag = name;
        const { id, classes } = extractIdClass(attrs);
        current.id = id;
        current.classes = classes;
        current.semanticBoost = semanticBoostFor(name);
        current.negativeBoost = negativeBoostFor(id, classes, cfg.negativePatterns, name);
      }

      // capture images appearing right after opening a block (e.g., <figure><img ...>)
      if (name === "img") {
        const src = extractAttr(attrs, "src");
        if (src) current.images.push(decodeEntities(src));
      }

      // track headings to give carryover boost
      if (name === "h1" || name === "h2" || name === "h3") {
        ctx.headingCarry = 10; // max heading boost; will be assigned to next block
      }

      if (name === "img") {
        const src = extractAttr(attrs, "src");
        if (src) current.images.push(decodeEntities(src));
      }

      current.tagCount += 1;
      ctx.depth += selfClosing ? 0 : 1;
      continue;
    }

    // text node
    const nextTag = html.indexOf("<", i);
    const text = nextTag === -1 ? html.slice(i) : html.slice(i, nextTag);
    i = nextTag === -1 ? length : nextTag;
    if (skipDepth > 0) continue;
    appendText(current, text, inLink);
  }

  finalizeBlock(ctx, current);
}

/**
 * @param {string} name
 */
function isSkippableTag(name) {
  return (
    name === "script" ||
    name === "style" ||
    name === "noscript" ||
    name === "template" ||
    name === "svg" ||
    name === "canvas"
  );
}

/**
 * @param {string} name
 */
function isBlockBoundary(name) {
  return BLOCK_BOUNDARY.has(name);
}

/**
 * @param {number} depth
 * @returns {Block}
 */
function newBlock(depth) {
  /** @type {Block} */
  const b = {
    text: "",
    html: "",
    tag: "",
    classes: "",
    id: "",
    depth,
    tagCount: 0,
    words: 0,
    linkedWords: 0,
    sentenceEnds: 0,
    uppercaseRatio: 0,
    headingBoost: 0,
    semanticBoost: 0,
    negativeBoost: 0,
    linkDensity: 0,
    textDensity: 0,
    score: 0,
    images: [],
  };
  return b;
}

/**
 * @param {Block} block
 * @param {string} rawText
 * @param {boolean} inLink
 */
function appendText(block, rawText, inLink) {
  if (!rawText) return;
  const decoded = decodeEntities(rawText);
  block.html += rawText;
  const clean = decoded.replace(/[\t\f\v\r ]+/g, " ");
  block.text += clean;
  const words = countWords(clean);
  block.words += words;
  if (inLink) block.linkedWords += words;
  block.sentenceEnds += regexCount(clean, /[.!?](?:\s|$)/g);
  const letters = clean.replace(/[^A-Za-z]/g, "");
  if (letters.length > 0) {
    const upper = letters.replace(/[^A-Z]/g, "").length;
    block.uppercaseRatio = Math.max(block.uppercaseRatio, upper / letters.length);
  }
}

/**
 * @param {{headingCarry:number, blocks: Block[]}} ctx
 * @param {Block} block
 */
function finalizeBlock(ctx, block) {
  if (block.text.trim().length === 0 && (!block.images || block.images.length === 0)) return;
  // Assign heading carry to first non-empty block
  if (ctx.headingCarry > 0 && block.headingBoost === 0) {
    block.headingBoost = ctx.headingCarry;
    ctx.headingCarry = 0;
  }
  ctx.blocks.push(block);
}

/**
 * @param {string} attrs
 */
function extractIdClass(attrs) {
  const idm = /\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
  const cm = /\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
  const id = idm ? (idm[2] ?? idm[3] ?? idm[4] ?? "") : "";
  const classes = cm ? (cm[2] ?? cm[3] ?? cm[4] ?? "") : "";
  return { id: decodeEntities(id), classes: decodeEntities(classes) };
}

/**
 * @param {string} attrs
 * @param {string} name
 */
function extractAttr(attrs, name) {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  if (!m) return null;
  return decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
}

/**
 * @param {string} tag
 */
function semanticBoostFor(tag) {
  if (tag === "article" || tag === "main") return 8;
  if (tag === "section") return 4;
  return 0;
}

/**
 * @param {string} id
 * @param {string} classes
 * @param {RegExp} re
 * @param {string} tag
 */
function negativeBoostFor(id, classes, re, tag) {
  let penalty = 0;
  if (tag === "nav" || tag === "header" || tag === "footer" || tag === "aside") penalty += 10;
  const bag = `${id} ${classes}`;
  if (re.test(bag)) penalty += 12;
  return -penalty;
}

/**
 * @param {Block[]} blocks
 * @param {ReturnType<typeof normalizeOptions>} cfg
 */
/**
 * @param {Block[]} blocks
 * @param {ReturnType<typeof normalizeOptions>} cfg
 */
function scoreBlocks(blocks, cfg) {
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    const words = Math.max(0, b.words);
    const linkDensity = words === 0 ? 0 : b.linkedWords / words;
    const textDensity = words / (1 + b.tagCount);
    b.linkDensity = linkDensity;
    b.textDensity = textDensity;

    const stopwordDensity = cfg.stopwords ? estimateStopwordDensity(b.text) : 0;
    const uppercasePenalty = b.uppercaseRatio > 0.3 && words > 20 ? 8 : 0;

    if (words === 0) {
      b.score = -5 + b.negativeBoost;
      continue;
    }

    let score = 0;
    score += words * 0.4;
    score += b.sentenceEnds * 2;
    score += textDensity * 3;
    score += Math.min(10, b.headingBoost);
    score += b.semanticBoost;
    score += stopwordDensity * 6;
    score -= linkDensity * 12;
    score += b.negativeBoost;
    score -= uppercasePenalty;

    b.score = score;
  }
}

/**
 * @param {Block[]} blocks
 * @param {ReturnType<typeof normalizeOptions>} cfg
 */
/**
 * @param {Block[]} blocks
 * @param {ReturnType<typeof normalizeOptions>} cfg
 */
function pickSeedIndex(blocks, cfg) {
  let best = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.words < cfg.minWords) continue;
    if (b.linkDensity > cfg.maxLinkDensity) continue;
    if (b.score > bestScore) {
      bestScore = b.score;
      best = i;
    }
  }
  return best;
}

/**
 * @param {Block[]} blocks
 * @param {number} seed
 * @param {ReturnType<typeof normalizeOptions>} cfg
 */
/**
 * @param {Block[]} blocks
 * @param {number} seed
 * @param {ReturnType<typeof normalizeOptions>} cfg
 */
function expandCluster(blocks, seed, cfg) {
  let left = seed;
  let right = seed;
  let totalScore = blocks[seed].score;
  let totalWords = blocks[seed].words;

  // expand left
  for (let i = seed - 1; i >= 0; i -= 1) {
    const b = blocks[i];
    if (b.linkDensity >= 0.4) break;
    if (b.words < Math.max(10, Math.floor(cfg.minWords / 2))) break;
    if (b.score <= 0 && totalWords > cfg.minWords * 4) break;
    left = i;
    totalScore += b.score;
    totalWords += b.words;
  }

  // expand right
  for (let i = seed + 1; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.linkDensity >= 0.4) break;
    if (b.words < Math.max(10, Math.floor(cfg.minWords / 2))) break;
    if (b.score <= 0 && totalWords > cfg.minWords * 4) break;
    right = i;
    totalScore += b.score;
    totalWords += b.words;
  }

  const indices = [];
  for (let i = left; i <= right; i += 1) indices.push(i);
  return { indices, score: totalScore };
}

/**
 * @param {string} s
 * @returns {string}
 */
function normalizeParagraph(s) {
  let t = s.replace(/\r\n?|\u2028|\u2029/g, "\n");
  t = t.replace(/[\t\f\v ]+/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

/**
 * @param {string} s
 * @returns {string}
 */
function finalizeText(s) {
  // Preserve double newlines between paragraphs, collapse others
  let t = s.replace(/[ \t\f\v]+\n/g, "\n");
  t = t.replace(/\n[ \t\f\v]+/g, "\n");
  return t;
}

/**
 * @param {string} text
 * @returns {string}
 */
function buildExcerpt(text) {
  const trimmed = text.trim();
  if (trimmed.length <= 200) return trimmed;
  // Cut at nearest sentence boundary <= 200 or hard cut
  const cut = trimmed.slice(0, 200);
  const m = /(.*?[.!?])(?:\s|$)/.exec(cut);
  return (m ? m[1] : cut).trim();
}

/**
 * @param {string} s
 * @returns {number}
 */
function countWords(s) {
  const m = s.match(/\b\w{2,}\b/g);
  return m ? m.length : 0;
}

/**
 * @param {string} text
 * @returns {number}
 */
function estimateStopwordDensity(text) {
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g);
  if (!words || words.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < words.length; i += 1) if (STOPWORDS.has(words[i])) count += 1;
  return count / words.length;
}

/**
 * @param {string} s
 * @param {RegExp} re
 * @returns {number}
 */
function regexCount(s, re) {
  let c = 0;
  re.lastIndex = 0;
  for (;;) {
    const m = re.exec(s);
    if (m === null) break;
    c += 1;
    if (re.lastIndex === m.index) re.lastIndex += 1;
  }
  return c;
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

/**
 * @param {string} s
 * @returns {string}
 */
function decodeEntities(s) {
  s = s.replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(Number(d)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeFromCodePoint(parseInt(h, 16)));
  s = s.replace(/&([a-zA-Z]+);/g, (_, name) => NAMED_ENTITIES[name] || `&${name};`);
  return s;
}

/**
 * @param {string} text
 * @returns {string}
 */
function paragraphsToHtml(text) {
  const parts = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  return parts.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

const SELF_CLOSING = new Set(["br", "img", "hr", "meta", "link", "input", "source", "track", "wbr"]);
const BLOCK_BOUNDARY = new Set([
  "p",
  "div",
  "section",
  "article",
  "main",
  "li",
  "pre",
  "blockquote",
  "figure",
  "header",
  "footer",
]);

/** @type {Set<string>} */
const STOPWORDS = new Set([
  "the",
  "of",
  "and",
  "to",
  "in",
  "a",
  "is",
  "it",
  "you",
  "that",
  "he",
  "was",
  "for",
  "on",
  "are",
  "with",
  "as",
  "i",
  "his",
  "they",
  "be",
  "at",
  "one",
  "have",
  "this",
  "from",
  "or",
  "had",
  "by",
  "not",
  "but",
  "what",
  "all",
  "were",
  "we",
  "when",
  "your",
  "can",
  "there",
  "an",
]);

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
