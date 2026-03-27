import { Injectable, OnModuleInit } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  async onModuleInit() {
    try {
      // 读取初始化SQL文件
      const sqlPath = path.join(__dirname, '../../database/init.sql');
      const sql = fs.readFileSync(sqlPath, 'utf-8');

      // 分割SQL语句
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      // 逐条执行
      for (const statement of statements) {
        try {
          await query(statement);
        } catch (error: any) {
          // 忽略已存在的错误
          if (!error.message.includes('already exists')) {
            console.error('SQL Error:', error.message);
          }
        }
      }

      console.log('✅ Database initialized successfully');
    } catch (error: any) {
      console.error('❌ Database initialization failed:', error.message);
    }
  }
}
