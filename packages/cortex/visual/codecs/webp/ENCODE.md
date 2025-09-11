# WEBP Encode Plan (Zero-deps, Pure JS, Lean, Deterministic)

This document specifies a complete, implementation-ready plan for a zero-dependency WebP encoder in RavenJS. It mirrors the decoder’s module layout and contracts, targeting `{ pixels: Uint8Array RGBA, width, height }` → a valid WEBP RIFF container with one of: `VP8 ` (lossy), `VP8L` (lossless), or `VP8X` + auxiliaries (alpha, ICC/EXIF/XMP, animation). No code—maximum-depth algorithmic guidance, pitfalls, and testing.

---

## 1. Container Writer (RIFF/WEBP)

- RIFF structure: `"RIFF" <size> "WEBP"` followed by chunks.
- Chunk writer:
  - Emit `<FOURCC> <uint32 size> <data>`.
  - If `size` is odd, write one pad byte (0) after data; it is not counted in `size`.
- Size calculation:
  - RIFF size = total bytes after `"RIFF" <size>` field (i.e., `4 /*WEBP*/ + sum(chunks incl. pad)`).
- Endianness: All multi-byte sizes/fields are little-endian.
- Order recommendations:
  - Still lossy without VP8X: `[VP8 ]` only.
  - Still lossless without VP8X: `[VP8L]` only.
  - With VP8X: `[VP8X, ICCP?, EXIF?, XMP ?, ANIM?, ANMF* or VP8/VP8L, ALPH?]` maintaining WEBP constraints.

Pitfalls:

- Mis-sized chunk lengths or forgetting even-byte padding corrupts stream.
- When VP8X is present, width/height must be in VP8X and may differ from sub-bitstream’s internal fields; ensure consistency when allowed or reject.
- Do not emit `ALPH` unless VP8X has Alpha flag set.
- Avoid duplicate metadata chunks; emit at most one of `ICCP`, `EXIF`, `XMP `.

---

## 2. VP8 (Lossy) Encoder

Goal: High-quality baseline intra-only VP8 frame with in-loop deblocking and robust rate control, matching practical encoders while staying lean.

### 2.1 Pipeline Overview

1. Color transform: RGBA → YUV420 (BT.601 limited), with chroma downsampling (2×2 box or optimized filtered downsample).
2. Tiling (optional): split image into tiles for parallel encode; keep off initially to reduce complexity.
3. Intra mode decision:
   - For each macroblock (16×16), choose 16×16 mode vs 4×4 modes per 4×4 sub-blocks; UV uses 8×8 modes.
   - Use RD-cost (rate + lambda\*distortion) with fast heuristics: SAD/SSE predictors pre-check; fall back to RD for ambiguous blocks.
4. Transform and quant:
   - Forward 4×4 integer transform (DCT-like) for Y (AC/DC as applicable). UV 4×4 transforms.
   - Quantization using segment-specific quant indices; apply delta for DC/AC, clamp.
5. Tokenization:
   - Coefficient token trees per band/context; gather stats and tokens.
6. Probability adaptation:
   - Estimate coefficient probs from stats with smoothing; optionally per-frame adaptation only (no per-MB adaptation to stay lean).
7. Loop filter strength:
   - Choose global level and sharpness based on Q and activity; per-segment delta optional.
8. Rate control:
   - Target size (bytes) or quality (near-constant Q). Simple single-pass: iterate lambda/Q with coarse adjustment to hit size, or accept Q input.
9. Partitioning:
   - Partition 0: headers, prob tables; other partitions: token streams. Create N partitions (1..8); 1 is simplest.
10. Bitstream pack:

- Frame tag (3 bits: keyframe=0, version=0..3, show_frame=1) and 19-bit first-partition length (little-endian in 3 bytes just after tag).
- Write start code `0x9d 0x01 0x2a` and 14-bit width/height with sample ratio flags.
- Partition sizes for tokens (if multiple partitions) each as little-endian 3-byte sizes.
- Tokens via boolean arithmetic encoder; finalize frame.

