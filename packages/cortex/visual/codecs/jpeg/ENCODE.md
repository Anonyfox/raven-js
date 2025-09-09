## JPEG Encoder: Design, Algorithms, Edge Cases, and Assertions

### 1) Purpose, scope, guarantees

Define a pure ESM function `encodeJPEG(pixels, width, height, opts)` that takes RGBA (Uint8Array) and produces a valid JFIF-compatible JPEG as `Uint8Array`. The encoder is deterministic, dependency-free, and supports Baseline DCT (required) and optionally Progressive DCT (configurable). It emphasizes correctness, spec compliance, and predictable quality-size tradeoffs.

Guarantees:

- Valid JPEG bitstreams with correct marker ordering and lengths.
- Baseline DCT with standard Huffman tables by default; optional optimized Huffman tables.
- Color conversion RGB→YCbCr with selectable subsampling (4:4:4, 4:2:2, 4:2:0). Grayscale when eligible.
- Proper 0xFF byte stuffing, restart interval support, and byte alignment at EOI.
- Optional metadata: JFIF density, EXIF passthrough, Adobe APP14, ICC profile segmentation.

Implementor notes:

- Determinism: same input/options must produce identical bytes. Fix rounding rules (FDCT, quant) and deterministic Huffman optimization (stable symbol ordering on ties).
- Purity: no globals; pass options explicitly; avoid date/time or randomness.
- Performance: typed arrays everywhere; avoid per-pixel allocations; precompute tables (RGB→YCbCr coefficients, FDCT constants, quant tables).
- Compatibility: baseline mandatory; progressive optional but encouraged; ensure strict marker ordering.

### 2) Input contract and options

- RGBA input shape, accepted color models, metadata passthrough
  Input:
- `pixels`: Uint8Array length `width*height*4`, RGBA with 0..255.
- `width`, `height`: positive integers.

Options (selected):

- `quality` (1..100, default 75): quality factor for quant table scaling.
- `subsampling`: '444' | '422' | '420' | 'gray' (auto 'gray' if chroma zero-variance).
- `progressive` (boolean, default false): enable progressive scans.
- `restartIntervalMCU` (0=disabled, else N): DRI value.
- `optimizeHuffman` (boolean): build optimized Huffman tables from histograms.
- `jfif`: `{ units: 0|1|2, xDensity: number, yDensity: number }`.
- `exif`: Uint8Array passthrough; `adobeTransform`: 0|1|2; `icc`: Uint8Array.

Validation: enforce bounds, ensure buffer size matches dimensions, reject impossible subsampling for small images gracefully by promotion to 4:4:4.

Details and pitfalls:

- Verify `pixels.length === width*height*4`; otherwise throw `ERR_INPUT_SIZE` with expected/got values.
- Accept only Uint8Array (or ArrayBuffer view) to avoid surprises; copy if necessary but prefer zero-copy.
- `subsampling='gray'` requires detecting grayscale; compute variance of Cb/Cr (from RGB) or accept explicit `forceGray` option.
- For tiny images (1×N or N×1), promote to 4:4:4 even if '420' requested; document deterministic promotion.
- Clamp quality to [1,100]; expose mapping to scale factor in docs.
- `restartIntervalMCU`: ensure it divides reasonably into `mcusPerLine*mcusPerColumn`; accept any >0 but document typical values (2,4,8).
- Size caps for EXIF/ICC to avoid bloat (configurable); segment splitting for ICC per spec.

### 3) Color transforms and subsampling

- RGB→YCbCr, grayscale, YCCK/CMYK consideration
- Subsampling schemes 4:4:4 / 4:2:2 / 4:2:0
  RGB→YCbCr:
  Y = 0.299R + 0.587G + 0.114B
  Cb = -0.168736R - 0.331264G + 0.5B + 128
  Cr = 0.5R - 0.418688G - 0.081312B + 128
  Use integer or fixed-point approximations with clamping to [0,255].

Implementor notes:

- Fixed-point conversion per pixel:
  - `Y  = ( 19595*R + 38470*G +  7471*B + 32768) >> 16`
  - `Cb = (-11059*R - 21709*G + 32768*B + 8421376) >> 16` // +128<<16 bias
  - `Cr = ( 32768*R - 27439*G -  5329*B + 8421376) >> 16`
- Grayscale: if chosen, emit only Y component; adjust SOF/SOS and tables accordingly; skip Cb/Cr coding entirely.
- Subsampling (downsampling) strategy:
  - 4:2:0: average 2×2 pixel neighborhoods to produce one chroma sample; handle odd edges by clamping.
  - 4:2:2: average 2×1 horizontally for chroma.
  - 4:4:4: no downsampling.
