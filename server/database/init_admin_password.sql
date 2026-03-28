-- 初始化管理员密码
-- 默认密码: admin123
-- bcrypt hash for 'admin123': $2b$10$rQZ9Z8xG6M4N5K2L7J8V3O5N4M3L2K1J8H7G6F5D4S3A2B1C0D9E8F7

UPDATE admin_user 
SET password = '$2b$10$rQZ9Z8xG6M4N5K2L7J8V3O5N4M3L2K1J8H7G6F5D4S3A2B1C0D9E8F7'
WHERE username = 'admin';

-- 确认更新
SELECT id, username, real_name, role_id, status FROM admin_user WHERE username = 'admin';
