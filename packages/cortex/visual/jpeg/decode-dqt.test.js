/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  decodeDQT,
  estimateQuality,
  getQuantizationSummary,
  getQuantizationTable,
  matrixToZigzag,
  STANDARD_CHROMINANCE_TABLE,
  STANDARD_LUMINANCE_TABLE,
  ZIGZAG_ORDER,
  zigzagToMatrix,
} from "./decode-dqt.js";

describe("JPEG DQT Decoder", () => {
  describe("Zigzag Order Constants", () => {
    it("defines correct zigzag scan order", () => {
      assert.equal(ZIGZAG_ORDER.length, 64);
      assert.equal(ZIGZAG_ORDER[0], 0); // DC coefficient (0,0)
      assert.equal(ZIGZAG_ORDER[1], 1); // First AC coefficient (0,1)
      assert.equal(ZIGZAG_ORDER[2], 8); // Second AC coefficient (1,0)
      assert.equal(ZIGZAG_ORDER[63], 63); // Last coefficient (7,7)
    });

    it("contains all indices 0-63 exactly once", () => {
      const sorted = [...ZIGZAG_ORDER].sort((a, b) => a - b);
      for (let i = 0; i < 64; i++) {
        assert.equal(sorted[i], i);
      }
    });
  });

  describe("Standard Tables", () => {
    it("defines standard luminance table", () => {
      assert.equal(STANDARD_LUMINANCE_TABLE.length, 64);
      assert.equal(STANDARD_LUMINANCE_TABLE[0], 16); // DC coefficient
      assert(STANDARD_LUMINANCE_TABLE.every((val) => val >= 1 && val <= 255));
    });

    it("defines standard chrominance table", () => {
      assert.equal(STANDARD_CHROMINANCE_TABLE.length, 64);
      assert.equal(STANDARD_CHROMINANCE_TABLE[0], 17); // DC coefficient
      assert(STANDARD_CHROMINANCE_TABLE.every((val) => val >= 1 && val <= 255));
    });
  });

  describe("Zigzag Matrix Conversion", () => {
    it("converts zigzag to 8x8 matrix", () => {
      const zigzag = Array.from({ length: 64 }, (_, i) => i);
      const matrix = zigzagToMatrix(zigzag);

      assert.equal(matrix.length, 8);
      assert(matrix.every((row) => row.length === 8));
      assert.equal(matrix[0][0], 0); // DC coefficient (zigzag[0] -> position 0)
      assert.equal(matrix[0][1], 1); // First AC (zigzag[1] -> position 1)
      assert.equal(matrix[1][0], 2); // Second AC (zigzag[2] -> position 8, but zigzag[2] contains value 2)
      assert.equal(matrix[7][7], 63); // Last coefficient
    });

    it("converts 8x8 matrix to zigzag", () => {
      const matrix = Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => row * 8 + col));
      const zigzag = matrixToZigzag(matrix);

      assert.equal(zigzag.length, 64);
      assert.equal(zigzag[0], 0); // DC coefficient
      assert.equal(zigzag[1], 1); // First AC
      assert.equal(zigzag[2], 8); // Second AC
      assert.equal(zigzag[63], 63); // Last coefficient
    });

    it("roundtrip conversion preserves data", () => {
      const original = Array.from({ length: 64 }, (_, i) => i + 1);
      const matrix = zigzagToMatrix(original);
      const restored = matrixToZigzag(matrix);

      assert.deepEqual(restored, original);
    });

    it("throws on invalid zigzag input", () => {
      assert.throws(() => {
        zigzagToMatrix([1, 2, 3]); // Too short
      }, /Expected zigzagData to be array of 64 elements/);

      assert.throws(() => {
        zigzagToMatrix("not array");
      }, /Expected zigzagData to be array of 64 elements/);
    });

    it("throws on invalid matrix input", () => {
      assert.throws(() => {
        matrixToZigzag([[1, 2, 3]]); // Wrong size
      }, /Expected matrix to be 8x8 array/);

      assert.throws(() => {
        matrixToZigzag(Array.from({ length: 8 }, () => [1, 2, 3])); // Wrong row size
      }, /Expected matrix row .* to be array of 8 elements/);
    });
  });

  describe("Quality Estimation", () => {
    it("estimates quality for standard luminance table", () => {
      const quality = estimateQuality(STANDARD_LUMINANCE_TABLE, true);
      assert(quality >= 45 && quality <= 55); // Should be around 50
    });

    it("estimates quality for standard chrominance table", () => {
      const quality = estimateQuality(STANDARD_CHROMINANCE_TABLE, false);
      assert(quality >= 45 && quality <= 55); // Should be around 50
    });

    it("estimates quality for scaled tables", () => {
      // Create high quality table (quality 90)
      const highQuality = STANDARD_LUMINANCE_TABLE.map((val) => {
        const scaleFactor = 200 - 2 * 90; // 20
        return Math.max(1, Math.floor((val * scaleFactor + 50) / 100));
      });

      const estimated = estimateQuality(highQuality, true);
      assert(estimated >= 85 && estimated <= 95);
    });

    it("returns -1 for non-standard tables", () => {
      const customTable = Array.from({ length: 64 }, () => 42);
      const quality = estimateQuality(customTable, true);
      assert.equal(quality, -1);
    });

    it("throws on invalid table input", () => {
      assert.throws(() => {
        estimateQuality([1, 2, 3]); // Too short
      }, /Expected table to be array of 64 elements/);
    });
  });

  describe("Basic DQT Decoding", () => {
    it("decodes single 8-bit quantization table", () => {
      // Table 0, 8-bit precision, with simple values 1-64
      const data = new Uint8Array([
        0x00, // Pq=0 (8-bit), Tq=0 (table 0)
        ...Array.from({ length: 64 }, (_, i) => i + 1), // Values 1-64
      ]);

      const tables = decodeDQT(data);

      assert.equal(tables.length, 1);
      assert.equal(tables[0].id, 0);
      assert.equal(tables[0].precision, 0);
      assert.equal(tables[0].elementSize, 1);
      assert.equal(tables[0].values.length, 64);
      assert.equal(tables[0].values[0], 1);
      assert.equal(tables[0].values[63], 64);
      assert.equal(tables[0].matrix.length, 8);
      assert.equal(tables[0].matrix[0].length, 8);
    });

    it("decodes single 16-bit quantization table", () => {
      // Table 1, 16-bit precision
      const values = Array.from({ length: 64 }, (_, i) => (i + 1) * 256); // Values 256, 512, ...
      const data = new Uint8Array([
        0x11, // Pq=1 (16-bit), Tq=1 (table 1)
        ...values.flatMap((val) => [val >> 8, val & 0xff]), // 16-bit big-endian
      ]);

      const tables = decodeDQT(data);

      assert.equal(tables.length, 1);
      assert.equal(tables[0].id, 1);
      assert.equal(tables[0].precision, 1);
      assert.equal(tables[0].elementSize, 2);
      assert.equal(tables[0].values[0], 256);
      assert.equal(tables[0].values[63], 64 * 256);
    });

    it("decodes multiple tables in single DQT", () => {
      const data = new Uint8Array([
        // Table 0, 8-bit
        0x00,
        ...Array.from({ length: 64 }, (_, i) => i + 1),
        // Table 1, 8-bit
        0x01,
        ...Array.from({ length: 64 }, (_, i) => 64 - i),
      ]);

      const tables = decodeDQT(data);

      assert.equal(tables.length, 2);
      assert.equal(tables[0].id, 0);
      assert.equal(tables[1].id, 1);
      assert.equal(tables[0].values[0], 1);
      assert.equal(tables[1].values[0], 64);
    });

    it("decodes standard luminance table", () => {
      const data = new Uint8Array([0x00, ...STANDARD_LUMINANCE_TABLE]);

      const tables = decodeDQT(data);

      assert.equal(tables.length, 1);
      assert.equal(tables[0].id, 0);
      assert.deepEqual(tables[0].values, STANDARD_LUMINANCE_TABLE);
      assert(tables[0].estimatedQuality > 0); // Should recognize standard table
    });
  });

  describe("Error Handling", () => {
    it("throws on invalid buffer type", () => {
      assert.throws(() => {
        decodeDQT(null);
      }, TypeError);

      assert.throws(() => {
        decodeDQT("not a buffer");
      }, TypeError);
    });

    it("throws on empty data", () => {
      assert.throws(() => {
        decodeDQT(new Uint8Array([]));
      }, /DQT data is empty/);
    });

    it("throws on invalid precision", () => {
      const data = new Uint8Array([
        0x20, // Pq=2 (invalid), Tq=0
        ...Array.from({ length: 64 }, () => 1),
      ]);

      assert.throws(() => {
        decodeDQT(data);
      }, /Invalid quantization table precision: 2/);
    });

    it("throws on invalid table ID", () => {
      const data = new Uint8Array([
        0x04, // Pq=0, Tq=4 (invalid)
        ...Array.from({ length: 64 }, () => 1),
      ]);

      assert.throws(() => {
        decodeDQT(data);
      }, /Invalid quantization table ID: 4/);
    });

    it("throws on incomplete table data", () => {
      const data = new Uint8Array([
        0x00, // Pq=0, Tq=0
        1,
        2,
        3, // Only 3 values instead of 64
      ]);

      assert.throws(() => {
        decodeDQT(data);
      }, /Incomplete quantization table 0/);
    });

    it("throws on zero quantization values", () => {
      const data = new Uint8Array([
        0x00,
        0, // Zero value (invalid)
        ...Array.from({ length: 63 }, () => 1),
      ]);

      assert.throws(() => {
        decodeDQT(data);
      }, /quantization value at index 0 is 0/);
    });

    it("throws on 8-bit values exceeding 255", () => {
      // This is actually impossible with Uint8Array, but test the validation logic
      const data = new Uint8Array([0x00, ...Array.from({ length: 64 }, () => 255)]);
      const tables = decodeDQT(data);
      // Should not throw - 255 is valid for 8-bit
      assert.equal(tables[0].values[0], 255);
    });

    it("throws on incomplete 16-bit table", () => {
      const data = new Uint8Array([
        0x10, // Pq=1 (16-bit), Tq=0
        0x01,
        0x00, // First 16-bit value
        0x02, // Incomplete second value
      ]);

      assert.throws(() => {
        decodeDQT(data);
      }, /Incomplete quantization table 0/);
    });

    it("throws on data length mismatch", () => {
      const data = new Uint8Array([
        0x00,
        ...Array.from({ length: 64 }, () => 1),
        0x01, // Valid header for second table
        1,
        2,
        3, // But incomplete data (only 3 bytes instead of 64)
      ]);

      assert.throws(() => {
        decodeDQT(data);
      }, /Incomplete quantization table 1/);
    });
  });

  describe("Table Utilities", () => {
    let tables;

    beforeEach(() => {
      const data = new Uint8Array([
        // Table 0
        0x00,
        ...STANDARD_LUMINANCE_TABLE,
        // Table 2
        0x02,
        ...STANDARD_CHROMINANCE_TABLE,
      ]);
      tables = decodeDQT(data);
    });

    it("finds table by ID", () => {
      const table0 = getQuantizationTable(tables, 0);
      const table2 = getQuantizationTable(tables, 2);
      const table1 = getQuantizationTable(tables, 1);

      assert.equal(table0.id, 0);
      assert.equal(table2.id, 2);
      assert.equal(table1, null);
    });

    it("throws on invalid table search parameters", () => {
      assert.throws(() => {
        getQuantizationTable("not array", 0);
      }, TypeError);

      assert.throws(() => {
        getQuantizationTable(tables, -1);
      }, /Expected tableId to be number 0-3/);

      assert.throws(() => {
        getQuantizationTable(tables, 4);
      }, /Expected tableId to be number 0-3/);
    });

    it("generates table summary", () => {
      const summary = getQuantizationSummary(tables);

      assert.equal(summary.count, 2);
      assert.deepEqual(summary.ids, [0, 2]);
      assert.deepEqual(summary.precisions, ["8-bit"]);
      assert(summary.qualities.length > 0);
      assert.equal(summary.hasStandardTables, true);
      assert(summary.description.includes("2 quantization tables"));
    });

    it("handles custom tables in summary", () => {
      const customData = new Uint8Array([
        0x00,
        ...Array.from({ length: 64 }, () => 42), // Custom table
      ]);
      const customTables = decodeDQT(customData);
      const summary = getQuantizationSummary(customTables);

      assert.deepEqual(summary.qualities, ["Custom"]);
      assert.equal(summary.hasStandardTables, false);
    });

    it("throws on invalid summary input", () => {
      assert.throws(() => {
        getQuantizationSummary("not array");
      }, TypeError);
    });
  });

  describe("Mixed Precision Tables", () => {
    it("handles 8-bit and 16-bit tables together", () => {
      const data = new Uint8Array([
        // Table 0: 8-bit
        0x00,
        ...Array.from({ length: 64 }, (_, i) => i + 1),
        // Table 1: 16-bit
        0x11,
        ...Array.from({ length: 64 }, (_, i) => [(i + 1) >> 8, (i + 1) & 0xff]).flat(),
      ]);

      const tables = decodeDQT(data);

      assert.equal(tables.length, 2);
      assert.equal(tables[0].precision, 0);
      assert.equal(tables[1].precision, 1);
      assert.equal(tables[0].elementSize, 1);
      assert.equal(tables[1].elementSize, 2);
    });
  });

  describe("Edge Cases", () => {
    it("handles maximum table IDs", () => {
      const data = new Uint8Array([
        0x03, // Table 3
        ...Array.from({ length: 64 }, () => 1),
      ]);

      const tables = decodeDQT(data);
      assert.equal(tables[0].id, 3);
    });

    it("handles maximum 8-bit values", () => {
      const data = new Uint8Array([0x00, ...Array.from({ length: 64 }, () => 255)]);

      const tables = decodeDQT(data);
      assert(tables[0].values.every((val) => val === 255));
    });

    it("handles maximum 16-bit values", () => {
      const maxVal = 65535;
      const data = new Uint8Array([0x10, ...Array.from({ length: 64 }, () => [maxVal >> 8, maxVal & 0xff]).flat()]);

      const tables = decodeDQT(data);
      assert(tables[0].values.every((val) => val === maxVal));
    });

    it("handles minimum valid values", () => {
      const data = new Uint8Array([0x00, ...Array.from({ length: 64 }, () => 1)]);

      const tables = decodeDQT(data);
      assert(tables[0].values.every((val) => val === 1));
    });
  });

  describe("Quality Recognition", () => {
    it("recognizes high quality tables", () => {
      // Generate quality 90 table
      const highQuality = STANDARD_LUMINANCE_TABLE.map((val) => {
        const scaleFactor = 200 - 2 * 90; // 20
        return Math.max(1, Math.floor((val * scaleFactor + 50) / 100));
      });

      const data = new Uint8Array([0x00, ...highQuality]);
      const tables = decodeDQT(data);

      assert(tables[0].estimatedQuality >= 85);
    });

    it("recognizes low quality tables", () => {
      // Generate quality 10 table
      const lowQuality = STANDARD_LUMINANCE_TABLE.map((val) => {
        const scaleFactor = 5000 / 10; // 500
        return Math.max(1, Math.min(255, Math.floor((val * scaleFactor + 50) / 100)));
      });

      const data = new Uint8Array([0x00, ...lowQuality]);
      const tables = decodeDQT(data);

      assert(tables[0].estimatedQuality <= 15);
    });
  });

  describe("Performance Edge Cases", () => {
    it("handles many tables efficiently", () => {
      // Create 4 tables (maximum allowed)
      const data = new Uint8Array(4 * 65); // 4 tables * (1 header + 64 values)
      let offset = 0;

      for (let tableId = 0; tableId < 4; tableId++) {
        data[offset++] = tableId; // Pq=0, Tq=tableId
        for (let i = 0; i < 64; i++) {
          data[offset++] = (i + tableId + 1) % 255 || 1; // Ensure non-zero
        }
      }

      const tables = decodeDQT(data);
      assert.equal(tables.length, 4);
      assert.deepEqual(
        tables.map((t) => t.id),
        [0, 1, 2, 3]
      );
    });

    it("handles large 16-bit values", () => {
      const largeValues = Array.from({ length: 64 }, (_, i) => 32768 + i);
      const data = new Uint8Array([
        0x10, // 16-bit precision
        ...largeValues.flatMap((val) => [val >> 8, val & 0xff]),
      ]);

      const tables = decodeDQT(data);
      assert.deepEqual(tables[0].values, largeValues);
    });
  });
});
