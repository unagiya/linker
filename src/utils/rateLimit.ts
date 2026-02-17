/**
 * レート制限ユーティリティ
 * APIリクエストの頻度を制限する機能を提供
 */

/**
 * レート制限エラー
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * レート制限の設定
 */
export interface RateLimitOptions {
  /** 時間枠内で許可される最大リクエスト数 */
  maxRequests: number;
  /** 時間枠（ミリ秒） */
  windowMs: number;
  /** レート制限に達した時のメッセージ */
  message?: string;
}

/**
 * リクエスト記録
 */
interface RequestRecord {
  timestamps: number[];
}

/**
 * レート制限クラス
 * トークンバケットアルゴリズムを使用したシンプルな実装
 */
export class RateLimiter {
  private records: Map<string, RequestRecord> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly message: string;

  constructor(options: RateLimitOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.message = options.message ?? 'レート制限に達しました。しばらく待ってから再試行してください';
  }

  /**
   * リクエストを試行
   * 
   * @param key - レート制限のキー（通常はユーザーIDやIPアドレス）
   * @returns 許可された場合はtrue
   * @throws RateLimitError レート制限に達した場合
   */
  async tryRequest(key: string): Promise<boolean> {
    const now = Date.now();
    const record = this.records.get(key) ?? { timestamps: [] };

    // 時間枠外の古いタイムスタンプを削除
    record.timestamps = record.timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // レート制限チェック
    if (record.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = record.timestamps[0];
      const retryAfter = this.windowMs - (now - oldestTimestamp);
      throw new RateLimitError(this.message, retryAfter);
    }

    // 新しいリクエストを記録
    record.timestamps.push(now);
    this.records.set(key, record);

    return true;
  }

  /**
   * 残りのリクエスト数を取得
   * 
   * @param key - レート制限のキー
   * @returns 残りのリクエスト数
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record) {
      return this.maxRequests;
    }

    // 時間枠内のリクエスト数をカウント
    const recentRequests = record.timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    ).length;

    return Math.max(0, this.maxRequests - recentRequests);
  }

  /**
   * 次のリクエストまでの待機時間を取得
   * 
   * @param key - レート制限のキー
   * @returns 待機時間（ミリ秒）、制限に達していない場合は0
   */
  getRetryAfter(key: string): number {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || record.timestamps.length < this.maxRequests) {
      return 0;
    }

    // 時間枠内のタイムスタンプをフィルタ
    const recentTimestamps = record.timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (recentTimestamps.length < this.maxRequests) {
      return 0;
    }

    const oldestTimestamp = recentTimestamps[0];
    return Math.max(0, this.windowMs - (now - oldestTimestamp));
  }

  /**
   * 特定のキーの記録をリセット
   * 
   * @param key - リセットするキー
   */
  reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * すべての記録をクリア
   */
  clear(): void {
    this.records.clear();
  }

  /**
   * 古い記録をクリーンアップ
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, record] of this.records.entries()) {
      // 時間枠外の古いタイムスタンプを削除
      record.timestamps = record.timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      );

      // タイムスタンプが空になったら記録を削除
      if (record.timestamps.length === 0) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.records.delete(key));
  }
}

/**
 * 非同期関数にレート制限を適用するラッパー関数
 * 
 * @param fn - レート制限を適用する非同期関数
 * @param rateLimiter - 使用するレート制限インスタンス
 * @param keyGenerator - レート制限キーを生成する関数
 * @returns レート制限機能付きの関数
 */
export function withRateLimit<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  rateLimiter: RateLimiter,
  keyGenerator: (...args: TArgs) => string
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyGenerator(...args);
    
    // レート制限チェック
    await rateLimiter.tryRequest(key);
    
    // 関数を実行
    return fn(...args);
  };
}
