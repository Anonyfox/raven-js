## JPEG Decoder: Design, Algorithms, Edge Cases, and Assertions

### 1) Purpose, scope, guarantees

This document specifies a production-grade JPEG decode pipeline to RGBA for Raven Cortex Visual. It aims for precise, spec-faithful behavior on valid inputs and resilient, predictable behavior on malformed inputs without hidden dependencies. The implementation is a pure function `decodeJPEG(buffer, opts)` that returns `{ pixels: Uint8Array, width, height, metadata }` where `pixels` is RGBA (8-bit/chan) and length is `width * height * 4`.

Guarantees:

- Correct decoding of Baseline DCT JPEG (JFIF, raw) with 8-bit precision and Huffman entropy coding.
- Correct decoding of Progressive DCT JPEG with DC/AC spectral selection and successive approximation.
- Correct handling of common subsampling schemes: 4:4:4, 4:2:2, 4:2:0 (and 4:1:1 if encountered).
- Correct handling of restart intervals (RSTm) and predictor resets.
- Correct color conversion for JFIF YCbCr to RGB; Adobe APP14 transform handling (YCbCr, YCCK/CMYK) with best-effort conversion to RGB.
- Strict resource limits (resolution, memory footprint) and safe failure modes with actionable error messages.
- Deterministic output and stable APIs; no global state; no console logging.

Non-goals:

- No arithmetic coding, hierarchical, or lossless JPEG modes; no 12-bit precision.
- Do not parse/interpret EXIF/ICC contents; expose raw buffers only.

Determinism and stability:

- Fixed rounding rules; integer/fixed-point math where feasible; identical inputs yield identical outputs.
- No reliance on engine-specific FP behavior; avoid hidden global state.

Performance guidance (pure JS):

- Use typed arrays (Uint8Array/Int16Array/Int32Array) for hot data paths (coefficients, planes, IDCT scratch).
- Keep a 32-bit bit-buffer and bit-count; inline `receive(n)` and sign-extension to reduce calls.
- Precompute zig-zag, IDCT constants, upsample kernels; store as module constants.
- Reuse per-block 64-length scratch arrays; avoid allocating inside MCU loops.
- Clamp once at stage boundaries (post-IDCT, post-color) instead of per-op.

Memory model:

- Allocate block coefficient grids once from SOF; progressive scans refine in-place.
- Keep per-component planes lazily until reconstruction; consider tiling to limit peak memory.
- Enforce global memory budget; bail early on adversarial dimensions.

Error taxonomy:

- Structural (marker order/length, unsupported SOF/precision) → throw with marker and offset.
- Entropy (invalid Huffman code, underflow) → throw; tolerant mode may resync.
- Truncation (premature EOI/incomplete scan) → strict: throw; tolerant: succeed only if full MCUs done.

Options (summary):

- `tolerantDecoding?: boolean` (default false)
- `maxResolutionMP?: number` (default 100)
- `maxMemoryMB?: number` (default 512)
- `fancyUpsampling?: boolean` (default false)
- `colorTransform?: boolean|undefined` (undefined = spec-driven)

Compatibility policy:

- Prefer marker-driven color handling (JFIF/Adobe); allow override via `colorTransform` for edge files.

Common pitfalls to avoid:

- Forgetting 0xFF00 unstuffing inside entropy data (false markers).
- Not resetting DC predictors and EOBRUN at RST boundaries in progressive mode.
- Miscomputing segment lengths (length includes its own 2 bytes).
- Mixing block/MCU geometry when subsampling (wrong `blocksPerLine/Column`).

### 2) JPEG variants and support matrix (what we support, what we reject)

Supported (must decode):

- Baseline DCT, 8-bit precision, Huffman (SOF0 + DHT + DQT + SOS), single or multiple scans (single-scan typical).
- Progressive DCT, 8-bit precision, Huffman (SOF2) with full progressive AC/DC refinement, EOB runs, successive approximation.
- Restart intervals (DRI + RST0..RST7) for both baseline and progressive.
- JFIF APP0 (density, thumbnails ignored for pixel output), Adobe APP14 (transform=0/1/2), EXIF in APP1 (preserved in metadata), ICC profile in APP2 (preserved in metadata).
- Common subsampling 4:4:4, 4:2:2, 4:2:0; grayscale single-component.

Best-effort (tolerant when opts.tolerantDecoding = true):

- Minor marker irregularities: fill bytes 0xFF 0x00, spurious 0xFF padding, trailing scan padding prior to next marker.
- Malformed APP segments where length mismatches but are skippable without affecting entropy-coded segments.
- Truncated tail after completing a scan (EOI missing) if full MCUs decoded.

Rejected (throw with precise error):

- 12-bit precision frames (SOF0 with precision=12).
- Arithmetic coding (SOF9..SOF13 with arithmetic entropy coding).
- Lossless and hierarchical modes (SOF3, SOF5..SOF7, SOF15).
- Multi-frame MJPEG inside a single buffer (we only support single frame images; first frame required by JFIF). If multiple frames encountered, error.
- Progressive images with invalid spectral ordering or refinement rules.

Notes on color spaces:

- Three components: default to YCbCr unless Adobe APP14 states otherwise; allow override via `opts.colorTransform`.
- Four components: CMYK or YCCK (Adobe transform=2). Convert to RGB best-effort; if transform missing, assume CMYK.

Progressive scan legality (accept/reject rules):

- DC scans: Ss=0, Se=0; first pass Ah=0 (magnitude), refinements Ah>0 with non-increasing Al. Reject out-of-order DC refinements.
- AC scans: 1 ≤ Ss ≤ 63, Ss ≤ Se ≤ 63; first pass Ah=0; refinements Ah>0 with non-increasing Al. Reject overlapping spectral bands or repeated first passes.
- EOBRUN in AC scans may span MCUs; maintain across MCUs; reset at each RST.

Subsampling acceptance:

- Enforce 1 ≤ Hi,Vi ≤ 4 and Hmax,Vmax ≤ 4. Reject 0 or >4 sampling factors.
- Compute `blocksPerLine/blocksPerColumn` with the double-ceil rule to avoid off-by-one at image edges.

APP/COM acceptance:

- Accept unknown APP markers; skip payload. Optionally collect small COM as text.
- ICC (APP2) reassembly (id="ICC_PROFILE\0"): obey sequence and count; ignore if inconsistent.

