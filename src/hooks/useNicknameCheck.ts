/**
 * ニックネーム利用可能性チェック機能を提供するカスタムフック
 */

import { useState, useEffect, useCallback } from 'react';
import { validateNickname } from '../utils/nicknameValidation';
import { checkNicknameAvailability } from '../services/nicknameService';
import { useDebounce } from './useDebounce';
import { getErrorMessage, isNetworkError } from '../utils/errorUtils';
import type { NicknameValidationResult, NicknameAvailabilityResult } from '../types/nickname';

/**
 * ニックネームチェックの状態
 */
export type NicknameCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

/**
 * ニックネームチェックの結果
 */
export interface NicknameCheckResult {
  status: NicknameCheckStatus;
  message?: string;
  isValid: boolean;
  isAvailable: boolean;
}

/**
 * ニックネーム利用可能性チェックフックのオプション
 */
export interface UseNicknameCheckOptions {
  /** デバウンス遅延時間（ミリ秒）、デフォルト: 500ms */
  debounceDelay?: number;
  /** 現在のニックネーム（変更時に除外するため） */
  currentNickname?: string;
}

/**
 * ニックネーム利用可能性チェック機能を提供するカスタムフック
 * 
 * @param nickname - チェックするニックネーム
 * @param options - オプション設定
 * @returns チェック結果と制御関数
 */
export function useNicknameCheck(
  nickname: string,
  options: UseNicknameCheckOptions = {}
) {
  const { debounceDelay = 500, currentNickname } = options;
  
  const [result, setResult] = useState<NicknameCheckResult>({
    status: 'idle',
    isValid: false,
    isAvailable: false
  });
  
  // デバウンスされたニックネーム
  const debouncedNickname = useDebounce(nickname, debounceDelay);
  
  // 現在のリクエストをキャンセルするためのフラグ
  const [currentRequestId, setCurrentRequestId] = useState<number>(0);

  // チェック処理をリセットする関数
  const reset = useCallback(() => {
    setResult({
      status: 'idle',
      isValid: false,
      isAvailable: false
    });
    setCurrentRequestId(prev => prev + 1);
  }, []);

  useEffect(() => {
    // 空文字列の場合はアイドル状態にリセット
    if (!debouncedNickname.trim()) {
      reset();
      return;
    }

    // リクエストIDを更新（前のリクエストをキャンセルするため）
    const requestId = Date.now();
    setCurrentRequestId(requestId);

    // まずバリデーションを実行
    const validationResult: NicknameValidationResult = validateNickname(debouncedNickname);
    
    if (!validationResult.isValid) {
      // バリデーションエラーの場合
      setResult({
        status: 'error',
        message: validationResult.error,
        isValid: false,
        isAvailable: false
      });
      return;
    }

    // 現在のニックネームと同じ場合は利用可能とする
    if (currentNickname && debouncedNickname.toLowerCase() === currentNickname.toLowerCase()) {
      setResult({
        status: 'available',
        message: '現在のニックネームです',
        isValid: true,
        isAvailable: true
      });
      return;
    }

    // 利用可能性チェックを開始
    setResult(prev => ({
      ...prev,
      status: 'checking',
      message: 'チェック中...',
      isValid: true,
      isAvailable: false
    }));

    // 非同期で利用可能性をチェック
    const checkAvailability = async () => {
      try {
        const availabilityResult: NicknameAvailabilityResult = await checkNicknameAvailability(
          debouncedNickname,
          currentNickname
        );

        // リクエストがキャンセルされていないかチェック
        if (requestId !== currentRequestId) {
          return; // 古いリクエストの結果は無視
        }

        if (availabilityResult.isAvailable) {
          setResult({
            status: 'available',
            message: 'このニックネームは利用可能です',
            isValid: true,
            isAvailable: true
          });
        } else {
          setResult({
            status: 'unavailable',
            message: availabilityResult.error || 'このニックネームは利用できません',
            isValid: true,
            isAvailable: false
          });
        }
      } catch (error) {
        // リクエストがキャンセルされていないかチェック
        if (requestId !== currentRequestId) {
          return; // 古いリクエストの結果は無視
        }

        // エラーメッセージを取得
        const errorMessage = getErrorMessage(error);
        
        // ネットワークエラーの場合は特別なメッセージ
        const message = isNetworkError(error)
          ? '接続エラーが発生しました。再試行してください'
          : errorMessage;

        setResult({
          status: 'error',
          message,
          isValid: true,
          isAvailable: false
        });
      }
    };

    checkAvailability();
  }, [debouncedNickname, currentNickname, currentRequestId, reset]);

  return {
    ...result,
    reset
  };
}