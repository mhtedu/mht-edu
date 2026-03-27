import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class ConfigService {
  // ==================== 系统配置 ====================

  /**
   * 获取所有系统配置
   */
  async getAllConfigs() {
    const configs = await executeQuery(`
      SELECT * FROM system_configs ORDER BY id
    `);

    // 转换为键值对格式
    const result: Record<string, any> = {};
    configs.forEach((config: any) => {
      let value = config.config_value;
      if (config.config_type === 'number') {
        value = parseFloat(value);
      } else if (config.config_type === 'boolean') {
        value = value === 'true';
      } else if (config.config_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // 保持原值
        }
      }
      result[config.config_key] = value;
    });

    return result;
  }

  /**
   * 获取单个配置
   */
  async getConfig(key: string) {
    const configs = await executeQuery(`
      SELECT * FROM system_configs WHERE config_key = ?
    `, [key]);

    if (configs.length === 0) {
      return null;
    }

    const config = configs[0] as any;
    let value = config.config_value;

    if (config.config_type === 'number') {
      value = parseFloat(value);
    } else if (config.config_type === 'boolean') {
      value = value === 'true';
    } else if (config.config_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // 保持原值
      }
    }

    return value;
  }

  /**
   * 设置配置
   */
  async setConfig(key: string, value: any, description?: string) {
    const configType = typeof value === 'number' ? 'number' 
      : typeof value === 'boolean' ? 'boolean'
      : typeof value === 'object' ? 'json'
      : 'string';

    const configValue = configType === 'json' ? JSON.stringify(value) : String(value);

    await executeQuery(`
      INSERT INTO system_configs (config_key, config_value, config_type, description)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE config_value = ?, config_type = ?, description = COALESCE(?, description)
    `, [key, configValue, configType, description || '', configValue, configType, description]);

    return { success: true };
  }

  /**
   * 批量设置配置
   */
  async setConfigs(configs: Record<string, any>) {
    for (const [key, value] of Object.entries(configs)) {
      await this.setConfig(key, value);
    }
    return { success: true };
  }

  // ==================== 分销配置 ====================

  /**
   * 获取分销配置
   */
  async getDistributionConfigs() {
    return executeQuery(`
      SELECT * FROM distribution_configs WHERE is_active = 1 ORDER BY level
    `);
  }

  /**
   * 更新分销比例
   */
  async updateDistributionConfig(level: number, rate: number) {
    await executeQuery(`
      UPDATE distribution_configs SET rate = ? WHERE level = ?
    `, [rate, level]);

    return { success: true };
  }

  // ==================== 科目管理 ====================

  /**
   * 获取科目列表
   */
  async getSubjects(category?: string) {
    const conditions = category ? `WHERE category = ?` : '';
    const params = category ? [category] : [];

    return executeQuery(`
      SELECT * FROM subjects ${conditions} ORDER BY sort_order, id
    `, params);
  }

  /**
   * 添加科目
   */
  async addSubject(data: { name: string; category: string; icon?: string; sortOrder?: number }) {
    const result = await executeQuery(`
      INSERT INTO subjects (name, category, icon, sort_order)
      VALUES (?, ?, ?, ?)
    `, [data.name, data.category, data.icon || '', data.sortOrder || 0]);

    return { id: (result as any).insertId, ...data };
  }

  /**
   * 更新科目
   */
  async updateSubject(id: number, data: Partial<{ name: string; category: string; icon: string; sortOrder: number; isActive: number }>) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name) { updates.push('name = ?'); values.push(data.name); }
    if (data.category) { updates.push('category = ?'); values.push(data.category); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive); }

    if (updates.length > 0) {
      await executeQuery(`
        UPDATE subjects SET ${updates.join(', ')} WHERE id = ?
      `, [...values, id]);
    }

    return { success: true };
  }

  /**
   * 删除科目
   */
  async deleteSubject(id: number) {
    await executeQuery(`DELETE FROM subjects WHERE id = ?`, [id]);
    return { success: true };
  }

  // ==================== 年级管理 ====================

  /**
   * 获取年级列表
   */
  async getGrades(stage?: string) {
    const conditions = stage ? `WHERE stage = ?` : '';
    const params = stage ? [stage] : [];

    return executeQuery(`
      SELECT * FROM grades ${conditions} ORDER BY sort_order, id
    `, params);
  }

  // ==================== 会员权益管理 ====================

  /**
   * 获取会员套餐
   */
  async getMembershipPlans(role?: number) {
    const conditions = role !== undefined ? `WHERE role = ?` : '';
    const params = role !== undefined ? [role] : [];

    return executeQuery(`
      SELECT * FROM membership_plans ${conditions} ORDER BY role, sort_order
    `, params);
  }

  /**
   * 创建会员套餐
   */
  async createMembershipPlan(data: {
    name: string;
    role: number;
    price: number;
    originalPrice: number;
    durationDays: number;
    features: string[];
  }) {
    const result = await executeQuery(`
      INSERT INTO membership_plans (name, role, price, original_price, duration_days, features)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.name, data.role, data.price, data.originalPrice, data.durationDays, JSON.stringify(data.features)]);

    return { id: (result as any).insertId, ...data };
  }

  /**
   * 更新会员套餐
   */
  async updateMembershipPlan(id: number, data: Partial<{
    name: string;
    price: number;
    originalPrice: number;
    durationDays: number;
    features: string[];
    isActive: number;
    sortOrder: number;
  }>) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name) { updates.push('name = ?'); values.push(data.name); }
    if (data.price !== undefined) { updates.push('price = ?'); values.push(data.price); }
    if (data.originalPrice !== undefined) { updates.push('original_price = ?'); values.push(data.originalPrice); }
    if (data.durationDays) { updates.push('duration_days = ?'); values.push(data.durationDays); }
    if (data.features) { updates.push('features = ?'); values.push(JSON.stringify(data.features)); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive); }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder); }

    if (updates.length > 0) {
      await executeQuery(`
        UPDATE membership_plans SET ${updates.join(', ')} WHERE id = ?
      `, [...values, id]);
    }

    return { success: true };
  }

  /**
   * 删除会员套餐
   */
  async deleteMembershipPlan(id: number) {
    await executeQuery(`DELETE FROM membership_plans WHERE id = ?`, [id]);
    return { success: true };
  }
}
