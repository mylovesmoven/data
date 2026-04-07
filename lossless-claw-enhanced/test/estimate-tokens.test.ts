import { describe, it, expect } from "vitest";

// Will import from the shared module once created
import { estimateTokens } from "../src/estimate-tokens.js";

describe("estimateTokens", () => {
  // --- ASCII text (existing behavior should be preserved) ---

  it("estimates ASCII text at ~4 chars per token", () => {
    const ascii = "Hello, this is an English sentence for testing.";
    const estimate = estimateTokens(ascii);
    // 47 chars / 4 = 11.75, ceil = 12
    expect(estimate).toBe(Math.ceil(ascii.length / 4));
  });

  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("returns 1 for a single character", () => {
    expect(estimateTokens("a")).toBe(1);
  });

  // --- CJK text (the core fix) ---

  it("estimates pure CJK text higher than length/4", () => {
    // 10 Chinese chars: JS length = 10, old estimate = ceil(10/4) = 3
    // Real tokens ≈ 10-15 (each CJK char is roughly 1-2 tokens)
    // Our fix should give at least 10 tokens, not 3
    const chinese = "今天天气真不错啊你好吗";
    const estimate = estimateTokens(chinese);
    expect(estimate).toBeGreaterThanOrEqual(10);
  });

  it("estimates Japanese text higher than length/4", () => {
    // Mixed hiragana + kanji
    const japanese = "こんにちは世界東京タワー";
    const estimate = estimateTokens(japanese);
    expect(estimate).toBeGreaterThanOrEqual(10);
  });

  it("estimates Korean text higher than length/4", () => {
    const korean = "안녕하세요세계대한민국";
    const estimate = estimateTokens(korean);
    expect(estimate).toBeGreaterThanOrEqual(10);
  });

  it("estimates mixed CJK+ASCII proportionally", () => {
    // "Hello 你好世界 world" — mix of ASCII and CJK
    const mixed = "Hello 你好世界 world";
    const pureAscii = "Hello  world"; // 12 chars → 3 tokens
    const pureCjk = "你好世界"; // 4 CJK chars → ~4-6 tokens
    const estimate = estimateTokens(mixed);
    // Should be noticeably higher than pure ASCII estimate
    const asciiOnlyEstimate = Math.ceil(mixed.length / 4); // ceil(13/4) = 4
    expect(estimate).toBeGreaterThan(asciiOnlyEstimate);
  });

  it("handles long Chinese paragraph correctly", () => {
    // A realistic Chinese message (40 chars)
    const paragraph = "这个项目的架构设计非常优秀，使用了有向无环图来管理上下文压缩，确保每条消息都不会丢失";
    const estimate = estimateTokens(paragraph);
    // Old: ceil(40/4) = 10, way too low
    // Real: ~40-60 tokens for 40 CJK chars
    // Our estimate should be at least 35
    expect(estimate).toBeGreaterThanOrEqual(35);
  });

  // --- Edge cases ---

  it("handles emoji (supplementary plane chars)", () => {
    // Emoji are surrogate pairs in JS: "😀" has length 2
    const emoji = "😀😃😄😁";
    const estimate = estimateTokens(emoji);
    // Each emoji is typically 1-3 tokens
    expect(estimate).toBeGreaterThanOrEqual(4);
  });

  it("handles CJK punctuation within CJK text", () => {
    // CJK punctuation like ，。！ should count similarly to CJK chars
    const withPunctuation = "你好，世界！这是测试。";
    const estimate = estimateTokens(withPunctuation);
    expect(estimate).toBeGreaterThanOrEqual(8);
  });
});
