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
	encodeSet,
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

describe('SSL Certificate Generation - Minimal Coverage', () => {
	describe('Critical ASN.1 Branches', () => {
		test('encodeTLV - both length branches', () => {
			// Short length branch (<128)
			const short = encodeTLV(0x04, new Uint8Array([0x01]));
			assert.strictEqual(new Uint8Array(short)[1], 0x01);

			// Long length branch (≥128) - covers while loop
			const long = encodeTLV(0x04, new Uint8Array(128));
			assert.strictEqual(new Uint8Array(long)[1], 0x81);
		});

		test('encodeInteger - all branches', () => {
			// Empty array branch
			assert.strictEqual(new Uint8Array(encodeInteger(new Uint8Array([])))[2], 0x00);

			// Leading zero removal while loop
			assert.strictEqual(new Uint8Array(encodeInteger(new Uint8Array([0x00, 0x42])))[2], 0x42);

			// High bit padding branch (NOT 0xFF)
			const padded = new Uint8Array(encodeInteger(new Uint8Array([0x81])));
			assert.strictEqual(padded[2], 0x00); // Padding added

			// 0xFF special case (no padding)
			assert.strictEqual(new Uint8Array(encodeInteger(new Uint8Array([0xFF])))[2], 0xFF);
		});

		test('encodeObjectIdentifier - both part branches', () => {
			// Small part branch (<128)
			assert.ok(encodeObjectIdentifier('2.5'));

			// Large part branch (≥128) - covers while loop and for loop
			assert.ok(encodeObjectIdentifier('1.2.999'));
		});

		test('encodeSubjectPublicKeyInfo - all branches', async () => {
			// Mock data branch (byteLength === 100)
			assert.strictEqual(new Uint8Array(encodeSubjectPublicKeyInfo(new ArrayBuffer(100)))[0], 0x30);

			// Real SPKI branch (starts with 0x30)
			const keyPair = await generateRSAKeyPair(2048);
			const realSpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
			assert.strictEqual(new Uint8Array(encodeSubjectPublicKeyInfo(realSpki))[0], 0x30);

			// Non-SEQUENCE branch (else path)
			const nonSeq = new ArrayBuffer(20);
			new Uint8Array(nonSeq).fill(0x42); // Not 0x30
			assert.strictEqual(new Uint8Array(encodeSubjectPublicKeyInfo(nonSeq))[0], 0x30);
		});
	});

	describe('Essential Functions', () => {
		test('basic encoding functions', () => {
			assert.ok(encodePrintableString('test'));
			assert.ok(encodeUTCTime(new Date()));
			assert.ok(encodeNull());
			assert.ok(encodeBitString(new ArrayBuffer(1)));
			assert.ok(encodeSequence([]));
			assert.ok(encodeSet([]));
			assert.ok(encodeVersion());
			assert.ok(encodeName({ commonName: 'test' }));
			assert.ok(encodeValidity(new Date(), new Date()));
		});

		test('certificate structure', async () => {
			const keyPair = await generateRSAKeyPair(2048);
			const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);

			assert.ok(createTBSCertificate(new Uint8Array([1]), {commonName:'test'}, {commonName:'test'}, new Date(), new Date(), spki));
			assert.ok(createCertificateStructure(new ArrayBuffer(100), new ArrayBuffer(256)));
			assert.ok(await exportPrivateKeyPEM(keyPair.privateKey));
			assert.ok(await signTBSCertificate(keyPair.privateKey, new ArrayBuffer(100)));
		});
	});

	describe('Validation', () => {
		test('validateOptions - all error branches', () => {
			// Valid case
			assert.doesNotThrow(() => validateOptions({}));

			// Each validation branch - both undefined check AND invalid value
			assert.throws(() => validateOptions({ commonName: '' })); // string but empty
			assert.throws(() => validateOptions({ commonName: 123 })); // not string

			assert.throws(() => validateOptions({ organization: '' }));
			assert.throws(() => validateOptions({ organization: 123 }));

			assert.throws(() => validateOptions({ country: '' }));
			assert.throws(() => validateOptions({ country: 123 }));

			assert.throws(() => validateOptions({ state: '' }));
			assert.throws(() => validateOptions({ state: 123 }));

			assert.throws(() => validateOptions({ locality: '' }));
			assert.throws(() => validateOptions({ locality: 123 }));

			assert.throws(() => validateOptions({ keySize: 1024 })); // invalid value
			assert.throws(() => validateOptions({ keySize: '2048' })); // not number

			assert.throws(() => validateOptions({ validityDays: 0 })); // < 1
			assert.throws(() => validateOptions({ validityDays: 3651 })); // > 3650
			assert.throws(() => validateOptions({ validityDays: 1.5 })); // not integer
		});

		test('validateCertificate - all branches', async () => {
			const result = await generateSSLCert();
			assert.doesNotThrow(() => validateCertificate(result.certificate));
			assert.throws(() => validateCertificate(''));
			assert.throws(() => validateCertificate('invalid'));
			assert.throws(() => validateCertificate(123));
		});
	});

	describe('Integration', () => {
		test('generateSSLCert & HTTPS server', async () => {
			const result = await generateSSLCert();
			assert.ok(result.certificate.includes('-----BEGIN CERTIFICATE-----'));

			const https = await import('node:https');
			const server = https.default.createServer({
				key: result.privateKey,
				cert: result.certificate
			});
			await new Promise(r => server.listen(0, r));
			server.close();
		});
	});
});