### 2.2 Core Algorithms

- Color conversion and downsample:
  - Use integer matrix; for chroma downsample, box-average 2×2 YUV or filter per spec-like practice; avoid ringing.
- Intra prediction:
  - Implement all Y 4×4 (10 modes), Y 16×16 (4 modes), UV 8×8 (4 modes). Build reference samples with clamped borders.
- Forward transform:
  - 4×4 integer transform matching inverse pair exactly; short-circuit for flat blocks (all-zero AC).
- Quantization:
  - From base Q index derive DC/AC scales with deltas; dead-zone quant; store sign/magnitude tokens.
- RD cost:
  - Distortion: SSE in YUV; Rate: token bit-cost via precomputed probs; Lambda from Q (tuned table).
- Boolean arithmetic encoder:
  - Mirror decoder: range init, split calc, renormalization; deterministic.
- Loop filter:
  - Same as decode; store params in headers.

Edge cases:

- Images smaller than MB: pad with edge replication in predictors and transforms.
- Solid-color regions: force skip of AC tokens to near-zero bits.

Pitfalls:

- Float YUV → introduce drift; integer only.
- Token partitions must not overrun sizes; measure length precisely.
- Over-aggressive deblocking at low Q blurs details; clamp with sharpness.

Tuning knobs (safe defaults):

- Q index 20–40 typical for still images; sharpness: 0–3; loop filter level derived from Q.
- 1 token partition initially; add more when parallelizing.

---

## 3. Alpha for Lossy (ALPH and VP8X)

Rules for still images:

- Only emit `ALPH` when a `VP8X` chunk is present with the Alpha flag set.
- Place `ALPH` before the primary `VP8 ` chunk.

Alpha encoding:

1. Extract A plane from RGBA.
2. Method selection:
   - 0 Raw: store bytes directly; fastest, larger size.
   - 1 LZ-compressed: simple LZ77/deflate-like; implement a minimal, fast LZ with hash chains limited by small windows.
   - 2 Quantized: uniform quantization to fewer levels; store quant params and indices.
3. Optional filtering for alpha upsampling paths (store method/filter markers in `ALPH` header accordingly).

Pitfalls:

- Don’t premultiply color; keep alpha separate.
- If alpha is binary or near-binary, quantization to two levels yields large wins—detect automatically.

---

## 4. VP8L (Lossless) Encoder

Goal: Efficient, spec-correct VP8L with solid compression but lean algorithms; avoid exotic heuristics.

### 4.1 Pipeline Overview

1. Pre-transform analysis:
   - Detect palette <= 256 colors; if so, index-colormap mode.
   - Measure green correlation; enable subtract-green if beneficial.
   - Evaluate color transform multipliers with small search in local neighborhoods.
2. Meta-block tiling: split image into meta-blocks (e.g., 128×128) for local Huffman trees and better compression.
3. Predictors:
   - Choose among gradient, horizontal, vertical per tile or adaptively per row using SSE-based selection.
4. LZ77 parsing:
   - Greedy with lazy match (1-step lookahead), cap window size for speed. Favor shorter codes when bit-cost equal.
5. Huffman coding:
   - Build canonical trees per tile for literals/lengths and distances. Use histogram + package-merge or optimal length limits.
6. Pack streams:
   - Emit header, transforms, code trees, and compressed data blocks.

### 4.2 Core Algorithms

- Palette encoding:
  - Build palette, encode indices; fallback if palette too large or hurts size.
- Subtract-green:
  - Apply G to R/B diffs; inverse during decode; record in transform chain.
- Color transform:
  - Small integer multipliers for channel mixing (search e.g., in [-8..8]).
- Predictors:
  - Implement spec predictors; at borders use clamped/zero neighbors.
- LZ77:
  - Fast hash table on rolling 3–5 byte keys; max match length limited; allow overlapping copies.
- Huffman:
  - Build trees with max code length constraints; store code length alphabet then codes.

Edge cases:

- Very small images: prefer raw literals.
- Images with high noise: disable transforms; literal-only.

