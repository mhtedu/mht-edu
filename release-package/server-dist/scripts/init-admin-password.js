"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
async function initAdminPassword() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mht_edu',
    });
    try {
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute('UPDATE admin_user SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
        console.log('✅ 管理员密码初始化成功！');
        console.log('账号: admin');
        console.log('密码: admin123');
        console.log('');
        console.log('⚠️  请登录后立即修改密码！');
    }
    catch (error) {
        console.error('❌ 初始化失败:', error);
    }
    finally {
        await connection.end();
    }
}
initAdminPassword();
//# sourceMappingURL=init-admin-password.js.map