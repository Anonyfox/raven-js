/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { extractMetadata, validateEXIF, validateICCP, validateXMP } from "./metadata.js";

describe("extractMetadata", () => {
  describe("core functionality", () => {
    it("extracts all standard metadata types", () => {
      const chunksByType = new Map([
        ["ICCP", [{ type: "ICCP", data: new Uint8Array([1, 2, 3, 4]) }]],
        ["EXIF", [{ type: "EXIF", data: new Uint8Array([5, 6, 7, 8]) }]],
        ["XMP ", [{ type: "XMP ", data: new Uint8Array([9, 10, 11, 12]) }]],
        ["VP8 ", [{ type: "VP8 ", data: new Uint8Array([13, 14, 15, 16]) }]],
      ]);

      const metadata = extractMetadata(chunksByType);

      assert.deepEqual([...metadata.icc], [1, 2, 3, 4]);
      assert.deepEqual([...metadata.exif], [5, 6, 7, 8]);
      assert.deepEqual([...metadata.xmp], [9, 10, 11, 12]);
      assert.equal(metadata.unknownChunks.length, 0);
    });

    it("handles missing metadata chunks gracefully", () => {
      const chunksByType = new Map([["VP8 ", [{ type: "VP8 ", data: new Uint8Array([1, 2, 3, 4]) }]]]);

      const metadata = extractMetadata(chunksByType);

      assert.equal(metadata.icc, undefined);
      assert.equal(metadata.exif, undefined);
      assert.equal(metadata.xmp, undefined);
      assert.equal(metadata.unknownChunks.length, 0);
    });

    it("collects unknown chunks", () => {
      const chunksByType = new Map([
        ["XXXX", [{ type: "XXXX", data: new Uint8Array([1, 2, 3, 4]) }]],
        ["YYYY", [{ type: "YYYY", data: new Uint8Array([5, 6, 7, 8]) }]],
        ["VP8 ", [{ type: "VP8 ", data: new Uint8Array([9, 10, 11, 12]) }]],
      ]);

      const metadata = extractMetadata(chunksByType);

      assert.equal(metadata.unknownChunks.length, 2);
      assert.equal(metadata.unknownChunks[0].type, "XXXX");
      assert.deepEqual([...metadata.unknownChunks[0].data], [1, 2, 3, 4]);
      assert.equal(metadata.unknownChunks[1].type, "YYYY");
      assert.deepEqual([...metadata.unknownChunks[1].data], [5, 6, 7, 8]);
    });

    it("uses first occurrence for duplicate metadata chunks", () => {
      const chunksByType = new Map([
        [
          "ICCP",
          [
            { type: "ICCP", data: new Uint8Array([1, 2, 3, 4]) },
            { type: "ICCP", data: new Uint8Array([5, 6, 7, 8]) },
          ],
        ],
      ]);

      const metadata = extractMetadata(chunksByType);

      assert.deepEqual([...metadata.icc], [1, 2, 3, 4]); // First occurrence
    });

    it("handles multiple unknown chunks of same type", () => {
      const chunksByType = new Map([
        [
          "XXXX",
          [
            { type: "XXXX", data: new Uint8Array([1, 2]) },
            { type: "XXXX", data: new Uint8Array([3, 4]) },
          ],
        ],
      ]);

      const metadata = extractMetadata(chunksByType);

      assert.equal(metadata.unknownChunks.length, 2);
      assert.deepEqual([...metadata.unknownChunks[0].data], [1, 2]);
      assert.deepEqual([...metadata.unknownChunks[1].data], [3, 4]);
    });
  });

  describe("known chunk types recognition", () => {
    it("recognizes all standard WebP chunk types", () => {
      const standardChunks = ["VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF", "ICCP", "EXIF", "XMP ", "META"];
      const chunksByType = new Map(
        standardChunks.map((type) => [type, [{ type, data: new Uint8Array([1, 2, 3, 4]) }]])
      );

      const metadata = extractMetadata(chunksByType);

      assert.equal(metadata.unknownChunks.length, 0);
    });
  });
});