Pitfalls:

- Over-subscribed or empty Huffman trees; validate and repair (e.g., single-symbol tree case).
- Incorrect distance for overlapping back-refs; emulate decode exactly.

---

## 5. VP8X and Extended Features

- VP8X header must reflect features used: ICC, EXIF, XMP, Alpha, Animation, Tiles.
- Canvas size is width-1/height-1, little endian 24-bit.
- For still images with alpha/metadata: emit VP8X, then ICCP/EXIF/XMP, then `ALPH` (if used), then primary image chunk `VP8 `/`VP8L`.
- Animation (optional later):
  - `ANIM` global: background color, loop count.
  - `ANMF` frames: sub-bitstream + frame rect, duration, blend/dispose flags.

Pitfalls:

- Keep chunk order canonical to maximize compatibility.
- If VP8X present, ensure sub-bitstream sizes don’t exceed canvas; align frame rectangles.

---

## 6. API Contract and Options

Function shapes (eventual):

- `encodeWEBP(pixels, width, height, options)` returns `Uint8Array` RIFF WEBP.

Options (subset):

- `mode`: `"lossy" | "lossless" | "auto"`.
- `quality`: 0..100 (maps to Q index or VP8L effort heuristics).
- `targetSizeBytes`: optional; enable rate control for VP8.
- `alpha`: `{ method: 0|1|2, quantLevels?: number }`.
- `metadata`: `{ icc?: Uint8Array, exif?: Uint8Array, xmp?: Uint8Array }`.
- `effort`: 0..9 (search depth, partitions, tiling), default lean (3–4).

Output invariants:

- Deterministic for equal inputs/options.
- Integer math for color.

---

## 7. Performance and Memory Strategy

- Pre-allocate token buffers per tile; reuse across rows.
- Early skip flat blocks (variance below threshold) with 16×16 mode and zero AC.
- Use 1 token partition at first; add N partitions when parallelizing.
- Use small, cache-friendly data structures; avoid object allocations in hot loops.

---

## 8. Testing Strategy (Doctrinal, Lean, High-Signal)

### 8.1 Golden Round-trips

- Encode tiny known RGBA patterns (2×2, 4×4) → decode with our decoder → compare RGBA.
- Verify integer YUV path equivalence (no float drift).

### 8.2 Size/Quality Controls

- For fixed `targetSizeBytes`, confirm output within ±2% using binary search on Q; assert convergence in ≤6 iters.
- For fixed `quality`, ensure monotonic size decrease as quality drops on canonical images.

### 8.3 Alpha Cases

- Binary masks, soft gradients, sparse transparency → confirm chosen alpha method and correct channel reproduction.

### 8.4 Lossless Specific

- Palette vs non-palette images; ensure palette chosen only when beneficial.
- Backref overlapping coverage; palette limits; malformed tree repair logic never triggers in encoder.

### 8.5 VP8X and Metadata

- Presence/absence of ICC/EXIF/XMP reflected in VP8X flags; byte-exact preservation.

### 8.6 Fuzz/Property

- Random seeds generate small images; ensure encoder→decoder idempotent and deterministic.

Performance bounds:

- Each test <1s, suite <10s. Use tiny fixtures.

---

## 9. Module Layout (Mirrors Decoder)

- `codecs/webp/`
  - `encode.js` (orchestrator, options, route to VP8/VP8L)
  - `write-riff.js` (container writer)
  - `vp8/`
    - `color.js` (RGBA→YUV420, downsample)
    - `rd.js` (rate-distortion, lambda)
    - `predict.js` (intra modes)
    - `fdct.js` (forward 4×4 transform)
    - `quant.js`
    - `tokens.js`
    - `probs.js` (estimate coeff probabilities)
    - `bool-encoder.js`
    - `loop-filter.js`
    - `pack.js` (frame header, partitions)
  - `alpha/`
    - `encode-alpha.js`
  - `vp8l/`
    - `palette.js`
    - `predict.js`
    - `transforms.js`
    - `lz77.js`
    - `huffman.js`
    - `pack.js`
  - `features/`
    - `vp8x.js`
    - `metadata.js`
  - `ENCODE.md` (this document)