Tolerant-decoding behaviors:

- If DRI declared but RST markers are missing, proceed as if DRI=0; when a valid RST appears, resync and reset predictors.
- If multiple frames are present, either decode only the first or reject based on `opts.allowMultipleFrames` (default false).

### 3) Bitstream anatomy and marker grammar

- SOI/EOI, marker classes, segment length rules, fill bytes
- JFIF vs. raw JPEG vs. SPIFF overview
  Marker structure: each marker is 0xFF followed by a non-0x00 byte. Within entropy-coded data, any literal 0xFF byte is stuffed with a following 0x00 byte (0xFF00) and must be unstuffed by the bit reader.

Critical markers:

- SOI (FFD8): start of image, no payload.
- APPn (FFE0..FFEF): application data, 2-byte length L includes length field itself, then L-2 bytes payload.
- DQT (FFDB): quantization tables, supports 8-bit and 16-bit entries, zig-zag order mapping to 8×8.
- DHT (FFC4): Huffman tables, DC/AC for up to 4 tables each.
- DRI (FFDD): restart interval N (MCUs), applies to subsequent scans.
- SOFn: frame header (SOF0 baseline, SOF2 progressive). Contains precision (usually 8), height, width, number of components, per-component sampling factors (h,v) and quant table selectors.
- SOS (FFDA): start of scan. Lists components participating in this scan and their DC/AC tables, plus spectral selection and successive approximation.
- RSTm (FFD0..FFD7): restart markers used inside entropy-coded data to reset DC predictors and resynchronize MCU boundaries every N MCUs.
- EOI (FFD9): end of image.

Segment length rules: all non-entropy markers (except SOI/EOI/RSTm) carry a 2-byte big-endian length including the length field.

JFIF vs. raw: JFIF adds APP0 with density and optional thumbnail; raw JPEG may omit APP0. Adobe APP14 may indicate color transforms (YCbCr or YCCK). SPIFF (APP8) exists; we ignore its metadata safely.

Bitreader design:

- Maintain a 32-bit bitBuffer and bitCount. Refill by reading next byte, unstuffing 0xFF00. If 0xFF is followed by non-zero inside a scan, treat as marker boundary (only RSTm valid mid-scan).
- Implement `readBit`, `receive(n)`, and `receiveSigned(n)` to be inline-able; avoid per-bit function overhead.

Marker scanning and resynchronization:

- Between segments, skip fill bytes (e.g., 0xFF00, repeated 0xFF). Find markers by scanning for 0xFF followed by a non-0x00.
- With DRI set, after every N MCUs expect an RSTm; if absent (tolerant mode), skip forward to next valid marker and reset predictors/EOBRUN.

Common pitfalls:

- Failing to unstuff 0x00 after 0xFF within entropy-coded data (creates false markers).
- Treating any 0xFF as marker without examining the following byte.
- Forgetting that segment lengths include the 2-byte length field.
- Not resetting DC predictors and EOBRUN at RST boundaries in progressive scans.

Performance hints:

- Single-pass segment parse; avoid copying slices; keep offsets and typed-array views.
- Defer copying EXIF/ICC; store subarray views and only materialize if requested.

Exact marker notes:

- TEM (FF01) is ignorable outside scans.
- RST0..RST7 (FFD0..FFD7) only valid in entropy streams; treat elsewhere as error.
- DNL (FFDC) may update height; accept and apply if present.
- DHP/EXP and hierarchical markers are unsupported; reject.

Length validation details:

- For a segment with declared length L, ensure L ≥ 2 and `offset + L - 2 ≤ buffer.length` before consuming payload.
- On overflow: strict mode throws; tolerant mode may scan forward to a plausible marker boundary.

### 4) Quantization tables (DQT)

- 8-bit and 16-bit entries, zig-zag order, per-component mapping
  Each DQT segment defines one or more tables. The high nibble of the table spec indicates precision (0=8-bit, 1=16-bit). Entries are transmitted in zig-zag order and must be de-zigzagged to natural [row, col]. Tables are referenced by components in SOF via `Tq` (0..3). Our decoder stores tables as Int32Array[64] in natural order.

Edge cases:

- Multiple DQT segments can redefine tables; latest wins before use.
- 16-bit entries must be handled without overflow; we keep them as 32-bit integers. Output remains 8-bit due to subsequent IDCT scaling and clamping.

Implementor details:

- DQT segment format: for each table in the segment: one byte `Pq|Tq` where `Pq` in high 4 bits (0 → 8-bit, 1 → 16-bit) and `Tq` in low 4 bits (0..3). Then 64 entries follow in zig-zag order, each entry sized per `Pq`.
- Zig-zag mapping: use a fixed 64-length table to map serialized index → natural order index `[u,v]`. Precompute a Uint8Array for speed.
- Storage: store tables per id (0..3). When SOF arrives, copy references by component (`quantizationIdx` → `quantizationTable`). This allows late DQT before subsequent scans to affect components in multi-frame files (we only support one frame, but be correct in ordering prior to SOS).
- Normalization: If using an AAN-scaled IDCT, you can pre-scale quant tables by row/column factors once to save per-block multiplies: `q'[i] = q[i] * scaleRow[r] * scaleCol[c]`. Ensure this matches the chosen IDCT math to avoid bias.

Validation and errors:

- Reject `Tq` > 3. Reject `Pq` not 0 or 1. Ensure there are at least 64 entries available in the segment for each advertised table.
- If a component references a missing `Tq` at decode time, error (strict) or use best-effort default table (tolerant mode only if explicitly enabled).

Performance tips:

- Parse DQT into a temporary buffer, then de-zigzag into the final Int32Array in a tight loop; avoid bounds checks.
- If pre-scaling for IDCT, perform it once at table load.

Testing targets:

- 8-bit vs 16-bit tables equivalence on small images; ensure no overflow.
- Table redefinition between scans should not affect already decoded MCUs.
- De-zigzag correctness: feed synthetic block with increasing values; check mapping.

### 5) Huffman coding (DHT) and bitstream decoding

