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

---

## 13. Incremental Implementation Pipeline (Milestones with Exact Specs)

Each milestone is shippable alone, with 100% branch coverage in its own tests. Keep functions pure, pass typed-array views, avoid allocations in hot paths, and fail fast with precise messages.

### M0 — Skeleton Orchestrator and RIFF Container Parser

- Purpose:
  - Establish `decodeWEBP(bytes)` orchestrator stub and `parseRIFFWebP(bytes)` container parser.
- Contracts:
  - `parseRIFFWebP(bytes: Uint8Array) -> { riffSize: number, chunks: { type: string, data: Uint8Array, offset: number, size: number }[], chunksByType: Map<string, { type, data, offset, size }[]>, hasVP8X: boolean, features?: { icc: boolean, alpha: boolean, exif: boolean, xmp: boolean, anim: boolean, tiles: boolean }, orderValid: boolean, errors: string[] }`.
  - Orchestrator returns `{ metadata, width?, height? }` for now and throws if no primary stream is found.
- Algorithm:
  1. Validate `"RIFF"` (bytes 0..3), LE size at 4..7, `"WEBP"` at 8..11.
  2. Iterate chunks at offset 12: read 4-char type, LE size, take `size` bytes as `data`, record `offset` (start of data), `size`, then advance by `size + (size & 1)` (pad if odd).
  3. Validate cumulative size never exceeds container, and final offset equals or is within the RIFF size boundary.
  4. Populate `chunksByType` and `hasVP8X` (presence of `VP8X`).
  5. Validate ordering constraints if `hasVP8X` (VP8X must be first after header; other chunks allowed as per spec). Collect violations in `errors`.
- Tests:
  - Core: minimal file with one `VP8 ` chunk; one with `VP8L` chunk.
  - Edges: odd-sized chunk padding byte; overlapping/overflowing size → error; multiple primary chunks present → error list contains specific items; unknown chunk types preserved in `chunks`.
  - Integration: `VP8X` followed by metadata chunks (ICCP/EXIF/XMP) then primary.
- Pitfalls:
  - Off-by-one when applying padding; size overflows; treating ASCII types as UTF-8 (keep raw bytes and construct string from 4 bytes only).
  - Accept files without `VP8X`.
- Done criteria:
  - Strict size/order validation, exact offsets in errors, zero allocations beyond views and arrays of descriptors.

### M1 — VP8X Header and Metadata Extraction (Parse-only)

- Purpose:
  - Parse `VP8X` flags and canvas size; surface ICC/EXIF/XMP in metadata; do not decode yet.
- Contracts:
  - `parseVP8X(view: Uint8Array) -> { width: number, height: number, flags: { icc, alpha, exif, xmp, anim, tiles } }`.
  - `extractMetadata(chunks: {type,data}[]) -> { icc?: Uint8Array, exif?: Uint8Array, xmp?: Uint8Array, unknownChunks: { type: string, data: Uint8Array }[] }`.
- Algorithm:
  1. VP8X: byte0 = flags; bytes1..3 = reserved; bytes4..6 = width-1 (24-bit LE); bytes7..9 = height-1 (24-bit LE). Compute width/height by +1; validate >0.
  2. Flags: bit positions per spec; expose booleans.
  3. Metadata: find at most one `ICCP`, `EXIF`, `XMP `; duplicates → error at orchestrator-level; collect unknown chunks.
- Tests:
  - Core: min (1×1) and max (16384×16384) canvas sizes.
  - Edges: invalid size 0; duplicate ICC/EXIF/XMP flagged; set Alpha flag but no `ALPH` present (deferred validation but detectable once orchestrated).
- Pitfalls:
  - VP8X size governs canvas; sub-stream sizes are separate and must match later.
- Done criteria:
  - Correct width/height math, flags mapping, metadata surfaced as views, no copies.

### M2 — YUV and Transform Primitives (Codec-agnostic)

- Purpose:
  - Provide deterministic integer color conversion and IDCT/WHT for VP8.
- Contracts:
  - `yuv420ToRgba(y: Uint8Array, u: Uint8Array, v: Uint8Array, width: number, height: number) -> Uint8Array`.
  - `inverse4x4(block: Int16Array) -> void` (in-place 4×4 IDCT-like integer transform).
  - `inverseWHT4(dc: Int16Array) -> void` (Walsh-Hadamard on 4 DC terms).
- Algorithm:
  - YUV→RGB: use integer BT.601 limited range; compute per 2×2 block mapping shared UV; clamp to [0,255].
  - IDCT: implement spec integer path with early-out if all AC zero; keep intermediate in 16-bit or 32-bit accumulators; write back clamped.
  - WHT: fast butterfly on 4 DC terms, integer arithmetic only.
- Tests:
  - Core: known YUV triplets to RGB; all-zero AC path; DC-only block; saturation extremes.
  - Edges: odd width/height pad handling at right/bottom; ensure no float usage.
- Pitfalls:
  - Premature rounding; using floats; overflow without clamp.
- Done criteria:
  - Byte-for-byte parity with reference vectors; no allocations in inner loops.

