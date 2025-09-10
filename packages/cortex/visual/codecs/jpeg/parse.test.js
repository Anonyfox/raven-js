/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for JPEG marker parsing.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import {
  findNextMarker,
  getAppIndex,
  getFrameType,
  getRestartIndex,
  isAppMarker,
  isEntropyCodedMarker,
  isRestartMarker,
  isResyncMarker,
  isSofMarker,
  MARKERS,
  parseMarker,
  readUint16BE,
  readUint32BE,
  validateSegmentLength,
  validateSOI,
} from "./parse.js";

/**
 * Helper to create minimal JPEG buffer with SOI
 */
function createMinimalJPEG() {
  return new Uint8Array([
    0xff,
    0xd8, // SOI
    0xff,
    0xd9, // EOI
  ]);
}

/**
 * Helper to create buffer with marker and payload
 */
function createMarkerBuffer(marker, payload) {
  const buffer = new Uint8Array(4 + payload.length);
  buffer[0] = (marker >> 8) & 0xff;
  buffer[1] = marker & 0xff;
  buffer[2] = ((payload.length + 2) >> 8) & 0xff;
  buffer[3] = (payload.length + 2) & 0xff;
  for (let i = 0; i < payload.length; i++) {
    buffer[4 + i] = payload[i];
  }
  return buffer;
}

