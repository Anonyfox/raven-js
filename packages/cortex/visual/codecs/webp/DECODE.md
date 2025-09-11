# WEBP Decode Plan (Zero-deps, Pure JS, Lean and Correct)

This document specifies a complete, implementation-ready plan for a zero-dependency WebP decoder in RavenJS, matching the existing codec architecture (pure functions returning `{ pixels, width, height, metadata }`). It covers all variants (VP8 lossy, VP8L lossless, VP8X extended features), alpha, ICC/EXIF/XMP, and animation, with algorithms, edge cases, pitfalls, and synthetic integration testing strategies. No code here—only precise guidance to implement fast, lean, and correct.

---

## 1. Container Overview (RIFF WEBP)

- RIFF header: `"RIFF" <uint32 size> "WEBP"`.
- Primary chunks:
  - `VP8 `: Lossy bitstream (VP8 keyframe).
  - `VP8L`: Lossless bitstream (WebP-L).
  - `VP8X`: Extended header enabling features (animation, alpha, ICC, EXIF, XMP, tiles).
- Ancillary chunks (order constraints apply): `ALPH` (alpha for lossy), `ANIM` (global animation header), `ANMF` (frame chunks), `ICCP`, `EXIF`, `XMP `, `META`.
- Alignment: Each chunk data size is padded to even bytes; always skip a trailing pad byte if `size` is odd.
- Endianness: All multi-byte integer fields (RIFF size, chunk sizes) are little-endian.
- Size validation: Container size covers everything after `WEBP` tag; each chunk’s declared size must fit the container; reject overflows.

Implementation notes:

- Parse once into a flat array of `{ type, data }` with precise slices (do not copy unless needed); store offsets; verify sizes strictly.
- Enforce chunk ordering rules for extended files:
  - If `VP8X` is present, it MUST be the first chunk after `WEBP`.
  - For still images with features: recommended order is `VP8X`, then `ICCP?`, `EXIF?`, `XMP ?`, then `ALPH?`, then primary image chunk (`VP8 ` or `VP8L`).
  - For animation: `VP8X`, `ANIM`, then ≥1 `ANMF` frames; each `ANMF` encapsulates its own sub-bitstream (and optional `ALPH`).
- Single-occurrence constraints: allow at most one of each metadata chunk (`ICCP`, `EXIF`, `XMP `) and at most one `ALPH`. Duplicates → reject.
- Expose a summary structure: `{ hasVP8X, features, chunksByType, orderValid, errors[] }`.

Pitfalls:

- Accept files without `VP8X` (common) where a single `VP8 ` or `VP8L` chunk exists.
- Enforce single primary stream: exactly one of `VP8 `, `VP8L`, or `VP8X` (with sub-structure). Multiple primaries are invalid except animation frames (under `VP8X`).

Unknown chunks policy:

- Unknown chunk types: record as `{ type, data }` under `metadata.unknownChunks` and skip; do not fail unless size/ordering contradicts spec.

---

## 2. VP8 (Lossy) Bitstream (Keyframe-only for images)

### 2.1 High-level flow

1. Parse VP8 frame header: keyframe bit, version, show_frame, `first_partition_length_in_bytes`.
2. Parse start code `0x9d 0x01 0x2a`, then 14-bit width, 14-bit height with horizontal/vertical sample ratio flags.
3. Initialize boolean arithmetic decoder (range coder) over partition 0 (header + probability tables, segment, loop filter, quantization, mode probs).
4. Parse segmentation, loop filter (sharpness/level), quantization indices and deltas, refresh flags.
5. Token partitions: use partition sizes to feed token bool decoder(s) (>=1 partitions). Validate partition boundaries strictly.
6. Reconstruct macroblocks (16x16 Y, two 8x8 UV planes):
   - Intra prediction only (webp images are keyframe intra). Modes: Y (4x4 or 16x16), UV (8x8). Maintain per-block mode context.
   - Coeff token decode using tree probs; dequant; inverse transforms.
   - Apply in-loop deblocking filter per edge (strength from loop filter params and macroblock quant). Handle `simple` filter mode.
7. Convert YUV420 to RGB (BT.601 limited range). Output RGBA with A=255.

### 2.2 Core algorithms

- Boolean decoder: classic VP8 bool coder (range 128..255, split calc, bit probs). Ensure constant-time per bit.
- Coeff token tree: decode EOB, zero runs, magnitude categories using per-band, per-context probs; update probs adaptively if header signals refresh.
- Dequantization: quant base + deltas by segment; DC/AC different scales; clamp to 16-bit.
- Inverse transforms:
  - 4x4 IDCT-like integer transform (Walsh-Hadamard for DC where signaled), per spec. Optimize by in-place and short-circuit all-zero blocks.
  - 16x16 prediction path must aggregate DC from 4x4 subblocks where applicable.
- Intra predictors:
  - Y 4x4: 10 modes; Y 16x16: 4 modes; UV 8x8: 4 modes. Implement clamped edge sampling, handle missing top/left at borders.
