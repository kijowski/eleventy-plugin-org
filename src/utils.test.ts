import * as assert from "node:assert";
import test from "node:test";
import { parseTimestamp } from "./utils.js";

test("active timestamp parsing", () => {
  const input = "<2022-01-05>";
  const result = parseTimestamp(input);
  assert.equal(result, "2022-01-05");
});

test("inactive timestamp parsing", () => {
  const input = "[2022-01-05]";
  const result = parseTimestamp(input);
  assert.equal(result, "2022-01-05");
});

test("timestamp with additional data parsing", () => {
  const input = "[2022-01-05 10:30]";
  const result = parseTimestamp(input);
  assert.equal(result, "2022-01-05");
});
