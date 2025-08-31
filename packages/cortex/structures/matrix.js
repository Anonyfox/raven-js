/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Matrix class for linear algebra operations using Float32Array storage.
 *
 * Supports matrix creation, arithmetic operations, activation functions, and serialization.
 * Optimized for neural network workloads with in-place operations and direct array access.
 */

/**
 * Matrix implementation for linear algebra operations using Float32Array storage.
 *
 * Supports matrix creation, arithmetic operations, and activation functions.
 * Includes in-place operations for memory efficiency and direct array access patterns.
 *
 * @example
 * // Create matrices
 * const a = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
 * const b = new Matrix(3, 2, [1, 2, 3, 4, 5, 6]);
 *
 * // Matrix multiplication
 * const c = a.multiply(b);
 * console.log(c.toString()); // 2x2 result matrix
 */
export class Matrix {
	/**
	 * Create a new matrix with specified dimensions.
	 * Optionally initialize with data array.
	 *
	 * @param {number} rows - Number of rows
	 * @param {number} cols - Number of columns
	 * @param {Array<number>|Float32Array} [data] - Initial data in row-major order
	 */
	constructor(rows, cols, data = null) {
		if (!Number.isInteger(rows) || rows <= 0) {
			throw new Error("Rows must be a positive integer");
		}
		if (!Number.isInteger(cols) || cols <= 0) {
			throw new Error("Columns must be a positive integer");
		}

		this.rows = rows;
		this.cols = cols;
		this.size = rows * cols;

		// Use Float32Array for V8 optimization and memory efficiency
		this.data = new Float32Array(this.size);

		// Initialize with provided data if given
		if (data !== null) {
			if (data.length !== this.size) {
				throw new Error(
					`Data length ${data.length} does not match matrix size ${this.size}`,
				);
			}

			// Copy data to Float32Array with validation
			for (let i = 0; i < this.size; i++) {
				if (!Number.isFinite(data[i])) {
					throw new Error(`Invalid data value at index ${i}: ${data[i]}`);
				}
				this.data[i] = data[i];
			}
		}
	}

	/**
	 * Get matrix element at specified row and column.
	 * Uses inline row-major indexing for V8 optimization.
	 *
	 * @param {number} row - Row index (0-based)
	 * @param {number} col - Column index (0-based)
	 * @returns {number} Matrix element value
	 */
	get(row, col) {
		this._validateIndices(row, col);
		return this.data[row * this.cols + col];
	}

	/**
	 * Set matrix element at specified row and column.
	 * Uses inline row-major indexing for V8 optimization.
	 *
	 * @param {number} row - Row index (0-based)
	 * @param {number} col - Column index (0-based)
	 * @param {number} value - Value to set
	 */
	set(row, col, value) {
		this._validateIndices(row, col);
		if (!Number.isFinite(value)) {
			throw new Error(`Invalid value: ${value}`);
		}
		this.data[row * this.cols + col] = value;
	}

	/**
	 * Validate row and column indices for bounds checking.
	 * @private
	 * @param {number} row - Row index
	 * @param {number} col - Column index
	 */
	_validateIndices(row, col) {
		if (!Number.isInteger(row) || row < 0 || row >= this.rows) {
			throw new Error(`Row index ${row} out of bounds [0, ${this.rows})`);
		}
		if (!Number.isInteger(col) || col < 0 || col >= this.cols) {
			throw new Error(`Column index ${col} out of bounds [0, ${this.cols})`);
		}
	}

	/**
	 * Create a matrix filled with zeros.
	 *
	 * @param {number} rows - Number of rows
	 * @param {number} cols - Number of columns
	 * @returns {Matrix} New zero matrix
	 */
	static zeros(rows, cols) {
		return new Matrix(rows, cols);
	}