describe("JPEG Marker Parsing", () => {
  describe("parseMarker", () => {
    it("should parse SOI marker correctly", () => {
      const buffer = createMinimalJPEG();
      const result = parseMarker(buffer, 0);

      assert.strictEqual(result.marker, MARKERS.SOI);
      assert.strictEqual(result.length, 0);
      assert.strictEqual(result.dataOffset, 2);
    });

    it("should parse EOI marker correctly", () => {
      const buffer = createMinimalJPEG();
      const result = parseMarker(buffer, 2);

      assert.strictEqual(result.marker, MARKERS.EOI);
      assert.strictEqual(result.length, 0);
      assert.strictEqual(result.dataOffset, 4);
    });

    it("should parse marker with payload correctly", () => {
      const payload = new Uint8Array([0x01, 0x02, 0x03]);
      const buffer = createMarkerBuffer(MARKERS.DQT, payload);
      const result = parseMarker(buffer, 0);

      assert.strictEqual(result.marker, MARKERS.DQT);
      assert.strictEqual(result.length, 5); // 2 + 3
      assert.strictEqual(result.dataOffset, 4);
      assert.strictEqual(result.endOffset, 7);
    });

    it("should reject invalid length", () => {
      const buffer = new Uint8Array([0xff, 0xdb, 0x00, 0x01]); // length = 1 (invalid)
      assert.throws(() => parseMarker(buffer, 0), /Invalid marker length/);
    });

    it("should reject buffer overflow", () => {
      const buffer = new Uint8Array([0xff, 0xdb, 0x00, 0x05]); // claims length 5 but buffer only 4
      assert.throws(() => parseMarker(buffer, 0), /payload exceeds buffer bounds/);
    });
  });

  describe("isRestartMarker", () => {
    it("should identify restart markers correctly", () => {
      assert.strictEqual(isRestartMarker(MARKERS.RST0), true);
      assert.strictEqual(isRestartMarker(MARKERS.RST7), true);
      assert.strictEqual(isRestartMarker(MARKERS.SOI), false);
      assert.strictEqual(isRestartMarker(MARKERS.DQT), false);
    });
  });

  describe("getRestartIndex", () => {
    it("should return correct restart index", () => {
      assert.strictEqual(getRestartIndex(MARKERS.RST0), 0);
      assert.strictEqual(getRestartIndex(MARKERS.RST3), 3);
      assert.strictEqual(getRestartIndex(MARKERS.RST7), 7);
    });

    it("should reject non-restart markers", () => {
      assert.throws(() => getRestartIndex(MARKERS.SOI), /Not a restart marker/);
    });
  });

  describe("findNextMarker", () => {
    it("should find marker after fill bytes", () => {
      const buffer = new Uint8Array([
        0xff,
        0x00, // fill byte
        0xff,
        0x00, // fill byte
        0xff,
        0xd8, // SOI marker
      ]);

      const offset = findNextMarker(buffer, 0);
      assert.strictEqual(offset, 4);
    });

    it("should handle stuffed bytes correctly", () => {
      const buffer = new Uint8Array([
        0xff,
        0x00, // stuffed byte (skip)
        0xff,
        0xc4, // DHT marker
      ]);

      const offset = findNextMarker(buffer, 0);
      assert.strictEqual(offset, 2);
    });

    it("should throw if no marker found within limit", () => {
      const buffer = new Uint8Array([0x00, 0x01, 0x02]); // no 0xFF
      assert.throws(() => findNextMarker(buffer, 0, 10), /No valid marker found/);
    });
  });

  describe("validateSOI", () => {
    it("should accept valid SOI", () => {
      const buffer = createMinimalJPEG();
      assert.doesNotThrow(() => validateSOI(buffer));
    });

    it("should reject buffer too small", () => {
      const buffer = new Uint8Array([0xff]);
      assert.throws(() => validateSOI(buffer), /Buffer too small/);
    });

    it("should reject invalid SOI marker", () => {
      const buffer = new Uint8Array([0xff, 0xc0]); // wrong marker
      assert.throws(() => validateSOI(buffer), /Invalid JPEG/);
    });
  });

  describe("marker classification", () => {
    it("should identify APP markers correctly", () => {
      assert.strictEqual(isAppMarker(MARKERS.APP0), true);
      assert.strictEqual(isAppMarker(MARKERS.APP14), true);
      assert.strictEqual(isAppMarker(MARKERS.APP15), true);
      assert.strictEqual(isAppMarker(MARKERS.SOI), false);
      assert.strictEqual(isAppMarker(MARKERS.DQT), false);
    });

    it("should identify SOF markers correctly", () => {
      assert.strictEqual(isSofMarker(MARKERS.SOF0), true);
      assert.strictEqual(isSofMarker(MARKERS.SOF2), true);
      assert.strictEqual(isSofMarker(MARKERS.SOI), false);
      assert.strictEqual(isSofMarker(MARKERS.APP0), false);
    });

    it("should identify resync markers correctly", () => {
      assert.strictEqual(isResyncMarker(MARKERS.RST0), true);
      assert.strictEqual(isResyncMarker(MARKERS.DRI), true);
      assert.strictEqual(isResyncMarker(MARKERS.SOI), false);
      assert.strictEqual(isResyncMarker(MARKERS.APP0), false);
    });

    it("should identify entropy-coded markers correctly", () => {
      assert.strictEqual(isEntropyCodedMarker(MARKERS.SOS), true);
      assert.strictEqual(isEntropyCodedMarker(MARKERS.SOI), false);
      assert.strictEqual(isEntropyCodedMarker(MARKERS.APP0), false);
    });
  });

  describe("marker utilities", () => {
    it("should get APP marker index correctly", () => {
      assert.strictEqual(getAppIndex(MARKERS.APP0), 0);
      assert.strictEqual(getAppIndex(MARKERS.APP14), 14);
      assert.strictEqual(getAppIndex(MARKERS.APP15), 15);
    });

    it("should reject non-APP markers for getAppIndex", () => {
      assert.throws(() => getAppIndex(MARKERS.SOI), /Not an APP marker/);
    });

    it("should get frame type correctly", () => {
      assert.strictEqual(getFrameType(MARKERS.SOF0), "Baseline DCT");
      assert.strictEqual(getFrameType(MARKERS.SOF2), "Progressive DCT");
    });

    it("should reject non-SOF markers for getFrameType", () => {
      assert.throws(() => getFrameType(MARKERS.SOI), /Not a SOF marker/);
    });
  });

  describe("segment validation", () => {
    it("should validate segment length correctly", () => {
      // Valid segment
      assert.doesNotThrow(() => validateSegmentLength(MARKERS.DQT, 4, 2));

      // Invalid length (< 2 for non-SOI/EOI markers)
      assert.throws(() => validateSegmentLength(MARKERS.DQT, 1, 0), /Invalid segment length/);

      // Truncated payload (strict mode)
      assert.throws(() => validateSegmentLength(MARKERS.DQT, 6, 2), /Segment payload truncated/);
    });
  });

  describe("binary utilities", () => {
    it("should read big-endian 16-bit values correctly", () => {
      const buffer = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
      assert.strictEqual(readUint16BE(buffer, 0), 0x1234);
      assert.strictEqual(readUint16BE(buffer, 2), 0xabcd);
    });

    it("should read big-endian 32-bit values correctly", () => {
      const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x00, 0x12, 0x34, 0x56]);
      assert.strictEqual(readUint32BE(buffer, 0), 0x12345678);
      // Use a smaller value that doesn't overflow in JavaScript bitwise operations
      assert.strictEqual(readUint32BE(buffer, 4), 0x00123456);
    });
  });

  describe("marker constants", () => {
    it("should have all required markers defined", () => {
      // Check critical markers are defined
      assert.strictEqual(typeof MARKERS.SOI, "number");
      assert.strictEqual(typeof MARKERS.EOI, "number");
      assert.strictEqual(typeof MARKERS.SOF0, "number");
      assert.strictEqual(typeof MARKERS.SOF2, "number");
      assert.strictEqual(typeof MARKERS.SOS, "number");
      assert.strictEqual(typeof MARKERS.DQT, "number");
      assert.strictEqual(typeof MARKERS.DHT, "number");
      assert.strictEqual(typeof MARKERS.DRI, "number");
      assert.strictEqual(typeof MARKERS.APP0, "number");
      assert.strictEqual(typeof MARKERS.APP14, "number");
      assert.strictEqual(typeof MARKERS.COM, "number");

      // Check restart markers
      for (let i = 0; i <= 7; i++) {
        assert.strictEqual(typeof MARKERS[`RST${i}`], "number");
      }

      // Check TEM marker
      assert.strictEqual(typeof MARKERS.TEM, "number");
    });
  });
});