describe("validateICCP", () => {
  describe("core validation", () => {
    it("passes valid ICC profile", () => {
      // Minimal valid ICC profile structure
      const validICC = new Uint8Array(128);
      validICC[0] = 0x00;
      validICC[1] = 0x00;
      validICC[2] = 0x00;
      validICC[3] = 0x80; // Size = 128
      validICC[36] = 0x61;
      validICC[37] = 0x63;
      validICC[38] = 0x73;
      validICC[39] = 0x70; // "acsp"

      const errors = validateICCP(validICC);

      assert.equal(errors.length, 0);
    });

    it("rejects profile too small", () => {
      const tooSmall = new Uint8Array(127);

      const errors = validateICCP(tooSmall);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /profile too small.*minimum 128 bytes/);
    });

    it("rejects invalid signature", () => {
      const invalidSig = new Uint8Array(128);
      invalidSig[0] = 0x00;
      invalidSig[1] = 0x00;
      invalidSig[2] = 0x00;
      invalidSig[3] = 0x80; // Size = 128
      invalidSig[36] = 0x62;
      invalidSig[37] = 0x61;
      invalidSig[38] = 0x64;
      invalidSig[39] = 0x21; // "bad!"

      const errors = validateICCP(invalidSig);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /invalid profile signature "bad!".*expected "acsp"/);
    });

    it("rejects size mismatch", () => {
      const sizeMismatch = new Uint8Array(128);
      sizeMismatch[0] = 0x00;
      sizeMismatch[1] = 0x00;
      sizeMismatch[2] = 0x01;
      sizeMismatch[3] = 0x00; // Size = 256 (wrong)
      sizeMismatch[36] = 0x61;
      sizeMismatch[37] = 0x63;
      sizeMismatch[38] = 0x73;
      sizeMismatch[39] = 0x70; // "acsp"

      const errors = validateICCP(sizeMismatch);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /profile size mismatch.*header: 256, actual: 128/);
    });
  });
});

describe("validateEXIF", () => {
  describe("core validation", () => {
    it("passes valid little-endian EXIF", () => {
      const validEXIF = new Uint8Array([
        0x49,
        0x49, // "II" (little-endian)
        0x2a,
        0x00, // Magic number 42 (little-endian)
        0x08,
        0x00,
        0x00,
        0x00, // IFD offset (little-endian)
      ]);

      const errors = validateEXIF(validEXIF);

      assert.equal(errors.length, 0);
    });

    it("passes valid big-endian EXIF", () => {
      const validEXIF = new Uint8Array([
        0x4d,
        0x4d, // "MM" (big-endian)
        0x00,
        0x2a, // Magic number 42 (big-endian)
        0x00,
        0x00,
        0x00,
        0x08, // IFD offset (big-endian)
      ]);

      const errors = validateEXIF(validEXIF);

      assert.equal(errors.length, 0);
    });

    it("rejects data too small", () => {
      const tooSmall = new Uint8Array([0x49, 0x49, 0x2a]); // Only 3 bytes

      const errors = validateEXIF(tooSmall);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /data too small.*minimum 8 bytes/);
    });

    it("rejects invalid TIFF header", () => {
      const invalidHeader = new Uint8Array([
        0x58,
        0x58, // "XX" (invalid)
        0x2a,
        0x00,
        0x08,
        0x00,
        0x00,
        0x00,
      ]);

      const errors = validateEXIF(invalidHeader);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /invalid TIFF header "XX".*expected "II" or "MM"/);
    });

    it("rejects invalid magic number in little-endian", () => {
      const invalidMagic = new Uint8Array([
        0x49,
        0x49, // "II"
        0x2b,
        0x00, // Magic number 43 (should be 42)
        0x08,
        0x00,
        0x00,
        0x00,
      ]);

      const errors = validateEXIF(invalidMagic);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /invalid TIFF magic number 43.*expected 42/);
    });

    it("rejects invalid magic number in big-endian", () => {
      const invalidMagic = new Uint8Array([
        0x4d,
        0x4d, // "MM"
        0x00,
        0x2b, // Magic number 43 (should be 42)
        0x00,
        0x00,
        0x00,
        0x08,
      ]);

      const errors = validateEXIF(invalidMagic);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /invalid TIFF magic number 43.*expected 42/);
    });
  });
});

describe("validateXMP", () => {
  describe("core validation", () => {
    it("passes valid XMP packet", () => {
      const validXMP = new TextEncoder().encode(
        '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>\n' +
          '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n' +
          '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
          "</rdf:RDF>\n" +
          "</x:xmpmeta>\n" +
          '<?xpacket end="w"?>'
      );

      const errors = validateXMP(validXMP);

      assert.equal(errors.length, 0);
    });

    it("rejects empty data", () => {
      const empty = new Uint8Array([]);

      const errors = validateXMP(empty);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /empty data/);
    });

    it("rejects invalid UTF-8", () => {
      const invalidUTF8 = new Uint8Array([0xff, 0xfe, 0x00, 0x00]); // Invalid UTF-8 sequence

      const errors = validateXMP(invalidUTF8);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /invalid UTF-8 encoding/);
    });

    it("rejects missing XMP packet structure", () => {
      const missingStructure = new TextEncoder().encode("This is just plain text without XMP structure");

      const errors = validateXMP(missingStructure);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /missing required XMP packet structure/);
    });

    it("rejects partial XMP structure", () => {
      const partialStructure = new TextEncoder().encode(
        '<?xpacket begin="﻿" id="test"?>\nNo proper XMP meta structure here'
      );

      const errors = validateXMP(partialStructure);

      assert.equal(errors.length, 1);
      assert.match(errors[0], /missing required XMP packet structure/);
    });
  });
});