	/**
	 * Create a matrix filled with ones.
	 *
	 * @param {number} rows - Number of rows
	 * @param {number} cols - Number of columns
	 * @returns {Matrix} New matrix filled with ones
	 */
	static ones(rows, cols) {
		const matrix = new Matrix(rows, cols);
		matrix.data.fill(1);
		return matrix;
	}

	/**
	 * Create an identity matrix.
	 *
	 * @param {number} size - Size of square identity matrix
	 * @returns {Matrix} New identity matrix
	 */
	static identity(size) {
		const matrix = new Matrix(size, size);
		for (let i = 0; i < size; i++) {
			matrix.set(i, i, 1);
		}
		return matrix;
	}

	/**
	 * Create a matrix filled with uniform random values.
	 *
	 * @param {number} rows - Number of rows
	 * @param {number} cols - Number of columns
	 * @param {number} [min=-1] - Minimum value
	 * @param {number} [max=1] - Maximum value
	 * @returns {Matrix} New matrix with uniform random values
	 */
	static random(rows, cols, min = -1, max = 1) {
		const matrix = new Matrix(rows, cols);
		const range = max - min;

		for (let i = 0; i < matrix.size; i++) {
			matrix.data[i] = Math.random() * range + min;
		}

		return matrix;
	}

	/**
	 * Matrix multiplication with another matrix.
	 *
	 * @param {Matrix} other - Matrix to multiply with
	 * @param {Matrix} [result] - Optional output matrix to write result
	 * @returns {Matrix} Result matrix (new or provided result matrix)
	 */
	multiply(other, result = null) {
		if (!(other instanceof Matrix)) {
			throw new Error("Expected Matrix instance");
		}
		if (this.cols !== other.rows) {
			throw new Error(
				`Cannot multiply ${this.rows}×${this.cols} with ${other.rows}×${other.cols}: inner dimensions must match`,
			);
		}

		// Create result matrix if not provided
		if (result === null) {
			result = new Matrix(this.rows, other.cols);
		} else {
			if (result.rows !== this.rows || result.cols !== other.cols) {
				throw new Error(
					`Result matrix dimensions ${result.rows}×${result.cols} do not match expected ${this.rows}×${other.cols}`,
				);
			}
		}

		// Standard matrix multiplication
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < other.cols; j++) {
				let sum = 0;
				for (let k = 0; k < this.cols; k++) {
					sum += this.data[i * this.cols + k] * other.data[k * other.cols + j];
				}
				result.data[i * result.cols + j] = sum;
			}
		}

		return result;
	}

	/**
	 * Element-wise addition with another matrix.
	 * Optionally write result to provided output matrix.
	 *
	 * @param {Matrix} other - Matrix to add
	 * @param {Matrix} [result] - Optional output matrix
	 * @returns {Matrix} Result matrix
	 */
	add(other, result = null) {
		if (!(other instanceof Matrix)) {
			throw new Error("Expected Matrix instance");
		}
		if (this.rows !== other.rows || this.cols !== other.cols) {
			throw new Error(
				`Cannot add matrices of different dimensions: ${this.rows}×${this.cols} vs ${other.rows}×${other.cols}`,
			);
		}

		if (result === null) {
			result = new Matrix(this.rows, this.cols);
		} else {
			if (result.rows !== this.rows || result.cols !== this.cols) {
				throw new Error(`Result matrix dimensions do not match`);
			}
		}

		// Vectorized addition
		for (let i = 0; i < this.size; i++) {
			result.data[i] = this.data[i] + other.data[i];
		}

		return result;
	}

	/**
	 * Element-wise subtraction with another matrix.
	 *
	 * @param {Matrix} other - Matrix to subtract
	 * @param {Matrix} [result] - Optional output matrix
	 * @returns {Matrix} Result matrix
	 */
	subtract(other, result = null) {
		if (!(other instanceof Matrix)) {
			throw new Error("Expected Matrix instance");
		}
		if (this.rows !== other.rows || this.cols !== other.cols) {
			throw new Error(`Cannot subtract matrices of different dimensions`);
		}

		if (result === null) {
			result = new Matrix(this.rows, this.cols);
		}

		for (let i = 0; i < this.size; i++) {
			result.data[i] = this.data[i] - other.data[i];
		}

		return result;
	}

	/**
	 * Element-wise addition with another matrix, modifying this matrix in place.
	 *
	 * @param {Matrix} other - Matrix to add
	 * @returns {Matrix} This matrix (for chaining)
	 */
	addInPlace(other) {
		if (!(other instanceof Matrix)) {
			throw new Error("Expected Matrix instance");
		}
		if (this.rows !== other.rows || this.cols !== other.cols) {
			throw new Error("Matrix dimensions must match for in-place addition");
		}

		const thisData = this.data;
		const otherData = other.data;
		const size = this.size;

		for (let i = 0; i < size; i++) {
			thisData[i] += otherData[i];
		}

		return this;
	}

	/**
	 * Scalar multiplication modifying this matrix in place.
	 *
	 * @param {number} scalar - Scalar value to multiply by
	 * @returns {Matrix} This matrix (for chaining)
	 */
	scaleInPlace(scalar) {
		if (!Number.isFinite(scalar)) {
			throw new Error(`Invalid scalar value: ${scalar}`);
		}

		const data = this.data;
		const size = this.size;

		for (let i = 0; i < size; i++) {
			data[i] *= scalar;
		}

		return this;
	}

	/**
	 * Transpose the matrix (flip rows and columns).
	 *
	 * @param {Matrix} [result] - Optional output matrix
	 * @returns {Matrix} Transposed matrix
	 */
	transpose(result = null) {
		if (result === null) {
			result = new Matrix(this.cols, this.rows);
		} else {
			if (result.rows !== this.cols || result.cols !== this.rows) {
				throw new Error(
					`Result matrix dimensions must be ${this.cols}×${this.rows} for transpose`,
				);
			}
		}

		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.cols; j++) {
				result.data[j * result.cols + i] = this.data[i * this.cols + j];
			}
		}

		return result;
	}

	/**
	 * Apply ReLU activation function element-wise.
	 * ReLU(x) = max(0, x)
	 *
	 * @param {Matrix} [result] - Optional output matrix
	 * @returns {Matrix} Result matrix with ReLU applied
	 */
	relu(result = null) {
		if (result === null) {
			result = new Matrix(this.rows, this.cols);
		}

		for (let i = 0; i < this.size; i++) {
			result.data[i] = Math.max(0, this.data[i]);
		}

		return result;
	}

	/**
	 * Apply ReLU activation function element-wise, modifying this matrix in place.
	 *
	 * @returns {Matrix} This matrix (for chaining)
	 */
	reluInPlace() {
		const data = this.data;
		const size = this.size;

		for (let i = 0; i < size; i++) {
			const value = data[i];
			data[i] = value > 0 ? value : 0;
		}
		return this;
	}

	/**
	 * Create a copy of this matrix.
	 *
	 * @returns {Matrix} New matrix with same values
	 */
	clone() {
		const copy = new Matrix(this.rows, this.cols);
		copy.data.set(this.data);
		return copy;
	}

	/**
	 * Fill matrix with specified value.
	 *
	 * @param {number} value - Value to fill with
	 * @returns {Matrix} This matrix (for chaining)
	 */
	fill(value) {
		if (!Number.isFinite(value)) {
			throw new Error(`Invalid fill value: ${value}`);
		}
		this.data.fill(value);
		return this;
	}

	/**
	 * Get a specific row as a new matrix.
	 *
	 * @param {number} rowIndex - Row to extract
	 * @returns {Matrix} Row vector (1×cols matrix)
	 */
	getRow(rowIndex) {
		if (rowIndex < 0 || rowIndex >= this.rows) {
			throw new Error(`Row index ${rowIndex} out of bounds`);
		}

		const row = new Matrix(1, this.cols);
		const startIdx = rowIndex * this.cols;

		for (let j = 0; j < this.cols; j++) {
			row.data[j] = this.data[startIdx + j];
		}

		return row;
	}

	/**
	 * Get a specific column as a new matrix.
	 *
	 * @param {number} colIndex - Column to extract
	 * @returns {Matrix} Column vector (rows×1 matrix)
	 */
	getColumn(colIndex) {
		if (colIndex < 0 || colIndex >= this.cols) {
			throw new Error(`Column index ${colIndex} out of bounds`);
		}

		const col = new Matrix(this.rows, 1);

		for (let i = 0; i < this.rows; i++) {
			col.data[i] = this.data[i * this.cols + colIndex];
		}

		return col;
	}

	/**
	 * Calculate Frobenius norm of the matrix.
	 * ||A||_F = sqrt(sum of all elements squared)
	 *
	 * @returns {number} Frobenius norm
	 */
	norm() {
		let sum = 0;
		for (let i = 0; i < this.size; i++) {
			sum += this.data[i] * this.data[i];
		}
		return Math.sqrt(sum);
	}

	/**
	 * Check if matrix equals another matrix within tolerance.
	 *
	 * @param {Matrix} other - Matrix to compare with
	 * @param {number} [tolerance=1e-6] - Tolerance for floating point comparison
	 * @returns {boolean} True if matrices are equal within tolerance
	 */
	equals(other, tolerance = 1e-6) {
		if (!(other instanceof Matrix)) {
			return false;
		}
		if (this.rows !== other.rows || this.cols !== other.cols) {
			return false;
		}

		for (let i = 0; i < this.size; i++) {
			if (Math.abs(this.data[i] - other.data[i]) > tolerance) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Convert matrix to plain JavaScript array (row-major order).
	 *
	 * @returns {Array<Array<number>>} 2D array representation
	 */
	toArray() {
		const result = [];
		for (let i = 0; i < this.rows; i++) {
			const row = [];
			for (let j = 0; j < this.cols; j++) {
				row.push(this.data[i * this.cols + j]);
			}
			result.push(row);
		}
		return result;
	}

	/**
	 * Convert matrix to flat array.
	 *
	 * @returns {Array<number>} Flat array in row-major order
	 */
	toFlatArray() {
		return Array.from(this.data);
	}

	/**
	 * Serialize matrix to JSON.
	 *
	 * @returns {Object} JSON representation
	 */
	toJSON() {
		return {
			rows: this.rows,
			cols: this.cols,
			data: Array.from(this.data),
		};
	}

	/**
	 * Create matrix from JSON representation.
	 *
	 * @param {Object} json - JSON object with rows, cols, and data
	 * @returns {Matrix} New matrix instance
	 */
	static fromJSON(json) {
		if (!json || typeof json !== "object") {
			throw new Error("Invalid JSON: expected object");
		}

		const jsonAny = /** @type {any} */ (json);
		if (!Number.isInteger(jsonAny.rows) || !Number.isInteger(jsonAny.cols)) {
			throw new Error("Invalid JSON: rows and cols must be integers");
		}
		if (!Array.isArray(jsonAny.data)) {
			throw new Error("Invalid JSON: data must be an array");
		}

		return new Matrix(jsonAny.rows, jsonAny.cols, jsonAny.data);
	}

	/**
	 * String representation of matrix for debugging.
	 *
	 * @param {number} [precision=3] - Number of decimal places
	 * @returns {string} Formatted matrix string
	 */
	toString(precision = 3) {
		const rows = [];
		for (let i = 0; i < this.rows; i++) {
			const row = [];
			for (let j = 0; j < this.cols; j++) {
				row.push(this.data[i * this.cols + j].toFixed(precision));
			}
			rows.push(`[${row.join(", ")}]`);
		}
		return `Matrix ${this.rows}×${this.cols}:\n${rows.join("\n")}`;
	}
}
