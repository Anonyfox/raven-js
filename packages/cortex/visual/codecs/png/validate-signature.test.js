/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { getPNGSignature, validatePNGSignature } from "./validate-signature.js";

describe("PNG Signature Validation", () => {
  describe("validatePNGSignature", () => {
    it("validates correct PNG signature", () => {
      const validSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      assert.equal(validatePNGSignature(validSignature), true);
    });

    it("validates PNG signature with additional data", () => {
      const pngWithData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
      assert.equal(validatePNGSignature(pngWithData), true);
    });

    it("accepts ArrayBuffer input", () => {
      const buffer = new ArrayBuffer(16);
      const view = new Uint8Array(buffer);
      view.set([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);

      assert.equal(validatePNGSignature(buffer), true);
    });

    it("rejects invalid signature - wrong first byte", () => {
      const invalidSignature = new Uint8Array([138, 80, 78, 71, 13, 10, 26, 10]);
      assert.equal(validatePNGSignature(invalidSignature), false);
    });

    it("rejects invalid signature - wrong PNG bytes", () => {
      const invalidSignature = new Uint8Array([137, 80, 78, 72, 13, 10, 26, 10]);
      assert.equal(validatePNGSignature(invalidSignature), false);
    });

    it("rejects invalid signature - wrong line ending", () => {
      const invalidSignature = new Uint8Array([137, 80, 78, 71, 13, 11, 26, 10]);
      assert.equal(validatePNGSignature(invalidSignature), false);
    });

    it("rejects JPEG signature", () => {
      const jpegSignature = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70]);
      assert.equal(validatePNGSignature(jpegSignature), false);
    });

    it("rejects GIF signature", () => {
      const gifSignature = new Uint8Array([71, 73, 70, 56, 57, 97, 0, 0]);
      assert.equal(validatePNGSignature(gifSignature), false);
    });

    it("rejects WebP signature", () => {
      const webpSignature = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0]);
      assert.equal(validatePNGSignature(webpSignature), false);
    });

    it("rejects buffer shorter than signature", () => {
      const shortBuffer = new Uint8Array([137, 80, 78]);
      assert.equal(validatePNGSignature(shortBuffer), false);
    });

    it("rejects empty buffer", () => {
      const emptyBuffer = new Uint8Array(0);
      assert.equal(validatePNGSignature(emptyBuffer), false);
    });

    it("throws TypeError for null input", () => {
      assert.throws(() => validatePNGSignature(null), TypeError);
    });

    it("throws TypeError for undefined input", () => {
      assert.throws(() => validatePNGSignature(undefined), TypeError);
    });

    it("throws TypeError for string input", () => {
      assert.throws(() => validatePNGSignature("invalid"), TypeError);
    });

    it("throws TypeError for number input", () => {
      assert.throws(() => validatePNGSignature(123), TypeError);
    });
  });

  describe("getPNGSignature", () => {
    it("returns correct PNG signature", () => {
      const signature = getPNGSignature();
      const expected = [137, 80, 78, 71, 13, 10, 26, 10];

      assert(signature instanceof Uint8Array);
      assert.equal(signature.length, 8);
      assert.deepEqual(Array.from(signature), expected);
    });

    it("returns independent copy", () => {
      const sig1 = getPNGSignature();
      const sig2 = getPNGSignature();

      // Modify one copy
      sig1[0] = 999;

      // Other copy should be unchanged
      assert.equal(sig2[0], 137);
      assert.notEqual(sig1, sig2);
    });

    it("signature validates with validatePNGSignature", () => {
      const signature = getPNGSignature();
      assert.equal(validatePNGSignature(signature), true);
    });
  });

  describe("Edge Cases", () => {
    it("handles signature at buffer boundary", () => {
      // Exactly 8 bytes
      const exactSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      assert.equal(validatePNGSignature(exactSignature), true);
    });

    it("handles large buffers efficiently", () => {
      // Create large buffer with PNG signature at start
      const largeBuffer = new Uint8Array(1024 * 1024);
      largeBuffer.set([137, 80, 78, 71, 13, 10, 26, 10]);

      assert.equal(validatePNGSignature(largeBuffer), true);
    });

    it("detects corruption in each signature position", () => {
      const validSignature = [137, 80, 78, 71, 13, 10, 26, 10];

      // Test corruption at each position
      for (let i = 0; i < validSignature.length; i++) {
        const corrupted = [...validSignature];
        corrupted[i] = corrupted[i] ^ 1; // Flip a bit

        const corruptedBuffer = new Uint8Array(corrupted);
        assert.equal(validatePNGSignature(corruptedBuffer), false, `Should detect corruption at position ${i}`);
      }
    });
  });
});