---

## 10. Milestones (Ship in Small, Useful Steps)

1. Minimal VP8 lossy encoder: fixed Q, 1 partition, full intra modes, loop filter → `VP8 ` only.
2. Alpha (ALPH method 0 + 1), VP8X with alpha flag.
3. Rate control (simple binary search on Q), prob estimation.
4. VP8L lossless with palette, LZ77, Huffman.
5. Metadata (ICCP/EXIF/XMP) + VP8X flags and proper chunk ordering.
6. Optional: tiling and multi-partition for speed.

Each milestone includes tests for 100% branches of the new modules and deterministic outputs.

---

## 11. Real-world Pitfalls to Avoid

- Floating-point color transforms; must be integer.
- Writing wrong chunk sizes or forgetting padding byte.
- Overly aggressive quantization causing ringing on edges; prioritize mode decisions to reduce energy.
- Loop filter misconfigured vs Q leads to over-blur; clamp with sharpness.
- Non-deterministic heuristics (Math.random or unordered maps) → breaks tests.

---

## 12. Incremental Implementation Pipeline (Inverse of Decoder)

Ship each milestone independently with 100% branch coverage for the new files. Mirror decoder structure so primitives are reusable and parity is testable. All math integer-only, zero-deps, pure functions with explicit inputs/outputs.

### M0 — RIFF Writer and Orchestrator Skeleton

- Purpose:
  - Establish `encodeWEBP(pixels, width, height, options)` and `writeRIFFWebP(chunks)`.
- Contracts:
  - `writeRIFFWebP(chunks: { type: string, data: Uint8Array }[]) -> Uint8Array`.
  - Orchestrator selects path: VP8 (lossy) or VP8L (lossless) or VP8X + auxiliaries.
- Algorithm:
  1. Compute each chunk size; write `<FOURCC><u32 size><data>`; add pad byte if size is odd (not counted in size).
  2. RIFF header: `"RIFF" <u32 totalAfter> "WEBP"` where `totalAfter = 4 + sum(chunkRecordsInclPad)`.
- Tests:
  - Core: single `VP8 ` chunk emission produces valid sizes/padding.
  - Edges: odd `data.length` → pad; large size sum; empty `chunks` rejected.
- Pitfalls:
  - Incorrect RIFF size; forgetting to pad; FOURCC spacing (e.g., `"VP8 "`).
- Done criteria:
  - Byte-accurate container with round-trip parse by decoder parser.

### M1 — Color and Downsampling Primitives (RGBA→YUV420)

- Purpose:
  - Deterministic integer RGBA→YUV (BT.601) and 2×2 chroma downsample.
- Contracts:
  - `rgbaToYuv420(rgba: Uint8Array, width: number, height: number) -> { y: Uint8Array, u: Uint8Array, v: Uint8Array }`.
- Algorithm:
  - Integer matrix; U/V computed on 2×2 windows (box); handle odd width/height by clamping edges.
- Tests:
  - Core: known RGBA→YUV vectors; 2×2, 3×3 edge cases.
  - Edges: saturation, odd dims; no floats.
- Pitfalls:
  - Rounding drift vs decoder path; ensure symmetry when re-converted by our decoder.
- Done criteria:
  - Byte-for-byte agreement with decoder YUV→RGB inverse on round-trip fixtures.

### M2 — Forward 4×4 Transform and Quantization

- Purpose:
  - Implement forward integer transform matched to inverse; quantization with segment deltas.
- Contracts:
  - `fdct4x4(block: Int16Array) -> void` (in-place), `quantize(block, q) -> tokens`.
- Algorithm:
  - Use integer transform that inverts losslessly with inverse path at Q=0; support DC-only optimization.
  - Quant: dead-zone; derive DC/AC scales from base Q and deltas.
- Tests:
  - Core: transform-pair identity at Q=0; DC-only; random block vs reconstruct after inverse+dequant.
  - Edges: clamp ranges; all-zero quantization path.