- Loop filter:
  - Compute edge filters per macroblock edge and per 4x4 edge. Respect `filter_type` (simple/normal), sharpness, deltas, and `hev` detection. SIMD is out; do scalar but cache neighbors.
- YUV to RGB:
  - Use integer path: R = clamp((298*C + 409*E + 128)>>8), etc. Handle subsampling averaging for 2x2 mapping of UV to Y.

Edge cases:

- First partition size 0 or overlaps tokens → invalid.
- Width/height zero or >16383 → reject.
- Corrupted token partition boundary → fail fast with precise message.
- All-zero residuals with non-DC prediction.
- Frames smaller than a macroblock: pad predictors at edges.

Pitfalls:

- Off-by-one at macroblock edges in filter and predictors.
- Forgetting to clear above/left contexts per MB for 4x4 mode decisions.
- Using floating YUV→RGB causing tiny drift vs integer path; stick to integer to match ecosystem.
- Not skipping transform for EOB early → huge perf hit.

---

## 3. Alpha with Lossy (ALPH and VP8X)

Rules:

- `ALPH` is an Extended WebP feature and is only valid when `VP8X` is present with the Alpha flag set.
- For still images (non-animated), the alpha plane is carried by `ALPH`, followed by `VP8 ` color data.
- For animated WebP, per-frame alpha is handled within each `ANMF` frame; decoding animation is deferred but parsing must validate consistency.

Algorithm:

1. If `VP8X` reports alpha, locate `ALPH`. Parse header: method (0..3), filter, pre-processing.
2. Methods: 0=none (raw), 1=compressed (LZ77), 2=Q-only (quantized), 3=reserved.
3. Reconstruct alpha plane at full image size. If filtered, apply upsample filters per spec.
4. Composite alpha into output RGBA: A = alpha[x,y].

Edge cases & pitfalls:

- Alpha chunk may be absent despite flag (reject).
- Alpha plane rows can be padded; validate sizes.
- Colorspace conversion first, then apply A; do not premultiply.

---

## 4. VP8L (Lossless) Bitstream

### 4.1 High-level flow

1. Header: 14-bit width/height-1, version, color cache bits.
2. Meta-transforms chain per image/tiles: subtract-green, color transform (multipliers), color indexing, predictors.
3. LZ77-like backward references with Huffman-coded literals/lengths/distances; multiple Huffman trees per meta-block.
4. Pixels are ARGB in VP8L; final output must be converted to RGBA (reorder channels) without premultiplication.

### 4.2 Core algorithms

- Huffman decode: multiple trees (literal/length, distance), possibly meta-Huffman for code lengths. Implement canonical Huffman builder; validate code length sums.
- LZ77 decode: maintain sliding window on output; handle overlapping copies and large distances; clamp to buffer.
- Predictors: gradient (Paeth-like), horizontal, vertical, TrueColor transforms; follow predictor per pixel with proper neighbor availability at borders.
- Transforms:
  - Subtract-green: G added back to R/B on output.
  - Color transform: 3×3-ish integer with small multipliers; apply per channel in order.
  - Color indexing: palette expansion.
- Tiling: meta-blocks may be tiles; decode per tile with its own trees.

Edge cases:

- Malformed Huffman (over-subscribed/under-subscribed) → reject.
- Backref beyond produced pixels → reject.
- Palette size 0 or >256 → reject.
- Extremely small images (1×N, N×1) require careful neighbor handling in predictors.

Pitfalls:

- Predictor state across tiles must reset correctly.
- ARGB ordering: don’t accidentally premultiply or swap channels; maintain full 8-bit precision.
- Color cache optional; ensure misses are handled and cache size derived from header bits.

---

## 5. VP8X (Extended Header) and Features

- VP8X header: 1-byte feature flags + 24-bit canvas size minus-one (width-1,height-1).
- Feature flags: ICC, Alpha, EXIF, XMP, Animation, Tiles.
- If VP8X present:
  - Width/height come from VP8X, not VP8/VP8L stream header.
  - If animation is set: expect `ANIM` and ≥1 `ANMF` frames; each frame contains a sub-bitstream (VP8/VP8L) and frame rectangle + duration + blend/dispose flags.

Edge cases & pitfalls:

- Mismatch between VP8X canvas size and sub-frame sizes → reject.
- Missing mandatory chunks given flags (e.g., alpha set but no `ALPH`) → reject.
- Tiles rarely used in still images; treat as unsupported initially, but parse flag and error clearly.

---

## 6. Metadata: ICC, EXIF, XMP, VP8(L) specific

- `ICCP`: ICC profile; store raw bytes in `metadata.icc`.
- `EXIF`: Standard TIFF-wrapped EXIF; store raw bytes; do not parse deeply at first.
- `XMP `: RDF packet; store raw bytes or UTF-8 string.
- For lossless, record transform chain summary in `metadata.lossless`.

Pitfalls:

- Chunk sizes can be large; avoid copying (store views).
- Respect even-byte padding after each chunk.

---

