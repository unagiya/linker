/**
 * useNicknameCheckフックのユニットテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNicknameCheck } from './useNicknameCheck';
import * as nicknameValidation from '../utils/nicknameValidation';
import * as nicknameService from '../services/nicknameService';

// モック設定
vi.mock('../utils/nicknameValidation');
vi.mock('../services/nicknameService');

describe('useNicknameCheck', () => {
  const mockValidateNickname = vi.mocked(nicknameValidation.validateNickname);
  const mockCheckNicknameAvailability = vi.mocked(nicknameService.checkNicknameAvailability);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期状態はidleである', () => {
    const { result } = renderHook(() => useNicknameCheck(''));
    
    expect(result.current.status).toBe('idle');
    expect(result.current.isValid).toBe(false);
    expect(result.current.isAvailable).toBe(false);
    expect(result.current.message).toBeUndefined();
  });

  it('空文字列の場合はidleのままである', async () => {
    const { result } = renderHook(() => useNicknameCheck(''));
    
    // デバウンス時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current.status).toBe('idle');
    expect(mockValidateNickname).not.toHaveBeenCalled();
    expect(mockCheckNicknameAvailability).not.toHaveBeenCalled();
  });

  it('バリデーションエラーの場合はerror状態になる', async () => {
    mockValidateNickname.mockReturnValue({
      isValid: false,
      error: 'ニックネームは3文字以上で入力してください'
    });

    const { result } = renderHook(() => useNicknameCheck('ab'));
    
    // デバウンス時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.message).toBe('ニックネームは3文字以上で入力してください');
      expect(result.current.isValid).toBe(false);
      expect(result.current.isAvailable).toBe(false);
    });
    
    expect(mockValidateNickname).toHaveBeenCalledWith('ab');
    expect(mockCheckNicknameAvailability).not.toHaveBeenCalled();
  });

  it('現在のニックネームと同じ場合はavailable状態になる', async () => {
    mockValidateNickname.mockReturnValue({ isValid: true });

    const { result } = renderHook(() => 
      useNicknameCheck('testuser', { currentNickname: 'TestUser' })
    );
    
    // デバウンス時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    await waitFor(() => {
      expect(result.current.status).toBe('available');
      expect(result.current.message).toBe('現在のニックネームです');
      expect(result.current.isValid).toBe(true);
      expect(result.current.isAvailable).toBe(true);
    });
    
    expect(mockValidateNickname).toHaveBeenCalledWith('testuser');
    expect(mockCheckNicknameAvailability).not.toHaveBeenCalled();
  });

  it('利用可能なニックネームの場合はavailable状態になる', async () => {
    mockValidateNickname.mockReturnValue({ isValid: true });
    mockCheckNicknameAvailability.mockResolvedValue({
      isAvailable: true
    });

    const { result } = renderHook(() => useNicknameCheck('newuser'));
    
    // デバウンス時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // 非同期処理完了を待つ
    await waitFor(() => {
      expect(result.current.status).toBe('available');
      expect(result.current.message).toBe('このニックネームは利用可能です');
      expect(result.current.isValid).toBe(true);
      expect(result.current.isAvailable).toBe(true);
    });
    
    expect(mockValidateNickname).toHaveBeenCalledWith('newuser');
    expect(mockCheckNicknameAvailability).toHaveBeenCalledWith('newuser', undefined);
  });

  it('利用不可能なニックネームの場合はunavailable状態になる', async () => {
    mockValidateNickname.mockReturnValue({ isValid: true });
    mockCheckNicknameAvailability.mockResolvedValue({
      isAvailable: false,
      error: 'このニックネームは既に使用されています'
    });

    const { result } = renderHook(() => useNicknameCheck('existinguser'));
    
    // デバウンス時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // 非同期処理完了を待つ
    await waitFor(() => {
      expect(result.current.status).toBe('unavailable');
      expect(result.current.message).toBe('このニックネームは既に使用されています');
      expect(result.current.isValid).toBe(true);
      expect(result.current.isAvailable).toBe(false);
    });
    
    expect(mockCheckNicknameAvailability).toHaveBeenCalledWith('existinguser', undefined);
  });
});