### M3 — VP8 Intra Predictors and Loop Filter (Isolated)

- Purpose:
  - Implement predictors and deblocking independent of bitstream.
- Contracts:
  - `predictIntra4x4(top: Uint8Array|undefined, left: Uint8Array|undefined, mode: number) -> Uint8Array(16)`.
  - `predictIntra16x16(top, left, mode) -> Uint8Array(256)`.
  - `predictUV8x8(top, left, mode) -> Uint8Array(64)`.
  - `filterEdges(y: Uint8Array, u: Uint8Array, v: Uint8Array, width: number, height: number, params: { filterType: 'simple'|'normal', sharpness: number, level: number, deltas: {...} }) -> void`.
- Algorithm:
  - Predictors: implement each mode per spec, handling missing top/left by padding with 129 or edge replication as defined.
  - Loop filter: compute per-edge strength from params and macroblock quant; apply per 4/8-pixel edges; handle `hev` detection; clamp neighbors.
- Tests:
  - Core: each mode with crafted borders; equality against known predictor outputs.
  - Edges: top row/left column absence; right/bottom macroblock boundaries; `simple` vs `normal` filter.
- Pitfalls:
  - Not resetting contexts between blocks; off-by-one at MB boundaries; incorrect `hev` thresholds.
- Done criteria:
  - Deterministic outputs, complete mode coverage, edge correctness.

### M4 — VP8 Bool Decoder and Headers

- Purpose:
  - Implement the boolean arithmetic decoder and parse VP8 frame headers and control data.
- Contracts:
  - `createBoolDecoder(view: Uint8Array, start: number, end: number) -> { readBit(prob: number): 0|1, readLiteral(n: number): number, tell(): number }`.
  - `parseVP8FrameHeader(view: Uint8Array) -> { keyframe: boolean, version: number, show: boolean, firstPartitionSize: number, width: number, height: number }`.
  - Additional header parsers: segmentation, loop filter, quantization, mode probabilities.
- Algorithm:
  - Bool decoder: maintain `range` (128..255) and `value` window; compute `split = 1 + (((range - 1) * prob) >> 8)`; branch, renormalize by left-shifting until range ≥ 128, pulling bytes as needed; constant-time per bit.
  - Frame header: read start code 0x9d 0x01 0x2a; 14-bit width/height with ratio flags; validate partition size and boundaries.
- Tests:
  - Core: synthetic ranges for bool decoder literals/bits; start code and size parsing for tiny frames.
  - Edges: zero `firstPartitionSize`; partition end before header complete; width/height 0 or >16383.
- Pitfalls:
  - Incorrect `split` rounding; not renormalizing; reading past buffer.
- Done criteria:
  - Pass vectors; strict boundary enforcement; precise error messages with offsets.

### M5 — VP8 Coefficient Tokens

- Purpose:
  - Decode DCT coefficient tokens across bands/contexts and partitions.
- Contracts:
  - `decodeCoefficients(dec: BoolDecoder, quant: { y, y2, uv }, modeCtx: object, partitions: Array<{start,end}>) -> Int16Array` (blocks for a macroblock).
- Algorithm:
  - Use per-band trees; decode EOB, zero runs, magnitude categories; apply dequant; maintain and update mode contexts; respect partition boundaries.
- Tests:
  - Core: EOB-only; DC-only; mixed AC with context changes; multi-partitions with exact cutoff.
  - Edges: corrupted token near partition end; under/overflows in dequant clamps.
- Pitfalls:
  - Forgetting early EOB; not updating context; crossing partition boundary.
- Done criteria:
  - Deterministic block reconstruction; strict partition safety.

### M6 — VP8 Lossy Still Decode (Opaque)

- Purpose:
  - End-to-end decode of `VP8 ` still images without alpha.
- Contracts:
  - `decodeVP8(view: Uint8Array) -> { y: Uint8Array, u: Uint8Array, v: Uint8Array, width: number, height: number }`.
  - Orchestrator composes RGBA via `yuv420ToRgba` and returns `{ pixels, width, height, metadata }`.
- Algorithm:
  - Parse headers; setup segmentation/loop filter/quant; iterate macroblocks: predict, decode coeffs, inverse transforms, reconstruct planes; apply loop filter per edges; final YUV420 to RGBA.
- Tests:
  - Core: 2×2 and 4×4 images with DC-only; images using each intra mode at least once; golden RGBA.
  - Edges: tiny images (1×N, N×1); filter edges; partition counts 1 vs many.
- Pitfalls:
  - Predictor context reset; border padding; integer overflow in transforms; performance regressions from not short-circuiting zeros.
- Done criteria:
  - Byte-exact RGBA, fast (<1s) tests, 100% branches in decode path modules.

### M7 — Alpha (ALPH) for VP8X Stills

- Purpose:
  - Decode `ALPH` and composite into RGBA; no premultiply.
- Contracts:
  - `decodeAlpha(alph: Uint8Array, width: number, height: number) -> Uint8Array` (alpha plane).
  - Orchestrator: if VP8X Alpha flag true, require `ALPH` and apply.
