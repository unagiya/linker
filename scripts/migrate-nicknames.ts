/**
 * ニックネームマイグレーション実行スクリプト
 * 既存のUUID形式のニックネームを持つプロフィールをマイグレーションする
 * 
 * 実行方法:
 * npm run migrate:nicknames
 * または
 * npx tsx scripts/migrate-nicknames.ts
 */

import { 
  checkMigrationStatus, 
  migrateAllProfiles 
} from '../src/services/migrationService';

/**
 * メイン処理
 */
async function main() {
  console.log('='.repeat(60));
  console.log('ニックネームマイグレーションスクリプト');
  console.log('='.repeat(60));
  console.log();

  try {
    // マイグレーション状態をチェック
    console.log('マイグレーション状態を確認中...');
    const status = await checkMigrationStatus();
    
    console.log(`総プロフィール数: ${status.total}`);
    console.log(`マイグレーション必要: ${status.needsMigration}`);
    console.log();

    if (status.isComplete) {
      console.log('✓ すべてのプロフィールはマイグレーション済みです');
      return;
    }

    // マイグレーション実行
    console.log(`${status.needsMigration}件のプロフィールをマイグレーションします...`);
    console.log();

    const result = await migrateAllProfiles();

    console.log('='.repeat(60));
    console.log('マイグレーション結果');
    console.log('='.repeat(60));
    console.log(`成功: ${result.success}件`);
    console.log(`失敗: ${result.failed}件`);
    console.log();

    if (result.errors.length > 0) {
      console.log('エラー詳細:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log();
    }

    if (result.failed === 0) {
      console.log('✓ マイグレーションが正常に完了しました');
    } else {
      console.log('⚠ 一部のプロフィールのマイグレーションに失敗しました');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ マイグレーション中にエラーが発生しました:');
    console.error(error instanceof Error ? error.message : '不明なエラー');
    process.exit(1);
  }
}

// スクリプト実行
main();