- Keep downsampling separated from tiling: first produce full planes (Y, Cb, Cr), then downsample chroma planes; this simplifies edge handling and improves cache locality.

Performance tips:

- Convert RGB→YCbCr in a single loop writing to three typed arrays; compute `(R,G,B)` once per pixel from RGBA.
- For large images, process rows to keep working set small; reuse buffers.

Pitfalls:

- Rounding bias: ensure `+32768` (or proper bias) before shifts to avoid systemic underflow.
- Mishandling edges in downsampling; ensure repetition/clamping.

Subsampling:

- 4:4:4: Hi=Vi=1 for all components.
- 4:2:2: Y: (2,1), Cb/Cr: (1,1) — horizontal subsample by 2.
- 4:2:0: Y: (2,2), Cb/Cr: (1,1) — both directions by 2.
  Downsample chroma using box filter or simple average over source pixels corresponding to each chroma sample; handle odd dimensions by edge replication.

Grayscale: if Cb/Cr nearly constant across image (variance below threshold) and user allows, encode single-component (Y only) Baseline.

### 4) Tiling into 8×8 blocks, padding strategy

- Edge extension vs zero padding, per-component block grids
  Partition each component plane into 8×8 blocks. For edges, replicate last row/column (edge extension) to complete blocks for exact 8×8 input to FDCT. Compute per-component block grid sizes based on sampling factors and image dimensions.

Implementor notes:

- Geometry:
  - `Hmax = max(Hi)`, `Vmax = max(Vi)` from chosen subsampling.
  - For component i: `width_i = ceil(width * Hi / Hmax)`, `height_i = ceil(height * Vi / Vmax)`; then `blocksPerLine = ceil(width_i / 8)`, `blocksPerColumn = ceil(height_i / 8)`.
- Stitching:
  - For each block (br, bc), gather an 8×8 window from the plane into an Int16[64], subtract 128 during gather.
- Padding:
  - Clamp indices at right/bottom edges to avoid introducing artificial high-frequency content.
- MCU order:
  - Emit Y’s `Hi×Vi` blocks first, then Cb, then Cr for each MCU in raster order.

Performance tips:

- Compute base offsets once per block; reuse a single scratch buffer per block.
- Merge gather and center (−128) to minimize passes.

Pitfalls:

- Using full image width instead of per-component `width_i` for chroma; wrong ceil leads to missing edge pixels.

Testing targets:

- Odd dimensions across 4:2:0/4:2:2; verify edge extension and absence of OOB access; gradient image shows expected blocking only due to quantization.

### 5) Forward DCT (FDCT)

- Loeffler 8×8, fixed-point scaling, precision/rounding
  Use Loeffler 8×8 FDCT (AAN or similar scaling acceptable). Implement fixed-point multipliers to avoid FP drift; define exact rounding (nearest with ties to away from zero or to even — choose one and document). Provide DC-only fast path for near-constant blocks (pre-check variance or sum of absolutes of AC approximations).

Implementor notes:

- Input Int16 centered samples in [-128..127].
- Precompute fixed-point constants (Q13/Q15); keep intermediates in 32-bit; add bias before shifts.
- Optional AAN scaling can be folded into quant tables for speed; maintain consistency.
- DC-only fast path: if all samples equal, compute DC directly; skip full FDCT.

Overflow analysis:

- Ensure worst-case intermediates fit 32-bit signed; document chosen scale.

Performance tips:

- Unroll passes; store temporaries in locals; reuse two Int32[64] scratch buffers.

Testing targets:

- Compare against FP reference; DC-only flat block yields only DC; ensure average coefficient error minimal post-quantization.

### 6) Quantization

- Standard luma/chroma tables, quality scaling, bounds, trellis (optional)
  Start from standard JPEG Annex K tables (or JFIF defaults). Map `quality` to a scale factor `sf`:
- if q < 50: sf = floor(5000 / q)
- else: sf = floor(200 - 2q)
  ScaledCoeff = clamp(1, 255, floor((BaseCoeff \* sf + 50)/100))
  Maintain separate Y and C quant tables. Optionally support custom tables or trellis quantization later; default is standard scaling.

Implementor notes:

- Quantize then zig-zag or combine both in one loop for cache friendliness.
- No extra dead-zone beyond integer division rounding.
- Allow `opts.quantTables` override (advanced use).

Performance tips:

- Precompute scaled tables once; combine quant+zigzag scatter.

Testing targets:

- Quality sweep q={1,50,95}; verify size trends; custom table injection works and respects clamping.

### 7) Huffman coding and table strategy

