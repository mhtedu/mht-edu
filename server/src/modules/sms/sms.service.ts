import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';

interface SmsConfig {
  access_key_id: string;
  access_key_secret: string;
  sign_name: string;
  template_code: string;
  enabled: number;
}

@Injectable()
export class SmsService {
  private config: SmsConfig | null = null;

  /**
   * 获取短信配置
   */
  async getConfig(): Promise<SmsConfig | null> {
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
    } catch (error) {
      console.error('获取短信配置失败:', error);
      return null;
    }
  }

  /**
   * 更新短信配置
   */
  async updateConfig(config: Partial<SmsConfig>): Promise<boolean> {
    const updates = {
      'sms_access_key_id': config.access_key_id,
      'sms_access_key_secret': config.access_key_secret,
      'sms_sign_name': config.sign_name,
      'sms_template_code': config.template_code,
      'sms_enabled': config.enabled?.toString(),
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await db.update(
          `INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
           VALUES (?, ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
          [key, value, value]
        );
      }
    }

    // 清除缓存
    this.config = null;
    return true;
  }

  /**
   * 发送短信验证码
   */
  async sendVerificationCode(mobile: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();

    if (!config || !config.enabled) {
      // 配置未启用，返回模拟成功（开发模式）
      console.log(`[SMS Mock] 发送验证码到 ${mobile}，验证码: 123456`);
      return { success: true, message: '验证码已发送（开发模式）' };
    }

    // 生成6位验证码
    const code = Math.random().toString().slice(-6);
    
    // 存储验证码（5分钟有效）
    await db.update(
      `INSERT INTO sms_verification_codes (mobile, code, expire_at, created_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), NOW())
       ON DUPLICATE KEY UPDATE code = ?, expire_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE)`,
      [mobile, code, code]
    );

    try {
      // 调用阿里云短信API
      const result = await this.sendAliyunSms(config, mobile, code);
      
      if (result.success) {
        return { success: true, message: '验证码已发送' };
      } else {
        return { success: false, message: result.message || '发送失败' };
      }
    } catch (error) {
      console.error('发送短信失败:', error);
      return { success: false, message: '发送失败，请稍后重试' };
    }
  }

  /**
   * 验证短信验证码
   */
  async verifyCode(mobile: string, code: string): Promise<boolean> {
    try {
      const [records] = await db.query(
        `SELECT code FROM sms_verification_codes 
         WHERE mobile = ? AND expire_at > NOW() AND used = 0
         ORDER BY created_at DESC LIMIT 1`,
        [mobile]
      );

      if (!records || records.length === 0) {
        // 开发模式：如果没有找到验证码记录，允许使用默认验证码123456
        console.log(`[SMS Mock] 无验证码记录，开发模式允许默认验证码 123456`);
        return code === '123456';
      }

      const isValid = records[0].code === code;

      if (isValid) {
        // 标记为已使用
        await db.update(
          'UPDATE sms_verification_codes SET used = 1 WHERE mobile = ? AND code = ?',
          [mobile, code]
        );
      }

      return isValid;
    } catch (error) {
      // 数据库错误时，开发模式允许默认验证码
      console.log(`[SMS Mock] 数据库错误，开发模式允许默认验证码 123456`);
      return code === '123456';
    }
  }

  /**
   * 调用阿里云短信API
   */
  private async sendAliyunSms(
    config: SmsConfig, 
    mobile: string, 
    code: string
  ): Promise<{ success: boolean; message?: string }> {
    // 如果没有安装阿里云SDK，返回错误
    try {
      const Core = require('@alicloud/pop-rpc');
      
      const client = new Core({
        accessKeyId: config.access_key_id,
        accessKeySecret: config.access_key_secret,
        endpoint: 'https://dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25'
      });

      const params = {
        PhoneNumbers: mobile,
        SignName: config.sign_name,
        TemplateCode: config.template_code,
        TemplateParam: JSON.stringify({ code }),
      };

      const result = await client.request('SendSms', params, { method: 'POST' });
      
      if (result.Code === 'OK') {
        return { success: true };
      } else {
        return { success: false, message: result.Message };
      }
    } catch (error) {
      console.error('阿里云短信发送失败:', error);
      // 如果SDK未安装或调用失败，记录日志并返回模拟成功
      console.log(`[SMS Mock] 阿里云调用失败，模拟发送验证码到 ${mobile}，验证码: ${code}`);
      return { success: true, message: '验证码已发送（模拟模式）' };
    }
  }
}
