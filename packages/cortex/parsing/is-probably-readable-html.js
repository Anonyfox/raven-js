/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Fast, string-only readability pre-check for HTML.
 *
 * Pure function: inspects a small sample of the HTML and returns a boolean
 * indicating whether the document likely contains readable content.
 * No DOM, no dependencies, O(n) over a capped slice.
 */

/**
 * @typedef {object} ReadableOptions
 * @property {number} [sampleBytes=16384] Max number of bytes (chars) to scan from start
 * @property {object} [thresholds]
 * @property {number} [thresholds.minHtmlLength=1000]
 * @property {number} [thresholds.minTextRatio=0.14]
 * @property {number} [thresholds.minParagraphs=3]
 * @property {number} [thresholds.minWordCount=120]
 * @property {number} [thresholds.minSentenceEnds=3]
 * @property {number} [thresholds.maxScriptStyleRatio=0.35]
 * @property {number} [thresholds.minScore=20]
 */

/**
 * Determine if the given HTML likely contains "readable" article content.
 * String-only heuristics; deterministic and fast.
 *
 * @param {string} html
 * @param {ReadableOptions} [options]
 * @returns {boolean}
 */
export function isProbablyReadableHtml(html, options = {}) {
  if (typeof html !== "string") {
    throw new TypeError("Expected html to be a string");
  }

  const sampleBytes =
    typeof options.sampleBytes === "number" && options.sampleBytes > 0 ? Math.floor(options.sampleBytes) : 16384;
  const t = normalizeThresholds(options.thresholds);

  if (html.length < t.minHtmlLength) return false;

  const sample = html.slice(0, sampleBytes);
  const lower = sample.toLowerCase();

  // Utility/low-value pages quick reject
  if (UTILITY_RE.test(lower)) return false;

  // Script/style heavy quick reject
  const scriptStyleLen = totalLength(sample, SCRIPT_OPEN_RE) + totalLength(sample, STYLE_OPEN_RE);
  if (scriptStyleLen / sample.length > t.maxScriptStyleRatio) return false;

  // Text density check
  const textOnly = sample.replace(TAG_RE, " ").replace(/\s+/g, " ").trim();
  const textRatio = textOnly.length / sample.length;
  if (textRatio < t.minTextRatio) return false;

  // Pattern counts
  const paragraphs = count(sample, P_RE);
  if (paragraphs < t.minParagraphs) return false;

  const articleOrMain = ARTICLE_MAIN_RE.test(sample) ? 1 : 0;
  const headings = Math.min(count(sample, H1_3_RE), 12);
  const sentenceEnds = count(sample, SENTENCE_END_RE);
  const wordCount = count(sample, WORD4_RE);
  const brDivCluster = BR_DIV_CLUSTER_RE.test(sample) ? 1 : 0;

  // Fast-path: strong content indicators
  if (articleOrMain && paragraphs >= 3) return true;
  if (brDivCluster && paragraphs >= 3 && textRatio >= t.minTextRatio) return true;

  const scriptTags = count(sample, SCRIPT_OPEN_RE);
  const inputTags = count(sample, INPUT_RE);
  const forms = count(sample, FORM_RE);
  const tables = count(sample, TABLE_RE);
  const tableHeavy = tables > paragraphs ? 1 : 0;

  const textRatioBonus = clamp01((textRatio - 0.12) / 0.1) * 6;

  const score =
    paragraphs * 3 +
    articleOrMain * 10 +
    headings * 1.5 +
    sentenceEnds * 0.5 +
    wordCount * 0.01 +
    (brDivCluster ? 8 : 0) +
    textRatioBonus -
    scriptTags * 2 -
    inputTags * 3 -
    forms * 3 -
    (tableHeavy ? 5 : 0);

  return score >= t.minScore;
}

/**
 * @param {Partial<{minHtmlLength:number,minTextRatio:number,minParagraphs:number,minWordCount:number,minSentenceEnds:number,maxScriptStyleRatio:number,minScore:number}>|undefined} x
 */
function normalizeThresholds(x) {
  const t = x || {};
  return {
    minHtmlLength: num(t.minHtmlLength, 300),
    minTextRatio: num(t.minTextRatio, 0.14),
    minParagraphs: num(t.minParagraphs, 3),
    minWordCount: num(t.minWordCount, 120),
    minSentenceEnds: num(t.minSentenceEnds, 3),
    maxScriptStyleRatio: num(t.maxScriptStyleRatio, 0.35),
    minScore: num(t.minScore, 20),
  };
}

/**
 * @param {unknown} v
 * @param {number} d
 */
function num(v, d) {
  return typeof v === "number" ? v : d;
}

/**
 * @param {string} s
 * @param {RegExp} re
 */
function count(s, re) {
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
 * @param {RegExp} re
 */
function totalLength(s, re) {
  let sum = 0;
  re.lastIndex = 0;
  for (;;) {
    const m = re.exec(s);
    if (m === null) break;
    sum += m[0].length;
    if (re.lastIndex === m.index) re.lastIndex += 1;
  }
  return sum;
}

/**
 * @param {number} x
 */
function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// Regexes (sticky/global where useful); keep simple for performance
const TAG_RE = /<[^>]*>/g;
const P_RE = /<p[\s>]/gi;
const H1_3_RE = /<h[1-3][\s>]/gi;
const ARTICLE_MAIN_RE = /<(article|main)([\s>]|\b)|role\s*=\s*"(?:article|main)"/i;
const SCRIPT_OPEN_RE = /<script[\s>]/gi;
const STYLE_OPEN_RE = /<style[\s>]/gi;
const FORM_RE = /<form[\s>]/gi;
const INPUT_RE = /<input[\s>]/gi;
const TABLE_RE = /<table[\s>]/gi;
const SENTENCE_END_RE = /[.!?]\s+[A-Z]/g;
const WORD4_RE = /\b\w{4,}\b/g;
const BR_DIV_CLUSTER_RE = /<div[^>]*>\s*(?:<br\s*\/?>(?:\s*|\n)){2,}/gi;
const UTILITY_RE = /(404|403|500|error|not found|login|signin|register|password|search\s+results|\bquery\b)/i;
