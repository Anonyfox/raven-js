import assert from "node:assert";
import { mkdtempSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { loadEnv, parseEnv } from "./dotenv.js";

describe("parseEnv", () => {
  it("validates input type", () => {
    assert.throws(() => parseEnv(123), /Expected content to be a string/);
    assert.throws(() => parseEnv(null), /Expected content to be a string/);
  });

  it("handles empty content and returns empty object", () => {
    assert.deepEqual(parseEnv(""), {});
    assert.deepEqual(parseEnv("\n\n\n"), {});
  });

  it("parses simple KEY=value pairs", () => {
    const content = "FOO=bar\nBAZ=qux";
    assert.deepEqual(parseEnv(content), { FOO: "bar", BAZ: "qux" });
  });

  it("strips double and single quotes from values", () => {
    const content = "KEY1=\"quoted value\"\nKEY2='single quoted'";
    assert.deepEqual(parseEnv(content), { KEY1: "quoted value", KEY2: "single quoted" });
  });

  it("preserves values with embedded equals signs", () => {
    const content = "URL=https://example.com?a=1&b=2";
    assert.deepEqual(parseEnv(content), { URL: "https://example.com?a=1&b=2" });
  });

  it("trims whitespace around keys and unquoted values", () => {
    const content = "  KEY1  =  value1  \nKEY2=  value2  ";
    assert.deepEqual(parseEnv(content), { KEY1: "value1", KEY2: "value2" });
  });

  it("handles empty values", () => {
    const content = "EMPTY=\nALSO_EMPTY=";
    assert.deepEqual(parseEnv(content), { EMPTY: "", ALSO_EMPTY: "" });
  });

  it("skips comment lines", () => {
    const content = "# This is a comment\nKEY=value\n# Another comment";
    assert.deepEqual(parseEnv(content), { KEY: "value" });
  });

  it("skips lines without equals sign", () => {
    const content = "KEY=value\nINVALID_LINE\nKEY2=value2";
    assert.deepEqual(parseEnv(content), { KEY: "value", KEY2: "value2" });
  });

  it("skips lines with empty keys", () => {
    const content = "=value\n  =another\nVALID=ok";
    assert.deepEqual(parseEnv(content), { VALID: "ok" });
  });

  it("last value wins for duplicate keys", () => {
    const content = "KEY=first\nKEY=second\nKEY=third";
    assert.deepEqual(parseEnv(content), { KEY: "third" });
  });

  it("handles CRLF line endings", () => {
    const content = "KEY1=value1\r\nKEY2=value2\r\n";
    assert.deepEqual(parseEnv(content), { KEY1: "value1", KEY2: "value2" });
  });

  it("preserves spaces inside quoted values", () => {
    const content = 'KEY="  spaced  "';
    assert.deepEqual(parseEnv(content), { KEY: "  spaced  " });
  });

  it("does not strip quotes if they don't wrap entire value", () => {
    const content = 'KEY="start\nKEY2=end"';
    assert.deepEqual(parseEnv(content), { KEY: '"start', KEY2: 'end"' });
  });
});

describe("loadEnv", () => {
  it("validates filepath type", () => {
    assert.throws(() => loadEnv(123), /Expected filepath to be a string/);
    assert.throws(() => loadEnv(null), /Expected filepath to be a string/);
  });

  it("reads file, parses, and applies to process.env", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "dotenv-test-"));
    const envFile = join(tmpDir, ".env");
    writeFileSync(envFile, "TEST_VAR_1=value1\nTEST_VAR_2=value2");

    const result = loadEnv(envFile);

    assert.deepEqual(result, { TEST_VAR_1: "value1", TEST_VAR_2: "value2" });
    assert.equal(process.env.TEST_VAR_1, "value1");
    assert.equal(process.env.TEST_VAR_2, "value2");

    // Cleanup
    delete process.env.TEST_VAR_1;
    delete process.env.TEST_VAR_2;
    unlinkSync(envFile);
  });

  it("overwrites existing process.env keys", () => {
    process.env.OVERWRITE_TEST = "original";

    const tmpDir = mkdtempSync(join(tmpdir(), "dotenv-test-"));
    const envFile = join(tmpDir, ".env");
    writeFileSync(envFile, "OVERWRITE_TEST=new");

    loadEnv(envFile);

    assert.equal(process.env.OVERWRITE_TEST, "new");

    // Cleanup
    delete process.env.OVERWRITE_TEST;
    unlinkSync(envFile);
  });

  it("uses default .env path when no argument provided", () => {
    const originalCwd = process.cwd();
    const tmpDir = mkdtempSync(join(tmpdir(), "dotenv-test-"));
    process.chdir(tmpDir);

    writeFileSync(".env", "DEFAULT_PATH_TEST=success");

    const result = loadEnv();

    assert.deepEqual(result, { DEFAULT_PATH_TEST: "success" });
    assert.equal(process.env.DEFAULT_PATH_TEST, "success");

    // Cleanup
    delete process.env.DEFAULT_PATH_TEST;
    process.chdir(originalCwd);
    unlinkSync(join(tmpDir, ".env"));
  });

  it("throws when file does not exist", () => {
    assert.throws(() => loadEnv("/nonexistent/path/.env"), /ENOENT/);
  });
});
