/**
 * バリデーションユーティリティ
 * Zodスキーマとバリデーション関数を提供
 */

import { z } from "zod";

/**
 * SNSリンクのバリデーションスキーマ
 */
export const socialLinkSchema = z.object({
  service: z
    .string()
    .min(1, "サービス名は必須です")
    .max(50, "サービス名は50文字以内で入力してください"),
  url: z
    .string()
    .min(1, "URLは必須です")
    .regex(
      /^https?:\/\/.+/,
      "URLはhttp://またはhttps://で始まる有効な形式で入力してください"
    ),
});

/**
 * プロフィールのバリデーションスキーマ
 */
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "名前は必須です")
    .max(100, "名前は100文字以内で入力してください"),
  jobTitle: z
    .string()
    .min(1, "職種は必須です")
    .max(100, "職種は100文字以内で入力してください"),
  bio: z
    .string()
    .max(500, "自己紹介は500文字以内で入力してください")
    .optional(),
  skills: z
    .array(z.string())
    .max(20, "スキルは20個まで登録できます"),
  yearsOfExperience: z
    .number()
    .min(0, "経験年数は0以上で入力してください")
    .max(100, "経験年数は100以下で入力してください")
    .optional(),
  socialLinks: z
    .array(socialLinkSchema)
    .max(10, "SNSリンクは10個まで登録できます"),
});

/**
 * プロフィールフォームデータのバリデーションスキーマ
 * フォームでは経験年数を文字列として扱うため、専用のスキーマを用意
 */
export const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, "名前は必須です")
    .max(100, "名前は100文字以内で入力してください"),
  jobTitle: z
    .string()
    .min(1, "職種は必須です")
    .max(100, "職種は100文字以内で入力してください"),
  bio: z
    .string()
    .max(500, "自己紹介は500文字以内で入力してください")
    .optional()
    .default(""),
  skills: z
    .array(z.string())
    .max(20, "スキルは20個まで登録できます")
    .default([]),
  yearsOfExperience: z
    .string()
    .optional()
    .default(""),
  socialLinks: z
    .array(
      z.object({
        service: z
          .string()
          .min(1, "サービス名は必須です")
          .max(50, "サービス名は50文字以内で入力してください"),
        url: z
          .string()
          .min(1, "URLは必須です")
          .regex(
            /^https?:\/\/.+/,
            "URLはhttp://またはhttps://で始まる有効な形式で入力してください"
          ),
      })
    )
    .max(10, "SNSリンクは10個まで登録できます")
    .default([]),
});

/**
 * バリデーション結果の型
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

/**
 * プロフィールデータをバリデーションする
 * @param data バリデーション対象のデータ
 * @returns バリデーション結果
 */
export function validateProfile(data: unknown): ValidationResult<z.infer<typeof profileSchema>> {
  const result = profileSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // エラーをフィールドごとに整理
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((error) => {
    const path = error.path.join(".");
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  });

  return { success: false, errors };
}

/**
 * プロフィールフォームデータをバリデーションする
 * @param data バリデーション対象のデータ
 * @returns バリデーション結果
 */
export function validateProfileForm(
  data: unknown
): ValidationResult<z.infer<typeof profileFormSchema>> {
  const result = profileFormSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // エラーをフィールドごとに整理
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((error) => {
    const path = error.path.join(".");
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  });

  return { success: false, errors };
}

/**
 * SNSリンクをバリデーションする
 * @param data バリデーション対象のデータ
 * @returns バリデーション結果
 */
export function validateSocialLink(
  data: unknown
): ValidationResult<z.infer<typeof socialLinkSchema>> {
  const result = socialLinkSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // エラーをフィールドごとに整理
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((error) => {
    const path = error.path.join(".");
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  });

  return { success: false, errors };
}

/**
 * URLが有効かどうかをチェックする
 * @param url チェック対象のURL
 * @returns 有効な場合true
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 経験年数の文字列を数値に変換する
 * @param value 変換対象の文字列
 * @returns 変換された数値、または undefined
 */
export function parseYearsOfExperience(value: string): number | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (isNaN(parsed) || parsed < 0 || parsed > 100) {
    return undefined;
  }

  return parsed;
}