- Code length tables, canonical code generation
- Bit stuffing after 0xFF, marker resynchronization
  Huffman tables are defined by 16 code length counts and a list of values. We build canonical codes: increasing code length, increasing symbol order assigns lexicographic codes. Build separate trees (or code tables) for DC and AC per table id (0..3). During decoding, use a bit reader with byte-stuffing awareness (on 0xFF followed by 0x00, drop the 0x00) and detect markers (0xFF then non-zero). On marker detection inside scans, only RSTm are valid (others indicate end of scan/padding).

DC decoding: read a Huffman symbol giving the number of additional bits; 0 indicates no change. Receive that many bits and sign-extend (JPEG’s value coding). Add to component predictor.

AC decoding: read run-size RS, where high nibble is run of preceding zeros and low nibble is size of the nonzero coefficient. Special RS=0x00 means EOB (remaining coeffs in block are zero), RS=0xF0 means ZRL (run of 16 zeros). Map coefficient index through zig-zag table.

Implementor details:

- DHT format: One byte `Tc|Th` where `Tc` (high nibble) is table class (0=DC,1=AC) and `Th` (low nibble) is table id (0..3). Next 16 bytes are counts `L[1..16]` of codes for each length; then sum(L) bytes of symbols. Validate total symbol count ≤ 256.
- Canonical code construction:
  1. For lengths 1..16, assign consecutive code values. Start with code=0. For each length `i`, left-shift code by 1 relative to previous length, assign to symbols in order, then increment.
  2. Store per symbol its bit-length and code.
- Fast decode tables:
  - Build a primary lookup table of size `1<<N` (e.g., N=8 or 9) mapping the next N bits to either a symbol or an indication that more bits are needed. For longer codes, fall back to a secondary traversal or nested tables.
  - This reduces branches per coefficient substantially in JS, where function calls are costly.
- Bitreader sign-extension:
  - To decode a signed value of `s` bits: let `v = receive(s)`. If `s==0`, return 0. If `v < (1 << (s-1))`, then `v -= (1<<s) - 1`. This matches JPEG’s “receive and extend”.
- DC predictor handling per component: maintain an array of size Nc; at RST boundaries, reset to 0. Progressive DC refine: simply OR the next bit at position `Al`.

Progressive AC specifics (state machine outline):

- Maintain `eobrun` counter. In AC-first scans (Ah=0), RS=0 with r<15 encodes `eobrun = receive(r) + (1<<r) - 1` and skips remaining coefficients in band.
- In AC-refine scans (Ah>0): iterate coefficients in band; for non-zero coeffs, add `(readBit() << Al)` with sign depending on current coeff; for zeros, manage run and possibly insert a new non-zero coeff with magnitude `±(1<<Al)` when RS indicates.
- Always reset `eobrun` at RST; maintain across MCUs otherwise.

Error handling:

- Invalid Huffman sequences (exhausted bits without reaching a symbol) → error with byte/bit offset; tolerant mode may attempt to skip to next MCU boundary (risky).
- Table id/class out of range → error. Counts `L[i]` summing to 0 (degenerate) → error.

Performance tips:

- Keep bitbuffer local to the scan decode loop; avoid getters/setters.
- Use typed arrays for fast tables; pre-size to power-of-two lengths.
- Unroll inner coefficient loops: check for common cases (EOB quickly, ZRL) and skip branches.

Testing targets:

- Canonical table generation correctness against Annex K standard tables.
- Fast vs slow path decode parity with random bitstreams.
- Progressive AC refine synthetic tests (single coeff toggling, EOBRUN span across MCU with RST).

### 6) Restart intervals (DRI) and error resilience

- RST0..RST7 cadence, MCU counting, DC predictor reset
  When DRI is set to N>0, a restart marker must appear after every N MCUs within a scan. At each RST, reset DC predictors of all components to 0 and discard any pending EOB runs (progressive). RST markers cycle RST0..RST7. The decoder must:
- Count MCUs decoded since last RST; upon reaching N, expect the next non-stuffed 0xFF to be RSTm.
- If tolerant mode is enabled and a mismatch occurs, attempt to resynchronize by scanning forward to the next valid marker boundary and reset predictors.

Implementor details:

- DRI segment: marker FF DD, 2-byte length (should be 4), followed by 2-byte big-endian `Ri` (MCUs per restart interval). A value of 0 disables restarts.
- Expected RST index: maintain `rstIndex` in [0..7]; after each interval, expect marker `FFD0 + rstIndex` and then set `rstIndex = (rstIndex + 1) & 7`.
- MCU accounting: increment a simple counter per decoded MCU. When it reaches `Ri`, the next non-stuffed marker must be RSTm. After processing RSTm, reset counter to 0.
- Predictor reset scope: reset all components’ DC predictors to 0; in progressive mode also clear `eobrun` and any band-local refinement run state.
- Bit alignment: RST markers occur at byte boundaries; the bitreader must drop any remaining buffered bits in the current byte (spec-compliant streams align before emitting RST). To be robust, on seeing RST, force `bitCount=0`.

Edge cases and resilience:

- RST earlier/later than expected: strict mode → error with MCU index; tolerant mode → accept the marker, reset predictors, set counter=0, continue.
- Wrong RST number (e.g., seeing RST4 when RST2 expected): strict → error; tolerant → accept and resync `rstIndex` to observed number.
- Trailing bytes before RST: if non-zero noise appears (invalid per spec), tolerant mode may scan forward to the next 0xFFD0..7 within a small window and resync.
- Last partial interval: the final scan may end without a trailing RST; this is valid. Do not require an RST after the last MCU of the scan.

Performance tips:

- Use `& 7` instead of modulo for cycling `rstIndex`.
- Avoid recomputing `mcusPerLine * mcusPerColumn` in the loop; precompute.
- Keep predictors and `eobrun` in small fixed arrays indexed by component id to remain monomorphic.

Testing targets:

- Synthetic scan with DRI=1 to force RST per MCU; verify predictors reset and images stitch correctly.
- Corrupt streams: missing RST, wrong RST index, extra bytes before RST; verify strict vs tolerant behavior.
- Progressive with long `eobrun` across multiple MCUs interrupted by RST: verify `eobrun` reset.

### 7) Frames, components, sampling and MCU layout (SOF0/SOF2)

