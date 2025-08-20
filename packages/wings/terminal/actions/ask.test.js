import { strict as assert } from "node:assert";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

describe("ask", () => {
	let originalGetReadline;
	let mockInterface;
	let capturedQuestions;
	let mockAnswers;
	let answerIndex;

	beforeEach(async () => {
		// Import the module and store original
		const askModule = await import("./ask.js");
		originalGetReadline = askModule.readlineProvider.getReadline;

		// Reset test state
		capturedQuestions = [];
		mockAnswers = [];
		answerIndex = 0;

		// Create mock interface
		mockInterface = {
			question: mock.fn((prompt, callback) => {
				capturedQuestions.push(prompt);
				callback(mockAnswers[answerIndex++] || "");
			}),
			close: mock.fn(),
			on: mock.fn(),
		};
	});

	afterEach(async () => {
		// Restore original getReadline
		const askModule = await import("./ask.js");
		askModule.readlineProvider.getReadline = originalGetReadline;
		mock.reset();
	});

	describe("parameter validation", () => {
		it("should throw TypeError for non-string question", async () => {
			const { ask } = await import("./ask.js");

			await assert.rejects(async () => await ask(null), {
				name: "TypeError",
				message: "Question must be a string",
			});

			await assert.rejects(async () => await ask(123), {
				name: "TypeError",
				message: "Question must be a string",
			});

			await assert.rejects(async () => await ask({}), {
				name: "TypeError",
				message: "Question must be a string",
			});
		});
	});

	describe("normal operation", () => {
		it("should ask question and return trimmed answer", async () => {
			const askModule = await import("./ask.js");

			// Replace the module export
			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => mockInterface,
			});

			mockAnswers = ["  John Doe  "];

			const result = await askModule.ask("What is your name? ");

			assert.equal(result, "John Doe");
			assert.equal(capturedQuestions[0], "What is your name? ");
			assert.equal(mockInterface.question.mock.callCount(), 1);
			assert.equal(mockInterface.close.mock.callCount(), 1);
		});

		it("should handle empty answers", async () => {
			const askModule = await import("./ask.js");

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => mockInterface,
			});

			mockAnswers = [""];

			const result = await askModule.ask("Press enter: ");

			assert.equal(result, "");
		});
	});

	describe("error handling", () => {
		it("should handle readline import errors", async () => {
			const askModule = await import("./ask.js");

			askModule.readlineProvider.getReadline = async () => {
				throw new Error("Import failed");
			};

			await assert.rejects(() => askModule.ask("Test?"), /Import failed/);
		});

		it("should call readlineProvider.getReadline function directly", async () => {
			const askModule = await import("./ask.js");

			// Test that the getReadline function can be called directly
			const result = await askModule.readlineProvider.getReadline();
			assert.ok(result);
			assert.equal(typeof result.createInterface, "function");
		});

		it("should handle createInterface errors", async () => {
			const askModule = await import("./ask.js");

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => {
					throw new Error("Interface failed");
				},
			});

			await assert.rejects(() => askModule.ask("Test?"), /Interface failed/);
		});

		it("should handle question errors", async () => {
			const askModule = await import("./ask.js");

			const errorInterface = {
				question: () => {
					throw new Error("Question failed");
				},
				close: mock.fn(),
				on: mock.fn(),
			};

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => errorInterface,
			});

			await assert.rejects(() => askModule.ask("Test?"), /Question failed/);
		});

		it("should handle readline error events", async () => {
			const askModule = await import("./ask.js");

			const errorInterface = {
				question: () => {
					throw new Error("Readline error");
				},
				close: mock.fn(),
				on: mock.fn(),
			};

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => errorInterface,
			});

			await assert.rejects(() => askModule.ask("Test?"), /Readline error/);
		});

		it("should close interface even when errors occur", async () => {
			const askModule = await import("./ask.js");

			const errorInterface = {
				question: () => {
					throw new Error("Question failed");
				},
				close: mock.fn(),
				on: mock.fn(),
			};

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => errorInterface,
			});

			await assert.rejects(() => askModule.ask("Test?"), /Question failed/);
			assert.equal(errorInterface.close.mock.callCount(), 1);
		});
	});
});