- Standard tables vs optimized tables; canonical code generation
  Default: use standard tables from Annex K for DC/AC Y and C. For `optimizeHuffman`, first pass over all quantized blocks to build symbol histograms (DC categories and AC run/size codes), then construct canonical Huffman tables minimizing expected code lengths; write those in DHT before SOS.

Implementor notes:

- DC symbolization: category from magnitude of `Diff = DC - prevDC`; emit category then magnitude bits (two’s complement style per JPEG).
- AC RLE: count zeros; emit ZRL (0xF0) for runs ≥16; EOB (0x00) at end if trailing zeros remain.
- Separate histograms for Y DC/AC and C DC/AC; canonical build with max code length ≤16; stable order on ties.
- Emit DHT before SOS; generate encode LUTs {code,length} for fast packing.

Performance tips:

- Single-pass RLE + symbolization over zig-zag coefficients; avoid log2 via small LUT.
- Buffer bits in uint32 accumulator; stuff 0x00 after emitted 0xFF.

Pitfalls:

- Forgetting EOB; mixing Y/C tables; unstable histograms leading to nondeterminism.

Testing targets:

- Known-coefficient block roundtrip bitstream; optimized tables reduce size on photo content by ~5–15%.

### 8) Restart intervals

- DRI planning, RST cadence, encoder state resets
  If `restartIntervalMCU` > 0, emit DRI. During entropy coding, insert RSTm after every N MCUs, cycling 0..7 and resetting DC predictors to 0 per component at each boundary. Ensure bit writer is byte-aligned at RST boundaries implicitly by the marker (RST markers occur between bytes; continue with next byte).

Implementor notes:

- DRI marker: FF DD, length 4, then 2-byte big-endian `Ri` (MCUs per interval). Write once before SOS or between scans.
- State:
  - Maintain `mcusSinceRST`, `rstIndex` (0..7), and per-component `prevDC` predictors.
  - After emitting `Ri` MCUs, flush any pending bits to byte boundary (or ensure encoder only inserts markers at byte boundary), write `FFD0+rstIndex`, increment `rstIndex = (rstIndex+1)&7`, reset `prevDC` to 0 for all components, reset `mcusSinceRST=0`.
- Placement:
  - Only insert RST markers inside the entropy-coded segment, not between markers.

Performance tips:

- Choose `Ri` so that markers are not too frequent (overhead) nor too sparse (robustness). Typical: 2, 4, 8.
- Avoid per-MCU modulo by counting down and comparing to 0.

Pitfalls:

- Writing RST not on byte boundary; forgetting to reset prevDC; cycling wrong RST number.

Testing targets:

- Encode with `Ri=1` to force frequent RST; decode via multiple decoders and verify bitstream validity and image equality.

### 9) Scan design

- Baseline single scan; Progressive scan script (DC/AC bands, successive approximation)
  Baseline: Single SOS covering all components, full spectrum Ss=0, Se=63, Ah=Al=0.

Progressive (optional): Use a conservative script for broad compatibility:

- DC first (Ss=0, Se=0, Ah=0, Al=0) for all comps.
- AC 1st pass in bands: [1..5], [6..63] Ah=0, Al=0.
- Refinement passes with Al increasing where beneficial are optional; many encoders ship only first-pass AC scans or minimal refinement for compatibility. Keep total scans small (≤4) for speed.

Implementor notes:

- Baseline:
  - One SOS: list components in [Y, Cb, Cr] with their DC/AC table ids (typically Y→(DC0,AC0), C→(DC1,AC1)). Encode MCUs in raster order.
- Progressive:
  - DC first for all comps with (Ah=0,Al=0), then AC bands as per script. Optional refinements (Ah>0) can be omitted for simplicity.
  - Keep table selection stable across scans; use same quant tables.
- Trade-offs:
  - Progressive improves perceived quality during incremental display but costs more complexity; baseline is universally compatible and faster.

Pitfalls:

- Emitting illegal scan parameters (e.g., Ss>Se, wrong Ah/Al transitions). Stick to the script.

Testing targets:

- Baseline vs progressive for the same image: verify decodes match within 1 LSB after reconstruction.

### 10) Entropy bitstream packing

- Bit writer, 0xFF stuffing, byte alignment at EOI
  Bit writer packs MSB-first; whenever a written byte equals 0xFF, write a stuffed 0x00 next. At end of entropy stream before EOI, pad with 1-bits as per spec to complete the last byte (emit all-ones with appropriate length) to avoid ambiguity.

Implementor notes:

- Accumulator:
  - Keep a 32-bit accumulator and a bit count; append bits MSB-first; when `count >= 8`, emit top byte; if 0xFF, emit extra 0x00.
