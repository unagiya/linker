/**
 * ニックネームバリデーション機能
 */

import { z } from 'zod';
import { RESERVED_NICKNAMES } from '../types/nickname';
import type { NicknameValidationResult } from '../types/nickname';

/**
 * ニックネーム形式バリデーションスキーマ
 */
const nicknameSchema = z
  .string()
  .min(3, "ニックネームは3文字以上で入力してください")
  .max(36, "ニックネームは36文字以下で入力してください")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "ニックネームは英数字、ハイフン、アンダースコアのみ使用可能です"
  )
  .regex(
    /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
    "ニックネームは記号で始まったり終わったりできません"
  )
  .regex(
    /^(?!.*[-_]{2,})/,
    "ニックネームに連続する記号は使用できません"
  )
  .refine(
    (value) => !RESERVED_NICKNAMES.includes(value.toLowerCase() as any),
    "このニックネームは予約語のため使用できません"
  );

/**
 * ニックネームのバリデーションを実行する
 * 
 * @param nickname - バリデーションするニックネーム
 * @returns バリデーション結果
 */
export function validateNickname(nickname: string): NicknameValidationResult {
  try {
    nicknameSchema.parse(nickname);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // ZodErrorの最初のエラーメッセージを取得
      const firstIssue = error.issues[0];
      if (firstIssue?.message) {
        return { isValid: false, error: firstIssue.message };
      }
    }
    return { isValid: false, error: "不明なエラーが発生しました" };
  }
}

/**
 * ニックネームが予約語かどうかをチェックする
 * 
 * @param nickname - チェックするニックネーム
 * @returns 予約語の場合true
 */
export function isReservedNickname(nickname: string): boolean {
  return RESERVED_NICKNAMES.includes(nickname.toLowerCase() as any);
}

/**
 * ニックネームを正規化する（小文字変換）
 * 
 * @param nickname - 正規化するニックネーム
 * @returns 正規化されたニックネーム
 */
export function normalizeNickname(nickname: string): string {
  return nickname.toLowerCase();
}