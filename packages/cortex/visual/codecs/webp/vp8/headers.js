/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file VP8 frame header and control data parsing.
 *
 * Implements parsing of VP8 frame headers, segmentation, loop filter,
 * quantization parameters, and mode probabilities from the bitstream.
 */

/**
 * Parse VP8 frame header from bitstream.
 *
 * Extracts frame type, version, show flag, partition size, and dimensions.
 * Validates the VP8 start code and frame structure.
 *
 * @param {Uint8Array} view - VP8 bitstream data
 * @returns {Object} Parsed frame header
 * @throws {Error} Invalid frame header or insufficient data
 */
export function parseVP8FrameHeader(view) {
  if (!(view instanceof Uint8Array)) {
    throw new Error("VP8Header: view must be Uint8Array");
  }

  if (view.length < 10) {
    throw new Error(`VP8Header: need at least 10 bytes for header (got ${view.length})`);
  }

  let offset = 0;

  // Read frame tag (3 bytes)
  const frameTag = (view[offset + 2] << 16) | (view[offset + 1] << 8) | view[offset];
  offset += 3;

  // Extract frame type and version
  const keyframe = (frameTag & 1) === 0; // Bit 0: 0=keyframe, 1=interframe
  const version = (frameTag >> 1) & 7; // Bits 1-3: version
  const show = (frameTag >> 4) & 1; // Bit 4: show frame flag

  // Extract first partition size (19 bits)
  const firstPartitionSize = (frameTag >> 5) & 0x7ffff; // Bits 5-23

  if (!keyframe) {
    throw new Error("VP8Header: only keyframes are supported");
  }

  if (version > 3) {
    throw new Error(`VP8Header: unsupported version ${version} (must be 0-3)`);
  }

  // Note: partition size can be zero for some valid frames

  if (firstPartitionSize > view.length - offset) {
    throw new Error(
      `VP8Header: first partition size ${firstPartitionSize} exceeds remaining data ${view.length - offset}`
    );
  }

  // Read start code for keyframes (3 bytes: 0x9d 0x01 0x2a)
  if (view[offset] !== 0x9d || view[offset + 1] !== 0x01 || view[offset + 2] !== 0x2a) {
    throw new Error(
      `VP8Header: invalid start code [${view[offset].toString(16)}, ${view[offset + 1].toString(16)}, ${view[offset + 2].toString(16)}] (expected [9d, 01, 2a])`
    );
  }
  offset += 3;

  // Read width and height (2 bytes each, little-endian)
  const width = view[offset] | (view[offset + 1] << 8);
  const height = view[offset + 2] | (view[offset + 3] << 8);
  offset += 4;

  // Extract 14-bit dimensions and scaling flags
  const actualWidth = width & 0x3fff; // Bits 0-13
  const actualHeight = height & 0x3fff; // Bits 0-13
  const widthScale = (width >> 14) & 3; // Bits 14-15
  const heightScale = (height >> 14) & 3; // Bits 14-15

  if (actualWidth === 0 || actualHeight === 0) {
    throw new Error(`VP8Header: invalid dimensions ${actualWidth}x${actualHeight} (must be > 0)`);
  }

  // Note: 14-bit values are already limited to 0-16383, so no need for explicit check

  return {
    keyframe,
    version,
    show: show === 1,
    firstPartitionSize,
    width: actualWidth,
    height: actualHeight,
    widthScale,
    heightScale,
    headerSize: offset,
  };
}

/**
 * Parse segmentation parameters from boolean decoder.
 *
 * @param {{ readBit: (prob: number) => 0|1, readLiteral: (n: number) => number }} decoder - Boolean decoder instance
 * @returns {Object} Segmentation parameters
 */
export function parseSegmentation(decoder) {
  const segmentation = {
    enabled: false,
    updateMap: false,
    updateData: false,
    absoluteDelta: false,
    quantizer: [0, 0, 0, 0],
    loopFilter: [0, 0, 0, 0],
  };

  // Check if segmentation is enabled
  segmentation.enabled = decoder.readBit(128) === 1;

  if (!segmentation.enabled) {
    return segmentation;
  }

  // Check segmentation update flags
  segmentation.updateMap = decoder.readBit(128) === 1;
  segmentation.updateData = decoder.readBit(128) === 1;

  if (segmentation.updateData) {
    segmentation.absoluteDelta = decoder.readBit(128) === 1;

    // Read quantizer updates for each segment
    for (let i = 0; i < 4; i++) {
      if (decoder.readBit(128) === 1) {
        segmentation.quantizer[i] = readSignedValue(decoder, 7);
      }
    }

    // Read loop filter updates for each segment
    for (let i = 0; i < 4; i++) {
      if (decoder.readBit(128) === 1) {
        segmentation.loopFilter[i] = readSignedValue(decoder, 6);
      }
    }
  }

  return segmentation;
}

/**
 * Parse loop filter parameters from boolean decoder.
 *
 * @param {{ readBit: (prob: number) => 0|1, readLiteral: (n: number) => number }} decoder - Boolean decoder instance
 * @returns {Object} Loop filter parameters
 */
