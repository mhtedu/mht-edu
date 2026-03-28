import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';

@Injectable()
export class ConfigService {
  private configCache: Map<string, string> = new Map();
  private cacheTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  // 获取所有配置
  async getAllConfig() {
    const [rows] = await db.query(
      'SELECT * FROM site_config ORDER BY config_group, sort_order'
    );
    return rows;
  }

  // 按分组获取配置
  async getConfigByGroup(group: string) {
    const [rows] = await db.query(
      'SELECT * FROM site_config WHERE config_group = ? ORDER BY sort_order',
      [group]
    );
    return rows;
  }

  // 获取单个配置
  async getConfig(key: string) {
    // 先从缓存读取
    if (this.configCache.has(key) && Date.now() - this.cacheTime < this.CACHE_TTL) {
      return { key, value: this.configCache.get(key) };
    }

    const [rows]: any = await db.query(
      'SELECT config_value FROM site_config WHERE config_key = ?',
      [key]
    );

    if (rows.length === 0) {
      return { key, value: null };
    }

    const value = rows[0].config_value;
    this.configCache.set(key, value);
    this.cacheTime = Date.now();

    return { key, value };
  }

  // 获取配置值（供其他服务调用）
  async getConfigValue(key: string, defaultValue: string = ''): Promise<string> {
    const config = await this.getConfig(key);
    return config.value || defaultValue;
  }

  // 获取数值配置
  async getConfigNumber(key: string, defaultValue: number = 0): Promise<number> {
    const value = await this.getConfigValue(key);
    return value ? parseFloat(value) : defaultValue;
  }

  // 更新单个配置
  async updateConfig(key: string, value: string) {
    await db.update(
      'UPDATE site_config SET config_value = ? WHERE config_key = ?',
      [value, key]
    );

    // 清除缓存
    this.configCache.delete(key);

    return { success: true, message: '配置更新成功' };
  }

  // 批量更新配置
  async batchUpdateConfig(configs: { key: string; value: string }[]) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      for (const config of configs) {
        await conn.execute(
          'UPDATE site_config SET config_value = ? WHERE config_key = ?',
          [config.value, config.key]
        );
      }
      await conn.commit();

      // 清除缓存
      this.configCache.clear();

      return { success: true, message: '配置批量更新成功' };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 获取公开的站点配置（不需要登录）
  async getPublicSiteConfig() {
    const publicKeys = [
      'site_name',
      'site_domain',
      'site_logo',
      'site_description',
      'contact_phone',
      'contact_wechat',
    ];

    const [rows]: any = await db.query(
      `SELECT config_key, config_value FROM site_config WHERE config_key IN (${publicKeys.map(() => '?').join(',')})`,
      publicKeys
    );

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.config_key] = row.config_value;
    }

    return result;
  }

  // 获取微信支付配置
  async getWechatPayConfig() {
    const [rows]: any = await db.query(
      `SELECT config_key, config_value FROM site_config 
       WHERE config_key IN ('wechat_appid', 'wechat_mch_id', 'wechat_pay_key', 'wechat_pay_cert', 'wechat_pay_key_pem')`
    );

    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.config_key] = row.config_value;
    }

    return {
      appId: config.wechat_appid || '',
      mchId: config.wechat_mch_id || '',
      apiKey: config.wechat_pay_key || '',
      cert: config.wechat_pay_cert || '',
      key: config.wechat_pay_key_pem || '',
    };
  }

  // 清除缓存
  clearCache() {
    this.configCache.clear();
    this.cacheTime = 0;
  }
}