- Pitfalls:
  - Non-matching forward/inverse integer constants; missed dead-zone optimization.
- Done criteria:
  - Exact inverse consistency tests with decode primitives.

### M3 — Intra Predictors and Mode Decision Harness

- Purpose:
  - Implement predictors and a minimal mode decision loop (deterministic, no RD yet or simple lambda).
- Contracts:
  - `predictIntra4x4(top,left,mode)`, `predictIntra16x16(...)`, `predictUV8x8(...)` (reuse decoder’s predictor code if shared).
  - `chooseModes(mbCtx) -> { yMode16, yModes4[], uvMode }`.
- Algorithm:
  - For each block, evaluate SSE of predicted vs source; optionally simple rate term from expected token counts; pick minimal cost.
- Tests:
  - Core: patterns that favor specific modes; borders (no top/left).
  - Edges: tie-breaking determinism.
- Pitfalls:
  - Non-deterministic iteration order; border sample handling mismatch.
- Done criteria:
  - Stable choices and coverage of all modes at least once.

### M4 — Boolean Arithmetic Encoder and Frame Packer

- Purpose:
  - Mirror bool decoder; pack VP8 frame tag, headers, and partitions.
- Contracts:
  - `createBoolEncoder() -> { writeBit(prob, bit), writeLiteral(n, value), finish() -> Uint8Array }`.
  - `packVP8Headers(params) -> Uint8Array`.
- Algorithm:
  - Range init 128..255, compute split like decoder, renormalize; write out bytes deterministically.
  - Frame tag: keyframe=0, version, show_frame=1, 19-bit first partition length encoded in 3 bytes little-endian.
- Tests:
  - Core: encode known literal patterns, verify decoder reads same bits.
  - Edges: partition size computation exact; zero-length partitions rejected.
- Pitfalls:
  - Off-by-one in split; endian on partition sizes.
- Done criteria:
  - Cross-validated with decoder’s bool reader in tests.

### M5 — VP8 Lossy Encode (Minimal, Opaque)

- Purpose:
  - End-to-end intra-only VP8 encoder with single partition, loop filter, fixed Q.
- Contracts:
  - `encodeVP8(rgba, width, height, { qIndex, sharpness }) -> Uint8Array /* VP8 frame */`.
- Algorithm:
  - RGBA→YUV420; mode decision; FDCT; quant; tokenization using coeff trees; write headers (quant, loop filter, probs), pack tokens.
- Tests:
  - Core: 2×2 and 4×4 images; golden size ranges and decode back to RGBA equal to source within tolerance driven by Q.
  - Edges: 1×N/N×1; flat blocks produce few tokens; filter params consistent.
- Pitfalls:
  - Token order/tree mismatches; partition size miscalc; mismatch in filter params vs decode.
- Done criteria:
  - Self-decode parity; deterministic output with fixed options.

### M6 — ALPH Encode (Stills)

- Purpose:
  - Encode alpha plane via methods 0 (raw) and 2 (quant), later 1 (compressed using VP8L primitives).
- Contracts:
  - `encodeAlpha(plane: Uint8Array, width, height, { method, quantLevels? }) -> Uint8Array /* ALPH chunk data */`.
- Algorithm:
  - Method 0: direct bytes with optional filter markers.
  - Method 2: quantize to N levels; store table + indices.
  - Method 1 (later): compress with VP8L encoder’s LZ/Huffman.
- Tests:
  - Core: binary mask chooses 2 levels; gradient preserved with configured levels.
  - Edges: row padding; reserved method rejected.
- Pitfalls:
  - Premultiplication; forgetting VP8X alpha flag when emitting ALPH.
- Done criteria:
  - Byte-exact plane reconstruction by decoder.

### M7 — Rate Control and Probability Estimation

- Purpose:
  - Hit target size or quality deterministically; adapt coeff probabilities.
- Contracts:
  - `estimateProbs(stats) -> probs`; `rateControl(targetBytes, encodeOnce) -> { qIndex }`.