- Component sampling factors (h,v), 4:4:4 / 4:2:2 / 4:2:0 / 4:1:1
- Blocks per component, blocks per MCU, image tiling
  SOF lists Nc components (1=grayscale, 3=YCbCr/RGB, 4=CMYK/YCCK). Each component i has sampling factors `(Hi, Vi)` in 1..4 and quant table id `Tqi`. Define `Hmax = max(Hi)`, `Vmax = max(Vi)`. An MCU is a tile of `Hmax × Vmax` luma blocks, with each chroma component contributing `Hi × Vi` blocks. For 4:2:0: Y has (2,2), Cb and Cr have (1,1). The image dimensions in blocks are ceil(width/8), ceil(height/8); in MCUs they are ceil(width/(8*Hmax)), ceil(height/(8*Vmax)).

Each component maintains `blocksPerLine = ceil(ceil(width/8) * Hi / Hmax)` and `blocksPerColumn = ceil(ceil(height/8) * Vi / Vmax)`. Progressive/baseline both write to these blocks across scans.

Implementor details:

- SOF structure: precision (typically 8), height (can be 0; DNL later), width, component count Nc, then per-component triplets: `Ci, (Hi<<4 | Vi), Tqi`.
- Geometry:
  - `Hmax = max(Hi)`, `Vmax = max(Vi)` across components.
  - `mcusPerLine = ceil(width / (8 * Hmax))`, `mcusPerColumn = ceil(height / (8 * Vmax))`.
  - For component i: `blocksPerLine = ceil(ceil(width/8) * Hi / Hmax)`, `blocksPerColumn = ceil(ceil(height/8) * Vi / Vmax)`.
  - Blocks per MCU for component i = `Hi * Vi`.
- MCU iteration (raster order): for each MCU (my, mx), process component blocks in the canonical order: for each component i, for `v in 0..Vi-1` and `h in 0..Hi-1`, decode one 8×8 block and place it at block coordinates `(blockRow = my*Vi + v, blockCol = mx*Hi + h)` inside that component’s block grid.
- Edge MCUs: when the image dimension is not divisible by `(8*Hmax)` or `(8*Vmax)`, the rightmost/bottom MCUs contain partial blocks. Still decode full 8×8; during upsampling/reconstruction, sample indices beyond image bounds should clamp to edge pixels.
- Storage layout: store `component.blocks` as an array of rows, each row an array of Int16[64] (or Int32). This yields direct addressing `blocks[blockRow][blockCol]` without recomputation.
- Progressive writes: initial scans write some coefficients; later scans refine in-place. Ensure blocks are allocated upfront (Int16[64] zero-initialized) for all `(blocksPerColumn × blocksPerLine)` positions.

Pitfalls to avoid:

- Using `floor` instead of `ceil` in geometry → misaligned MCU grid and out-of-bounds accesses.
- Confusing block indices in component grid with MCU-local indices; always translate via `(my*Vi + v, mx*Hi + h)`.
- Allocating blocks lazily in progressive mode leading to undefined entries when a scan references them; allocate all blocks at SOF.
- Forgetting that grayscale has Nc=1 but still uses 8×8 blocks and quant/Huffman tables like Y.

Performance tips:

- Precompute per-component strides: `rowStride = blocksPerLine`, `mcuHStride = Hi`, `mcuVStride = Vi`.
- Avoid nested property lookups inside the coefficient loop; cache `comp = components[i]`, `blocks = comp.blocks`.
- For baseline, decode a component’s `Hi*Vi` blocks in a tight loop before moving to next component to keep table references hot.

Testing targets:

- 4:4:4, 4:2:2, 4:2:0 synthetic grids: verify block placement with colored MCUs (distinct values per block) to ensure mapping correctness.
- Odd dimensions (e.g., 13×17): ensure block counts and right/bottom edges are handled without out-of-bounds.

### 8) Scans and spectral selection (SOS)

- Baseline single-scan
- Progressive: DC first/refine, AC successive approximation, EOB runs
  Baseline: one SOS with components {Y,(Cb),(Cr)}, each with DC/AC table selectors. Decode each MCU in raster MCU order, each block fully decoded (all 64 coefficients) via one DC and multiple AC symbols.

Progressive: multiple SOS segments partition the spectrum and bit-planes:

- DC first (Ss=0, Se=0, Ah=0, Al>=0): decode DC magnitude at bit-plane Al (often 0). Predictor increases by received value << Al.
- DC refine (Ss=0, Se=0, Ah>0): refine DC by appending the next bit at plane Al.
- AC first (Ss>=1, Se>=Ss, Ah=0): decode AC coefficients in [Ss..Se] with magnitude shifted by `<< Al`. Manage EOB runs: a symbol with s=0 and r<15 sets eobrun = receive(r) + (1<<r) - 1 and skips zeros accordingly.
- AC refine (Ss>=1, Se>=Ss, Ah>0): refine existing non-zero ACs in band [Ss..Se] by adding +/- 1<<Al per coefficient, and insert new non-zero coefficients indicated by special symbols and runs. Maintain refinement state machine (initial, run, set, eob).

Implementor details (SOS parsing):

- SOS structure: `Ns` (component count in scan), then `Ns` pairs: `(Cs, Td|Ta)` where `Cs` is component id, `Td` DC table id, `Ta` AC table id. Then 3 bytes: `Ss` (spectral start), `Se` (spectral end), `AhAl` (high 4 bits Ah, low 4 bits Al).
- Baseline constraints: `Ns` is typically 1 or 3; `Ss=0`, `Se=63`, `Ah=Al=0`.
- Progressive constraints checked per section 2 rules. Reject invalid band ranges or approximation sequences.

Baseline MCU decode algorithm:

1. For each MCU in raster order:
   - For each component in scan order: for `v in 0..Vi-1`, `h in 0..Hi-1`, decode a block:
     - DC: read symbol from DC table; if `s=0` then `diff=0`, else `diff = receiveSigned(s)`. `coeff[0] += diff` with per-component predictor.
     - AC: set `k=1`; while `k<64` read RS from AC table: `r = RS>>4`, `s = RS&15`:
       - If RS==0x00 → EOB: set remaining coeffs to 0 and break.
       - If RS==0xF0 → ZRL: advance `k+=16`.
       - Else: `k += r`; set `coeff[zigzag[k]] = receiveSigned(s)`; `k++`.
     - Store coefficients in the component’s block grid at `(blockRow, blockCol)`.

Progressive DC:

- First pass (Ah=0, Al≥0): decode `diff = receiveSigned(s) << Al`, add to predictor, write to `coeff[0]`.
- Refinement (Ah>0): read one bit and OR it into `coeff[0]` at bit `Al`: `coeff[0] |= (readBit() << Al)`.

