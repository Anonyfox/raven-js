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
  decodeSOS,
  determineScanType,
  getSOSSummary,
  MAX_COMPONENTS_PER_SCAN,
  MAX_SPECTRAL_INDEX,
  MAX_TABLE_ID,
  SCAN_TYPE,
  validateComponentSelector,
  validateHuffmanTables,
  validateInterleaving,
  validateSpectralSelection,
  validateSuccessiveApproximation,
} from "./decode-sos.js";

describe("JPEG SOS Decoder", () => {
  describe("Constants and Enums", () => {
    it("defines correct maximum values", () => {
      assert.equal(MAX_COMPONENTS_PER_SCAN, 4);
      assert.equal(MAX_SPECTRAL_INDEX, 63);
      assert.equal(MAX_TABLE_ID, 3);
    });

    it("defines scan type enumeration", () => {
      assert.equal(SCAN_TYPE.SEQUENTIAL, "sequential");
      assert.equal(SCAN_TYPE.PROGRESSIVE_DC, "progressive_dc");
      assert.equal(SCAN_TYPE.PROGRESSIVE_AC, "progressive_ac");
      assert.equal(SCAN_TYPE.PROGRESSIVE_REFINEMENT, "progressive_refinement");
      assert.equal(SCAN_TYPE.LOSSLESS, "lossless");
    });
  });

  describe("Component Validation", () => {
    const mockFrameComponents = [
      { id: 1, horizontalSampling: 2, verticalSampling: 2 },
      { id: 2, horizontalSampling: 1, verticalSampling: 1 },
      { id: 3, horizontalSampling: 1, verticalSampling: 1 },
    ];

    it("validates existing component", () => {
      const component = validateComponentSelector(1, mockFrameComponents);
      assert.equal(component.id, 1);
      assert.equal(component.horizontalSampling, 2);
    });

    it("throws on non-existent component", () => {
      assert.throws(() => {
        validateComponentSelector(4, mockFrameComponents);
      }, /Component 4 not found in frame/);
    });

    it("throws on invalid component ID", () => {
      assert.throws(() => {
        validateComponentSelector(-1, mockFrameComponents);
      }, /Invalid component selector: -1/);

      assert.throws(() => {
        validateComponentSelector(256, mockFrameComponents);
      }, /Invalid component selector: 256/);
    });

    it("throws on invalid frame components", () => {
      assert.throws(() => {
        validateComponentSelector(1, "not array");
      }, TypeError);
    });
  });

  describe("Huffman Table Validation", () => {
    const mockHuffmanTables = [
      { class: 0, id: 0 }, // DC table 0
      { class: 0, id: 1 }, // DC table 1
      { class: 1, id: 0 }, // AC table 0
      { class: 1, id: 1 }, // AC table 1
    ];

    it("validates existing DC and AC tables", () => {
      // Should not throw
      validateHuffmanTables(0, 0, mockHuffmanTables, true);
      validateHuffmanTables(1, 1, mockHuffmanTables, true);
    });

    it("validates DC-only scan (AC not required)", () => {
      // Should not throw even if AC table doesn't exist
      validateHuffmanTables(0, 2, mockHuffmanTables, false);
    });

    it("throws on missing DC table", () => {
      assert.throws(() => {
        validateHuffmanTables(2, 0, mockHuffmanTables, true);
      }, /DC Huffman table 2 not found/);
    });

    it("throws on missing AC table when required", () => {
      assert.throws(() => {
        validateHuffmanTables(0, 2, mockHuffmanTables, true);
      }, /AC Huffman table 2 not found/);
    });

    it("throws on invalid table IDs", () => {
      assert.throws(() => {
        validateHuffmanTables(-1, 0, mockHuffmanTables, true);
      }, /Invalid DC table ID: -1/);

      assert.throws(() => {
        validateHuffmanTables(0, 4, mockHuffmanTables, true);
      }, /Invalid AC table ID: 4/);
    });

    it("throws on invalid input types", () => {
      assert.throws(() => {
        validateHuffmanTables(0, 0, "not array", true);
      }, TypeError);
    });
  });

  describe("Spectral Selection Validation", () => {
    it("validates sequential scan", () => {
      // Should not throw
      validateSpectralSelection(0, 63, SCAN_TYPE.SEQUENTIAL);
    });

    it("validates progressive DC scan", () => {
      // Should not throw
      validateSpectralSelection(0, 0, SCAN_TYPE.PROGRESSIVE_DC);
    });

    it("validates progressive AC scan", () => {
      // Should not throw
      validateSpectralSelection(1, 5, SCAN_TYPE.PROGRESSIVE_AC);
      validateSpectralSelection(6, 63, SCAN_TYPE.PROGRESSIVE_AC);
    });

    it("throws on invalid spectral range", () => {
      assert.throws(() => {
        validateSpectralSelection(-1, 63, SCAN_TYPE.SEQUENTIAL);
      }, /Invalid start spectral: -1/);

      assert.throws(() => {
        validateSpectralSelection(0, 64, SCAN_TYPE.SEQUENTIAL);
      }, /Invalid end spectral: 64/);

      assert.throws(() => {
        validateSpectralSelection(5, 3, SCAN_TYPE.PROGRESSIVE_AC);
      }, /Invalid spectral range: Ss\(5\) > Se\(3\)/);
    });

    it("throws on invalid sequential parameters", () => {
      assert.throws(() => {
        validateSpectralSelection(0, 5, SCAN_TYPE.SEQUENTIAL);
      }, /Sequential scan must have Ss=0, Se=63/);
    });

    it("throws on invalid progressive DC parameters", () => {
      assert.throws(() => {
        validateSpectralSelection(0, 5, SCAN_TYPE.PROGRESSIVE_DC);
      }, /Progressive DC scan must have Ss=0, Se=0/);
    });

    it("throws on invalid progressive AC parameters", () => {
      assert.throws(() => {
        validateSpectralSelection(0, 0, SCAN_TYPE.PROGRESSIVE_AC);
      }, /Progressive AC scan cannot have Ss=0, Se=0/);
    });
  });

  describe("Successive Approximation Validation", () => {
    it("validates sequential scan", () => {
      // Should not throw
      validateSuccessiveApproximation(0, 0, SCAN_TYPE.SEQUENTIAL);
    });

    it("validates progressive first scan", () => {
      // Should not throw
      validateSuccessiveApproximation(0, 2, SCAN_TYPE.PROGRESSIVE_DC);
      validateSuccessiveApproximation(0, 1, SCAN_TYPE.PROGRESSIVE_AC);
    });

    it("validates progressive refinement", () => {
      // Should not throw
      validateSuccessiveApproximation(2, 1, SCAN_TYPE.PROGRESSIVE_REFINEMENT);
      validateSuccessiveApproximation(3, 2, SCAN_TYPE.PROGRESSIVE_REFINEMENT);
    });

    it("throws on invalid approximation values", () => {
      assert.throws(() => {
        validateSuccessiveApproximation(-1, 0, SCAN_TYPE.SEQUENTIAL);
      }, /Invalid approximation high: -1/);

      assert.throws(() => {
        validateSuccessiveApproximation(0, 14, SCAN_TYPE.SEQUENTIAL);
      }, /Invalid approximation low: 14/);
    });

    it("throws on invalid approximation relationship", () => {
      assert.throws(() => {
        validateSuccessiveApproximation(3, 1, SCAN_TYPE.PROGRESSIVE_REFINEMENT);
      }, /Invalid approximation: Ah=3 must equal Al\+1/);
    });

    it("throws on invalid sequential parameters", () => {
      assert.throws(() => {
        validateSuccessiveApproximation(1, 0, SCAN_TYPE.SEQUENTIAL);
      }, /Sequential scan must have Ah=0, Al=0/);
    });

    it("throws on invalid refinement parameters", () => {
      assert.throws(() => {
        validateSuccessiveApproximation(0, 1, SCAN_TYPE.PROGRESSIVE_REFINEMENT);
      }, /Progressive refinement scan must have Ah>0/);
    });
  });

  describe("Scan Type Determination", () => {
    it("determines sequential scan", () => {
      const type = determineScanType(0, 63, 0, 0);
      assert.equal(type, SCAN_TYPE.SEQUENTIAL);
    });

    it("determines progressive DC scan", () => {
      const type = determineScanType(0, 0, 0, 2);
      assert.equal(type, SCAN_TYPE.PROGRESSIVE_DC);
    });

    it("determines progressive AC scan", () => {
      let type = determineScanType(1, 5, 0, 0);
      assert.equal(type, SCAN_TYPE.PROGRESSIVE_AC);

      type = determineScanType(6, 63, 0, 1);
      assert.equal(type, SCAN_TYPE.PROGRESSIVE_AC);
    });

    it("determines progressive refinement scan", () => {
      let type = determineScanType(0, 0, 2, 1);
      assert.equal(type, SCAN_TYPE.PROGRESSIVE_REFINEMENT);

      type = determineScanType(1, 5, 1, 0);
      assert.equal(type, SCAN_TYPE.PROGRESSIVE_REFINEMENT);
    });
  });

  describe("Interleaving Validation", () => {
    const mockComponents = [{ id: 1 }, { id: 2 }, { id: 3 }];

    it("validates single component scan", () => {
      // Should not throw
      validateInterleaving([mockComponents[0]], SCAN_TYPE.SEQUENTIAL);
      validateInterleaving([mockComponents[0]], SCAN_TYPE.PROGRESSIVE_DC);
    });

    it("validates multi-component sequential scan", () => {
      // Should not throw
      validateInterleaving(mockComponents, SCAN_TYPE.SEQUENTIAL);
    });

    it("validates multi-component progressive scan", () => {
      // Should not throw (allowed but less common)
      validateInterleaving(mockComponents, SCAN_TYPE.PROGRESSIVE_DC);
    });

    it("throws on duplicate components", () => {
      const duplicateComponents = [{ id: 1 }, { id: 1 }];
      assert.throws(() => {
        validateInterleaving(duplicateComponents, SCAN_TYPE.SEQUENTIAL);
      }, /Duplicate components in scan not allowed/);
    });

    it("throws on invalid input", () => {
      assert.throws(() => {
        validateInterleaving("not array", SCAN_TYPE.SEQUENTIAL);
      }, TypeError);
    });
  });

  describe("Basic SOS Decoding", () => {
    const mockFrameComponents = [
      { id: 1, horizontalSampling: 2, verticalSampling: 2 },
      { id: 2, horizontalSampling: 1, verticalSampling: 1 },
      { id: 3, horizontalSampling: 1, verticalSampling: 1 },
    ];

    const mockHuffmanTables = [
      { class: 0, id: 0 }, // DC table 0
      { class: 0, id: 1 }, // DC table 1
      { class: 1, id: 0 }, // AC table 0
      { class: 1, id: 1 }, // AC table 1
    ];

    it("decodes sequential single component scan", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x00, // Component 1, DC table 0, AC table 0
        0,
        63, // Ss=0, Se=63 (full spectrum)
        0x00, // Ah=0, Al=0 (no approximation)
      ]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.componentCount, 1);
      assert.equal(sos.components[0].id, 1);
      assert.equal(sos.components[0].dcTableId, 0);
      assert.equal(sos.components[0].acTableId, 0);
      assert.equal(sos.startSpectral, 0);
      assert.equal(sos.endSpectral, 63);
      assert.equal(sos.approximationHigh, 0);
      assert.equal(sos.approximationLow, 0);
      assert.equal(sos.scanType, SCAN_TYPE.SEQUENTIAL);
      assert.equal(sos.isProgressive, false);
      assert.equal(sos.isInterleaved, false);
    });

    it("decodes sequential multi-component scan", () => {
      const data = new Uint8Array([
        3, // Ns: 3 components
        1,
        0x00, // Component 1, DC table 0, AC table 0
        2,
        0x11, // Component 2, DC table 1, AC table 1
        3,
        0x11, // Component 3, DC table 1, AC table 1
        0,
        63, // Ss=0, Se=63 (full spectrum)
        0x00, // Ah=0, Al=0 (no approximation)
      ]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.componentCount, 3);
      assert.equal(sos.components.length, 3);
      assert.equal(sos.scanType, SCAN_TYPE.SEQUENTIAL);
      assert.equal(sos.isInterleaved, true);
    });

    it("decodes progressive DC scan", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x00, // Component 1, DC table 0, AC table 0 (AC not used)
        0,
        0, // Ss=0, Se=0 (DC only)
        0x02, // Ah=0, Al=2 (first progressive scan)
      ]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.scanType, SCAN_TYPE.PROGRESSIVE_DC);
      assert.equal(sos.isProgressive, true);
      assert.equal(sos.isDCOnly, true);
      assert.equal(sos.approximationLow, 2);
    });

    it("decodes progressive AC scan", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x00, // Component 1, DC table 0, AC table 0
        1,
        5, // Ss=1, Se=5 (AC coefficients 1-5)
        0x00, // Ah=0, Al=0 (first AC scan)
      ]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.scanType, SCAN_TYPE.PROGRESSIVE_AC);
      assert.equal(sos.isProgressive, true);
      assert.equal(sos.isACOnly, true);
      assert.equal(sos.spectralRange, 5);
    });

    it("decodes progressive refinement scan", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x00, // Component 1, DC table 0, AC table 0
        0,
        0, // Ss=0, Se=0 (DC only)
        0x21, // Ah=2, Al=1 (refinement scan)
      ]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.scanType, SCAN_TYPE.PROGRESSIVE_REFINEMENT);
      assert.equal(sos.isRefinement, true);
      assert.equal(sos.approximationHigh, 2);
      assert.equal(sos.approximationLow, 1);
    });
  });

  describe("Error Handling", () => {
    const mockFrameComponents = [{ id: 1, horizontalSampling: 1, verticalSampling: 1 }];
    const mockHuffmanTables = [
      { class: 0, id: 0 },
      { class: 1, id: 0 },
    ];

    it("throws on invalid buffer type", () => {
      assert.throws(() => {
        decodeSOS(null, mockFrameComponents, mockHuffmanTables);
      }, TypeError);

      assert.throws(() => {
        decodeSOS("not buffer", mockFrameComponents, mockHuffmanTables);
      }, TypeError);
    });

    it("throws on invalid frame components", () => {
      const data = new Uint8Array([1, 1, 0x00, 0, 63, 0x00]);

      assert.throws(() => {
        decodeSOS(data, null, mockHuffmanTables);
      }, TypeError);
    });

    it("throws on invalid Huffman tables", () => {
      const data = new Uint8Array([1, 1, 0x00, 0, 63, 0x00]);

      assert.throws(() => {
        decodeSOS(data, mockFrameComponents, "not array");
      }, TypeError);
    });

    it("throws on data too short", () => {
      const shortData = new Uint8Array([1, 2, 3]); // Only 3 bytes

      assert.throws(() => {
        decodeSOS(shortData, mockFrameComponents, mockHuffmanTables);
      }, /SOS data too short: need at least 6 bytes/);
    });

    it("throws on invalid component count", () => {
      const data = new Uint8Array([
        0, // Ns: 0 components (invalid)
        0,
        0, // Dummy bytes to pass length check
        0,
        63,
        0x00,
      ]);

      assert.throws(() => {
        decodeSOS(data, mockFrameComponents, mockHuffmanTables);
      }, /Invalid component count: 0/);

      const data2 = new Uint8Array([
        5, // Ns: 5 components (too many)
        1,
        0x00,
        2,
        0x00,
        3,
        0x00,
        4,
        0x00,
        5,
        0x00,
        0,
        63,
        0x00,
      ]);

      assert.throws(() => {
        decodeSOS(data2, mockFrameComponents, mockHuffmanTables);
      }, /Invalid component count: 5/);
    });

    it("throws on malformed component data", () => {
      // Create a scenario where data is malformed and triggers validation errors
      const frameComponents = [{ id: 1 }, { id: 2 }];

      const data = new Uint8Array([
        2, // Ns: 2 components
        1,
        0x00, // Component 1 complete
        2,
        0x00, // Component 2 complete
        63,
        0, // Ss=63, Se=0 (invalid: Ss > Se)
        0x00,
      ]);

      assert.throws(() => {
        decodeSOS(data, frameComponents, mockHuffmanTables);
      }, /Invalid spectral range/);
    });

    it("throws on data length mismatch", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x00, // Component 1
        0,
        63,
        0x00, // Spectral and approximation
        0xff, // Extra byte
      ]);

      assert.throws(() => {
        decodeSOS(data, mockFrameComponents, mockHuffmanTables);
      }, /SOS parsing error.*expected to consume.*consumed/);
    });

    it("throws on non-existent component", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        99,
        0x00, // Component 99 (doesn't exist)
        0,
        63,
        0x00,
      ]);

      assert.throws(() => {
        decodeSOS(data, mockFrameComponents, mockHuffmanTables);
      }, /Component 99 not found in frame/);
    });

    it("throws on missing Huffman table", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x22, // Component 1, DC table 2, AC table 2 (don't exist)
        0,
        63,
        0x00,
      ]);

      assert.throws(() => {
        decodeSOS(data, mockFrameComponents, mockHuffmanTables);
      }, /DC Huffman table 2 not found/);
    });
  });

  describe("Edge Cases", () => {
    const mockFrameComponents = [
      { id: 1, horizontalSampling: 2, verticalSampling: 2 },
      { id: 2, horizontalSampling: 1, verticalSampling: 1 },
    ];

    const mockHuffmanTables = [
      { class: 0, id: 0 },
      { class: 0, id: 1 },
      { class: 1, id: 0 },
      { class: 1, id: 1 },
    ];

    it("handles maximum components per scan", () => {
      const frameComponents = [
        { id: 1, horizontalSampling: 1, verticalSampling: 1 },
        { id: 2, horizontalSampling: 1, verticalSampling: 1 },
        { id: 3, horizontalSampling: 1, verticalSampling: 1 },
        { id: 4, horizontalSampling: 1, verticalSampling: 1 },
      ];

      const data = new Uint8Array([
        4, // Ns: 4 components (maximum)
        1,
        0x00,
        2,
        0x00,
        3,
        0x00,
        4,
        0x00,
        0,
        63,
        0x00,
      ]);

      const sos = decodeSOS(data, frameComponents, mockHuffmanTables);
      assert.equal(sos.componentCount, 4);
    });

    it("handles maximum spectral indices", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x00, // Component 1
        63,
        63, // Ss=63, Se=63 (single AC coefficient)
        0x00,
      ]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);
      assert.equal(sos.startSpectral, 63);
      assert.equal(sos.endSpectral, 63);
      assert.equal(sos.spectralRange, 1);
    });

    it("handles maximum table IDs", () => {
      const huffmanTables = [
        { class: 0, id: 3 }, // DC table 3
        { class: 1, id: 3 }, // AC table 3
      ];

      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x33, // Component 1, DC table 3, AC table 3
        0,
        63,
        0x00,
      ]);

      const sos = decodeSOS(data, mockFrameComponents, huffmanTables);
      assert.equal(sos.components[0].dcTableId, 3);
      assert.equal(sos.components[0].acTableId, 3);
    });

    it("handles maximum approximation values", () => {
      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x00, // Component 1
        0,
        0, // Ss=0, Se=0 (DC only)
        0xdc, // Ah=13, Al=12 (maximum values)
      ]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);
      assert.equal(sos.approximationHigh, 13);
      assert.equal(sos.approximationLow, 12);
    });

    it("handles DC-only scan without AC table requirement", () => {
      const huffmanTablesNoAC = [
        { class: 0, id: 0 }, // Only DC table
      ];

      const data = new Uint8Array([
        1, // Ns: 1 component
        1,
        0x00, // Component 1, DC table 0, AC table 0 (not required)
        0,
        0, // Ss=0, Se=0 (DC only)
        0x00,
      ]);

      const sos = decodeSOS(data, mockFrameComponents, huffmanTablesNoAC);
      assert.equal(sos.isDCOnly, true);
    });
  });

  describe("Summary Generation", () => {
    it("generates sequential scan summary", () => {
      const scan = {
        scanType: SCAN_TYPE.SEQUENTIAL,
        componentCount: 3,
        components: [{ id: 1 }, { id: 2 }, { id: 3 }],
        startSpectral: 0,
        endSpectral: 63,
        isProgressive: false,
        isInterleaved: true,
        isDCOnly: false,
        isACOnly: false,
        isRefinement: false,
        spectralRange: 64,
        approximationHigh: 0,
        approximationLow: 0,
      };

      const summary = getSOSSummary(scan);

      assert.equal(summary.type, SCAN_TYPE.SEQUENTIAL);
      assert.equal(summary.componentCount, 3);
      assert.deepEqual(summary.componentIds, [1, 2, 3]);
      assert.equal(summary.isProgressive, false);
      assert.equal(summary.isInterleaved, true);
      assert(summary.description.includes("Sequential scan"));
      assert(summary.description.includes("3 components"));
      assert(summary.description.includes("Full(0-63)"));
    });

    it("generates progressive DC summary", () => {
      const scan = {
        scanType: SCAN_TYPE.PROGRESSIVE_DC,
        componentCount: 1,
        components: [{ id: 1 }],
        startSpectral: 0,
        endSpectral: 0,
        isProgressive: true,
        isInterleaved: false,
        isDCOnly: true,
        isACOnly: false,
        isRefinement: false,
        spectralRange: 1,
        approximationHigh: 0,
        approximationLow: 2,
      };

      const summary = getSOSSummary(scan);

      assert.equal(summary.type, SCAN_TYPE.PROGRESSIVE_DC);
      assert(summary.description.includes("Progressive DC scan"));
      assert(summary.description.includes("DC-only"));
    });

    it("generates progressive AC summary", () => {
      const scan = {
        scanType: SCAN_TYPE.PROGRESSIVE_AC,
        componentCount: 1,
        components: [{ id: 1 }],
        startSpectral: 1,
        endSpectral: 5,
        isProgressive: true,
        isInterleaved: false,
        isDCOnly: false,
        isACOnly: true,
        isRefinement: false,
        spectralRange: 5,
        approximationHigh: 0,
        approximationLow: 0,
      };

      const summary = getSOSSummary(scan);

      assert.equal(summary.type, SCAN_TYPE.PROGRESSIVE_AC);
      assert(summary.description.includes("Progressive AC scan"));
      assert(summary.description.includes("AC(1-5)"));
    });

    it("generates refinement summary", () => {
      const scan = {
        scanType: SCAN_TYPE.PROGRESSIVE_REFINEMENT,
        componentCount: 1,
        components: [{ id: 1 }],
        startSpectral: 0,
        endSpectral: 0,
        isProgressive: true,
        isInterleaved: false,
        isDCOnly: true,
        isACOnly: false,
        isRefinement: true,
        spectralRange: 1,
        approximationHigh: 2,
        approximationLow: 1,
      };

      const summary = getSOSSummary(scan);

      assert.equal(summary.type, SCAN_TYPE.PROGRESSIVE_REFINEMENT);
      assert(summary.description.includes("Progressive Refinement scan"));
      assert(summary.description.includes("Ah=2,Al=1"));
    });

    it("throws on invalid scan object", () => {
      assert.throws(() => {
        getSOSSummary(null);
      }, TypeError);

      assert.throws(() => {
        getSOSSummary("not object");
      }, TypeError);
    });
  });

  describe("Progressive JPEG Scenarios", () => {
    const mockFrameComponents = [{ id: 1, horizontalSampling: 1, verticalSampling: 1 }];
    const mockHuffmanTables = [
      { class: 0, id: 0 },
      { class: 1, id: 0 },
    ];

    it("handles progressive DC first scan", () => {
      const data = new Uint8Array([1, 1, 0x00, 0, 0, 0x03]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.scanType, SCAN_TYPE.PROGRESSIVE_DC);
      assert.equal(sos.approximationHigh, 0);
      assert.equal(sos.approximationLow, 3);
      assert.equal(sos.bitPrecision, 3);
    });

    it("handles progressive DC refinement scans", () => {
      const data = new Uint8Array([1, 1, 0x00, 0, 0, 0x32]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.scanType, SCAN_TYPE.PROGRESSIVE_REFINEMENT);
      assert.equal(sos.approximationHigh, 3);
      assert.equal(sos.approximationLow, 2);
    });

    it("handles progressive AC spectral bands", () => {
      // First AC band (1-5)
      let data = new Uint8Array([1, 1, 0x00, 1, 5, 0x00]);
      let sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.scanType, SCAN_TYPE.PROGRESSIVE_AC);
      assert.equal(sos.startSpectral, 1);
      assert.equal(sos.endSpectral, 5);

      // Second AC band (6-63)
      data = new Uint8Array([1, 1, 0x00, 6, 63, 0x00]);
      sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.scanType, SCAN_TYPE.PROGRESSIVE_AC);
      assert.equal(sos.startSpectral, 6);
      assert.equal(sos.endSpectral, 63);
    });

    it("handles combined spectral and approximation", () => {
      const data = new Uint8Array([1, 1, 0x00, 1, 5, 0x01]);

      const sos = decodeSOS(data, mockFrameComponents, mockHuffmanTables);

      assert.equal(sos.scanType, SCAN_TYPE.PROGRESSIVE_AC);
      assert.equal(sos.startSpectral, 1);
      assert.equal(sos.endSpectral, 5);
      assert.equal(sos.approximationLow, 1);
    });
  });

  describe("Component Enrichment", () => {
    it("enriches scan components with frame properties", () => {
      const frameComponents = [
        {
          id: 1,
          horizontalSampling: 2,
          verticalSampling: 2,
          quantizationTableId: 0,
          customProperty: "test",
        },
      ];

      const huffmanTables = [
        { class: 0, id: 0 },
        { class: 1, id: 0 },
      ];

      const data = new Uint8Array([1, 1, 0x00, 0, 63, 0x00]);

      const sos = decodeSOS(data, frameComponents, huffmanTables);

      const component = sos.components[0];
      assert.equal(component.id, 1);
      assert.equal(component.dcTableId, 0);
      assert.equal(component.acTableId, 0);
      assert.equal(component.horizontalSampling, 2);
      assert.equal(component.verticalSampling, 2);
      assert.equal(component.quantizationTableId, 0);
      assert.equal(component.customProperty, "test");
    });
  });
});