- Algorithm:
  - Parse header: method (0 none/raw, 1 compressed, 2 quant-only, 3 reserved), filter, pre-processing.
  - Implement method 0 and 2 first: raw plane with optional filtering; quant table expansion.
  - Validate plane size, handle row padding.
- Tests:
  - Core: uniform 128 alpha (method 0); quantized small set (method 2) vs expected plane.
  - Edges: Alpha flag without ALPH → error; wrong plane size; reserved method → error.
- Pitfalls:
  - Premultiplying; ignoring padding; wrong method gates.
- Done criteria:
  - Correct A channel composition; precise validations.

### M8 — VP8L Lossless Primitives

- Purpose:
  - Implement Huffman/LZ77/predictors/transforms for VP8L.
- Contracts:
  - `buildHuffman(codeLengths: Uint8Array) -> { table: Uint16Array, ... }` and `decodeSymbol(reader)`.
  - `lz77Copy(dst: Uint32Array, from: number, len: number) -> void` (ARGB packed or separate channels strategy, define and stick to one).
  - `predictPixel(x,y,mode,neighbors) -> [r,g,b,a]`.
  - `applyTransforms(chain, pixels)` for subtract-green, color transform, palette.
- Algorithm:
  - Canonical Huffman construction with overflow/undersubscription checks; bit reader supporting meta trees.
  - LZ77 with overlap-safe copy; sliding window limited to output length.
  - Predictors per spec; transforms order matters.
- Tests:
  - Core: over/under-subscribed tree detection; overlapping copies; palette bounds; subtract-green round-trip.
  - Edges: 1×N/N×1 predictors; color cache optional behavior.
- Pitfalls:
  - Silent tree errors; ARGB vs RGBA ordering; state leakage across tiles.
- Done criteria:
  - Deterministic primitives with exhaustive edge coverage.

### M9 — VP8L Image Decode + ALPH Method 1

- Purpose:
  - Full VP8L still decode and use its decompressor for ALPH method 1.
- Contracts:
  - `decodeVP8L(view: Uint8Array) -> { pixels: Uint8Array /* RGBA */, width: number, height: number }`.
  - Extend `decodeAlpha` to method 1 (compressed) using VP8L primitives.
- Algorithm:
  - Parse VP8L header (14-bit w/h-1, version, color cache bits); decode meta-blocks with trees/backrefs; apply transforms; reorder ARGB→RGBA.
- Tests:
  - Core: subtract-green-only image; small palette image; LZ77 overlap; golden RGBA.
  - Edges: broken Huffman → specific error; backref beyond produced pixels.
- Pitfalls:
  - Predictor resets between tiles; wrong channel order; accidental premultiply.
- Done criteria:
  - Byte-exact RGBA; compressed ALPH verified on tiny planes.

### M10 — VP8X Feature Validation and Final Orchestration

- Purpose:
  - Tie all parts together; validate flags/order; reject animation with clear diagnostics.
- Contracts:
  - `decodeWEBP(bytes: Uint8Array) -> { pixels: Uint8Array, width: number, height: number, metadata: { icc?, exif?, xmp?, unknownChunks: [...] } }`.
- Algorithm:
  1. Parse RIFF; if VP8X present, parse flags and canvas; enforce VP8X-first rule.
  2. Extract metadata; ensure single-occurrence constraints.
  3. Resolve primary: `VP8 ` or `VP8L` (not both). If animation flags set, parse `ANIM`/`ANMF` frames structurally but throw `Animation not supported` with details.
  4. If Alpha flag: require `ALPH` and decode plane; composite with color pixels (no premultiply).
  5. Validate canvas vs substream sizes (match for stills).
- Tests:
  - Core: end-to-end still lossy and lossless with/without alpha.
  - Edges: canvas/substream mismatch; missing mandatory chunk per flag; duplicate metadata chunks; animation present → rejection with frame counts.
  - Integration: unknown chunks preserved; odd padding preserved and skipped.
- Pitfalls:
  - Reading sizes from wrong header; failing to enforce single primary; metadata duplication allowed silently.
- Done criteria:
  - Clean API surface; all branches tested; deterministic outputs; isomorphic behavior in Node and browser.

---

## 14. Test Authoring Guidance

- Keep assets ≤ 8×8, checked-in as Uint8Array literals or tiny binary fixtures.
- Group tests into: core, edges/errors, integration; enforce runtime limits (<1s per test, <10s suite).
- Assert with byte-precise buffers (RGBA) and exact error messages with offsets and chunk names.
- Exclude `*.test.js` from coverage; target 100% branch coverage for all implementation files.

---

## 15. Error Message Conventions

- Prefix with subsystem: `RIFF:`, `VP8X:`, `VP8:`, `VP8L:`, `ALPH:`.
- Include offset and context: e.g., `VP8: token partition overflow at 0x1A3C (partition 2)`.
- Use consistent verbs: `missing`, `invalid`, `overflow`, `mismatch`, `unsupported`.

---

## 16. Performance Discipline

- Use integer math only; avoid object churn inside loops.
- Early-out on all-zero blocks; reuse scratch buffers passed as parameters.
- Validate once, compute many: container parsing upfront, strict boundaries to avoid re-checks.
