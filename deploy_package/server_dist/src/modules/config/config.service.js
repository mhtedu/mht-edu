"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const db = require("../../storage/database/mysql-client");
let ConfigService = class ConfigService {
    constructor() {
        this.configCache = new Map();
        this.cacheTime = 0;
        this.CACHE_TTL = 5 * 60 * 1000;
    }
    async getAllConfig() {
        const [rows] = await db.query('SELECT * FROM site_config ORDER BY config_group, sort_order');
        return rows;
    }
    async getConfigByGroup(group) {
        const [rows] = await db.query('SELECT * FROM site_config WHERE config_group = ? ORDER BY sort_order', [group]);
        return rows;
    }
    async getConfig(key) {
        if (this.configCache.has(key) && Date.now() - this.cacheTime < this.CACHE_TTL) {
            return { key, value: this.configCache.get(key) };
        }
        const [rows] = await db.query('SELECT config_value FROM site_config WHERE config_key = ?', [key]);
        if (rows.length === 0) {
            return { key, value: null };
        }
        const value = rows[0].config_value;
        this.configCache.set(key, value);
        this.cacheTime = Date.now();
        return { key, value };
    }
    async getConfigValue(key, defaultValue = '') {
        const config = await this.getConfig(key);
        return config.value || defaultValue;
    }
    async getConfigNumber(key, defaultValue = 0) {
        const value = await this.getConfigValue(key);
        return value ? parseFloat(value) : defaultValue;
    }
    async updateConfig(key, value) {
        await db.update('UPDATE site_config SET config_value = ? WHERE config_key = ?', [value, key]);
        this.configCache.delete(key);
        return { success: true, message: '配置更新成功' };
    }
    async batchUpdateConfig(configs) {
        const conn = await db.getConnection();
        await conn.beginTransaction();
        try {
            for (const config of configs) {
                await conn.execute('UPDATE site_config SET config_value = ? WHERE config_key = ?', [config.value, config.key]);
            }
            await conn.commit();
            this.configCache.clear();
            return { success: true, message: '配置批量更新成功' };
        }
        catch (error) {
            await conn.rollback();
            throw error;
        }
        finally {
            conn.release();
        }
    }
    async getPublicSiteConfig() {
        const publicKeys = [
            'site_name',
            'site_domain',
            'site_logo',
            'site_description',
            'contact_phone',
            'contact_wechat',
        ];
        const [rows] = await db.query(`SELECT config_key, config_value FROM site_config WHERE config_key IN (${publicKeys.map(() => '?').join(',')})`, publicKeys);
        const result = {};
        for (const row of rows) {
            result[row.config_key] = row.config_value;
        }
        return result;
    }
    async getWechatPayConfig() {
        const [rows] = await db.query(`SELECT config_key, config_value FROM site_config 
       WHERE config_key IN ('wechat_appid', 'wechat_mch_id', 'wechat_pay_key', 'wechat_pay_cert', 'wechat_pay_key_pem')`);
        const config = {};
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
    clearCache() {
        this.configCache.clear();
        this.cacheTime = 0;
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)()
], ConfigService);
//# sourceMappingURL=config.service.js.map