## 7. Output Contract and Validation

- Return `{ pixels: Uint8Array, width, height, metadata }` with RGBA (non-premultiplied).
- Validate inputs thoroughly; fail fast with descriptive errors including offsets and chunk types.
- All integer math, no floats, to ensure determinism and cross-platform parity.

---

## 8. Performance and Memory

- Streamed partition decoding for VP8 tokens to avoid large temporary buffers.
- Early EOB short-circuit on all-zero blocks; reuse small scratch buffers for IDCT and filters.
- Use line buffers for predictors and loop filtering; avoid full-frame intermediate copies.
- Avoid object churn in inner loops; tight loops over typed arrays.

---

## 9. Testing Strategy (Doctrinal, Synthetic, Deterministic)

Design tests to be tiny, fast (<1s each), complete (100% branches), and intention-verifying.

### 9.1 Container and Parsing

- Minimal RIFF without VP8X: single `VP8 ` tiny image with known 2×2 output.
- VP8X present with canvas size and no extra features; ensure we read sizes from VP8X.
- Odd-sized chunk padding behavior with sentinel bytes.
- Invalid: overlapping chunk sizes, multiple primary streams, missing mandatory chunks when flags set.

### 9.2 VP8 Lossy Core

- 2×2 and 4×4 images with known patterns:
  - Solid color blocks using only DC coefficients → confirm predictors and dequant paths.
  - Checkerboard pushing loop filter edges; verify filter strength transitions.
  - Images exercising each intra mode at least once; assert mode path coverage.
  - Token partitions: 1 vs multiple partitions; boundary validation.
- Golden RGBA byte-for-byte comparisons using pre-encoded micro images.

### 9.3 Alpha

- `ALPH` method 0 (raw) uniform 128 alpha; confirm A channel only.
- `ALPH` method 1 (compressed) tiny random alpha; confirm decompressor and size checks.
- VP8X alpha flag without ALPH → expect specific error.

### 9.4 VP8L Lossless

- Subtract-green only case: synthetic where R/B depend on G.
- Palette index small images (≤16 colors) to exercise color indexing.
- LZ77 backref overlapping copy; verify exact reproduction.
- Broken Huffman: over-subscribed tree → fail with message.

### 9.5 VP8X Features

- Canvas size mismatch vs sub-frame → error.
- ICC/EXIF/XMP presence; ensure bytes are surfaced.
- Animation (deferred decode): parse `ANIM`/`ANMF` and reject with “animation not supported yet” but confirm we correctly compute frame rectangles and durations in parse-layer tests.

### 9.6 Property and Fuzz Tests (targeted)

- Random small images (≤8×8) round-tripped against a reference encoder/decoder outside the codebase in a fixture step to generate vectors (stored as static files, not shell calls during tests).
- Bit-flip corruption near partition boundaries must error, not crash.

Verification style:

- Keep assets tiny and checked-in; avoid heavy binaries.
- Single test file groups: core, edge/errors, integration. Use deterministic fixtures.

---

## 10. Implementation Order (Milestones)

1. Container parse + metadata only → `decodeWEBP` parses, returns metadata, and throws on missing primary stream.
2. VP8 lossy minimal (no alpha, no VP8X) → output opaque RGBA.
3. Alpha support via `ALPH` and VP8X alpha flag.
4. VP8L lossless.
5. VP8X metadata/features, reject animation with clear error; optionally implement full animation later.

Each milestone ships with tests hitting 100% branches of the new modules.

---

## 11. Known Real-world Pitfalls to Avoid

- Misinterpreting VP8 width/height bits vs VP8X canvas dimensions.
- Incorrect bool decoder split rounding causing rare artifacts; implement per spec with exact integer math.
- Premultiplying alpha accidentally; keep straight RGBA.
- Loop filter mis-application on right/bottom edges; clamp neighbors and honor mb_edge rules.
- Assuming presence/order of ancillary chunks; the wild exists.
- Treating color conversion with floats; use integer matrices to match other decoders.

---

## 12. Module Layout (to create incrementally)

- `codecs/webp/`
  - `index.js` (exports decodeWEBP; later encode)
  - `parse-riff.js` (container, chunk table)
  - `decode.js` (top-level orchestrator)
  - `vp8/`
    - `bool-decoder.js`
    - `headers.js` (segmentation, loopfilter, quant, modes)
    - `tokens.js` (coeff trees, partitions)
    - `predict.js` (intra modes)
    - `idct.js` (4×4, DC)
    - `loop-filter.js`
    - `yuv2rgb.js`
  - `alpha/`
    - `decode-alpha.js`
  - `vp8l/`
    - `headers.js`
    - `huffman.js`
    - `lz77.js`
    - `predict.js`
    - `transforms.js`
  - `features/`
    - `vp8x.js` (flags, canvas size)
    - `metadata.js` (ICCP/EXIF/XMP)
  - `DECODE.md` (this document)

All functions pure, typed via JSDoc, no shared mutable globals; reuse typed array scratch buffers by explicit passing.
