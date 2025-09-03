/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { LSHBuckets } from "./lsh.js";

describe("LSH", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("constructs, hashes bands, adds items, and retrieves candidates", () => {
			// constructor defaults
			const l = new LSHBuckets();
			strictEqual(l.numBands, 16);
			strictEqual(l.signatureLength, 128);
			strictEqual(l.threshold, 0.5);
			ok(l.buckets instanceof Map);
			ok(l.signatures instanceof Map);
			ok(l.items instanceof Map);
			strictEqual(l.rowsPerBand, 8);
			strictEqual(l.actualSignatureLength, 128);

			// hashBand stable and distinct
			strictEqual(l.hashBand([1, 2, 3, 4, 5]), l.hashBand([1, 2, 3, 4, 5]));
			ok(l.hashBand([1, 2, 3, 4, 5]) !== l.hashBand([1, 2, 3, 4, 6]));

			// add + getCandidates
			const l4 = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			const sig = [1, 2, 3, 4, 5, 6, 7, 8];
			const id = l4.add("doc", sig);
			strictEqual(typeof id, "number");
			deepStrictEqual(l4.signatures.get(id), sig);
			strictEqual(l4.items.get(id), "doc");
			const cand = l4.getCandidates(sig);
			ok(cand instanceof Set);
			ok(cand.has(id));

			// addBatch success path
			const lb = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			const ids = lb.addBatch([
				{ item: "a", signature: [1, 2, 3, 4] },
				{ item: "b", signature: [2, 3, 4, 5] },
			]);
			deepStrictEqual(ids, [0, 1]);
			strictEqual(lb.items.size, 2);
		});
	});

	describe("edge cases and errors", () => {
		it("validates configurations, inputs, and probability functions", () => {
			// invalid band configuration
			throws(
				() => new LSHBuckets({ numBands: 200, signatureLength: 64 }),
				/too large/,
			);
			// add/getCandidates invalids
			const l = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			throws(() => l.add("x", "not array"), /must be an array/);
			throws(() => l.add("x", [1, 2, 3]), /does not match expected length/);
			throws(() => l.getCandidates("not array"), /must be an array/);
			throws(
				() => l.getCandidates([1, 2, 3]),
				/does not match expected length/,
			);
			// addBatch invalid input
			throws(() => l.addBatch("not array"), /must be an array/);

			// search uses threshold defaulting and sorting, and returns empty when no match
			const l4 = new LSHBuckets({
				numBands: 4,
				signatureLength: 8,
				threshold: 0.5,
			});
			l4.add("s1", [1, 2, 3, 4, 5, 6, 7, 8]);
			l4.add("s2", [1, 2, 3, 4, 9, 10, 11, 12]);
			let res = l4.search([1, 2, 3, 4, 5, 6, 7, 8]);
			ok(res.every((r) => r.similarity >= 0.5));
			res = l4.search([9, 10, 11, 12, 13, 14, 15, 16], { threshold: 0.9 });
			deepStrictEqual(res, []);

			// getStats on empty and filled
			const empty = new LSHBuckets();
			let stats = empty.getStats();
			strictEqual(stats.totalItems, 0);
			strictEqual(stats.usedBuckets, 0);
			strictEqual(stats.avgBucketSize, 0);
			const filled = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			filled.add("d1", [1, 2, 3, 4, 5, 6, 7, 8]);
			stats = filled.getStats();
			strictEqual(stats.totalItems, 1);

			// collision probability extremes and mid values
			const p = new LSHBuckets({ numBands: 4, signatureLength: 8 });
			strictEqual(p.estimateCollisionProbability(0), 0);
			strictEqual(p.estimateCollisionProbability(1), 1);
			ok(
				p.estimateCollisionProbability(0.8) >
					p.estimateCollisionProbability(0.3),
			);
			// invalid similarity throws
			throws(() => p.estimateCollisionProbability(-0.1), /between 0 and 1/);
			throws(() => p.estimateCollisionProbability(1.1), /between 0 and 1/);
			// estimateSimilarity mismatched lengths early return
			strictEqual(p.estimateSimilarity([1, 2, 3], [1, 2]), 0);

			// findOptimalBands and createOptimal
			const opt = LSHBuckets.findOptimalBands(0.7, 64);
			ok(
				opt.numBands >= 1 && opt.rowsPerBand >= 1 && opt.signatureLength <= 64,
			);
			throws(() => LSHBuckets.findOptimalBands(0), /between 0 and 1/);
			const created = LSHBuckets.createOptimal(0.6, 64);
			ok(created instanceof LSHBuckets);

			// remove non-existent returns false
			const l2 = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			strictEqual(l2.remove(999), false);

			// explicit clear covering nextItemId reset and bucket clears
			const lc = new LSHBuckets({ numBands: 2, signatureLength: 4 });
			lc.add("x", [1, 2, 3, 4]);
			lc.add("y", [2, 3, 4, 5]);
			lc.clear();
			strictEqual(lc.nextItemId, 0);
			for (let i = 0; i < lc.numBands; i++) {
				strictEqual(lc.buckets.get(i).size, 0);
			}
		});
	});

	describe("integration scenarios", () => {
		it("indexes, searches, scales, and remains consistent across operations", () => {
			const l = new LSHBuckets({ numBands: 8, signatureLength: 64 });
			// Index multiple docs (extend sigs to required length)
			const docs = [
				{ text: "machine learning algorithms", sig: [1, 2, 3, 4, 5, 6, 7, 8] },
				{ text: "machine learning models", sig: [1, 2, 3, 4, 9, 10, 11, 12] },
				{
					text: "deep learning neural networks",
					sig: [1, 2, 13, 14, 15, 16, 17, 18],
				},
				{ text: "cooking recipes", sig: [20, 21, 22, 23, 24, 25, 26, 27] },
			];
			for (const d of docs) {
				while (d.sig.length < 64) d.sig.push(Math.floor(Math.random() * 1000));
				l.add(d.text, d.sig);
			}
			// Search
			const q = [1, 2, 3, 4, 5, 6, 7, 8];
			while (q.length < 64) q.push(Math.floor(Math.random() * 1000));
			const results = l.search(q, { threshold: 0.1, maxResults: 5 });
			ok(Array.isArray(results));
			ok(results.length >= 1);
			for (let i = 1; i < results.length; i++)
				ok(results[i - 1].similarity >= results[i].similarity);
			ok(
				results.every(
					(r) =>
						typeof r.item === "string" &&
						typeof r.similarity === "number" &&
						typeof r.itemId === "number",
				),
			);

			// remove works and candidates drop
			const removedId = 0;
			l.remove(removedId);
			const cands = l.getCandidates(q);
			ok(!cands.has(removedId));
		});
	});
});
