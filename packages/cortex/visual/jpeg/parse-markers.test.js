/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  findMarkersByType,
  getJPEGInfo,
  getMarkerName,
  isStandaloneMarker,
  JPEG_MARKERS,
  parseJPEGMarkers,
} from "./parse-markers.js";

describe("JPEG Marker Parser", () => {
  describe("Marker Constants", () => {
    it("defines all critical JPEG markers", () => {
      assert.equal(JPEG_MARKERS.SOI, 0xd8);
      assert.equal(JPEG_MARKERS.EOI, 0xd9);
      assert.equal(JPEG_MARKERS.SOF0, 0xc0);
      assert.equal(JPEG_MARKERS.SOF2, 0xc2);
      assert.equal(JPEG_MARKERS.DHT, 0xc4);
      assert.equal(JPEG_MARKERS.DQT, 0xdb);
      assert.equal(JPEG_MARKERS.SOS, 0xda);
      assert.equal(JPEG_MARKERS.APP0, 0xe0);
      assert.equal(JPEG_MARKERS.APP1, 0xe1);
      assert.equal(JPEG_MARKERS.COM, 0xfe);
    });

    it("defines restart markers", () => {
      assert.equal(JPEG_MARKERS.RST0, 0xd0);
      assert.equal(JPEG_MARKERS.RST1, 0xd1);
      assert.equal(JPEG_MARKERS.RST7, 0xd7);
    });

    it("defines all SOF variants", () => {
      assert.equal(JPEG_MARKERS.SOF0, 0xc0);
      assert.equal(JPEG_MARKERS.SOF1, 0xc1);
      assert.equal(JPEG_MARKERS.SOF2, 0xc2);
      assert.equal(JPEG_MARKERS.SOF15, 0xcf);
    });
  });

  describe("Marker Name Resolution", () => {
    it("returns correct names for known markers", () => {
      assert.equal(getMarkerName(0xd8), "SOI");
      assert.equal(getMarkerName(0xd9), "EOI");
      assert.equal(getMarkerName(0xc0), "SOF0");
      assert.equal(getMarkerName(0xc2), "SOF2");
      assert.equal(getMarkerName(0xe0), "APP0");
      assert.equal(getMarkerName(0xe1), "APP1");
    });

    it("returns UNKNOWN for invalid markers", () => {
      assert.equal(getMarkerName(0x99), "UNKNOWN(0x99)");
      assert.equal(getMarkerName(0x00), "UNKNOWN(0x00)");
      assert.equal(getMarkerName(0xff), "UNKNOWN(0xFF)");
    });

    it("formats unknown markers with proper hex padding", () => {
      assert.equal(getMarkerName(0x02), "UNKNOWN(0x02)");
      assert.equal(getMarkerName(0x0a), "UNKNOWN(0x0A)");
    });
  });

  describe("Standalone Marker Detection", () => {
    it("identifies standalone markers correctly", () => {
      assert.equal(isStandaloneMarker(JPEG_MARKERS.SOI), true);
      assert.equal(isStandaloneMarker(JPEG_MARKERS.EOI), true);
      assert.equal(isStandaloneMarker(JPEG_MARKERS.RST0), true);
      assert.equal(isStandaloneMarker(JPEG_MARKERS.RST7), true);
      assert.equal(isStandaloneMarker(JPEG_MARKERS.TEM), true);
    });

    it("identifies non-standalone markers correctly", () => {
      assert.equal(isStandaloneMarker(JPEG_MARKERS.SOF0), false);
      assert.equal(isStandaloneMarker(JPEG_MARKERS.DHT), false);
      assert.equal(isStandaloneMarker(JPEG_MARKERS.DQT), false);
      assert.equal(isStandaloneMarker(JPEG_MARKERS.SOS), false);
      assert.equal(isStandaloneMarker(JPEG_MARKERS.APP0), false);
    });
  });

  describe("Basic Marker Parsing", () => {
    it("parses minimal valid JPEG (SOI + EOI)", () => {
      const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
      const markers = parseJPEGMarkers(buffer, { validateSequence: false });

      assert.equal(markers.length, 2);
      assert.equal(markers[0].markerCode, JPEG_MARKERS.SOI);
      assert.equal(markers[0].name, "SOI");
      assert.equal(markers[0].standalone, true);
      assert.equal(markers[0].data.length, 0);
      assert.equal(markers[1].markerCode, JPEG_MARKERS.EOI);
      assert.equal(markers[1].name, "EOI");
    });

    it("parses marker with length field", () => {
      // SOI + APP0 (length=16, 14 bytes data) + EOI
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xe0,
        0x00,
        0x10, // APP0, length=16
        0x4a,
        0x46,
        0x49,
        0x46,
        0x00, // "JFIF\0"
        0x01,
        0x01,
        0x01,
        0x00,
        0x48,
        0x00,
        0x48,
        0x00,
        0x00, // JFIF data
        0xff,
        0xd9, // EOI
      ]);

      const markers = parseJPEGMarkers(buffer, { validateSequence: false });

      assert.equal(markers.length, 3);
      assert.equal(markers[1].markerCode, JPEG_MARKERS.APP0);
      assert.equal(markers[1].name, "APP0");
      assert.equal(markers[1].standalone, false);
      assert.equal(markers[1].length, 14); // 16 - 2 (length field)
      assert.equal(markers[1].data.length, 14);
    });

    it("handles marker stuffing (0xFF00)", () => {
      // SOI + entropy data with marker stuffing + EOI
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0x12,
        0x34,
        0xff,
        0x00,
        0x56,
        0x78, // Data with marker stuffing
        0xff,
        0xd9, // EOI
      ]);

      const markers = parseJPEGMarkers(buffer, { includeEntropy: true, validateSequence: false });

      assert.equal(markers.length, 3);
      assert.equal(markers[0].name, "SOI");
      assert.equal(markers[1].name, "ENTROPY_DATA");
      assert.equal(markers[1].data.length, 6);
      assert.equal(markers[2].name, "EOI");
    });

    it("skips padding bytes (0xFFFF)", () => {
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xff,
        0xff,
        0xff, // Padding
        0xff,
        0xd9, // EOI
      ]);

      const markers = parseJPEGMarkers(buffer, { validateSequence: false });

      assert.equal(markers.length, 2);
      assert.equal(markers[0].name, "SOI");
      assert.equal(markers[1].name, "EOI");
    });
  });

  describe("Error Handling", () => {
    it("throws on invalid buffer type", () => {
      assert.throws(() => {
        parseJPEGMarkers(null);
      }, TypeError);

      assert.throws(() => {
        parseJPEGMarkers("not a buffer");
      }, TypeError);
    });

    it("throws on incomplete marker in strict mode", () => {
      // Incomplete APP0 marker
      const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);

      assert.throws(() => {
        parseJPEGMarkers(buffer, { strictMode: true });
      }, /Incomplete marker APP0/);
    });

    it("handles incomplete marker in non-strict mode", () => {
      const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);

      const markers = parseJPEGMarkers(buffer, { strictMode: false, validateSequence: false });

      assert.equal(markers.length, 1);
      assert.equal(markers[0].name, "SOI");
    });

    it("throws on invalid length field", () => {
      // APP0 with invalid length=1 (minimum is 2)
      const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01, 0xff, 0xd9]);

      assert.throws(() => {
        parseJPEGMarkers(buffer, { strictMode: true });
      }, /Invalid length 1 for marker APP0/);
    });

    it("handles invalid length in non-strict mode", () => {
      const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01, 0xff, 0xd9]);

      const markers = parseJPEGMarkers(buffer, { strictMode: false, validateSequence: false });

      assert.equal(markers.length, 3);
      assert.equal(markers[1].valid, false);
      assert(markers[1].error.includes("Invalid length"));
    });
  });

  describe("Sequence Validation", () => {
    it("validates correct marker sequence", () => {
      // SOI + SOF0 + SOS + EOI
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xc0,
        0x00,
        0x11, // SOF0 (length=17)
        0x08,
        0x00,
        0x10,
        0x00,
        0x10,
        0x01,
        0x01,
        0x11,
        0x00,
        0x02,
        0x11,
        0x01,
        0x03,
        0x11,
        0x01, // SOF data
        0xff,
        0xda,
        0x00,
        0x0c, // SOS (length=12)
        0x03,
        0x01,
        0x00,
        0x02,
        0x11,
        0x03,
        0x11,
        0x00,
        0x3f,
        0x00, // SOS data
        0xff,
        0xd9, // EOI
      ]);

      // Should not throw
      const markers = parseJPEGMarkers(buffer);
      assert.equal(markers.length, 4);
    });

    it("throws on missing SOI", () => {
      const buffer = new Uint8Array([0xff, 0xc0, 0x00, 0x02, 0xff, 0xd9]);

      assert.throws(() => {
        parseJPEGMarkers(buffer);
      }, /First marker must be SOI/);
    });

    it("throws on missing EOI", () => {
      const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x02]);

      assert.throws(() => {
        parseJPEGMarkers(buffer);
      }, /Last marker must be EOI/);
    });

    it("throws on missing SOF", () => {
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xda,
        0x00,
        0x02, // SOS
        0xff,
        0xd9, // EOI
      ]);

      assert.throws(() => {
        parseJPEGMarkers(buffer);
      }, /JPEG file must contain a Start of Frame/);
    });

    it("throws on missing SOS", () => {
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xc0,
        0x00,
        0x02, // SOF0
        0xff,
        0xd9, // EOI
      ]);

      assert.throws(() => {
        parseJPEGMarkers(buffer);
      }, /JPEG file must contain a Start of Scan/);
    });

    it("throws when SOF comes after SOS", () => {
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xda,
        0x00,
        0x02, // SOS
        0xff,
        0xc0,
        0x00,
        0x02, // SOF0
        0xff,
        0xd9, // EOI
      ]);

      assert.throws(() => {
        parseJPEGMarkers(buffer);
      }, /Start of Frame.*must appear before Start of Scan/);
    });

    it("allows disabling sequence validation", () => {
      const buffer = new Uint8Array([0xff, 0xc0, 0x00, 0x02, 0xff, 0xd9]);

      // Should not throw with validation disabled
      const markers = parseJPEGMarkers(buffer, { validateSequence: false });
      assert.equal(markers.length, 2);
    });
  });

  describe("Marker Filtering", () => {
    it("finds markers by type", () => {
      const markers = [
        { markerCode: JPEG_MARKERS.SOI, valid: true },
        { markerCode: JPEG_MARKERS.APP0, valid: true },
        { markerCode: JPEG_MARKERS.APP1, valid: true },
        { markerCode: JPEG_MARKERS.APP0, valid: true }, // Duplicate
        { markerCode: JPEG_MARKERS.EOI, valid: true },
      ];

      const app0Markers = findMarkersByType(markers, JPEG_MARKERS.APP0);
      assert.equal(app0Markers.length, 2);

      const app1Markers = findMarkersByType(markers, JPEG_MARKERS.APP1);
      assert.equal(app1Markers.length, 1);

      const dhtMarkers = findMarkersByType(markers, JPEG_MARKERS.DHT);
      assert.equal(dhtMarkers.length, 0);
    });

    it("excludes invalid markers", () => {
      const markers = [
        { markerCode: JPEG_MARKERS.APP0, valid: true },
        { markerCode: JPEG_MARKERS.APP0, valid: false },
      ];

      const validMarkers = findMarkersByType(markers, JPEG_MARKERS.APP0);
      assert.equal(validMarkers.length, 1);
    });

    it("throws on invalid input types", () => {
      assert.throws(() => {
        findMarkersByType("not array", JPEG_MARKERS.SOI);
      }, TypeError);

      assert.throws(() => {
        findMarkersByType([], "not number");
      }, TypeError);
    });
  });

  describe("JPEG File Information", () => {
    it("extracts basic file properties", () => {
      const markers = [
        { markerCode: JPEG_MARKERS.SOI, valid: true },
        { markerCode: JPEG_MARKERS.APP0, valid: true },
        { markerCode: JPEG_MARKERS.SOF0, valid: true },
        { markerCode: JPEG_MARKERS.SOS, valid: true },
        { markerCode: JPEG_MARKERS.EOI, valid: true },
      ];

      const info = getJPEGInfo(markers);

      assert.equal(info.hasSOI, true);
      assert.equal(info.hasEOI, true);
      assert.equal(info.hasSOF, true);
      assert.equal(info.hasSOS, true);
      assert.equal(info.progressive, false);
      assert.equal(info.arithmetic, false);
      assert.deepEqual(info.applications, ["APP0"]);
    });

    it("detects progressive JPEG", () => {
      const markers = [
        { markerCode: JPEG_MARKERS.SOI, valid: true },
        { markerCode: JPEG_MARKERS.SOF2, valid: true }, // Progressive
        { markerCode: JPEG_MARKERS.SOS, valid: true },
        { markerCode: JPEG_MARKERS.EOI, valid: true },
      ];

      const info = getJPEGInfo(markers);
      assert.equal(info.progressive, true);
    });

    it("detects arithmetic coding", () => {
      const markers = [
        { markerCode: JPEG_MARKERS.SOI, valid: true },
        { markerCode: JPEG_MARKERS.SOF9, valid: true }, // Arithmetic
        { markerCode: JPEG_MARKERS.SOS, valid: true },
        { markerCode: JPEG_MARKERS.EOI, valid: true },
      ];

      const info = getJPEGInfo(markers);
      assert.equal(info.arithmetic, true);
    });

    it("lists all application markers", () => {
      const markers = [
        { markerCode: JPEG_MARKERS.SOI, valid: true },
        { markerCode: JPEG_MARKERS.APP0, valid: true },
        { markerCode: JPEG_MARKERS.APP1, valid: true },
        { markerCode: JPEG_MARKERS.APP14, valid: true },
        { markerCode: JPEG_MARKERS.SOF0, valid: true },
        { markerCode: JPEG_MARKERS.SOS, valid: true },
        { markerCode: JPEG_MARKERS.EOI, valid: true },
      ];

      const info = getJPEGInfo(markers);
      assert.deepEqual(info.applications, ["APP0", "APP1", "APP14"]);
    });

    it("excludes invalid markers from analysis", () => {
      const markers = [
        { markerCode: JPEG_MARKERS.SOI, valid: false },
        { markerCode: JPEG_MARKERS.SOF0, valid: true },
        { markerCode: JPEG_MARKERS.SOS, valid: true },
        { markerCode: JPEG_MARKERS.EOI, valid: true },
      ];

      const info = getJPEGInfo(markers);
      assert.equal(info.hasSOI, false); // Invalid SOI excluded
      assert.equal(info.hasSOF, true);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty buffer", () => {
      const buffer = new Uint8Array([]);
      const markers = parseJPEGMarkers(buffer, { validateSequence: false });
      assert.equal(markers.length, 0);
    });

    it("handles buffer with no markers", () => {
      const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      const markers = parseJPEGMarkers(buffer, { validateSequence: false });
      assert.equal(markers.length, 0);
    });

    it("handles multiple restart markers", () => {
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xd0, // RST0
        0xff,
        0xd1, // RST1
        0xff,
        0xd7, // RST7
        0xff,
        0xd9, // EOI
      ]);

      const markers = parseJPEGMarkers(buffer, { validateSequence: false });
      assert.equal(markers.length, 5);
      assert.equal(markers[1].name, "RST0");
      assert.equal(markers[2].name, "RST1");
      assert.equal(markers[3].name, "RST7");
    });

    it("handles ArrayBuffer input", () => {
      const arrayBuffer = new ArrayBuffer(4);
      const view = new Uint8Array(arrayBuffer);
      view[0] = 0xff;
      view[1] = 0xd8;
      view[2] = 0xff;
      view[3] = 0xd9;

      const markers = parseJPEGMarkers(arrayBuffer, { validateSequence: false });
      assert.equal(markers.length, 2);
      assert.equal(markers[0].name, "SOI");
      assert.equal(markers[1].name, "EOI");
    });

    it("stops parsing at EOI marker", () => {
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0xff,
        0xd9, // EOI
        0xff,
        0xe0,
        0x00,
        0x02, // APP0 after EOI (should be ignored)
      ]);

      const markers = parseJPEGMarkers(buffer, { validateSequence: false });
      assert.equal(markers.length, 2);
      assert.equal(markers[1].name, "EOI");
    });

    it("includes entropy data when requested", () => {
      const buffer = new Uint8Array([
        0xff,
        0xd8, // SOI
        0x12,
        0x34,
        0x56, // Entropy data
        0xff,
        0xd9, // EOI
      ]);

      const markers = parseJPEGMarkers(buffer, { includeEntropy: true, validateSequence: false });
      assert.equal(markers.length, 3);
      assert.equal(markers[1].name, "ENTROPY_DATA");
      assert.equal(markers[1].data.length, 3);
    });
  });

  describe("Performance Edge Cases", () => {
    it("handles large markers efficiently", () => {
      // Create APP0 marker with maximum size (65535 - 2 = 65533 bytes data)
      const markerData = new Uint8Array(65533);
      markerData.fill(0x42); // Fill with test data

      const buffer = new Uint8Array(4 + 65533 + 4);
      buffer[0] = 0xff;
      buffer[1] = 0xd8; // SOI
      buffer[2] = 0xff;
      buffer[3] = 0xe0; // APP0
      buffer[4] = 0xff;
      buffer[5] = 0xff; // Length = 65535
      buffer.set(markerData, 6);
      buffer[buffer.length - 2] = 0xff;
      buffer[buffer.length - 1] = 0xd9; // EOI

      const markers = parseJPEGMarkers(buffer, { validateSequence: false });
      assert.equal(markers.length, 3);
      assert.equal(markers[1].data.length, 65533);
    });

    it("handles many small markers", () => {
      // Create 100 small APP0 markers
      const markerCount = 100;
      const markerSize = 6; // 4 bytes header + 2 bytes data
      const buffer = new Uint8Array(4 + markerCount * markerSize);

      let offset = 0;
      buffer[offset++] = 0xff;
      buffer[offset++] = 0xd8; // SOI

      for (let i = 0; i < markerCount; i++) {
        buffer[offset++] = 0xff;
        buffer[offset++] = 0xe0; // APP0
        buffer[offset++] = 0x00;
        buffer[offset++] = 0x04; // Length = 4 (2 bytes data)
        buffer[offset++] = 0x12;
        buffer[offset++] = 0x34; // Test data
      }

      buffer[offset++] = 0xff;
      buffer[offset++] = 0xd9; // EOI

      const markers = parseJPEGMarkers(buffer, { validateSequence: false });
      assert.equal(markers.length, markerCount + 2); // +2 for SOI and EOI
    });
  });
});