- Algorithm:
  - Gather token histograms; smooth and clamp probs; single-pass or two-pass size targeting via binary search on Q.
- Tests:
  - Core: monotonicity wrt Q; target size within ±2% on canonical images.
  - Edges: tiny target that is impossible → graceful failure.
- Pitfalls:
  - Non-deterministic histograms; oscillation in binary search without bounds.
- Done criteria:
  - Stable outputs; bounded iterations.

### M8 — VP8L Lossless Primitives (Encoder Side)

- Purpose:
  - Build Huffman, LZ77, predictors, and transforms for lossless path.
- Contracts:
  - `analyzeTransforms(pixels) -> chain`; `lz77Parse(argb) -> tokens`; `buildHuffman(hist) -> tables`.
- Algorithm:
  - Palette detection (<=256 colors); subtract-green; small search for color transform multipliers; greedy+lazy LZ; canonical Huffman with length limits.
- Tests:
  - Core: encode small images with palette; overlapping backrefs; tree shapes valid.
  - Edges: noise images prefer literals; invalid states never produced.
- Pitfalls:
  - Over/under-subscribed trees; channel order ARGB vs RGBA.
- Done criteria:
  - Decoder decodes to original RGBA byte-for-byte.

### M9 — VP8L Image Encode + ALPH Method 1

- Purpose:
  - Full VP8L image emission; reuse to compress ALPH method 1.
- Contracts:
  - `encodeVP8L(rgba, width, height, opts) -> Uint8Array /* VP8L bitstream */`.
- Algorithm:
  - Emit header (w/h-1, version, color cache bits), transforms, trees, compressed stream; convert RGBA→ARGB packing as needed.
- Tests:
  - Core: subtract-green-only, palette, overlap backref; round-trip exact.
  - Edges: very small images prefer literals; palette size bounds.
- Pitfalls:
  - Predictor reset per meta-block; color cache off-by-one.
- Done criteria:
  - Lossless round-trip; ALPH-1 compression verified on tiny planes.

### M10 — VP8X Features and Final Orchestration

- Purpose:
  - Wire features, metadata, alpha, and primary streams into final RIFF; ensure strict compliance.
- Contracts:
  - `encodeWEBP(pixels, w, h, options) -> Uint8Array` with `options.metadata`, `options.mode`, `options.alpha`.
- Algorithm:
  1. Decide mode (VP8/VP8L) and alpha presence.
  2. If features present, write VP8X with flags and canvas size; then ICCP/EXIF/XMP; then ALPH (if used); then primary chunk.
  3. Validate chunk order and single-occurrence constraints.
- Tests:
  - Core: lossy/lossless with/without alpha and metadata; decoder parses flags and decodes correctly.
  - Edges: missing VP8X when ALPH present (encoder must not produce); oversized sub-bitstream vs canvas (reject before write).
- Pitfalls:
  - Flag-chunk mismatch; bad ordering; canvas mismatch allowed erroneously.
- Done criteria:
  - Files validated by our parser; decodable by our decoder and common viewers.

---

## 13. Test Authoring Guidance (Encoder)

- Use micro-images (≤ 8×8); test three groups per file: core, edges/errors, integration.
- Round-trip using our decoder; assert byte-precise RGBA (lossless) or deterministic output and monotonic size/quality (lossy).
- Ensure deterministic behavior: fixed iteration orders; no randomization.
- Enforce performance limits: each test <1s; suite <10s.

---

## 14. Error and Option Validation Conventions

- Validate inputs early: `pixels.length === width*height*4`, dimensions > 0.
- Use clear errors: `RIFF:`, `VP8:`, `VP8L:`, `VP8X:`, `ALPH:` prefixes.
- Provide constraints in messages: e.g., `VP8X: cannot emit ALPH without Alpha flag`.

---

## 15. Performance Discipline (Encoder)

- Reuse pre-allocated buffers; avoid object churn in hot loops.
- Prefer 1 token partition initially; add more only with measurable wins.
- Ensure symmetry with decoder math to avoid tiny drifts.