Progressive AC (first pass, Ah=0):

- Iterate `k` from `Ss` to `Se` in zig-zag order indices. Maintain `eobrun=0`.
- If `eobrun>0`: decrement and continue (skip whole band for this block).
- Else decode RS from AC table: if `s=0` and `r<15`: set `eobrun = receive(r) + (1<<r) - 1` and stop band for this block.
- Else if `RS==0xF0`: `run=16`, skip 16 zeros (`k += 16`).
- Else: skip `r` zeros: advance `k += r`. Then set `coeff[zigzag[k]] = receiveSigned(s) << Al`; `k++`.

Progressive AC (refine, Ah>0):

- For each position `k` in band:
  - If `coeff[zigzag[k]] != 0`: add `(readBit() << Al)` with sign depending on current value (`+` if positive, `-` if negative by XOR trick or branch).
  - Else manage a run of zeros (`r`) and possible insertion of a new coefficient with value `±(1<<Al)` when indicated by RS codes per spec. Use the 4-state machine: initial, run, set, eob.

RST and band state:

- At each RST, reset predictors and `eobrun=0`. In AC refine, also reset any run counters.

Pitfalls to avoid:

- Using natural index instead of zig-zag for `Ss/Se` band traversal; JPEG bands are in zig-zag space.
- Not carrying `eobrun` across blocks/MCUs; it persists until exhausted or RST.
- Failing to left-shift magnitudes by `Al` in progressive first passes.
- Misinterpreting sign refinement in AC refine (must adjust existing non-zero coefficients and only set new ones to ±(1<<Al)).

Performance tips:

- Precompute band index arrays for common `Ss,Se` ranges to avoid conditionals in the inner loop.
- Fast-path baseline single-component scans by removing per-component loops.
- Use small local variables for predictor, eobrun, and bit buffer to keep monomorphic shapes.

Testing targets:

- Baseline: a 2×2 MCU image with known DC/AC to verify ZRL/EOB paths.
- Progressive: synthetic images with single non-zero AC at various positions and multi-scan refinement; ensure exact coefficient values.
- EOBRUN spanning MCUs with and without RST; ensure resets.

### 9) Dequantization and IDCT

- Loeffler 8×8 IDCT, scaling, integer vs float, fast-paths for zero AC
- Clamping and exact output range guarantees
  After all scans contributing to a block are decoded, reconstruct spatial-domain samples by de-quantizing each coefficient: `F[u,v] = q[u,v] * D[u,v]` where D is the decoded coefficient and q the quant table. Then perform 2D IDCT. We adopt a scaled Loeffler 8×8 IDCT (11 multiplies) with integer arithmetic or fixed-point, taking care to avoid overflow with 32-bit math. Fast path: if all ACs are zero, output a DC-only block with all samples equal to `round((q[0]*D[0]) * c) + 128` where c reflects IDCT scale; vectorized row/col shortcuts reduce work.

Clamp resulting sample values to [0,255]. Define exact rounding behavior to ensure determinism across platforms. Our implementation uses fixed-point shifts and bias for rounding toward nearest.

Implementor details:

- Dequantization: multiply each coefficient by its quant table entry. If using pre-scaled quant tables (AAN), integrate scaling factors here to reduce per-row/col multiplications.
- Fixed-point IDCT:
  - Use Loeffler (AAN) algorithm with constants scaled by 2^n (e.g., 13 or 14 bits) to keep precision. Keep intermediates in 32-bit signed integers.
  - Row pass then column pass over an Int32 scratch buffer of 64 elements. Exploit symmetry and early exits.
- DC-only shortcut:
  - If all AC coefficients are zero (track a flag during decode), compute a single value `s = ((q[0]*D[0]) * c) >> shift` and add 128; fill all 64 outputs with clamped `s`.
  - This path is extremely common in smooth areas and dramatically improves performance.
- Bias and rounding:
  - After the final pass, add a rounding bias before the right shift (e.g., `+ (1 << (shift-1))`) to implement round-to-nearest. Document and keep consistent across environments.
- Output:
  - Store spatial-domain samples as Uint8 in a temporary 8×8 buffer (row-major). Later stages will stitch into component planes or directly convert to RGB.

Overflow and precision:

- Ensure no intermediate exceeds 32-bit signed range; pick scaling that keeps max within bounds for worst-case coefficients (±2047 before quantization).
- When using 16-bit quant entries, the product `q*D` fits in 32-bit; still safe with chosen scales.

Performance tips:

- Precompute and inline constants; avoid table lookups for constants in inner loops.
- Unroll the 8-element row/column loops; JS JIT benefits from predictable loops.
- Reuse the same two 64-length scratch buffers for all blocks.

Testing targets:

- DC-only: random DC values with zero AC; verify flat blocks with correct mean after clamp.
- Random coefficient blocks: compare against a high-quality FP reference within a small tolerance (e.g., max error ≤ 1–2 LSBs).
- Stress with large coefficients and 16-bit quant tables to detect overflow issues.

### 10) Upsampling and reconstruction to full resolution

- Horizontal/vertical upsampling choices, edge handling
  For subsampled chroma, upsample to luma resolution. We support:
- Nearest-neighbor (fast, acceptable for most cases).
- (Optional) Linear/fancy upsampling for better quality: horizontal then vertical separable filtering. Edge handling uses clamped repeat of border samples.

MCU to image placement: assemble per-component planes, then convert to RGB per pixel.

Implementor details:

- Plane shapes:
  - Y plane: `width × height`.
  - Cb/Cr planes: `ceil(width / Hs) × ceil(height / Vs)`, where `Hs = Hmax/Hi`, `Vs = Vmax/Vi` (for Y, `Hs=Vs=1`).
- Placement:
  - After IDCT of each component block, stitch its 8×8 pixels into the component plane at pixel offsets `(blockCol*8, blockRow*8)` respecting component resolution (pre-upsampling).
- Upsampling kernels:
  - Nearest: replicate each chroma sample into the `Hs × Vs` destination footprint.
  - Linear (separable):
    - Horizontal: for each row, upsample by `Hs` using linear interpolation between neighboring samples; at edges, clamp indices (repeat edge).
    - Vertical: for each column, upsample the horizontally-upsampled result by `Vs` similarly.
  - Implementation in pure JS should use integer math with bias for rounding; avoid branching in inner loops.
