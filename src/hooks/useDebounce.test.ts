/**
 * useDebounceフックのユニットテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期値を即座に返す', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('値が変更されても遅延時間内は古い値を返す', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // 値を変更
    rerender({ value: 'updated', delay: 500 });
    
    // まだ古い値のまま
    expect(result.current).toBe('initial');

    // 遅延時間の半分経過
    act(() => {
      vi.advanceTimersByTime(250);
    });
    
    // まだ古い値のまま
    expect(result.current).toBe('initial');
  });

  it('遅延時間経過後に新しい値を返す', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // 値を変更
    rerender({ value: 'updated', delay: 500 });
    
    // 遅延時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // 新しい値に更新される
    expect(result.current).toBe('updated');
  });

  it('値が連続して変更された場合、最後の値のみが反映される', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // 値を連続して変更
    rerender({ value: 'first', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    rerender({ value: 'second', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    rerender({ value: 'final', delay: 500 });
    
    // 遅延時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // 最後の値のみが反映される
    expect(result.current).toBe('final');
  });

  it('遅延時間が変更された場合、新しい遅延時間が適用される', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // 値と遅延時間を変更
    rerender({ value: 'updated', delay: 1000 });
    
    // 元の遅延時間（500ms）経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // まだ古い値のまま（新しい遅延時間が適用されている）
    expect(result.current).toBe('initial');
    
    // 新しい遅延時間の残り（500ms）経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // 新しい値に更新される
    expect(result.current).toBe('updated');
  });

  it('数値型の値でも正しく動作する', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 300 });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe(42);
  });

  it('オブジェクト型の値でも正しく動作する', () => {
    const initialObj = { name: 'initial' };
    const updatedObj = { name: 'updated' };
    
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialObj, delay: 300 } }
    );

    expect(result.current).toBe(initialObj);

    rerender({ value: updatedObj, delay: 300 });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe(updatedObj);
  });
});