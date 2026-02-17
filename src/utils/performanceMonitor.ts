/**
 * パフォーマンス監視ユーティリティ
 * 関数の実行時間を測定し、パフォーマンス要件を満たしているか確認
 */

/**
 * パフォーマンス測定結果
 */
export interface PerformanceMetrics {
  /** 関数名 */
  functionName: string;
  /** 実行時間（ミリ秒） */
  duration: number;
  /** 開始時刻 */
  startTime: number;
  /** 終了時刻 */
  endTime: number;
  /** 成功したかどうか */
  success: boolean;
  /** エラーメッセージ（失敗時） */
  error?: string;
}

/**
 * パフォーマンス測定のオプション
 */
export interface PerformanceMonitorOptions {
  /** 警告を出す閾値（ミリ秒） */
  warningThreshold?: number;
  /** ログを出力するかどうか */
  enableLogging?: boolean;
  /** メトリクスを保存するかどうか */
  saveMetrics?: boolean;
}

/**
 * 測定されたメトリクスの保存
 */
const metricsStore: PerformanceMetrics[] = [];
const MAX_METRICS_SIZE = 1000;

/**
 * 非同期関数の実行時間を測定
 * 
 * @param fn - 測定する非同期関数
 * @param functionName - 関数名（ログ用）
 * @param options - オプション設定
 * @returns 測定結果と関数の戻り値
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>,
  functionName: string,
  options: PerformanceMonitorOptions = {}
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const {
    warningThreshold = 200, // デフォルト200ms（要件10.1）
    enableLogging = true,
    saveMetrics = true
  } = options;

  const startTime = performance.now();
  let success = true;
  let error: string | undefined;
  let result: T;

  try {
    result = await fn();
  } catch (err) {
    success = false;
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics: PerformanceMetrics = {
      functionName,
      duration,
      startTime,
      endTime,
      success,
      error
    };

    // メトリクスを保存
    if (saveMetrics) {
      metricsStore.push(metrics);
      
      // サイズ制限を超えたら古いものを削除
      if (metricsStore.length > MAX_METRICS_SIZE) {
        metricsStore.shift();
      }
    }

    // ログ出力
    if (enableLogging) {
      const status = success ? '成功' : '失敗';
      const message = `[パフォーマンス] ${functionName}: ${duration.toFixed(2)}ms (${status})`;

      if (duration > warningThreshold) {
        console.warn(`⚠️ ${message} - 閾値(${warningThreshold}ms)を超えています`);
      } else {
        console.log(`✓ ${message}`);
      }

      if (error) {
        console.error(`エラー: ${error}`);
      }
    }
  }

  return { result: result!, metrics: metricsStore[metricsStore.length - 1] };
}

/**
 * 非同期関数にパフォーマンス測定を適用するラッパー
 * 
 * @param fn - 測定する非同期関数
 * @param functionName - 関数名
 * @param options - オプション設定
 * @returns パフォーマンス測定機能付きの関数
 */
export function withPerformanceMonitoring<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  functionName: string,
  options: PerformanceMonitorOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const { result } = await measurePerformance(
      () => fn(...args),
      functionName,
      options
    );
    return result;
  };
}

/**
 * 保存されたメトリクスを取得
 * 
 * @param functionName - フィルタする関数名（オプション）
 * @returns メトリクスの配列
 */
export function getMetrics(functionName?: string): PerformanceMetrics[] {
  if (functionName) {
    return metricsStore.filter(m => m.functionName === functionName);
  }
  return [...metricsStore];
}

/**
 * メトリクスの統計情報を取得
 * 
 * @param functionName - 統計を取得する関数名
 * @returns 統計情報
 */
export function getMetricsStats(functionName: string): {
  count: number;
  average: number;
  min: number;
  max: number;
  successRate: number;
} | null {
  const metrics = getMetrics(functionName);
  
  if (metrics.length === 0) {
    return null;
  }

  const durations = metrics.map(m => m.duration);
  const successCount = metrics.filter(m => m.success).length;

  return {
    count: metrics.length,
    average: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    successRate: (successCount / metrics.length) * 100
  };
}

/**
 * メトリクスをクリア
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}

/**
 * パフォーマンスレポートを生成
 * 
 * @returns レポート文字列
 */
export function generatePerformanceReport(): string {
  const functionNames = [...new Set(metricsStore.map(m => m.functionName))];
  
  let report = '=== パフォーマンスレポート ===\n\n';
  
  for (const functionName of functionNames) {
    const stats = getMetricsStats(functionName);
    if (stats) {
      report += `${functionName}:\n`;
      report += `  実行回数: ${stats.count}\n`;
      report += `  平均時間: ${stats.average.toFixed(2)}ms\n`;
      report += `  最小時間: ${stats.min.toFixed(2)}ms\n`;
      report += `  最大時間: ${stats.max.toFixed(2)}ms\n`;
      report += `  成功率: ${stats.successRate.toFixed(2)}%\n\n`;
    }
  }
  
  return report;
}