- Edge handling:
  - Right/bottom edges where the chroma plane is smaller due to ceil: when reading neighbors, clamp to last valid index.
  - For odd widths/heights, ensure destination indexing does not overrun; compute destination extents exactly once.
- Tiling order:
  - For cache locality, upsample entire chroma planes after full reconstruction instead of per-MCU.

Quality notes:

- 4:2:0: linear upsampling improves diagonals; gate behind `fancyUpsampling`.
- 4:2:2: horizontal-only upsampling is sufficient; vertical factor is 1.

Performance tips:

- Use typed arrays and precomputed row strides; avoid function calls in inner loops.
- In linear mode, precompute fractional coefficients for uniform steps; clamp once per pixel.
- Process in strips to keep cache-hot rows.

Pitfalls to avoid:

- Off-by-one in destination sizes; mixing `Hs,Vs` semantics; writing past last row/col.

Testing targets:

- Synthetic 4:2:0 chroma stripes (nearest vs linear); odd dimensions (15×17) for 4:2:0 and 4:2:2; high-frequency luma with low-frequency chroma to catch misalignment.

### 11) Color spaces and transforms

- JFIF YCbCr → RGB
- Adobe APP14 (transform=0/1/2), CMYK and YCCK handling
- Grayscale
  JFIF defaults to YCbCr for 3-component images. Convert using:
  R = clamp(Y + 1.402 _ (Cr-128))
  G = clamp(Y - 0.3441363 _ (Cb-128) - 0.71413636 _ (Cr-128))
  B = clamp(Y + 1.772 _ (Cb-128))

Adobe APP14 transform:

- transform=0: unknown/none (assume RGB for 3 comp; CMYK for 4 comp).
- transform=1: YCbCr for 3 comp.
- transform=2: YCCK for 4 comp. Convert YCCK→CMYK via inverse YCbCr then CMYK→RGB by `R=255 - min(255, C*(1-K/255)+K)`, etc.

Grayscale (Nc=1): replicate Y to R,G,B.

Implementor details:

- Default (3 comp, JFIF/no Adobe): YCbCr → RGB via BT.601 fixed-point:
  - `R = Y + (91881*(Cr-128) >> 16)`
  - `G = Y - (22554*(Cb-128) >> 16) - (46802*(Cr-128) >> 16)`
  - `B = Y + (116130*(Cb-128) >> 16)`
- Adobe APP14:
  - transform=1 → YCbCr (same as default for 3 comp).
  - transform=0 (3 comp) → data is RGB; copy channels directly.
  - transform=2 (4 comp) → YCCK; convert to CMYK via YCbCr inverse then CMYK→RGB:
    - `R = 255 - clamp((C*(255-K) + 255*K) / 255)` and analogous for G,B.
  - If 4 comp without transform=2 → assume CMYK; apply CMYK→RGB.
- ICC profiles: retained as metadata; no color management applied; assume sRGB output.
- Alpha: set A=255 for all pixels.

Performance tips:

- Use per-pixel fixed-point math; compute `(Cb-128)`/`(Cr-128)` once; clamp after computing all three channels.
- Process scanlines to improve cache locality of output RGBA writes.

Pitfalls to avoid:

- Wrong G coefficients/signs; double clamping; ignoring Adobe transform=0 case.

Testing targets:

- Known YCbCr tuples (grayscale extremes, saturated colors); Adobe transform=0 RGB samples; CMYK/YCCK with Adobe APP14.

### 12) Metadata and application markers

- APP0 JFIF density, thumbnails; APP1 EXIF; APP14 Adobe; ICC profile in APP2
  We collect:
- JFIF: version, density units (0: aspect ratio only, 1: dpi, 2: dpcm), X/Y density, thumbnail size. We ignore embedded thumbnail for pixel output.
- EXIF (APP1): retain raw buffer for caller; decoding EXIF is out-of-scope.
- Adobe APP14: version, flags, transform code.
- ICC profile (APP2, “ICC_PROFILE\0”): store concatenated profile as Uint8Array.

Implementor details:

- JFIF (APP0, FFE0):
  - Verify signature `"JFIF\0"`. Parse `version` (major,minor), `densityUnits` (0 none, 1 dpi, 2 dpcm), `xDensity`, `yDensity`, `thumbWidth`, `thumbHeight`. Thumbnail bytes follow (`3*w*h`). We ignore thumbnails for output; store header fields in `metadata.jfif`.
- EXIF (APP1, FFE1):
  - Verify header `"Exif\0\0"` (some files use single zero; tolerate). Store the entire remainder (TIFF stream) as `metadata.exif` (Uint8Array view). Do not parse TIFF here to keep zero deps; consumers can parse later.
- XMP (APP1):
  - Some files embed XMP packets under APP1 without Exif header (starts with `"http://ns.adobe.com/xap/1.0/\0"`). We may store raw as `metadata.xmp` when detected (optional).
- ICC (APP2, FFE2):
  - Header: `"ICC_PROFILE\0"` then 1-byte `seqNo` (1-based), 1-byte `count`, then payload. Collect all chunks for a given `count`; reject inconsistent counts or duplicate seqNos. After all chunks are seen, concatenate in order into `metadata.icc`.
- Adobe APP14 (FFEE):
  - Verify `"Adobe\0"`; parse `version`, `flags0`, `flags1`, `transform` (0,1,2). Store as `metadata.adobe` and feed color decision (section 11).
- SPIFF (APP8):
  - Header may be `"SPIFF\0"`. We do not implement SPIFF; skip data safely and optionally record `metadata.spiff=true`.
- COM (FFFE):
  - Comment as raw bytes. For small payloads (< 64KB), optionally decode as Latin-1/UTF-8 best-effort to `metadata.comments[]`. For binary or very large comments, skip or cap length.

Safety and size limits:

- Cap per-APP payload examined (e.g., 10MB) and total metadata bytes retained (e.g., 32MB) to prevent memory abuse; configurable via opts.
- Always validate stated segment length against buffer bounds before reading.

Tolerant behavior:

- If APP length overflows buffer or signature invalid, skip the segment (do not throw) unless `strictMetadata` is set. Preserve core decode correctness by never depending on APP contents.

