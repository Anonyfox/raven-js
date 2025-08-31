/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { Matrix } from "./matrix.js";

describe("Matrix", () => {
	describe("Constructor", () => {
		it("should create matrix with correct dimensions", () => {
			const matrix = new Matrix(3, 4);

			assert.strictEqual(matrix.rows, 3);
			assert.strictEqual(matrix.cols, 4);
			assert.strictEqual(matrix.size, 12);
			assert.ok(matrix.data instanceof Float32Array);
			assert.strictEqual(matrix.data.length, 12);
		});

		it("should initialize with provided data", () => {
			const data = [1, 2, 3, 4, 5, 6];
			const matrix = new Matrix(2, 3, data);

			assert.strictEqual(matrix.get(0, 0), 1);
			assert.strictEqual(matrix.get(0, 1), 2);
			assert.strictEqual(matrix.get(0, 2), 3);
			assert.strictEqual(matrix.get(1, 0), 4);
			assert.strictEqual(matrix.get(1, 1), 5);
			assert.strictEqual(matrix.get(1, 2), 6);
		});

		it("should validate constructor parameters", () => {
			assert.throws(() => new Matrix(0, 3), /Rows must be a positive integer/);
			assert.throws(() => new Matrix(-1, 3), /Rows must be a positive integer/);
			assert.throws(
				() => new Matrix(3.5, 3),
				/Rows must be a positive integer/,
			);
			assert.throws(
				() => new Matrix(3, 0),
				/Columns must be a positive integer/,
			);
			assert.throws(
				() => new Matrix(3, -1),
				/Columns must be a positive integer/,
			);
			assert.throws(
				() => new Matrix(3, 2.5),
				/Columns must be a positive integer/,
			);
		});

		it("should validate data length", () => {
			assert.throws(
				() => new Matrix(2, 3, [1, 2, 3]),
				/Data length 3 does not match matrix size 6/,
			);
		});

		it("should validate data values", () => {
			assert.throws(
				() => new Matrix(2, 2, [1, 2, NaN, 4]),
				/Invalid data value at index 2: NaN/,
			);
			assert.throws(
				() => new Matrix(2, 2, [1, 2, Infinity, 4]),
				/Invalid data value at index 2: Infinity/,
			);
		});
	});

	describe("Element Access", () => {
		it("should get and set elements correctly", () => {
			const matrix = new Matrix(2, 3);

			matrix.set(0, 1, 5.5);
			matrix.set(1, 2, -3.2);

			assert.strictEqual(matrix.get(0, 1), 5.5);
			// Float32Array precision - use approximate equality
			assert.ok(Math.abs(matrix.get(1, 2) - -3.2) < 1e-6);
			assert.strictEqual(matrix.get(0, 0), 0); // Default value
		});

		it("should validate indices", () => {
			const matrix = new Matrix(2, 3);

			assert.throws(() => matrix.get(-1, 0), /Row index -1 out of bounds/);
			assert.throws(() => matrix.get(2, 0), /Row index 2 out of bounds/);
			assert.throws(() => matrix.get(0, -1), /Column index -1 out of bounds/);
			assert.throws(() => matrix.get(0, 3), /Column index 3 out of bounds/);
			assert.throws(() => matrix.get(1.5, 0), /Row index 1.5 out of bounds/);

			assert.throws(() => matrix.set(-1, 0, 1), /Row index -1 out of bounds/);
			assert.throws(() => matrix.set(0, 3, 1), /Column index 3 out of bounds/);
		});

		it("should validate set values", () => {
			const matrix = new Matrix(2, 2);

			assert.throws(() => matrix.set(0, 0, NaN), /Invalid value: NaN/);
			assert.throws(
				() => matrix.set(0, 0, Infinity),
				/Invalid value: Infinity/,
			);
		});
	});

	describe("Static Factory Methods", () => {
		it("should create zero matrix", () => {
			const matrix = Matrix.zeros(2, 3);

			assert.strictEqual(matrix.rows, 2);
			assert.strictEqual(matrix.cols, 3);
			for (let i = 0; i < 2; i++) {
				for (let j = 0; j < 3; j++) {
					assert.strictEqual(matrix.get(i, j), 0);
				}
			}
		});

		it("should create ones matrix", () => {
			const matrix = Matrix.ones(2, 3);

			for (let i = 0; i < 2; i++) {
				for (let j = 0; j < 3; j++) {
					assert.strictEqual(matrix.get(i, j), 1);
				}
			}
		});

		it("should create identity matrix", () => {
			const matrix = Matrix.identity(3);

			assert.strictEqual(matrix.rows, 3);
			assert.strictEqual(matrix.cols, 3);

			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					if (i === j) {
						assert.strictEqual(matrix.get(i, j), 1);
					} else {
						assert.strictEqual(matrix.get(i, j), 0);
					}
				}
			}
		});

		it("should create random matrix", () => {
			const matrix = Matrix.random(3, 4);

			assert.strictEqual(matrix.rows, 3);
			assert.strictEqual(matrix.cols, 4);

			// Check that not all values are the same (very unlikely with random)
			let hasVariation = false;
			const firstValue = matrix.get(0, 0);

			for (let i = 0; i < matrix.rows; i++) {
				for (let j = 0; j < matrix.cols; j++) {
					const value = matrix.get(i, j);
					assert.ok(Number.isFinite(value), "Random values should be finite");
					if (value !== firstValue) {
						hasVariation = true;
					}
				}
			}

			assert.ok(hasVariation, "Random matrix should have variation");
		});

		it("should create random matrix with custom range", () => {
			const matrix = Matrix.random(2, 2, 2, 8); // min=2, max=8 (uniform distribution)

			// Check all values are within range
			for (let i = 0; i < 2; i++) {
				for (let j = 0; j < 2; j++) {
					const value = matrix.get(i, j);
					assert.ok(
						value >= 2 && value <= 8,
						`Value ${value} should be between 2 and 8`,
					);
				}
			}
		});
	});

	describe("Matrix Operations", () => {
		it("should multiply matrices correctly", () => {
			const a = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
			const b = new Matrix(3, 2, [1, 2, 3, 4, 5, 6]);

			const result = a.multiply(b);

			assert.strictEqual(result.rows, 2);
			assert.strictEqual(result.cols, 2);

			// Expected: [[22, 28], [49, 64]]
			assert.strictEqual(result.get(0, 0), 22);
			assert.strictEqual(result.get(0, 1), 28);
			assert.strictEqual(result.get(1, 0), 49);
			assert.strictEqual(result.get(1, 1), 64);
		});

		it("should multiply matrices with result parameter", () => {
			const a = new Matrix(2, 2, [1, 2, 3, 4]);
			const b = new Matrix(2, 2, [2, 0, 1, 2]);
			const result = new Matrix(2, 2);

			const returned = a.multiply(b, result);

			assert.strictEqual(returned, result);
			assert.strictEqual(result.get(0, 0), 4);
			assert.strictEqual(result.get(0, 1), 4);
			assert.strictEqual(result.get(1, 0), 10);
			assert.strictEqual(result.get(1, 1), 8);
		});

		it("should validate matrix multiplication dimensions", () => {
			const a = new Matrix(2, 3);
			const b = new Matrix(2, 3); // Wrong dimensions

			assert.throws(
				() => a.multiply(b),
				/Cannot multiply 2×3 with 2×3: inner dimensions must match/,
			);
		});

		it("should validate multiplication input type", () => {
			const a = new Matrix(2, 2);

			assert.throws(
				() => a.multiply("not a matrix"),
				/Expected Matrix instance/,
			);
		});

		it("should validate result matrix dimensions", () => {
			const a = new Matrix(2, 3);
			const b = new Matrix(3, 2);
			const wrongResult = new Matrix(3, 3);

			assert.throws(
				() => a.multiply(b, wrongResult),
				/Result matrix dimensions 3×3 do not match expected 2×2/,
			);
		});
	});

	describe("Addition and Subtraction", () => {
		it("should add matrices correctly", () => {
			const a = new Matrix(2, 2, [1, 2, 3, 4]);
			const b = new Matrix(2, 2, [2, 1, 1, 2]);

			const result = a.add(b);

			assert.strictEqual(result.get(0, 0), 3);
			assert.strictEqual(result.get(0, 1), 3);
			assert.strictEqual(result.get(1, 0), 4);
			assert.strictEqual(result.get(1, 1), 6);
		});

		it("should subtract matrices correctly", () => {
			const a = new Matrix(2, 2, [5, 3, 8, 2]);
			const b = new Matrix(2, 2, [2, 1, 3, 1]);

			const result = a.subtract(b);

			assert.strictEqual(result.get(0, 0), 3);
			assert.strictEqual(result.get(0, 1), 2);
			assert.strictEqual(result.get(1, 0), 5);
			assert.strictEqual(result.get(1, 1), 1);
		});

		it("should subtract matrices with result parameter for branch coverage", () => {
			const a = new Matrix(2, 2, [5, 3, 8, 2]);
			const b = new Matrix(2, 2, [2, 1, 3, 1]);
			const result = new Matrix(2, 2);

			const returnedResult = a.subtract(b, result);

			assert.strictEqual(returnedResult, result);
			assert.strictEqual(result.get(0, 0), 3);
			assert.strictEqual(result.get(0, 1), 2);
			assert.strictEqual(result.get(1, 0), 5);
			assert.strictEqual(result.get(1, 1), 1);
		});

		it("should validate add result matrix dimensions to hit line 238", () => {
			const a = new Matrix(2, 2, [1, 2, 3, 4]);
			const b = new Matrix(2, 2, [1, 1, 1, 1]);

			// Test wrong rows dimension
			const wrongRowsResult = new Matrix(3, 2);
			assert.throws(
				() => a.add(b, wrongRowsResult),
				/Result matrix dimensions do not match/,
			);

			// Test wrong columns dimension
			const wrongColsResult = new Matrix(2, 3);
			assert.throws(
				() => a.add(b, wrongColsResult),
				/Result matrix dimensions do not match/,
			);
		});

		it("should validate addition/subtraction dimensions", () => {
			const a = new Matrix(2, 3);
			const b = new Matrix(3, 2);

			assert.throws(
				() => a.add(b),
				/Cannot add matrices of different dimensions/,
			);
			assert.throws(
				() => a.subtract(b),
				/Cannot subtract matrices of different dimensions/,
			);
		});

		it("should validate Matrix instances in arithmetic operations (lines 227-228, 260-261, 285-286)", () => {
			const a = new Matrix(2, 2, [1, 2, 3, 4]);

			// Test add with non-Matrix (lines 227-228)
			assert.throws(() => a.add("not a matrix"), /Expected Matrix instance/);
			assert.throws(() => a.add(null), /Expected Matrix instance/);

			// Test subtract with non-Matrix (lines 260-261)
			assert.throws(
				() => a.subtract("not a matrix"),
				/Expected Matrix instance/,
			);
			assert.throws(() => a.subtract({}), /Expected Matrix instance/);

			// Test addInPlace with non-Matrix (lines 285-286)
			assert.throws(
				() => a.addInPlace("not a matrix"),
				/Expected Matrix instance/,
			);
			assert.throws(() => a.addInPlace([1, 2, 3]), /Expected Matrix instance/);
		});

		it("should validate result matrix dimensions in add operation (lines 238-241)", () => {
			const a = new Matrix(2, 2, [1, 2, 3, 4]);
			const b = new Matrix(2, 2, [1, 1, 1, 1]);
			const wrongSizeResult = new Matrix(3, 3); // Wrong dimensions

			assert.throws(
				() => a.add(b, wrongSizeResult),
				/Result matrix dimensions do not match/,
			);
		});

		it("should perform in-place addition", () => {
			const a = new Matrix(2, 2, [1, 2, 3, 4]);
			const b = new Matrix(2, 2, [1, 1, 1, 1]);

			const result = a.addInPlace(b);

			assert.strictEqual(result, a); // Should return same instance
			assert.strictEqual(a.get(0, 0), 2);
			assert.strictEqual(a.get(0, 1), 3);
			assert.strictEqual(a.get(1, 0), 4);
			assert.strictEqual(a.get(1, 1), 5);
		});

		it("should validate in-place addition dimensions", () => {
			const a = new Matrix(2, 2);
			const b = new Matrix(2, 3);

			assert.throws(
				() => a.addInPlace(b),
				/Matrix dimensions must match for in-place addition/,
			);
		});
	});

	describe("Scalar Operations", () => {
		it("should scale matrix in-place", () => {
			const matrix = new Matrix(2, 2, [1, 2, 3, 4]);

			const result = matrix.scaleInPlace(2.5);

			assert.strictEqual(result, matrix);
			assert.strictEqual(matrix.get(0, 0), 2.5);
			assert.strictEqual(matrix.get(0, 1), 5);
			assert.strictEqual(matrix.get(1, 0), 7.5);
			assert.strictEqual(matrix.get(1, 1), 10);
		});

		it("should validate scalar value", () => {
			const matrix = new Matrix(2, 2);

			assert.throws(
				() => matrix.scaleInPlace(NaN),
				/Invalid scalar value: NaN/,
			);
		});

		it("should fill matrix with value", () => {
			const matrix = new Matrix(2, 3);

			const result = matrix.fill(7);

			assert.strictEqual(result, matrix);
			for (let i = 0; i < 2; i++) {
				for (let j = 0; j < 3; j++) {
					assert.strictEqual(matrix.get(i, j), 7);
				}
			}
		});

		it("should validate fill value", () => {
			const matrix = new Matrix(2, 2);

			assert.throws(
				() => matrix.fill(Infinity),
				/Invalid fill value: Infinity/,
			);
		});
	});

	describe("Matrix Transformations", () => {
		it("should transpose matrix correctly", () => {
			const matrix = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);

			const result = matrix.transpose();

			assert.strictEqual(result.rows, 3);
			assert.strictEqual(result.cols, 2);
			assert.strictEqual(result.get(0, 0), 1);
			assert.strictEqual(result.get(0, 1), 4);
			assert.strictEqual(result.get(1, 0), 2);
			assert.strictEqual(result.get(1, 1), 5);
			assert.strictEqual(result.get(2, 0), 3);
			assert.strictEqual(result.get(2, 1), 6);
		});

		it("should transpose with result parameter", () => {
			const matrix = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
			const result = new Matrix(3, 2);

			const returned = matrix.transpose(result);

			assert.strictEqual(returned, result);
			assert.strictEqual(result.get(1, 1), 5);
		});

		it("should validate transpose result dimensions", () => {
			const matrix = new Matrix(2, 3);
			const wrongResult = new Matrix(2, 2);

			assert.throws(
				() => matrix.transpose(wrongResult),
				/Result matrix dimensions must be 3×2 for transpose/,
			);
		});

		it("should clone matrix", () => {
			const original = new Matrix(2, 2, [1, 2, 3, 4]);

			const clone = original.clone();

			assert.notStrictEqual(clone, original);
			assert.strictEqual(clone.rows, original.rows);
			assert.strictEqual(clone.cols, original.cols);

			for (let i = 0; i < 2; i++) {
				for (let j = 0; j < 2; j++) {
					assert.strictEqual(clone.get(i, j), original.get(i, j));
				}
			}

			// Modifying clone shouldn't affect original
			clone.set(0, 0, 99);
			assert.strictEqual(original.get(0, 0), 1);
		});
	});

	describe("Activation Functions", () => {
		it("should apply ReLU correctly", () => {
			const matrix = new Matrix(2, 2, [-1, 2, -3, 4]);

			const result = matrix.relu();

			assert.strictEqual(result.get(0, 0), 0);
			assert.strictEqual(result.get(0, 1), 2);
			assert.strictEqual(result.get(1, 0), 0);
			assert.strictEqual(result.get(1, 1), 4);
		});

		it("should apply ReLU in-place", () => {
			const matrix = new Matrix(2, 2, [-1, 2, -3, 4]);

			const result = matrix.reluInPlace();

			assert.strictEqual(result, matrix);
			assert.strictEqual(matrix.get(0, 0), 0);
			assert.strictEqual(matrix.get(0, 1), 2);
			assert.strictEqual(matrix.get(1, 0), 0);
			assert.strictEqual(matrix.get(1, 1), 4);
		});
	});

	describe("Row and Column Operations", () => {
		it("should get row correctly", () => {
			const matrix = new Matrix(3, 2, [1, 2, 3, 4, 5, 6]);

			const row = matrix.getRow(1);

			assert.strictEqual(row.rows, 1);
			assert.strictEqual(row.cols, 2);
			assert.strictEqual(row.get(0, 0), 3);
			assert.strictEqual(row.get(0, 1), 4);
		});

		it("should get column correctly", () => {
			const matrix = new Matrix(3, 2, [1, 2, 3, 4, 5, 6]);

			const col = matrix.getColumn(1);

			assert.strictEqual(col.rows, 3);
			assert.strictEqual(col.cols, 1);
			assert.strictEqual(col.get(0, 0), 2);
			assert.strictEqual(col.get(1, 0), 4);
			assert.strictEqual(col.get(2, 0), 6);
		});

		it("should validate row/column indices", () => {
			const matrix = new Matrix(2, 3);

			assert.throws(() => matrix.getRow(-1), /Row index -1 out of bounds/);
			assert.throws(() => matrix.getRow(2), /Row index 2 out of bounds/);
			assert.throws(
				() => matrix.getColumn(-1),
				/Column index -1 out of bounds/,
			);
			assert.throws(() => matrix.getColumn(3), /Column index 3 out of bounds/);
		});
	});

	describe("Matrix Properties", () => {
		it("should calculate Frobenius norm", () => {
			const matrix = new Matrix(2, 2, [3, 4, 0, 0]);

			const norm = matrix.norm();

			assert.strictEqual(norm, 5); // sqrt(3^2 + 4^2) = 5
		});

		it("should check matrix equality", () => {
			const a = new Matrix(2, 2, [1, 2, 3, 4]);
			const b = new Matrix(2, 2, [1, 2, 3, 4]);
			const c = new Matrix(2, 2, [1, 2, 3, 5]);
			const d = new Matrix(2, 3);

			assert.ok(a.equals(b));
			assert.ok(!a.equals(c));
			assert.ok(!a.equals(d));
			assert.ok(!a.equals("not a matrix"));
		});

		it("should check equality with tolerance", () => {
			const a = new Matrix(2, 2, [1, 2, 3, 4]);
			const b = new Matrix(2, 2, [1.000001, 2, 3, 4]);

			assert.ok(a.equals(b, 1e-5));
			assert.ok(!a.equals(b, 1e-7));
		});
	});

	describe("Conversion Methods", () => {
		it("should convert to 2D array", () => {
			const matrix = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);

			const array = matrix.toArray();

			assert.deepStrictEqual(array, [
				[1, 2, 3],
				[4, 5, 6],
			]);
		});

		it("should convert to flat array", () => {
			const matrix = new Matrix(2, 2, [1, 2, 3, 4]);

			const flat = matrix.toFlatArray();

			assert.deepStrictEqual(flat, [1, 2, 3, 4]);
		});

		it("should convert to string", () => {
			const matrix = new Matrix(2, 2, [1.1234, 2.5678, 3.9012, 4.3456]);

			const str = matrix.toString(2);

			assert.ok(str.includes("Matrix 2×2"));
			assert.ok(str.includes("1.12"));
			assert.ok(str.includes("2.57"));
		});

		it("should use default precision in toString", () => {
			const matrix = new Matrix(1, 1, [1.123456]);

			const str = matrix.toString();

			assert.ok(str.includes("1.123"));
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const matrix = new Matrix(2, 2, [1, 2, 3, 4]);

			const json = matrix.toJSON();

			assert.strictEqual(json.rows, 2);
			assert.strictEqual(json.cols, 2);
			assert.deepStrictEqual(json.data, [1, 2, 3, 4]);
		});

		it("should deserialize from JSON", () => {
			const json = {
				rows: 2,
				cols: 3,
				data: [1, 2, 3, 4, 5, 6],
			};

			const matrix = Matrix.fromJSON(json);

			assert.strictEqual(matrix.rows, 2);
			assert.strictEqual(matrix.cols, 3);
			assert.strictEqual(matrix.get(0, 1), 2);
			assert.strictEqual(matrix.get(1, 2), 6);
		});

		it("should validate JSON input", () => {
			assert.throws(
				() => Matrix.fromJSON(null),
				/Invalid JSON: expected object/,
			);

			assert.throws(
				() => Matrix.fromJSON({ rows: 2.5, cols: 3, data: [] }),
				/Invalid JSON: rows and cols must be integers/,
			);

			assert.throws(
				() => Matrix.fromJSON({ rows: 2, cols: 3, data: "not array" }),
				/Invalid JSON: data must be an array/,
			);
		});

		it("should roundtrip through JSON", () => {
			const original = new Matrix(2, 3, [1.5, -2.3, 0, 4.7, -1, 3.14]);

			const json = original.toJSON();
			const restored = Matrix.fromJSON(json);

			assert.ok(original.equals(restored));
		});
	});

	describe("Edge Cases", () => {
		it("should handle 1x1 matrices", () => {
			const a = new Matrix(1, 1, [5]);
			const b = new Matrix(1, 1, [3]);

			const result = a.multiply(b);

			assert.strictEqual(result.get(0, 0), 15);
		});

		it("should handle large matrices", () => {
			const size = 100;
			const a = Matrix.ones(size, size);
			const b = Matrix.identity(size);

			const result = a.multiply(b);

			// a * I = a
			assert.ok(a.equals(result));
		});

		it("should handle zero matrices in operations", () => {
			const zero = Matrix.zeros(2, 2);
			const ones = Matrix.ones(2, 2);

			const sum = zero.add(ones);
			const product = zero.multiply(ones);

			assert.ok(sum.equals(ones));
			assert.ok(product.equals(zero));
		});

		it("should handle chained operations", () => {
			const matrix = new Matrix(2, 2, [1, 2, 3, 4]);

			// Chain in-place operations
			matrix.scaleInPlace(2).addInPlace(Matrix.ones(2, 2)).reluInPlace();

			assert.strictEqual(matrix.get(0, 0), 3);
			assert.strictEqual(matrix.get(0, 1), 5);
			assert.strictEqual(matrix.get(1, 0), 7);
			assert.strictEqual(matrix.get(1, 1), 9);
		});
	});
});