- Flush:
  - After the last coefficient, flush remaining bits by padding with 1s to the next byte boundary.
- Order:
  - The entropy payload directly follows SOS; write no other markers until you finish the scan (except RST if enabled).

Performance tips:

- Inline hot paths: appending small bit-length codes (1..6 bits) is common; specialize for these cases.

Pitfalls:

- Forgetting stuffing after 0xFF; incorrect flush (using 0s instead of 1s).

Testing targets:

- Construct cases that generate many 0xFF bytes (e.g., repeated 0xFF codes) and verify correct stuffing; decoder should accept the stream.

### 11) Marker ordering and headers

- SOI, APPn (JFIF/EXIF/ICC/Adobe), DQT, DHT, SOF, DRI, SOS, EOI
  Order:
  SOI → APP0 JFIF (optional but recommended) → APP1 EXIF (optional) → APP2 ICC (possibly multiple segments, with index/total) → APP14 Adobe (if needed) → DQT (Y, C tables) → DHT (std or optimized) → SOF0/SOF2 (frame header, sampling factors, quant IDs) → DRI (optional) → SOS (scan header) → entropy-coded data (+RST if enabled) → EOI.

Implementor notes:

- SOI: FF D8.
- JFIF APP0: write signature `"JFIF\0"`, version (1.01), units, x/y density, thumb dims=0.
- EXIF APP1: write `"Exif\0\0"` then raw EXIF blob (caller-provided); ensure length fits 16-bit.
- ICC APP2: split profile into ≤ 65519-byte chunks with header `"ICC_PROFILE\0", seqNo(1..N), count(N)`.
- Adobe APP14: write `"Adobe\0"`, version=100, flags, transform as per color space.
- DQT: write Y and C tables; id 0 for Y, id 1 for C by convention.
- DHT: either standard tables (Annex K) or optimized from histograms; emit up to 4 tables (Y DC/AC, C DC/AC).
- SOF0/SOF2: image precision=8, height, width, Nc=1|3, per-component (id, HiVi, Tq).
- SOS: list components with (Td,Ta) table selectors and scan params.
- EOI: FF D9.

Pitfalls:

- Segment lengths include the 2-byte length field; miscomputing length causes decoders to fail.
- Emitting markers in the wrong order (e.g., SOF before DQT).

Testing targets:

- Parse emitted JPEG with multiple decoders; ensure all markers and lengths validate; roundtrip decode equals input content within quantization effects.

### 12) Rate control and output size considerations

- Quality factor mapping, table scaling, effect on bitrate
  We rely on quant table scaling for rate control. Quality→sf mapping above provides monotonic control; 1 yields heavy quantization (small files, blocky), 100 yields near-lossless (large files). Huffman optimization reduces size further (usually 5–15%). For deterministic outputs, when `optimizeHuffman` is disabled, sizes depend solely on quality/subsampling and content.

Implementor notes:

- Two-pass encode for `optimizeHuffman`:
  - Pass 1: FDCT+quantize+RLE only to build histograms; do not write bits. Pass 2: emit DHT with optimized tables, then entropy-code with LUTs.
- Size estimation:
  - Rough size ≈ header + sum over symbols of code lengths / 8; can provide a coarse estimate to callers.
- Target size (optional, later):
  - Iteratively adjust `quality` to meet size target using a simple search; monotonic mapping helps.

Performance tips:

- Skip optimization for tiny images; standard tables suffice.

Pitfalls:

- Non-deterministic optimized tables (unstable histogram sort); ensure stable ordering.

Testing targets:

- Verify monotonic size vs quality; verify optimized tables shrink files on photo content; ensure headers remain constant across runs with same options.

### 13) Metadata writing

- JFIF density, EXIF passthrough, Adobe APP14, ICC profile segmentation
  JFIF: write version 1.01, density units/values; omit thumbnail. EXIF: write APP1 with "EXIF\0" header then raw blob (caller-supplied). ICC: segment into multiple APP2 chunks with id="ICC_PROFILE\0", sequence numbering. Adobe APP14: set transform=1 for YCbCr, 0 for RGB (rare), 2 for YCCK if CMYK path is ever supported.

Implementor notes:

- JFIF APP0: signature, version, units, densities, no thumbnail; fixed 16-byte length.
- EXIF APP1: prefix then raw TIFF; do not split across segments; enforce length cap.
- ICC APP2: split into ≤65519-byte chunks each with header and sequence; emit in order.
- Adobe APP14: only when needed; set transform as per color mode.

Determinism: fixed APP order; no timestamps.