export function parseLoopFilter(decoder) {
  const filter = {
    type: "normal",
    level: 0,
    sharpness: 0,
    deltaEnabled: false,
    deltaUpdate: false,
    refDeltas: [1, 0, -1, -1],
    modeDeltas: [0, 0, 0, 0],
  };

  // Read filter type (0=normal, 1=simple)
  filter.type = decoder.readBit(128) === 1 ? "simple" : "normal";

  // Read filter level (6 bits)
  filter.level = decoder.readLiteral(6);

  // Read sharpness level (3 bits)
  filter.sharpness = decoder.readLiteral(3);

  // Check delta updates
  filter.deltaEnabled = decoder.readBit(128) === 1;

  if (filter.deltaEnabled) {
    filter.deltaUpdate = decoder.readBit(128) === 1;

    if (filter.deltaUpdate) {
      // Read reference frame deltas
      for (let i = 0; i < 4; i++) {
        if (decoder.readBit(128) === 1) {
          filter.refDeltas[i] = readSignedValue(decoder, 6);
        }
      }

      // Read mode deltas
      for (let i = 0; i < 4; i++) {
        if (decoder.readBit(128) === 1) {
          filter.modeDeltas[i] = readSignedValue(decoder, 6);
        }
      }
    }
  }

  return filter;
}

/**
 * Parse quantization parameters from boolean decoder.
 *
 * @param {{ readBit: (prob: number) => 0|1, readLiteral: (n: number) => number }} decoder - Boolean decoder instance
 * @returns {Object} Quantization parameters
 */
export function parseQuantization(decoder) {
  const quant = {
    yAC: 0,
    yDC: 0,
    y2DC: 0,
    y2AC: 0,
    uvDC: 0,
    uvAC: 0,
  };

  // Read base quantizer (7 bits)
  const baseQ = decoder.readLiteral(7);

  // Y AC quantizer is the base
  quant.yAC = baseQ;

  // Read delta values for other quantizers
  quant.yDC = baseQ + readDeltaQ(decoder);
  quant.y2DC = baseQ + readDeltaQ(decoder);
  quant.y2AC = baseQ + readDeltaQ(decoder);
  quant.uvDC = baseQ + readDeltaQ(decoder);
  quant.uvAC = baseQ + readDeltaQ(decoder);

  // Clamp all quantizers to valid range [0, 127]
  quant.yAC = Math.max(0, Math.min(127, quant.yAC));
  quant.yDC = Math.max(0, Math.min(127, quant.yDC));
  quant.y2DC = Math.max(0, Math.min(127, quant.y2DC));
  quant.y2AC = Math.max(0, Math.min(127, quant.y2AC));
  quant.uvDC = Math.max(0, Math.min(127, quant.uvDC));
  quant.uvAC = Math.max(0, Math.min(127, quant.uvAC));

  return quant;
}

/**
 * Parse mode probabilities from boolean decoder.
 *
 * @param {{ readBit: (prob: number) => 0|1, readLiteral: (n: number) => number }} decoder - Boolean decoder instance
 * @returns {Object} Mode probabilities for entropy coding
 */
export function parseModeProbs(decoder) {
  const probs = {
    yMode: [112, 86, 140, 37], // 16x16 Y mode probabilities
    uvMode: [162, 101, 204], // UV mode probabilities
    intra4x4: new Array(10).fill(0).map(() => new Array(10).fill(0).map(() => new Array(10).fill(128))),
    coeff: new Array(4)
      .fill(0)
      .map(() => new Array(8).fill(0).map(() => new Array(3).fill(0).map(() => new Array(11).fill(128)))),
  };

  // Update Y mode probabilities if present
  for (let i = 0; i < 4; i++) {
    if (decoder.readBit(128) === 1) {
      probs.yMode[i] = decoder.readLiteral(8);
    }
  }

  // Update UV mode probabilities if present
  for (let i = 0; i < 3; i++) {
    if (decoder.readBit(128) === 1) {
      probs.uvMode[i] = decoder.readLiteral(8);
    }
  }

  // Coefficient probabilities are complex and would be updated here
  // For now, we use default values

  return probs;
}

/**
 * Read a signed value from the boolean decoder.
 *
 * @param {{ readBit: (prob: number) => 0|1, readLiteral: (n: number) => number }} decoder - Boolean decoder instance
 * @param {number} bits - Number of bits for magnitude
 * @returns {number} Signed value
 */
function readSignedValue(decoder, bits) {
  const magnitude = decoder.readLiteral(bits);
  const sign = decoder.readBit(128);
  return sign === 1 ? -magnitude : magnitude;
}

/**
 * Read a quantizer delta value.
 *
 * @param {{ readBit: (prob: number) => 0|1, readLiteral: (n: number) => number }} decoder - Boolean decoder instance
 * @returns {number} Delta value
 */
function readDeltaQ(decoder) {
  if (decoder.readBit(128) === 1) {
    return readSignedValue(decoder, 4);
  }
  return 0;
}
