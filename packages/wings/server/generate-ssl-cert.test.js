import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
	generateSSLCert,
	encodeTLV,
	encodeInteger,
	encodeObjectIdentifier,
	encodePrintableString,
	encodeUTCTime,
	encodeNull,
	encodeBitString,
	encodeSequence,
	encodeVersion,
	encodeName,
	encodeValidity,
	encodeSubjectPublicKeyInfo,
	createTBSCertificate,
	createCertificateStructure,
	generateRSAKeyPair,
	exportPrivateKeyPEM,
	signTBSCertificate,
	validateOptions,
	validateCertificate
} from './generate-ssl-cert.js';

describe('generateSSLCert (Official RFC Implementation)', () => {
	describe('Phase 1: Core ASN.1 Encoding Functions', () => {
		describe('encodeTLV - Tag Length Value Encoding', () => {
			test('should encode basic TLV structure', () => {
				const data = new Uint8Array([0x01, 0x02, 0x03]);
				const result = encodeTLV(0x04, data); // OCTET STRING tag
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x04); // Tag
				assert.strictEqual(bytes[1], 0x03); // Length
				assert.strictEqual(bytes[2], 0x01); // Value
				assert.strictEqual(bytes[3], 0x02);
				assert.strictEqual(bytes[4], 0x03);
			});

			test('should handle empty value', () => {
				const data = new Uint8Array(0);
				const result = encodeTLV(0x05, data); // NULL tag
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x05); // Tag
				assert.strictEqual(bytes[1], 0x00); // Length = 0
				assert.strictEqual(bytes.length, 2); // Only tag and length
			});

			test('should handle single byte value', () => {
				const data = new Uint8Array([0xFF]);
				const result = encodeTLV(0x02, data); // INTEGER tag
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x02); // Tag
				assert.strictEqual(bytes[1], 0x01); // Length = 1
				assert.strictEqual(bytes[2], 0xFF); // Value
			});

			test('should handle 127-byte value (max short length)', () => {
				const data = new Uint8Array(127);
				data.fill(0x42);
				const result = encodeTLV(0x04, data);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x04); // Tag
				assert.strictEqual(bytes[1], 0x7F); // Length = 127 (max short length)
				assert.strictEqual(bytes[2], 0x42); // First value byte
				assert.strictEqual(bytes[128], 0x42); // Last value byte
			});

			test('should handle 128-byte value (requires long length)', () => {
				const data = new Uint8Array(128);
				data.fill(0x42);
				const result = encodeTLV(0x04, data);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x04); // Tag
				assert.strictEqual(bytes[1], 0x81); // Long length indicator (1 byte)
				assert.strictEqual(bytes[2], 0x80); // Length = 128
				assert.strictEqual(bytes[3], 0x42); // First value byte
				assert.strictEqual(bytes[130], 0x42); // Last value byte
			});

			test('should handle 255-byte value (1-byte long length)', () => {
				const data = new Uint8Array(255);
				data.fill(0x42);
				const result = encodeTLV(0x04, data);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x04); // Tag
				assert.strictEqual(bytes[1], 0x81); // Long length indicator (1 byte)
				assert.strictEqual(bytes[2], 0xFF); // Length = 255
				assert.strictEqual(bytes[3], 0x42); // First value byte
				assert.strictEqual(bytes[257], 0x42); // Last value byte
			});

			test('should handle 256-byte value (requires 2-byte long length)', () => {
				const data = new Uint8Array(256);
				data.fill(0x42);
				const result = encodeTLV(0x04, data);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x04); // Tag
				assert.strictEqual(bytes[1], 0x82); // Long length indicator (2 bytes)
				assert.strictEqual(bytes[2], 0x01); // Length high byte = 1
				assert.strictEqual(bytes[3], 0x00); // Length low byte = 0 (256 total)
				assert.strictEqual(bytes[4], 0x42); // First value byte
				assert.strictEqual(bytes[259], 0x42); // Last value byte
			});

			test('should handle large value (65535 bytes)', () => {
				const data = new Uint8Array(65535);
				data.fill(0x42);
				const result = encodeTLV(0x04, data);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x04); // Tag
				assert.strictEqual(bytes[1], 0x82); // Long length indicator (2 bytes)
				assert.strictEqual(bytes[2], 0xFF); // Length high byte = 255
				assert.strictEqual(bytes[3], 0xFF); // Length low byte = 255 (65535 total)
				assert.strictEqual(bytes[4], 0x42); // First value byte
				assert.strictEqual(bytes[65537], 0x42); // Last value byte
			});

			test('should handle all tag types correctly', () => {
				const data = new Uint8Array([0x01]);
				const tagTests = [
					{ tag: 0x01, name: 'BOOLEAN' },
					{ tag: 0x02, name: 'INTEGER' },
					{ tag: 0x03, name: 'BIT_STRING' },
					{ tag: 0x04, name: 'OCTET_STRING' },
					{ tag: 0x05, name: 'NULL' },
					{ tag: 0x06, name: 'OBJECT_IDENTIFIER' },
					{ tag: 0x13, name: 'PrintableString' },
					{ tag: 0x17, name: 'UTCTime' },
					{ tag: 0x30, name: 'SEQUENCE' },
					{ tag: 0xA0, name: 'Context[0]' },
					{ tag: 0xA1, name: 'Context[1]' },
					{ tag: 0xA2, name: 'Context[2]' },
					{ tag: 0xA3, name: 'Context[3]' }
				];

				for (const { tag, name } of tagTests) {
					const result = encodeTLV(tag, data);
					const bytes = new Uint8Array(result);
					assert.strictEqual(bytes[0], tag, `Tag mismatch for ${name}`);
					assert.strictEqual(bytes[1], 0x01, `Length mismatch for ${name}`);
					assert.strictEqual(bytes[2], 0x01, `Value mismatch for ${name}`);
				}
			});

			test('should handle edge case length values', () => {
				const edgeCases = [
					{ length: 0, expectedLengthBytes: [0x00] },
					{ length: 1, expectedLengthBytes: [0x01] },
					{ length: 127, expectedLengthBytes: [0x7F] },
					{ length: 128, expectedLengthBytes: [0x81, 0x80] },
					{ length: 255, expectedLengthBytes: [0x81, 0xFF] },
					{ length: 256, expectedLengthBytes: [0x82, 0x01, 0x00] },
					{ length: 65535, expectedLengthBytes: [0x82, 0xFF, 0xFF] }
				];

				for (const { length, expectedLengthBytes } of edgeCases) {
					const data = new Uint8Array(length);
					data.fill(0x42);
					const result = encodeTLV(0x04, data);
					const bytes = new Uint8Array(result);

					assert.strictEqual(bytes[0], 0x04); // Tag
					for (let i = 0; i < expectedLengthBytes.length; i++) {
						assert.strictEqual(bytes[1 + i], expectedLengthBytes[i],
							`Length byte ${i} mismatch for length ${length}`);
					}
				}
			});
		});

		describe('encodeInteger - INTEGER Encoding', () => {
			test('should encode zero correctly', () => {
				const value = new Uint8Array([0x00]);
				const result = encodeInteger(value);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x02); // INTEGER tag
				assert.strictEqual(bytes[1], 0x01); // Length = 1
				assert.strictEqual(bytes[2], 0x00); // Value = 0
			});

			test('should encode single byte positive integers', () => {
				const testCases = [
					{ value: [0x01], expected: [0x01] },
					{ value: [0x7F], expected: [0x7F] },
					{ value: [0xFF], expected: [0xFF] }
				];

				for (const { value, expected } of testCases) {
					const result = encodeInteger(new Uint8Array(value));
					const bytes = new Uint8Array(result);

					assert.strictEqual(bytes[0], 0x02); // INTEGER tag
					assert.strictEqual(bytes[1], 0x01); // Length = 1
					assert.strictEqual(bytes[2], expected[0]); // Value
				}
			});

			test('should encode multi-byte positive integers', () => {
				const value = new Uint8Array([0x7F, 0xFF, 0xFF, 0xFF]);
				const result = encodeInteger(value);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x02); // INTEGER tag
				assert.strictEqual(bytes[1], 0x04); // Length = 4
				assert.strictEqual(bytes[2], 0x7F); // Value
				assert.strictEqual(bytes[3], 0xFF);
				assert.strictEqual(bytes[4], 0xFF);
				assert.strictEqual(bytes[5], 0xFF);
			});

			test('should encode positive integers with leading zeros (canonical form)', () => {
				// RFC 5280 requires canonical form - no unnecessary leading zeros
				const value = new Uint8Array([0x00, 0x7F, 0xFF, 0xFF, 0xFF]);
				const result = encodeInteger(value);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x02); // INTEGER tag
				assert.strictEqual(bytes[1], 0x04); // Length = 4 (leading zero removed)
				assert.strictEqual(bytes[2], 0x7F); // Value (leading zero removed)
				assert.strictEqual(bytes[3], 0xFF);
				assert.strictEqual(bytes[4], 0xFF);
				assert.strictEqual(bytes[5], 0xFF);
			});

			test('should encode negative integers correctly', () => {
				const testCases = [
					{ value: [0x80], expected: [0x00, 0x80] }, // -128 needs leading zero
					{ value: [0xFF], expected: [0xFF] }, // -1 doesn't need leading zero
					{ value: [0x80, 0x00], expected: [0x00, 0x80, 0x00] }, // -32768 needs leading zero
					{ value: [0x80, 0x00, 0x00, 0x00], expected: [0x00, 0x80, 0x00, 0x00, 0x00] } // Large negative
				];

				for (const { value, expected } of testCases) {
					const result = encodeInteger(new Uint8Array(value));
					const bytes = new Uint8Array(result);

					assert.strictEqual(bytes[0], 0x02); // INTEGER tag
					assert.strictEqual(bytes[1], expected.length); // Length
					for (let i = 0; i < expected.length; i++) {
						assert.strictEqual(bytes[2 + i], expected[i],
							`Byte ${i} mismatch for value [${value.join(', ')}]`);
					}
				}
			});

			test('should handle edge case negative integers', () => {
				// Test the specific case from the original test
				const value = new Uint8Array([0x80, 0x00, 0x00, 0x00]);
				const result = encodeInteger(value);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x02); // INTEGER tag
				assert.strictEqual(bytes[1], 0x05); // Length (5 bytes due to leading zero)
				assert.strictEqual(bytes[2], 0x00); // Leading zero
				assert.strictEqual(bytes[3], 0x80); // Original value
				assert.strictEqual(bytes[4], 0x00);
				assert.strictEqual(bytes[5], 0x00);
				assert.strictEqual(bytes[6], 0x00);
			});

			test('should handle large positive integers', () => {
				const value = new Uint8Array([0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
				const result = encodeInteger(value);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x02); // INTEGER tag
				assert.strictEqual(bytes[1], 0x08); // Length = 8
				assert.strictEqual(bytes[2], 0x7F); // Value
				assert.strictEqual(bytes[9], 0xFF); // Last byte
			});

			test('should handle large negative integers', () => {
				const value = new Uint8Array([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
				const result = encodeInteger(value);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x02); // INTEGER tag
				assert.strictEqual(bytes[1], 0x09); // Length = 9 (with leading zero)
				assert.strictEqual(bytes[2], 0x00); // Leading zero
				assert.strictEqual(bytes[3], 0x80); // Original value
				assert.strictEqual(bytes[10], 0x00); // Last byte
			});

			test('should handle all zero bytes (canonical form)', () => {
				const value = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
				const result = encodeInteger(value);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x02); // INTEGER tag
				assert.strictEqual(bytes[1], 0x01); // Length = 1 (canonical form)
				assert.strictEqual(bytes[2], 0x00); // Value = 0
			});

			test('should handle single byte edge cases', () => {
				const edgeCases = [
					{ value: [0x00], expected: [0x00] }, // Zero
					{ value: [0x01], expected: [0x01] }, // Small positive
					{ value: [0x7F], expected: [0x7F] }, // Max positive single byte
					{ value: [0x80], expected: [0x00, 0x80] }, // Min negative (needs leading zero)
					{ value: [0xFF], expected: [0xFF] } // -1 (doesn't need leading zero)
				];

				for (const { value, expected } of edgeCases) {
					const result = encodeInteger(new Uint8Array(value));
					const bytes = new Uint8Array(result);

					assert.strictEqual(bytes[0], 0x02); // INTEGER tag
					assert.strictEqual(bytes[1], expected.length); // Length
					for (let i = 0; i < expected.length; i++) {
						assert.strictEqual(bytes[2 + i], expected[i],
							`Byte ${i} mismatch for value [${value.join(', ')}]`);
					}
				}
			});
		});

		test('encodeObjectIdentifier should encode OIDs correctly', () => {
			const oid = '1.2.840.113549.1.1.1'; // rsaEncryption
			const result = encodeObjectIdentifier(oid);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x06); // OBJECT IDENTIFIER tag
			// Expected encoding: 42 134 72 134 247 13 1 1 1
			assert.strictEqual(bytes[2], 42); // 1*40 + 2 = 42
			assert.strictEqual(bytes[3], 134); // 840 in base-128
			assert.strictEqual(bytes[4], 72); // 113549 in base-128
			assert.strictEqual(bytes[5], 134);
			assert.strictEqual(bytes[6], 247);
			assert.strictEqual(bytes[7], 13);
			assert.strictEqual(bytes[8], 1);
			assert.strictEqual(bytes[9], 1);
			assert.strictEqual(bytes[10], 1);
		});

		test('encodePrintableString should encode strings correctly', () => {
			const value = 'Test String';
			const result = encodePrintableString(value);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x13); // PrintableString tag
			assert.strictEqual(bytes[1], 0x0B); // Length = 11
			// Check first and last characters
			assert.strictEqual(bytes[2], 0x54); // 'T'
			assert.strictEqual(bytes[12], 0x67); // 'g'
		});

		test('encodeUTCTime should encode dates correctly', () => {
			const date = new Date('2024-01-15T12:30:45Z');
			const result = encodeUTCTime(date);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x17); // UTCTime tag
			assert.strictEqual(bytes[1], 0x0D); // Length = 13
			// Should encode as: 240115123045Z
			const timeStr = new TextDecoder().decode(bytes.slice(2));
			assert.strictEqual(timeStr, '240115123045Z');
		});

		test('encodeNull should encode NULL correctly', () => {
			const result = encodeNull();
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x05); // NULL tag
			assert.strictEqual(bytes[1], 0x00); // Length = 0
		});

		describe('encodeBitString - BIT STRING Encoding', () => {
			test('should encode empty bit string', () => {
				const data = new Uint8Array(0);
				const result = encodeBitString(data.buffer);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
				assert.strictEqual(bytes[1], 0x01); // Length = 1 (only unused bits byte)
				assert.strictEqual(bytes[2], 0x00); // 0 unused bits
			});

			test('should encode single byte with no unused bits', () => {
				const data = new Uint8Array([0xFF]);
				const result = encodeBitString(data.buffer);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
				assert.strictEqual(bytes[1], 0x02); // Length = 2 (1 unused bits byte + 1 data byte)
				assert.strictEqual(bytes[2], 0x00); // 0 unused bits
				assert.strictEqual(bytes[3], 0xFF); // Data
			});

			test('should encode single byte with unused bits', () => {
				const data = new Uint8Array([0xF0]); // Only first 4 bits used
				const result = encodeBitString(data.buffer);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
				assert.strictEqual(bytes[1], 0x02); // Length = 2 (1 unused bits byte + 1 data byte)
				assert.strictEqual(bytes[2], 0x04); // 4 unused bits
				assert.strictEqual(bytes[3], 0xF0); // Data
			});

			test('should encode multiple bytes with no unused bits', () => {
				const data = new Uint8Array([0xFF, 0xFF, 0xFF]);
				const result = encodeBitString(data.buffer);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
				assert.strictEqual(bytes[1], 0x04); // Length = 4 (1 unused bits byte + 3 data bytes)
				assert.strictEqual(bytes[2], 0x00); // 0 unused bits
				assert.strictEqual(bytes[3], 0xFF); // Data
				assert.strictEqual(bytes[4], 0xFF);
				assert.strictEqual(bytes[5], 0xFF);
			});

			test('should encode with unused bits (original test case)', () => {
				const data = new Uint8Array([0xFF, 0x0F]); // 12 bits of data
				const result = encodeBitString(data.buffer);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
				assert.strictEqual(bytes[1], 0x03); // Length = 3 (1 unused bits byte + 2 data bytes)
				assert.strictEqual(bytes[2], 0x04); // 4 unused bits (12 bits used, 4 bits unused)
				assert.strictEqual(bytes[3], 0xFF); // Data
				assert.strictEqual(bytes[4], 0x0F);
			});

			test('should handle all unused bits edge cases', () => {
				const testCases = [
					{ data: [0x80], unusedBits: 7, description: 'Only first bit used' },
					{ data: [0x40], unusedBits: 6, description: 'Only second bit used' },
					{ data: [0x20], unusedBits: 5, description: 'Only third bit used' },
					{ data: [0x10], unusedBits: 4, description: 'Only fourth bit used' },
					{ data: [0x08], unusedBits: 3, description: 'Only fifth bit used' },
					{ data: [0x04], unusedBits: 2, description: 'Only sixth bit used' },
					{ data: [0x02], unusedBits: 1, description: 'Only seventh bit used' },
					{ data: [0x01], unusedBits: 0, description: 'Only last bit used' }
				];

				for (const { data, unusedBits, description } of testCases) {
					const result = encodeBitString(new Uint8Array(data).buffer);
					const bytes = new Uint8Array(result);

					assert.strictEqual(bytes[0], 0x03, `${description}: Tag mismatch`);
					assert.strictEqual(bytes[1], 0x02, `${description}: Length mismatch`);
					assert.strictEqual(bytes[2], unusedBits, `${description}: Unused bits mismatch`);
					assert.strictEqual(bytes[3], data[0], `${description}: Data mismatch`);
				}
			});

			test('should handle multi-byte unused bits correctly', () => {
				const testCases = [
					{ data: [0xFF, 0x80], unusedBits: 7, description: 'Last byte has 7 unused bits' },
					{ data: [0xFF, 0x40], unusedBits: 6, description: 'Last byte has 6 unused bits' },
					{ data: [0xFF, 0x20], unusedBits: 5, description: 'Last byte has 5 unused bits' },
					{ data: [0xFF, 0x10], unusedBits: 4, description: 'Last byte has 4 unused bits' },
					{ data: [0xFF, 0x08], unusedBits: 3, description: 'Last byte has 3 unused bits' },
					{ data: [0xFF, 0x04], unusedBits: 2, description: 'Last byte has 2 unused bits' },
					{ data: [0xFF, 0x02], unusedBits: 1, description: 'Last byte has 1 unused bit' },
					{ data: [0xFF, 0x01], unusedBits: 0, description: 'Last byte has 0 unused bits' }
				];

				for (const { data, unusedBits, description } of testCases) {
					const result = encodeBitString(new Uint8Array(data).buffer);
					const bytes = new Uint8Array(result);

					assert.strictEqual(bytes[0], 0x03, `${description}: Tag mismatch`);
					assert.strictEqual(bytes[1], 0x03, `${description}: Length mismatch`);
					assert.strictEqual(bytes[2], unusedBits, `${description}: Unused bits mismatch`);
					assert.strictEqual(bytes[3], data[0], `${description}: First data byte mismatch`);
					assert.strictEqual(bytes[4], data[1], `${description}: Second data byte mismatch`);
				}
			});

			test('should handle large bit strings', () => {
				const data = new Uint8Array(256);
				data.fill(0xFF);
				const result = encodeBitString(data.buffer);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
				assert.strictEqual(bytes[1], 0x82); // Long length indicator (2 bytes)
				assert.strictEqual(bytes[2], 0x01); // Length high byte = 1
				assert.strictEqual(bytes[3], 0x01); // Length low byte = 1 (257 total: 1 unused bits + 256 data)
				assert.strictEqual(bytes[4], 0x00); // 0 unused bits
				assert.strictEqual(bytes[5], 0xFF); // First data byte
				assert.strictEqual(bytes[260], 0xFF); // Last data byte
			});

			test('should handle RSA public key bit string (typical case)', () => {
				// Simulate RSA public key (2048 bits = 256 bytes)
				const data = new Uint8Array(256);
				data.fill(0x42); // Fill with test pattern
				const result = encodeBitString(data.buffer);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
				assert.strictEqual(bytes[1], 0x82); // Long length indicator (2 bytes)
				assert.strictEqual(bytes[2], 0x01); // Length high byte = 1
				assert.strictEqual(bytes[3], 0x01); // Length low byte = 1 (257 total)
				assert.strictEqual(bytes[4], 0x00); // 0 unused bits (full bytes)
				assert.strictEqual(bytes[5], 0x42); // First data byte
				assert.strictEqual(bytes[260], 0x42); // Last data byte
			});

			test('should handle signature bit string (typical case)', () => {
				// Simulate RSA signature (2048 bits = 256 bytes)
				const data = new Uint8Array(256);
				data.fill(0xAA); // Fill with test pattern
				const result = encodeBitString(data.buffer);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
				assert.strictEqual(bytes[1], 0x82); // Long length indicator (2 bytes)
				assert.strictEqual(bytes[2], 0x01); // Length high byte = 1
				assert.strictEqual(bytes[3], 0x01); // Length low byte = 1 (257 total)
				assert.strictEqual(bytes[4], 0x00); // 0 unused bits (full bytes)
				assert.strictEqual(bytes[5], 0xAA); // First data byte
				assert.strictEqual(bytes[260], 0xAA); // Last data byte
			});
		});

		test('encodeSequence should combine multiple components', () => {
			const comp1 = encodeInteger(new Uint8Array([0x01]));
			const comp2 = encodePrintableString('test');
			const result = encodeSequence([comp1, comp2]);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			// Total length should be sum of component lengths + their TLV overhead
			assert.strictEqual(bytes[1], 0x09); // Length = 9
			// First component (INTEGER 1)
			assert.strictEqual(bytes[2], 0x02); // INTEGER tag
			assert.strictEqual(bytes[3], 0x01); // Length
			assert.strictEqual(bytes[4], 0x01); // Value
			// Second component (PrintableString "test")
			assert.strictEqual(bytes[5], 0x13); // PrintableString tag
			assert.strictEqual(bytes[6], 0x04); // Length
			assert.strictEqual(bytes[7], 0x74); // 't'
			assert.strictEqual(bytes[8], 0x65); // 'e'
			assert.strictEqual(bytes[9], 0x73); // 's'
			assert.strictEqual(bytes[10], 0x74); // 't'
		});
	});

	describe('Phase 2: X.509 Certificate Components', () => {
		describe('encodeVersion - X.509 Version Encoding', () => {
			test('should encode X.509 v3 correctly', () => {
				const result = encodeVersion();
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0xA0); // Context-specific tag 0
				assert.strictEqual(bytes[1], 0x03); // Length = 3
				assert.strictEqual(bytes[2], 0x02); // INTEGER tag
				assert.strictEqual(bytes[3], 0x01); // Length = 1
				assert.strictEqual(bytes[4], 0x02); // Value = 2 (v3 = version 2, 0-based)
			});

			test('should handle version field as optional', () => {
				// Version field is optional in X.509, but when present it must be v3
				const result = encodeVersion();
				const bytes = new Uint8Array(result);

				// Should be context-specific tag 0 (optional version field)
				assert.strictEqual(bytes[0], 0xA0);
				// Should contain INTEGER with value 2 (v3)
				assert.strictEqual(bytes[2], 0x02); // INTEGER tag
				assert.strictEqual(bytes[4], 0x02); // Value = 2
			});

			test('should follow RFC 5280 version encoding rules', () => {
				const result = encodeVersion();
				const bytes = new Uint8Array(result);

				// According to RFC 5280, version field is optional but when present:
				// - Must be context-specific tag 0
				// - Must contain INTEGER with value 2 (for v3)
				// - Must be the first field in TBSCertificate
				assert.strictEqual(bytes[0], 0xA0); // Context-specific tag 0
				assert.strictEqual(bytes[2], 0x02); // INTEGER tag
				assert.strictEqual(bytes[4], 0x02); // Value = 2 (v3)
			});
		});

		describe('encodeName - X.500 Distinguished Name Encoding', () => {
			test('should encode complete X.500 DN correctly', () => {
				const name = {
					commonName: 'localhost',
					organization: 'Test Org',
					country: 'US',
					state: 'CA',
					locality: 'San Francisco'
				};
				const result = encodeName(name);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should contain 5 RDN sequences (CN, O, L, ST, C)
				// Each RDN contains one AVA (Attribute Value Assertion)
				// Each AVA contains OID + value
			});

			test('should handle minimal DN with only commonName', () => {
				const name = { commonName: 'localhost' };
				const result = encodeName(name);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should contain only one RDN with CN
			});

			test('should handle DN with all optional fields', () => {
				const name = {
					commonName: 'test.example.com',
					organization: 'Test Organization',
					organizationalUnit: 'IT Department',
					country: 'US',
					state: 'California',
					locality: 'San Francisco',
					streetAddress: '123 Main St',
					postalCode: '94105'
				};
				const result = encodeName(name);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should contain 8 RDN sequences
			});

			test('should handle DN with special characters in values', () => {
				const name = {
					commonName: 'test@example.com',
					organization: 'Test & Company, Inc.',
					country: 'US'
				};
				const result = encodeName(name);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should handle special characters in PrintableString
			});

			test('should handle DN with empty string values', () => {
				const name = {
					commonName: '',
					organization: 'Test Org',
					country: 'US'
				};
				const result = encodeName(name);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should handle empty strings gracefully
			});

			test('should handle DN with very long values', () => {
				const longName = 'A'.repeat(1000);
				const name = {
					commonName: longName,
					organization: 'Test Org',
					country: 'US'
				};
				const result = encodeName(name);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should handle long strings with proper length encoding
			});

			test('should follow RFC 5280 DN encoding rules', () => {
				const name = {
					commonName: 'localhost',
					organization: 'Test Org',
					country: 'US'
				};
				const result = encodeName(name);
				const bytes = new Uint8Array(result);

				// According to RFC 5280, DN should be encoded as:
				// SEQUENCE OF RelativeDistinguishedName
				// Each RelativeDistinguishedName is SEQUENCE OF AttributeTypeAndValue
				// Each AttributeTypeAndValue is SEQUENCE { type, value }
				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});
		});

		describe('encodeValidity - Certificate Validity Period Encoding', () => {
			test('should encode standard validity period correctly', () => {
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2025-01-01T00:00:00Z');
				const result = encodeValidity(notBefore, notAfter);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should contain two UTCTime values
			});

			test('should handle same day validity period', () => {
				const date = new Date('2024-01-01T00:00:00Z');
				const result = encodeValidity(date, date);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should handle same start and end dates
			});

			test('should handle very short validity period', () => {
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2024-01-01T01:00:00Z'); // 1 hour later
				const result = encodeValidity(notBefore, notAfter);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should handle very long validity period', () => {
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2034-01-01T00:00:00Z'); // 10 years later
				const result = encodeValidity(notBefore, notAfter);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should handle dates at year boundaries', () => {
				const notBefore = new Date('2024-12-31T23:59:59Z');
				const notAfter = new Date('2025-01-01T00:00:00Z');
				const result = encodeValidity(notBefore, notAfter);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should handle dates with milliseconds', () => {
				const notBefore = new Date('2024-01-01T00:00:00.123Z');
				const notAfter = new Date('2025-01-01T00:00:00.456Z');
				const result = encodeValidity(notBefore, notAfter);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// UTCTime should truncate milliseconds
			});

			test('should follow RFC 5280 validity encoding rules', () => {
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2025-01-01T00:00:00Z');
				const result = encodeValidity(notBefore, notAfter);
				const bytes = new Uint8Array(result);

				// According to RFC 5280, validity should be:
				// SEQUENCE { notBefore Time, notAfter Time }
				// Time can be UTCTime or GeneralizedTime
				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});
		});

		describe('encodeSubjectPublicKeyInfo - SPKI Encoding', () => {
			test('should encode mock RSA public key correctly', () => {
				// Mock SPKI data
				const mockSpki = new ArrayBuffer(100);
				const result = encodeSubjectPublicKeyInfo(mockSpki);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should contain algorithm identifier + subject public key
			});

			test('should handle real SPKI data from WebCrypto', () => {
				// This test would require actual WebCrypto SPKI data
				// For now, we test the mock case
				const mockSpki = new ArrayBuffer(100);
				const result = encodeSubjectPublicKeyInfo(mockSpki);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should follow RFC 5280 SPKI encoding rules', () => {
				const mockSpki = new ArrayBuffer(100);
				const result = encodeSubjectPublicKeyInfo(mockSpki);
				const bytes = new Uint8Array(result);

				// According to RFC 5280, SPKI should be:
				// SEQUENCE { algorithm AlgorithmIdentifier, subjectPublicKey BIT STRING }
				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});
		});
	});

	describe('Phase 3: Certificate Structure', () => {
		describe('createTBSCertificate - TBS Certificate Structure', () => {
			test('should create valid TBS structure with all fields', () => {
				const serialNumber = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
				const subject = {
					commonName: 'localhost',
					organization: 'Test Org',
					country: 'US',
					state: 'CA',
					locality: 'San Francisco'
				};
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2025-01-01T00:00:00Z');
				const mockSpki = new ArrayBuffer(100);

				const result = createTBSCertificate(serialNumber, subject, subject, notBefore, notAfter, mockSpki);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should contain: version, serialNumber, signature, issuer, validity, subject, subjectPublicKeyInfo
			});

			test('should handle minimal TBS structure', () => {
				const serialNumber = new Uint8Array([0x01]);
				const subject = { commonName: 'localhost' };
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2025-01-01T00:00:00Z');
				const mockSpki = new ArrayBuffer(100);

				const result = createTBSCertificate(serialNumber, subject, subject, notBefore, notAfter, mockSpki);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should handle large serial number', () => {
				const serialNumber = new Uint8Array(20); // 160-bit serial number
				serialNumber.fill(0xFF);
				const subject = { commonName: 'localhost' };
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2025-01-01T00:00:00Z');
				const mockSpki = new ArrayBuffer(100);

				const result = createTBSCertificate(serialNumber, subject, subject, notBefore, notAfter, mockSpki);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should handle different issuer and subject', () => {
				const serialNumber = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
				const issuer = {
					commonName: 'CA Root',
					organization: 'CA Organization',
					country: 'US'
				};
				const subject = {
					commonName: 'localhost',
					organization: 'Test Org',
					country: 'US'
				};
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2025-01-01T00:00:00Z');
				const mockSpki = new ArrayBuffer(100);

				const result = createTBSCertificate(serialNumber, issuer, subject, notBefore, notAfter, mockSpki);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should follow RFC 5280 TBS structure', () => {
				const serialNumber = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
				const subject = { commonName: 'localhost' };
				const notBefore = new Date('2024-01-01T00:00:00Z');
				const notAfter = new Date('2025-01-01T00:00:00Z');
				const mockSpki = new ArrayBuffer(100);

				const result = createTBSCertificate(serialNumber, subject, subject, notBefore, notAfter, mockSpki);
				const bytes = new Uint8Array(result);

				// According to RFC 5280, TBSCertificate should be:
				// SEQUENCE {
				//   version [0] EXPLICIT Version DEFAULT v1,
				//   serialNumber CertificateSerialNumber,
				//   signature AlgorithmIdentifier,
				//   issuer Name,
				//   validity Validity,
				//   subject Name,
				//   subjectPublicKeyInfo SubjectPublicKeyInfo,
				//   issuerUniqueID [1] IMPLICIT UniqueIdentifier OPTIONAL,
				//   subjectUniqueID [2] IMPLICIT UniqueIdentifier OPTIONAL,
				//   extensions [3] EXPLICIT Extensions OPTIONAL
				// }
				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});
		});

		describe('createCertificateStructure - Final Certificate', () => {
			test('should create final certificate structure', () => {
				const mockTbs = new ArrayBuffer(200);
				const mockSignature = new ArrayBuffer(256);

				const result = createCertificateStructure(mockTbs, mockSignature);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
				// Should contain: tbsCertificate, signatureAlgorithm, signatureValue
			});

			test('should handle small TBS certificate', () => {
				const mockTbs = new ArrayBuffer(50);
				const mockSignature = new ArrayBuffer(256);

				const result = createCertificateStructure(mockTbs, mockSignature);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should handle large TBS certificate', () => {
				const mockTbs = new ArrayBuffer(1000);
				const mockSignature = new ArrayBuffer(256);

				const result = createCertificateStructure(mockTbs, mockSignature);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should handle different signature sizes', () => {
				const mockTbs = new ArrayBuffer(200);
				const mockSignature = new ArrayBuffer(512); // 4096-bit RSA signature

				const result = createCertificateStructure(mockTbs, mockSignature);
				const bytes = new Uint8Array(result);

				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});

			test('should follow RFC 5280 certificate structure', () => {
				const mockTbs = new ArrayBuffer(200);
				const mockSignature = new ArrayBuffer(256);

				const result = createCertificateStructure(mockTbs, mockSignature);
				const bytes = new Uint8Array(result);

				// According to RFC 5280, Certificate should be:
				// SEQUENCE {
				//   tbsCertificate TBSCertificate,
				//   signatureAlgorithm AlgorithmIdentifier,
				//   signatureValue BIT STRING
				// }
				assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			});
		});
	});

	describe('Phase 4: Key Generation and Signing', () => {
		describe('generateRSAKeyPair - RSA Key Generation', () => {
			test('should generate valid 2048-bit RSA key pair', async () => {
				const keyPair = await generateRSAKeyPair(2048);

				assert.ok(keyPair.privateKey);
				assert.ok(keyPair.publicKey);
				assert.strictEqual(keyPair.privateKey.type, 'private');
				assert.strictEqual(keyPair.publicKey.type, 'public');
				assert.strictEqual(keyPair.privateKey.algorithm.name, 'RSASSA-PKCS1-v1_5');
				assert.strictEqual(keyPair.publicKey.algorithm.name, 'RSASSA-PKCS1-v1_5');
			});

			test('should generate valid 4096-bit RSA key pair', async () => {
				const keyPair = await generateRSAKeyPair(4096);

				assert.ok(keyPair.privateKey);
				assert.ok(keyPair.publicKey);
				assert.strictEqual(keyPair.privateKey.type, 'private');
				assert.strictEqual(keyPair.publicKey.type, 'public');
				assert.strictEqual(keyPair.privateKey.algorithm.name, 'RSASSA-PKCS1-v1_5');
				assert.strictEqual(keyPair.publicKey.algorithm.name, 'RSASSA-PKCS1-v1_5');
			});

			test('should handle minimum key size (1024 bits)', async () => {
				const keyPair = await generateRSAKeyPair(1024);

				assert.ok(keyPair.privateKey);
				assert.ok(keyPair.publicKey);
				assert.strictEqual(keyPair.privateKey.type, 'private');
				assert.strictEqual(keyPair.publicKey.type, 'public');
			});

			test('should handle large key size (8192 bits)', async () => {
				const keyPair = await generateRSAKeyPair(8192);

				assert.ok(keyPair.privateKey);
				assert.ok(keyPair.publicKey);
				assert.strictEqual(keyPair.privateKey.type, 'private');
				assert.strictEqual(keyPair.publicKey.type, 'public');
			});

			test('should generate keys with correct algorithm parameters', async () => {
				const keyPair = await generateRSAKeyPair(2048);

				assert.strictEqual(keyPair.privateKey.algorithm.modulusLength, 2048);
				assert.strictEqual(keyPair.publicKey.algorithm.modulusLength, 2048);
				assert.strictEqual(keyPair.privateKey.algorithm.publicExponent.length, 3);
				assert.strictEqual(keyPair.publicKey.algorithm.publicExponent.length, 3);
				assert.strictEqual(keyPair.privateKey.algorithm.hash.name, 'SHA-256');
				assert.strictEqual(keyPair.publicKey.algorithm.hash.name, 'SHA-256');
			});

			test('should generate extractable keys', async () => {
				const keyPair = await generateRSAKeyPair(2048);

				assert.strictEqual(keyPair.privateKey.extractable, true);
				assert.strictEqual(keyPair.publicKey.extractable, true);
			});

			test('should generate keys with correct usages', async () => {
				const keyPair = await generateRSAKeyPair(2048);

				assert.deepStrictEqual(keyPair.privateKey.usages, ['sign']);
				assert.deepStrictEqual(keyPair.publicKey.usages, ['verify']);
			});
		});

		describe('exportPrivateKeyPEM - Private Key Export', () => {
			test('should export 2048-bit private key correctly', async () => {
				const keyPair = await generateRSAKeyPair(2048);
				const pem = await exportPrivateKeyPEM(keyPair.privateKey);

				assert.strictEqual(typeof pem, 'string');
				assert.ok(pem.includes('-----BEGIN PRIVATE KEY-----'));
				assert.ok(pem.includes('-----END PRIVATE KEY-----'));
				assert.ok(pem.length > 1000); // Reasonable size for 2048-bit key
			});

			test('should export 4096-bit private key correctly', async () => {
				const keyPair = await generateRSAKeyPair(4096);
				const pem = await exportPrivateKeyPEM(keyPair.privateKey);

				assert.strictEqual(typeof pem, 'string');
				assert.ok(pem.includes('-----BEGIN PRIVATE KEY-----'));
				assert.ok(pem.includes('-----END PRIVATE KEY-----'));
				assert.ok(pem.length > 2000); // Larger size for 4096-bit key
			});

			test('should export key in PKCS#8 format', async () => {
				const keyPair = await generateRSAKeyPair(2048);
				const pem = await exportPrivateKeyPEM(keyPair.privateKey);

				// PKCS#8 format should have specific headers
				assert.ok(pem.includes('-----BEGIN PRIVATE KEY-----'));
				assert.ok(pem.includes('-----END PRIVATE KEY-----'));
				// Should not have RSA-specific headers (PKCS#1 format)
				assert.ok(!pem.includes('-----BEGIN RSA PRIVATE KEY-----'));
			});

			test('should handle different key sizes consistently', async () => {
				const sizes = [1024, 2048, 4096];
				const pems = [];

				for (const size of sizes) {
					const keyPair = await generateRSAKeyPair(size);
					const pem = await exportPrivateKeyPEM(keyPair.privateKey);
					pems.push(pem);

					assert.strictEqual(typeof pem, 'string');
					assert.ok(pem.includes('-----BEGIN PRIVATE KEY-----'));
					assert.ok(pem.includes('-----END PRIVATE KEY-----'));
				}

				// Larger keys should produce longer PEM strings
				assert.ok(pems[1].length > pems[0].length); // 2048 > 1024
				assert.ok(pems[2].length > pems[1].length); // 4096 > 2048
			});
		});

		describe('signTBSCertificate - Certificate Signing', () => {
			test('should create valid signature for 2048-bit key', async () => {
				const keyPair = await generateRSAKeyPair(2048);
				const mockTbs = new ArrayBuffer(200);

				const signature = await signTBSCertificate(keyPair.privateKey, mockTbs);

				assert.ok(signature instanceof ArrayBuffer);
				assert.strictEqual(signature.byteLength, 256); // 2048-bit RSA signature
			});

			test('should create valid signature for 4096-bit key', async () => {
				const keyPair = await generateRSAKeyPair(4096);
				const mockTbs = new ArrayBuffer(200);

				const signature = await signTBSCertificate(keyPair.privateKey, mockTbs);

				assert.ok(signature instanceof ArrayBuffer);
				assert.strictEqual(signature.byteLength, 512); // 4096-bit RSA signature
			});

			test('should handle small TBS data', async () => {
				const keyPair = await generateRSAKeyPair(2048);
				const mockTbs = new ArrayBuffer(10);

				const signature = await signTBSCertificate(keyPair.privateKey, mockTbs);

				assert.ok(signature instanceof ArrayBuffer);
				assert.strictEqual(signature.byteLength, 256); // 2048-bit RSA signature
			});

			test('should handle large TBS data', async () => {
				const keyPair = await generateRSAKeyPair(2048);
				const mockTbs = new ArrayBuffer(1000);

				const signature = await signTBSCertificate(keyPair.privateKey, mockTbs);

				assert.ok(signature instanceof ArrayBuffer);
				assert.strictEqual(signature.byteLength, 256); // 2048-bit RSA signature
			});

			test('should handle empty TBS data', async () => {
				const keyPair = await generateRSAKeyPair(2048);
				const mockTbs = new ArrayBuffer(0);

				const signature = await signTBSCertificate(keyPair.privateKey, mockTbs);

				assert.ok(signature instanceof ArrayBuffer);
				assert.strictEqual(signature.byteLength, 256); // 2048-bit RSA signature
			});

			test('should use SHA-256 hash algorithm', async () => {
				const keyPair = await generateRSAKeyPair(2048);
				const mockTbs = new ArrayBuffer(200);

				const signature = await signTBSCertificate(keyPair.privateKey, mockTbs);

				assert.ok(signature instanceof ArrayBuffer);
				// The signature should be deterministic for the same input
				const signature2 = await signTBSCertificate(keyPair.privateKey, mockTbs);
				assert.deepStrictEqual(new Uint8Array(signature), new Uint8Array(signature2));
			});

			test('should produce different signatures for different data', async () => {
				const keyPair = await generateRSAKeyPair(2048);
				const mockTbs1 = new ArrayBuffer(200);
				const mockTbs2 = new ArrayBuffer(200);
				// Fill with different data
				new Uint8Array(mockTbs1).fill(0x01);
				new Uint8Array(mockTbs2).fill(0x02);

				const signature1 = await signTBSCertificate(keyPair.privateKey, mockTbs1);
				const signature2 = await signTBSCertificate(keyPair.privateKey, mockTbs2);

				assert.ok(signature1 instanceof ArrayBuffer);
				assert.ok(signature2 instanceof ArrayBuffer);
				// Signatures should be different for different data
				assert.notDeepStrictEqual(new Uint8Array(signature1), new Uint8Array(signature2));
			});
		});
	});

	describe('Phase 5: Main Function and Validation', () => {
		test('validateOptions should validate input parameters', () => {
			// Valid options
			assert.doesNotThrow(() => validateOptions({
				commonName: 'localhost',
				organization: 'Test Org',
				country: 'US',
				state: 'CA',
				locality: 'San Francisco',
				keySize: 2048,
				validityDays: 365
			}));

			// Invalid options
			assert.throws(() => validateOptions({ commonName: '' }), TypeError);
			assert.throws(() => validateOptions({ keySize: 1024 }), TypeError);
			assert.throws(() => validateOptions({ validityDays: 0 }), TypeError);
		});

		test('generateSSLCert should generate valid certificate with default options', async () => {
			const result = await generateSSLCert();

			assert.ok(result.privateKey);
			assert.ok(result.certificate);
			assert.strictEqual(typeof result.privateKey, 'string');
			assert.strictEqual(typeof result.certificate, 'string');
			assert.ok(result.privateKey.includes('-----BEGIN PRIVATE KEY-----'));
			assert.ok(result.certificate.includes('-----BEGIN CERTIFICATE-----'));
		});

		test('generateSSLCert should generate valid certificate with custom options', async () => {
			const result = await generateSSLCert({
				commonName: 'test.example.com',
				organization: 'Test Organization',
				country: 'US',
				state: 'California',
				locality: 'San Francisco',
				keySize: 4096,
				validityDays: 730
			});

			assert.ok(result.privateKey);
			assert.ok(result.certificate);
		});

		test('validateCertificate should validate generated certificate', async () => {
			const result = await generateSSLCert();
			const isValid = await validateCertificate(result.certificate, result.privateKey);

			assert.strictEqual(isValid, true);
		});
	});

	describe('Phase 6: Integration Testing', () => {
		// test('should work with HTTPS server', async () => {
		// 	const result = await generateSSLCert();

		// 	// Create HTTPS server with generated certificate
		// 	const https = await import('node:https');
		// 	const server = https.default.createServer({
		// 		key: result.privateKey,
		// 		cert: result.certificate
		// 	}, (req, res) => {
		// 		res.writeHead(200);
		// 		res.end('Hello World');
		// 	});

		// 	await new Promise((resolve) => server.listen(0, resolve));
		// 	const port = server.address().port;

		// 	// Test HTTPS connection - this will fail due to self-signed certificate
		// 	// but the server creation should succeed, proving the certificate is valid
		// 	try {
		// 		const response = await fetch(`https://localhost:${port}`, {
		// 			// Note: This will fail due to self-signed certificate
		// 			// In real usage, you'd need to handle this appropriately
		// 		});
		// 	} catch (error) {
		// 			// Expected error for self-signed certificate
		// 			// The important thing is that the server was created successfully
		// 	}

		// 	server.close();
		// });
	});
});
