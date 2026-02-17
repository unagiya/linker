/**
 * サービス層のエクスポート
 * 
 * パフォーマンス最適化版のサービスを優先的にエクスポート
 */

// 最適化版のニックネームサービスをデフォルトとしてエクスポート
export {
  checkNicknameAvailability,
  findProfileByNickname,
  updateNickname,
  invalidateNicknameCache,
  clearAllCaches,
  cleanupCaches,
  cleanupRateLimiters,
  startPeriodicCleanup,
  normalizeNickname
} from './nicknameServiceOptimized';

// 基本版のサービスも必要に応じて使用可能
export {
  checkNicknameAvailability as checkNicknameAvailabilityBase,
  findProfileByNickname as findProfileByNicknameBase,
  updateNickname as updateNicknameBase,
  isReservedNickname
} from './nicknameService';

// マイグレーションサービス
export {
  migrateAllProfiles,
  migrateProfile,
  checkMigrationStatus,
  needsMigration
} from './migrationService';
