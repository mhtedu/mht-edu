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

  // 批量更新配置 - 支持插入新配置
  async batchUpdateConfig(configs: { key: string; value: string }[]) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      for (const config of configs) {
        // 使用 INSERT ... ON DUPLICATE KEY UPDATE 来支持插入和更新
        await conn.execute(
          `INSERT INTO site_config (config_key, config_value, config_group, sort_order, created_at, updated_at)
           VALUES (?, ?, 'site', 0, NOW(), NOW())
           ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
          [config.key, config.value, config.value]
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
    const defaultConfig = {
      site_name: '牛师很忙',
      site_domain: '',
      site_logo: '',
      site_description: '连接优质教育资源，助力孩子成长',
      contact_phone: '',
      contact_wechat: '',
    };

    try {
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

      return { ...defaultConfig, ...result };
    } catch (error) {
      console.error('获取站点配置失败，使用默认配置:', error);
      return defaultConfig;
    }
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

  // 获取广告位列表
  async getAdsByPosition(positionKey: string) {
    try {
      const [rows] = await db.query(
        'SELECT id, position_key, title, image_url, link_url, sort_order, is_active FROM ad_positions WHERE position_key = ? AND is_active = 1 ORDER BY sort_order ASC',
        [positionKey]
      );
      return rows || [];
    } catch (error: any) {
      console.error('查询广告失败:', error);
      // 如果表不存在，创建表并插入示例数据
      if (error.code === 'ER_NO_SUCH_TABLE') {
        await this.createAdPositionsTable();
        await this.insertDefaultAds();
        const [rows] = await db.query(
          'SELECT id, position_key, title, image_url, link_url, sort_order, is_active FROM ad_positions WHERE position_key = ? AND is_active = 1 ORDER BY sort_order ASC',
          [positionKey]
        );
        return rows || [];
      }
      throw error;
    }
  }

  // 创建广告位表
  private async createAdPositionsTable() {
    await db.update(`
      CREATE TABLE IF NOT EXISTS ad_positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position_key VARCHAR(50) NOT NULL COMMENT '广告位标识',
        title VARCHAR(100) COMMENT '广告标题',
        image_url VARCHAR(255) NOT NULL COMMENT '图片URL',
        link_url VARCHAR(255) COMMENT '跳转链接',
        sort_order INT DEFAULT 0 COMMENT '排序',
        is_active TINYINT DEFAULT 1 COMMENT '是否启用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_position_key (position_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='广告位表'
    `);
  }

  // 插入默认广告数据
  private async insertDefaultAds() {
    await db.update(`
      INSERT INTO ad_positions (position_key, title, image_url, link_url, sort_order, is_active) VALUES
      ('home_top', '新人专享福利', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop', '/pages/member/index', 1, 1),
      ('home_top', '会员日特惠', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop', '/pages/membership/index', 2, 1),
      ('home_top', '名师一对一定制课程', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=400&fit=crop', '/pages/teacher/list', 3, 1),
      ('home_top', '暑期集训营火热报名', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=400&fit=crop', '/pages/activities/index', 4, 1),
      ('home_banner', '牛师班招生中', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=200&fit=crop', '/pages/elite-class/index', 1, 1),
      ('home_banner', '优质机构推荐', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=200&fit=crop', '/pages/org/list', 2, 1)
    `);
  }

  // 清除缓存
  clearCache() {
    this.configCache.clear();
    this.cacheTime = 0;
  }
}
