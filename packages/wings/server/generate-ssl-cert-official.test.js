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
} from './generate-ssl-cert-official.js';

describe('generateSSLCert (Official RFC Implementation)', () => {
	describe('Phase 1: Core ASN.1 Encoding Functions', () => {
		test('encodeTLV should encode basic TLV structure', () => {
			// Test basic TLV encoding
			const data = new Uint8Array([0x01, 0x02, 0x03]);
			const result = encodeTLV(0x04, data); // OCTET STRING tag
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x04); // Tag
			assert.strictEqual(bytes[1], 0x03); // Length
			assert.strictEqual(bytes[2], 0x01); // Value
			assert.strictEqual(bytes[3], 0x02);
			assert.strictEqual(bytes[4], 0x03);
		});

		test('encodeTLV should handle long length encoding', () => {
			// Test long length encoding (length > 127)
			const data = new Uint8Array(200);
			data.fill(0x42);
			const result = encodeTLV(0x04, data);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x04); // Tag
			assert.strictEqual(bytes[1], 0x81); // Long length indicator
			assert.strictEqual(bytes[2], 0xC8); // Length = 200
			assert.strictEqual(bytes[3], 0x42); // First value byte
		});

		test('encodeInteger should handle positive integers', () => {
			const value = new Uint8Array([0x7F, 0xFF, 0xFF, 0xFF]);
			const result = encodeInteger(value);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x02); // INTEGER tag
			assert.strictEqual(bytes[1], 0x04); // Length
			assert.strictEqual(bytes[2], 0x7F); // Value
			assert.strictEqual(bytes[3], 0xFF);
			assert.strictEqual(bytes[4], 0xFF);
			assert.strictEqual(bytes[5], 0xFF);
		});

		test('encodeInteger should handle negative integers (add leading zero)', () => {
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

		test('encodeBitString should encode with unused bits', () => {
			const data = new Uint8Array([0xFF, 0x0F]); // 12 bits of data
			const result = encodeBitString(data.buffer);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x03); // BIT STRING tag
			assert.strictEqual(bytes[1], 0x03); // Length = 3 (1 unused bits byte + 2 data bytes)
			assert.strictEqual(bytes[2], 0x04); // 4 unused bits (12 bits used, 4 bits unused)
			assert.strictEqual(bytes[3], 0xFF); // Data
			assert.strictEqual(bytes[4], 0x0F);
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
		test('encodeVersion should encode X.509 v3 correctly', () => {
			const result = encodeVersion();
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0xA0); // Context-specific tag 0
			assert.strictEqual(bytes[1], 0x03); // Length = 3
			assert.strictEqual(bytes[2], 0x02); // INTEGER tag
			assert.strictEqual(bytes[3], 0x01); // Length = 1
			assert.strictEqual(bytes[4], 0x02); // Value = 2 (v3 = version 2, 0-based)
		});

		test('encodeName should encode X.500 Distinguished Name correctly', () => {
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

		test('encodeValidity should encode validity period correctly', () => {
			const notBefore = new Date('2024-01-01T00:00:00Z');
			const notAfter = new Date('2025-01-01T00:00:00Z');
			const result = encodeValidity(notBefore, notAfter);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			// Should contain two UTCTime values
		});

		test('encodeSubjectPublicKeyInfo should encode RSA public key correctly', () => {
			// This will be tested with actual key generation
			const mockSpki = new ArrayBuffer(100);
			const result = encodeSubjectPublicKeyInfo(mockSpki);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			// Should contain algorithm + subjectPublicKey
		});
	});

	describe('Phase 3: Certificate Structure', () => {
		test('createTBSCertificate should create valid TBS structure', () => {
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

		test('createCertificateStructure should create final certificate', () => {
			const mockTbs = new ArrayBuffer(200);
			const mockSignature = new ArrayBuffer(256);

			const result = createCertificateStructure(mockTbs, mockSignature);
			const bytes = new Uint8Array(result);

			assert.strictEqual(bytes[0], 0x30); // SEQUENCE tag
			// Should contain: tbsCertificate, signatureAlgorithm, signatureValue
		});
	});

	describe('Phase 4: Key Generation and Signing', () => {
		test('generateRSAKeyPair should generate valid RSA key pair', async () => {
			const keyPair = await generateRSAKeyPair(2048);

			assert.ok(keyPair.privateKey);
			assert.ok(keyPair.publicKey);
			assert.strictEqual(keyPair.privateKey.type, 'private');
			assert.strictEqual(keyPair.publicKey.type, 'public');
			assert.strictEqual(keyPair.privateKey.algorithm.name, 'RSASSA-PKCS1-v1_5');
			assert.strictEqual(keyPair.publicKey.algorithm.name, 'RSASSA-PKCS1-v1_5');
		});

		test('exportPrivateKeyPEM should export private key correctly', async () => {
			const keyPair = await generateRSAKeyPair(2048);
			const pem = await exportPrivateKeyPEM(keyPair.privateKey);

			assert.strictEqual(typeof pem, 'string');
			assert.ok(pem.includes('-----BEGIN PRIVATE KEY-----'));
			assert.ok(pem.includes('-----END PRIVATE KEY-----'));
		});

		test('signTBSCertificate should create valid signature', async () => {
			const keyPair = await generateRSAKeyPair(2048);
			const mockTbs = new ArrayBuffer(200);

			const signature = await signTBSCertificate(keyPair.privateKey, mockTbs);

			assert.ok(signature instanceof ArrayBuffer);
			assert.strictEqual(signature.byteLength, 256); // 2048-bit RSA signature
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
		/*
		test('should work with HTTPS server', async () => {
			const result = await generateSSLCert();

			// Create HTTPS server with generated certificate
			const https = require('https');
			const server = https.createServer({
				key: result.privateKey,
				cert: result.certificate
			}, (req, res) => {
				res.writeHead(200);
				res.end('Hello World');
			});

			await new Promise((resolve) => server.listen(0, resolve));
			const port = server.address().port;

			// Test HTTPS connection
			const response = await fetch(`https://localhost:${port}`, {
				// Note: This will fail due to self-signed certificate
				// In real usage, you'd need to handle this appropriately
			});

			server.close();
		});
		*/
	});
});