describe("confirm", () => {
	let originalGetReadline;
	let originalConsoleLog;
	let mockInterface;
	let capturedQuestions;
	let capturedLogs;
	let mockAnswers;
	let answerIndex;

	beforeEach(async () => {
		// Import and store original
		const askModule = await import("./ask.js");
		originalGetReadline = askModule.readlineProvider.getReadline;

		// Mock console.log
		originalConsoleLog = console.log;
		capturedLogs = [];
		console.log = (msg) => capturedLogs.push(msg);

		// Reset test state
		capturedQuestions = [];
		mockAnswers = [];
		answerIndex = 0;

		// Create mock interface
		mockInterface = {
			question: mock.fn((prompt, callback) => {
				capturedQuestions.push(prompt);
				callback(mockAnswers[answerIndex++] || "");
			}),
			close: mock.fn(),
			on: mock.fn(),
		};
	});

	afterEach(async () => {
		// Restore originals
		const askModule = await import("./ask.js");
		askModule.readlineProvider.getReadline = originalGetReadline;
		console.log = originalConsoleLog;
		mock.reset();
	});

	describe("parameter validation", () => {
		it("should throw TypeError for non-string question", async () => {
			const { confirm } = await import("./ask.js");

			await assert.rejects(async () => await confirm(null), {
				name: "TypeError",
				message: "Question must be a string",
			});

			await assert.rejects(async () => await confirm(123), {
				name: "TypeError",
				message: "Question must be a string",
			});
		});
	});

	describe("response handling", () => {
		it("should return true for yes responses", async () => {
			const askModule = await import("./ask.js");

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => mockInterface,
			});

			const testInputs = ["y", "Y", "yes", "YES", "Yes"];

			for (const input of testInputs) {
				answerIndex = 0; // Reset for each test
				mockAnswers = [input];

				const result = await askModule.confirm("Continue? ");
				assert.equal(result, true, `Failed for input: ${input}`);
			}
		});

		it("should return false for no responses", async () => {
			const askModule = await import("./ask.js");

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => mockInterface,
			});

			const testInputs = ["n", "N", "no", "NO", "No"];

			for (const input of testInputs) {
				answerIndex = 0; // Reset for each test
				mockAnswers = [input];

				const result = await askModule.confirm("Continue? ");
				assert.equal(result, false, `Failed for input: ${input}`);
			}
		});

		it("should use default value for empty response", async () => {
			const askModule = await import("./ask.js");

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => mockInterface,
			});

			// Test default false
			mockAnswers = [""];
			answerIndex = 0;

			const result1 = await askModule.confirm("Continue? ");
			assert.equal(result1, false);

			// Test default true
			mockAnswers = [""];
			answerIndex = 0;

			const result2 = await askModule.confirm("Continue? ", true);
			assert.equal(result2, true);
		});

		it("should retry on invalid input", async () => {
			const askModule = await import("./ask.js");

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => mockInterface,
			});

			mockAnswers = ["invalid", "maybe", "y"];

			const result = await askModule.confirm("Continue? ");

			assert.equal(result, true);
			assert.equal(capturedQuestions.length, 3);
			assert.equal(capturedLogs.length, 2); // Two error messages
			assert.ok(
				capturedLogs.every((log) =>
					log.includes("Please enter 'y' for yes or 'n' for no."),
				),
			);
		});
	});

	describe("prompt formatting", () => {
		it("should format prompt with correct default indicators", async () => {
			const askModule = await import("./ask.js");

			askModule.readlineProvider.getReadline = async () => ({
				createInterface: () => mockInterface,
			});

			// Test default false
			mockAnswers = ["y"];
			answerIndex = 0;

			await askModule.confirm("Deploy? ");
			assert.equal(capturedQuestions[0], "Deploy? [y/N] ");

			// Test default true
			mockAnswers = ["n"];
			answerIndex = 0;
			capturedQuestions = [];

			await askModule.confirm("Deploy? ", true);
			assert.equal(capturedQuestions[0], "Deploy? [Y/n] ");
		});
	});
});
