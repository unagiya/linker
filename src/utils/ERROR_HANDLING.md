# エラーハンドリングガイド

このドキュメントは、Linkerプロジェクトにおけるエラーハンドリングの実装方法を説明します。

## 概要

プロジェクトでは、統一的なエラーハンドリングを実現するために以下のコンポーネントを提供しています：

- **エラー型定義** (`src/types/errors.ts`)
- **エラーハンドリングユーティリティ** (`src/utils/errorHandling.ts`)
- **エラーユーティリティ関数** (`src/utils/errorUtils.ts`)

## エラー型

### AppError

すべてのアプリケーションエラーの基底クラスです。

```typescript
import { AppError, ErrorType } from '../types/errors';

const error = new AppError(
  ErrorType.VALIDATION,
  'ニックネームは3文字以上で入力してください',
  originalError,
  false // リトライ可能かどうか
);
```

### 専用エラークラス

- **ValidationError**: バリデーションエラー（リトライ不可）
- **NetworkError**: ネットワークエラー（リトライ可能）
- **DatabaseError**: データベースエラー（リトライ可能）
- **DuplicateError**: 重複エラー（リトライ不可）
- **NotFoundError**: 見つからないエラー（リトライ不可）

```typescript
import { ValidationError, NetworkError, DuplicateError } from '../types/errors';

// バリデーションエラー
throw new ValidationError('ニックネームは3文字以上で入力してください');

// ネットワークエラー
throw new NetworkError('接続エラーが発生しました。再試行してください');

// 重複エラー
throw new DuplicateError('このニックネームは既に使用されています');
```

## エラー変換

`toAppError`関数を使用して、任意のエラーを適切なAppErrorに変換できます。

```typescript
import { toAppError } from '../types/errors';

try {
  // 何らかの処理
} catch (error) {
  const appError = toAppError(error);
  appError.log(); // エラーをログに記録
  throw appError;
}
```

## リトライ機能

`withRetry`関数を使用して、リトライ可能なエラーに対して自動的にリトライを実行できます。

```typescript
import { withRetry } from '../utils/errorHandling';

const result = await withRetry(
  async () => {
    // リトライしたい処理
    return await someAsyncFunction();
  },
  {
    maxRetries: 3,           // 最大リトライ回数
    retryDelay: 1000,        // リトライ間隔（ミリ秒）
    exponentialBackoff: true, // 指数バックオフを使用
    onRetry: (error, attempt) => {
      console.log(`リトライ ${attempt}回目:`, error.message);
    }
  }
);
```

## タイムアウト機能

`withTimeout`関数を使用して、処理にタイムアウトを設定できます。

```typescript
import { withTimeout } from '../utils/errorHandling';

const result = await withTimeout(
  async () => {
    // タイムアウトを設定したい処理
    return await someAsyncFunction();
  },
  5000 // 5秒でタイムアウト
);
```

## エラーメッセージの取得

`getErrorMessage`関数を使用して、ユーザーフレンドリーなエラーメッセージを取得できます。

```typescript
import { getErrorMessage } from '../utils/errorUtils';

try {
  // 何らかの処理
} catch (error) {
  const message = getErrorMessage(error);
  console.error(message); // ユーザーフレンドリーなメッセージ
}
```

## エラー判定

エラーの種類を判定するユーティリティ関数を提供しています。

```typescript
import { isNetworkError, isDatabaseError, isRetryable } from '../utils/errorUtils';

try {
  // 何らかの処理
} catch (error) {
  if (isNetworkError(error)) {
    // ネットワークエラーの処理
  } else if (isDatabaseError(error)) {
    // データベースエラーの処理
  }
  
  if (isRetryable(error)) {
    // リトライ可能なエラーの処理
  }
}
```

## 実装例

### サービス層でのエラーハンドリング

```typescript
import { toAppError, DuplicateError } from '../types/errors';
import { withRetry, withTimeout } from '../utils/errorHandling';

export async function updateNickname(profileId: string, newNickname: string): Promise<void> {
  try {
    const performUpdate = async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: newNickname })
        .eq('id', profileId);

      if (error) {
        if (error.code === '23505') {
          throw new DuplicateError('このニックネームは既に使用されています', error);
        }
        throw error;
      }
    };

    // タイムアウトとリトライ機能付きで更新
    await withRetry(
      () => withTimeout(performUpdate, 5000),
      {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: true,
      }
    );

  } catch (error) {
    const appError = toAppError(error);
    appError.log();
    throw appError;
  }
}
```

### コンテキストでのエラーハンドリング

```typescript
import { toAppError } from '../types/errors';
import { getErrorMessage } from '../utils/errorUtils';

const createProfile = useCallback(async (userId: string, data: ProfileFormData): Promise<Profile> => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    // プロフィール作成処理
    const profile = await repository.save(data);

    dispatch({ type: 'SET_PROFILE', payload: profile });
    return profile;

  } catch (error) {
    const errorMessage = getErrorMessage(error);
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    
    const appError = toAppError(error);
    appError.log();
    
    throw appError;
  }
}, [repository]);
```

### フックでのエラーハンドリング

```typescript
import { getErrorMessage, isNetworkError } from '../utils/errorUtils';

const checkAvailability = async () => {
  try {
    const result = await checkNicknameAvailability(nickname);
    
    if (result.isAvailable) {
      setStatus('available');
    } else {
      setStatus('unavailable');
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    
    // ネットワークエラーの場合は特別なメッセージ
    const message = isNetworkError(error)
      ? '接続エラーが発生しました。再試行してください'
      : errorMessage;

    setStatus('error');
    setMessage(message);
  }
};
```

## ベストプラクティス

1. **適切なエラー型を使用する**: エラーの種類に応じて適切なエラークラスを使用してください。

2. **エラーをログに記録する**: `appError.log()`を使用してエラーをログに記録してください。

3. **ユーザーフレンドリーなメッセージを提供する**: `getErrorMessage()`を使用してユーザーに分かりやすいメッセージを表示してください。

4. **リトライ可能なエラーにはリトライを実装する**: ネットワークエラーやデータベースエラーには`withRetry`を使用してください。

5. **タイムアウトを設定する**: 長時間実行される可能性のある処理には`withTimeout`を使用してください。

6. **エラーを適切に変換する**: `toAppError`を使用して、すべてのエラーをAppErrorに変換してください。

## 要件との対応

このエラーハンドリング実装は、以下の要件を満たしています：

- **要件 9.1**: ニックネーム利用可能性チェックでネットワークエラーが発生した場合の適切なメッセージ表示
- **要件 9.2**: ニックネーム変更でデータベースエラーが発生した場合の適切なメッセージ表示
- **要件 9.3**: 無効なニックネームでアクセスされた場合の404ページメッセージ表示

リトライ機能により、一時的なネットワークエラーやデータベースエラーから自動的に回復できます。
