/**
 * キャッシュユーティリティ
 * メモリベースのシンプルなキャッシュ実装
 */

/**
 * キャッシュエントリ
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * キャッシュオプション
 */
export interface CacheOptions {
  /** キャッシュの有効期限（ミリ秒）、デフォルト: 5分 */
  ttl?: number;
  /** 最大キャッシュサイズ、デフォルト: 100 */
  maxSize?: number;
}

/**
 * シンプルなメモリキャッシュクラス
 */
export class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 5 * 60 * 1000; // デフォルト5分
    this.maxSize = options.maxSize ?? 100;
  }

  /**
   * キャッシュから値を取得
   * 
   * @param key - キャッシュキー
   * @returns キャッシュされた値、または存在しない/期限切れの場合はundefined
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // 期限切れチェック
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * キャッシュに値を設定
   * 
   * @param key - キャッシュキー
   * @param value - キャッシュする値
   * @param ttl - カスタムTTL（オプション）
   */
  set(key: string, value: T, ttl?: number): void {
    // キャッシュサイズ制限チェック
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // 最も古いエントリを削除（FIFO）
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiresAt = Date.now() + (ttl ?? this.ttl);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * キャッシュから値を削除
   * 
   * @param key - キャッシュキー
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * パターンに一致するキーを削除
   * 
   * @param pattern - 削除するキーのパターン（正規表現）
   */
  deletePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * すべてのキャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 期限切れのエントリをクリーンアップ
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 現在のキャッシュサイズを取得
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * キャッシュにキーが存在するかチェック
   * 
   * @param key - チェックするキー
   * @returns 存在し、期限切れでない場合はtrue
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}

/**
 * 非同期関数の結果をキャッシュするラッパー関数
 * 
 * @param fn - キャッシュする非同期関数
 * @param cache - 使用するキャッシュインスタンス
 * @param keyGenerator - キャッシュキーを生成する関数
 * @returns キャッシュ機能付きの関数
 */
export function withCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  cache: Cache<TResult>,
  keyGenerator: (...args: TArgs) => string
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyGenerator(...args);
    
    // キャッシュから取得を試みる
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // キャッシュにない場合は関数を実行
    const result = await fn(...args);
    
    // 結果をキャッシュに保存
    cache.set(key, result);
    
    return result;
  };
}
