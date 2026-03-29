-- =====================================================
-- 清空并重建数据库（先删除所有外键检查，再删除表）
-- 在 phpMyAdmin 中第一个执行此文件
-- =====================================================

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 删除所有现有表
DROP TABLE IF EXISTS `elite_class_students`;
DROP TABLE IF EXISTS `elite_classes`;
DROP TABLE IF EXISTS `order_reviews`;
DROP TABLE IF EXISTS `order_close_history`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `teacher_moments`;
DROP TABLE IF EXISTS `teacher_profiles`;
DROP TABLE IF EXISTS `activities`;
DROP TABLE IF EXISTS `activity_signups`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `product_categories`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `message_reminders`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `withdrawals`;
DROP TABLE IF EXISTS `earnings`;
DROP TABLE IF EXISTS `referral_locks`;
DROP TABLE IF EXISTS `share_records`;
DROP TABLE IF EXISTS `cities`;
DROP TABLE IF EXISTS `site_config`;
DROP TABLE IF EXISTS `config_groups`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `admin_permission`;
DROP TABLE IF EXISTS `admin_role_permission`;
DROP TABLE IF EXISTS `admin_user`;
DROP TABLE IF EXISTS `admin_role`;
DROP TABLE IF EXISTS `admin_operation_log`;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 完成
SELECT '数据库已清空，请继续导入其他SQL文件' AS message;