Pitfalls: wrong length computation; splitting EXIF; unnecessary Adobe.

Testing: validate with external tools; roundtrip safety.

### 14) Edge cases and correctness notes

- All-zero blocks, near-constant regions, small images, odd dimensions
  All-zero AC blocks should encode with ZRL and EOB efficiently. Use DC predictor for smooth gradients. For 1×N or N×1 images, handle padding robustly. Odd width/height are supported via edge replication in block tiling; ensure chroma downsampling averages only valid source pixels.

Additional: ignore alpha; minimal images (≤8×8); DC-only detection; fixed-point determinism.

Testing: 1×1, 1×8, 8×1, 9×9; solid color; gradients.

### 15) Security and resource limits

- Max resolution/allocations, segment sizes, defensive checks
  Enforce maximum megapixels and memory usage. Validate that DQT/DHT counts are within spec; header sizes within 16-bit limits. Refuse ICC or EXIF that would exceed reasonable size thresholds unless caller explicitly overrides.

Notes: configurable caps; memory estimate; ensure APP lengths ≤65535; split ICC only; avoid `W*H` overflow.

### 16) Output interface and invariants

- Deterministic bytes, ESM/pure function, zero deps
  Return `Uint8Array` JPEG file. Deterministic given same inputs and options (note: optimized Huffman is deterministic given our histogram order). No global state; no console logging; ESM-only export.

Additional invariants: marker order per section 11; quant tables in [1,255]; standard or optimized Huffman with max code length ≤16; Nc=1 for gray; SOF0 baseline/SOF2 progressive per option.

### 17) Iconic happy‑path examples

- Solid color, checkerboard, photographic content (baseline/progressive)
  E1: Solid color RGBA
- 4:2:0, quality 75. Expect tiny file, DC predictors dominant, minimal AC.

E2: Checkerboard 8×8 step

- 4:4:4, quality 90. Expect visible AC energy, stable size; decoding matches input within quantization bounds.

E3: Photo 512×512

- 4:2:0, quality 80. Size within expected range; progressive on improves visual during progressive display.

Further checks: JFIF density; PSNR thresholds; external decoder compatibility.

### 18) Iconic failure‑mode examples and expectations

- Invalid options, impossible subsampling, huge EXIF, memory limits
  F1: `pixels.length` mismatch
- Throw with explicit expected vs got length.

F2: `subsampling='420'` on 1×1 image

- Promote to 4:4:4 with warning via return metadata flag (no console); or document deterministic promotion.

F3: EXIF > size limit

- Throw unless `opts.allowLargeExif` is set.

Plus: invalid quality; negative restart; unknown subsampling; OOM estimate exceed.

### 19) Test assertion blueprint

- Unit: FDCT/quant/Huffman; Integration: roundtrip quality bounds
  Units:
- FDCT vs reference on random blocks; DC-only fast path correctness.
- Quant scaling for multiple qualities; table bounds.
- Huffman canonical generator from histograms; symbol packing for DC/AC.
- Bit writer: stuffing on 0xFF, end alignment.

Integration:

- Encode known patterns; decode via our decoder; assert PSNR above threshold per quality.
- Roundtrip small images to ensure structural compliance (decoding succeeds, dimensions preserved).

Cross-decoders: verify decode success in libjpeg-turbo and stb_image.

### 20) Implementation plan for `encodeJPEG(pixels, width, height, opts)`

- Step-by-step pipeline and public API

1. Validate input and options; choose subsampling and color transform.
2. Convert RGBA → component planes (Y, Cb, Cr[, K?]); downsample chroma if needed.
3. Tile planes into 8×8 blocks with edge extension.
4. FDCT per block; quantize using scaled tables (Y/C).
5. If `optimizeHuffman`: histogram first pass; build canonical tables.
6. Write headers: SOI, APPs, DQT, DHT, SOF0 (or SOF2), DRI (optional), SOS.
7. Entropy-code blocks MCU-by-MCU, inserting RSTm if configured.
8. Finalize entropy stream with padding; write EOI.
9. Return `Uint8Array`.

Module structure: color, tiling, fdct, quant, huffman, bitstream, markers, index orchestrator. Two-pass when optimizing Huffman; enforce deterministic tie-breaking.

### 21) References

- ITU T.81 Annex K (quant tables, Huffman examples), overall JPEG spec.
- JFIF 1.02 specification.
- Adobe APP14 DCT Filters TN #5116.
- libjpeg-turbo, IJG notes on FDCT/IDCT and subsampling.
- ITU T.871 (JFIF), Adobe APP14 Tech Notes, Annex K tables and examples.
