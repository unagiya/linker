/**
 * バリデーション関数のプロパティベーステスト
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { isValidUrl, validateSocialLink, parseYearsOfExperience } from "./validation";

/**
 * Feature: engineer-profile-platform, Property 4: URLバリデーション
 * 検証: 要件 2.5
 *
 * 任意のURL文字列に対して、有効なURL形式（http/https）の場合のみ受け入れられ、
 * 無効な形式の場合はバリデーションエラーが発生する
 */
describe("Property 4: URLバリデーション", () => {
  it("有効なHTTP/HTTPS URLは常に受け入れられる", () => {
    fc.assert(
      fc.property(
        fc.webUrl({ validSchemes: ["http", "https"] }),
        (url) => {
          // 有効なURLはisValidUrlでtrueを返す
          const isValid = isValidUrl(url);
          return isValid === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("HTTP/HTTPS以外のスキームを持つURLは拒否される", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("ftp://example.com"),
          fc.constant("file:///path/to/file"),
          fc.constant("mailto:user@example.com"),
          fc.constant("ws://example.com"),
          fc.constant("wss://example.com")
        ),
        (url) => {
          // HTTP/HTTPS以外のスキームは拒否される
          const isValid = isValidUrl(url);
          return isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("無効な文字列はURLとして拒否される", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().filter((s) => !s.startsWith("http")),
          fc.constant(""),
          fc.constant("not-a-url"),
          fc.constant("example.com"), // スキームなし
          fc.constant("//example.com") // スキームなし
        ),
        (invalidUrl) => {
          // 無効な文字列は拒否される
          const isValid = isValidUrl(invalidUrl);
          return isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("SNSリンクバリデーションで有効なURLのみ受け入れられる", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl({ validSchemes: ["http", "https"] }),
        (service, url) => {
          // 有効なURLを持つSNSリンクは成功する
          const result = validateSocialLink({ service, url });
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("SNSリンクバリデーションで無効なURLは拒否される", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(
          fc.constant("not-a-url"),
          fc.constant(""),
          fc.constant("example.com"),
          fc.constant("//example.com"),
          fc.constant("ftp://example.com"),
          fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) => !s.startsWith("http") && !s.includes(":")
          )
        ),
        (service, invalidUrl) => {
          // 無効なURLを持つSNSリンクは失敗する
          const result = validateSocialLink({ service, url: invalidUrl });
          return result.success === false && result.errors.url !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: engineer-profile-platform, Property 6: 経験年数の数値バリデーション
 * 検証: 要件 2.7
 *
 * 任意の入力値に対して、0以上の数値のみが受け入れられ、
 * 負の数や非数値はバリデーションエラーとなる
 */
describe("Property 6: 経験年数の数値バリデーション", () => {
  it("0から100の範囲の数値は常に受け入れられる", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (years) => {
        // 有効な範囲の数値は正しく変換される
        const result = parseYearsOfExperience(years.toString());
        return result === years;
      }),
      { numRuns: 100 }
    );
  });

  it("負の数は常に拒否される", () => {
    fc.assert(
      fc.property(fc.integer({ max: -1 }), (negativeYears) => {
        // 負の数はundefinedを返す
        const result = parseYearsOfExperience(negativeYears.toString());
        return result === undefined;
      }),
      { numRuns: 100 }
    );
  });

  it("100を超える数は常に拒否される", () => {
    fc.assert(
      fc.property(fc.integer({ min: 101 }), (largeYears) => {
        // 100を超える数はundefinedを返す
        const result = parseYearsOfExperience(largeYears.toString());
        return result === undefined;
      }),
      { numRuns: 100 }
    );
  });

  it("非数値文字列は常に拒否される", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => isNaN(Number(s)) || s.trim() === ""),
        (nonNumeric) => {
          // 非数値文字列はundefinedを返す
          const result = parseYearsOfExperience(nonNumeric);
          return result === undefined;
        }
      ),
      { numRuns: 100 }
    );
  });
});