Testing targets:

- Multi-chunk ICC with out-of-order seqNos; ensure reassembly in correct order.
- Dual APP1 (Exif + XMP); ensure both are retained distinctly.
- Corrupted sizes: ensure safe skip without affecting entropy decoding.

### 13) Error handling strategy and tolerant decoding

- Truncation, malformed APP segments, premature EOI, stray markers
  Strict mode (default): throw on spec violations that make decoding ambiguous: invalid marker order, missing IHVs (IHDR-equivalent in JPEG is IHVs in SOF/SOS), inconsistent scan parameters, negative lengths, arithmetic coding, precision != 8. Throw on truncated entropy-coded segments before completing last MCU of the current scan.

Tolerant mode: allow skipping malformed APP markers, ignore trailing padding bytes at the end of scan, accept missing EOI if all scans finished. On restart mismatches, attempt forward resync to next RSTm or SOS/EOI, resetting predictors. Provide exact error offsets for diagnostics.

Implementor details:

- Error object should include: `code` (string), `message`, `offset` (byte index), and optionally `marker` (e.g., 0xFFDA) to aid diagnostics.
- Do not partially return pixel data on error; either throw or fully succeed. Tolerant mode still guarantees invariants if returned.
- Resynchronization strategy (tolerant):
  - On entropy error mid-scan: scan forward for next 0xFF byte, peek next; if RSTm and DRI>0, accept and reset; if SOS/EOI, end scan/image gracefully; otherwise continue search within a small window (e.g., up to N bytes) to avoid O(N^2) scanning.
  - On invalid APP lengths: skip to next marker by scanning for 0xFF followed by non-0x00, within bounded window; record `metadata.warnings`.

Known corruption patterns and handling:

- EOI missing: if all scans completed and last scan ended on byte boundary (or with permissible padding), accept image.
- Stuffing errors: stray 0xFF 0x00 sequences at the very end of scan; ignore as padding.
- Wrong RST index: tolerant mode resyncs `rstIndex` and continues.

Testing targets:

- Corpus with truncated entropy segments, missing EOI, malformed APP sizes, wrong RST; assert strict vs tolerant outcomes and presence of `metadata.warnings` entries when applicable.

### 14) Security and resource limits

- Resolution guards, memory accounting, worst-case byte budgets
  Limits:
- Max resolution in megapixels (configurable, default e.g. 100MP).
- Memory budget: estimate worst-case `width * height * (planes + RGBA)` and block buffers; refuse if exceeding limit.
- Enforce table counts: at most 4 DC + 4 AC Huffman tables; at most 4 quant tables.
- Segment length sanity: ensure `offset + length <= buffer.length`.

Implementor details:

- Resolution guard: `width*height` must be ≤ `opts.maxResolutionMP * 1e6`.
- Memory budget estimate:
  - Required RGBA: `4*W*H` bytes.
  - Coefficients: sum over components `(blocksPerLine*blocksPerColumn*64*2)` (Int16) or \*4 (Int32), plus scratch buffers (a few KB).
  - Upsampling temp (if linear): at most `max(W,H) * strideFactor` per strip.
  - Ensure sum ≤ `opts.maxMemoryMB * 1024*1024`.
- Table limits: at most 4 quant tables, 4 DC + 4 AC Huffman tables; reject more.
- Segment parsing:
  - Before reading any segment payload, check `length >= 2` and `offset+length-2 <= buffer.length`.
- Defensive loops:
  - All `while` loops must be bounded by known counters (MCUs, coefficients). Never loop until marker by reading unbounded bytes without a hard cap.

Testing targets:

- Adversarial images declaring huge DQT/DHT lengths; ensure early rejection.
- Extremely large images slightly over MP limit; ensure informative error mentioning delta.
- ICC payload exceeding cap; ensure skip and warning, not crash.

### 15) Output interface and invariants

- Returned buffer shape (RGBA), stride, determinism
  `decodeJPEG(buffer, opts)` returns:
- `pixels`: Uint8Array length `width*height*4`, RGBA with A=255.
- `width`, `height`: positive integers from SOF, after DNL (if present) applied.
- `metadata`: `{ jfif?, adobe?, exif?: Uint8Array, icc?: Uint8Array, units?, xDensity?, yDensity? }`.
  Invariants: deterministic output; no global state; no logging; throws are instances of Error with clear messages.

Additional invariants and notes:

- `pixels.length === width * height * 4`; `pixels` is a tightly packed RGBA buffer, row-major, no padding, A=255 everywhere.
- Color conversion policy is deterministic given metadata and opts; if ambiguous (e.g., 3 comp with Adobe transform=0), we assume RGB (no transform) unless `opts.colorTransform===true` forces YCbCr.
- Metadata keys present only when detected; large binary blobs (EXIF/ICC) are Uint8Array views over the source buffer when feasible (zero-copy), else copies if needed for lifetime.
- The function is pure: it does not mutate inputs and has no side effects.

Testing targets:

- Smoke: verify RGBA shape and alpha channel all 255.
- Determinism: decode the same buffer twice and compare outputs byte-for-byte.

### 16) Iconic happy‑path examples

- Baseline 4:4:4 RGB, Baseline 4:2:0 YCbCr, Progressive photo
  H1: Baseline 4:4:4, JFIF, no DRI
- Expect correct dimensions, solid color blocks roundtrip to near-identical RGB.
- Assertions: first pixel exact value; center patch uniform; metadata density parsed.

H2: Baseline 4:2:0, JFIF, with DRI=4

- Expect restart markers every 4 MCUs; predictors reset; no drift.
- Assertions: DC predictor resets at RST boundaries; visual seams absent after upsampling.

H3: Progressive photo (SOF2) with multiple scans

- Expect correct progressive DC/AC refinement, no banding.
- Assertions: per-block coefficient counts match scans; final block equal to baseline of same quantization within IDCT rounding tolerance.

Expanded scenarios and exact checks:

- H1.1: 8×8 solid gray (Y=128, Cb=Cr=128)
  - Decode → all RGB=(128,128,128). Assert every pixel equals exactly 128.
  - Time bound: decode under 1 ms on modern desktop; no allocations > few KB.
- H1.2: 16×16 color bars (primary colors), 4:4:4
  - Decode → exact RGB primaries at bar centers; edges within ±1 due to IDCT rounding.
  - Assert no out-of-bounds writes; alpha=255 everywhere.
