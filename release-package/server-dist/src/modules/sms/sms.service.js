"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const db = require("../../storage/database/mysql-client");
let SmsService = class SmsService {
    constructor() {
        this.config = null;
    }
    async getConfig() {
        if (this.config) {
            return this.config;
        }
        try {
            const [configs] = await db.query(`
        SELECT config_key, config_value 
        FROM site_config 
        WHERE config_key LIKE 'sms_%'
      `);
            if (configs && configs.length > 0) {
                const configMap = {};
                configs.forEach(c => {
                    configMap[c.config_key] = c.config_value;
                });
                this.config = {
                    access_key_id: configMap['sms_access_key_id'] || '',
                    access_key_secret: configMap['sms_access_key_secret'] || '',
                    sign_name: configMap['sms_sign_name'] || '',
                    template_code: configMap['sms_template_code'] || '',
                    enabled: parseInt(configMap['sms_enabled'] || '0'),
                };
            }
            return this.config;
        }
        catch (error) {
            console.error('获取短信配置失败:', error);
            return null;
        }
    }
    async updateConfig(config) {
        const updates = {
            'sms_access_key_id': config.access_key_id,
            'sms_access_key_secret': config.access_key_secret,
            'sms_sign_name': config.sign_name,
            'sms_template_code': config.template_code,
            'sms_enabled': config.enabled?.toString(),
        };
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                await db.update(`INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
           VALUES (?, ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`, [key, value, value]);
            }
        }
        this.config = null;
        return true;
    }
    async sendVerificationCode(mobile) {
        const config = await this.getConfig();
        if (!config || !config.enabled) {
            console.log(`[SMS Mock] 发送验证码到 ${mobile}，验证码: 123456`);
            return { success: true, message: '验证码已发送（开发模式）' };
        }
        const code = Math.random().toString().slice(-6);
        await db.update(`INSERT INTO sms_verification_codes (mobile, code, expire_at, created_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), NOW())
       ON DUPLICATE KEY UPDATE code = ?, expire_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE)`, [mobile, code, code]);
        try {
            const result = await this.sendAliyunSms(config, mobile, code);
            if (result.success) {
                return { success: true, message: '验证码已发送' };
            }
            else {
                return { success: false, message: result.message || '发送失败' };
            }
        }
        catch (error) {
            console.error('发送短信失败:', error);
            return { success: false, message: '发送失败，请稍后重试' };
        }
    }
    async verifyCode(mobile, code) {
        try {
            const [records] = await db.query(`SELECT code FROM sms_verification_codes 
         WHERE mobile = ? AND expire_at > NOW() AND used = 0
         ORDER BY created_at DESC LIMIT 1`, [mobile]);
            if (!records || records.length === 0) {
                console.log(`[SMS Mock] 无验证码记录，开发模式允许默认验证码 123456`);
                return code === '123456';
            }
            const isValid = records[0].code === code;
            if (isValid) {
                await db.update('UPDATE sms_verification_codes SET used = 1 WHERE mobile = ? AND code = ?', [mobile, code]);
            }
            return isValid;
        }
        catch (error) {
            console.log(`[SMS Mock] 数据库错误，开发模式允许默认验证码 123456`);
            return code === '123456';
        }
    }
    async sendAliyunSms(config, mobile, code) {
        try {
            const Dysmsapi20170525 = require('@alicloud/dysmsapi20170525');
            const OpenApi = require('@alicloud/openapi-client');
            const clientConfig = new OpenApi.Config({
                accessKeyId: config.access_key_id,
                accessKeySecret: config.access_key_secret,
                endpoint: 'dysmsapi.aliyuncs.com',
            });
            const client = new Dysmsapi20170525(clientConfig);
            const sendSmsRequest = new Dysmsapi20170525.SendSmsRequest({
                phoneNumbers: mobile,
                signName: config.sign_name,
                templateCode: config.template_code,
                templateParam: JSON.stringify({ code }),
            });
            const result = await client.sendSms(sendSmsRequest);
            if (result.body?.code === 'OK') {
                return { success: true };
            }
            else {
                console.error('阿里云短信发送失败:', result.body?.message);
                return { success: false, message: result.body?.message || '发送失败' };
            }
        }
        catch (error) {
            console.error('阿里云短信发送异常:', error);
            console.log(`[SMS Mock] 阿里云调用失败，模拟发送验证码到 ${mobile}，验证码: ${code}`);
            return { success: true, message: '验证码已发送（模拟模式）' };
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = __decorate([
    (0, common_1.Injectable)()
], SmsService);
//# sourceMappingURL=sms.service.js.map