- H2.1: 16×16 checkerboard luma, flat chroma, 4:2:0 with DRI=2
  - Verify RST every 2 MCUs; predictors reset to 0; reconstructed image shows sharp checkerboard without chroma misalignment.
  - Track `rstIndex` sequence cycles 0..7.
- H3.1: Progressive 32×32 with script: DC, AC[1..5], AC[6..63]
  - After each scan, partial image preview improves monotonically; final equals baseline within 1 LSB max error per channel.
  - Assert `eobrun` usage > 0 and resets at RST if DRI present.

### 17) Iconic failure‑mode examples and expected outcomes

- Bad CRC-like marker issues, stuffed 0x00 handling, restart sync loss, truncated scans
  F1: Stuffed 0xFF00 inside entropy stream
- Expect bitreader to unstuff and proceed; assertion: no false marker detection.

F2: Unexpected marker inside scan (not RST) in strict mode

- Expect error with offset; tolerant mode: attempt to skip to next SOS/EOI and continue if safe.

F3: Truncated file just after SOS

- Strict: throw “truncated entropy-coded segment” with offset. Tolerant: if at MCU boundary and full image decoded, return successfully.

F4: DRI set but missing RST markers

- Strict: error due to MCU cadence mismatch. Tolerant: resync by ignoring DRI and continue; predictors reset at guessed boundaries yields small blocks of error but completes.

F5: Precision=12 in SOF0

- Always reject with clear message: 12-bit not supported.

Additional negative cases and checks:

- F6: Invalid DHT with sum(L)=0 or >256 → throw `ERR_DHT_TABLE` with marker offset.
- F7: Component references missing quant table → strict: `ERR_MISSING_DQT`; tolerant: use default table only if `opts.allowDefaultTables` true.
- F8: APP segment length overruns buffer → skip, record warning; decoding continues.
- F9: Wrong Adobe transform for 3 comp (2) → ignore transform and assume YCbCr (warn).
- F10: EOI missing but last scan incomplete at coefficient level → strict throw; tolerant still throw (unsafe to guess).

### 18) Test assertion blueprint (unit + integration)

- Contract-style checks per stage to ensure branch coverage
  Units:
- DQT parser: 8/16-bit tables; de-zigzag correctness.
- DHT canonical builder: code assignment for known tables; invalid lengths detection.
- Bitreader: stuffed bytes, marker detection, readBit/receive/receiveAndExtend.
- Progressive AC refinement state machine: deterministic transitions for synthetic sequences (including EOBRUN).
- IDCT: DC-only block output, random AC vectors against reference within error bounds; clipping.
- Upsampling: 2× horizontal, 2× vertical, borders.
- Color conversion: known YCbCr tuples → RGB expected.

Integration:

- Decode reference JPEGs: tiny baseline 8×8, 16×16 4:2:0, progressive 32×32, CMYK/Adobe YCCK file, grayscale. Assert pixel hashes and spot-check values.
- Corruption tests: introduce stuffed-byte variants, truncated scans, wrong RST; ensure strict vs tolerant behavior.

Performance and memory assertions:

- Ensure total allocations do not exceed budget for given dimensions; track peak bytes.
- Time budget per file under 10 ms for 1MP baseline on desktop reference; progressive under 20 ms.

Coverage goals:

- Branch coverage ~100% for: DQT/DHT parsing, restart paths (hit with DRI=1), progressive state machine (all states), error branches (strict/tolerant), upsampling paths (nearest/linear), color transforms (default/Adobe cases).

Determinism check:

- Re-run same file twice; byte-for-byte identical RGBA. Hash equality assertion.

### 19) Implementation plan for `decodeJPEG(buffer, opts)` (pure function)

- Step-by-step pipeline and APIs

1. Parse markers sequentially:
   - SOI → zero state.
   - APP0/APP1/APP2/APP14 → collect metadata; ignore others.
   - DQT/DHT → store tables.
   - DRI → set restart interval.
   - SOFn → allocate frame, components, sampling geometry, block grids.
   - SOS → decode scan using current tables and DRI; update component blocks.
   - EOI → stop.
2. After final scan: dequantize+IDCT per block, assemble planes with upsampling.
3. Convert to RGB (or grayscale expand), compose RGBA.
4. Return result.

Options:

- `tolerantDecoding` (default false), `maxResolutionMP`, `maxMemoryMB`, `fancyUpsampling` (false), `colorTransform` override (undefined → spec-driven).

Module structure (recommended):

- `codecs/jpeg/parse.js` — marker parsing, APP collectors, DQT/DHT/DRI/SOF/SOS readers.
- `codecs/jpeg/huffman.js` — canonical build + fast decode tables; bitreader.
- `codecs/jpeg/progressive.js` — progressive scan engines (DC/AC first/refine).
- `codecs/jpeg/idct.js` — fixed-point IDCT and dequantization helpers.
- `codecs/jpeg/upsample.js` — nearest/linear upsampling kernels.
- `codecs/jpeg/color.js` — YCbCr/Adobe transforms.
- `codecs/jpeg/decode.js` — orchestrator exporting `decodeJPEG`.

API shape:

- `async function decodeJPEG(buffer: ArrayBuffer|Uint8Array, opts?: DecodeOptions): Promise<{ pixels: Uint8Array, width: number, height: number, metadata: object }>` — allow sync or microtask return; internals are synchronous.

Thread safety and purity:

- No module-level mutable caches except read-only constants and precomputed tables. Scratch buffers allocated per call or passed down.

Instrumentation (optional in dev builds only):

- Hooks to capture warnings, timing per phase (parse, entropy, reconstruct, color), and peak memory. Disabled in production build to keep zero overhead.

### 20) References (specs and canonical resources)

- ITU T.81: JPEG specification.
- JFIF 1.02 specification.
- Adobe APP14 (DCT Filters) Technical Note #5116.
- libjpeg-turbo documentation (huffman, idct, upsampling notes).
- Independent JPEG Group (IJG) codebase write-ups.
- stb_image JPEG decoder commentary.
- ITU T.871 (JPEG File Interchange Format - JFIF)
- W3C JPEG guidance and errata
- Mozilla pdf.js JPEG decoder notes (progressive nuances)
- JPEG XT/Adobe APP14 technical notes (color transforms)
