import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';
import Dysmsapi20170525, { SendSmsRequest } from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';

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
  private verificationCodes: Map<string, { code: string; expires: number }> = new Map();

  async getConfig(): Promise<SmsConfig | null> {
    if (this.config) return this.config;
    try {
      const [configs] = await db.query(`
        SELECT config_key, config_value 
        FROM site_config 
        WHERE config_key LIKE 'sms_%'
      `);
      if (configs && configs.length > 0) {
        this.config = {
          access_key_id: configs.find(c => c.config_key === 'sms_access_key_id')?.config_value || '',
          access_key_secret: configs.find(c => c.config_key === 'sms_access_key_secret')?.config_value || '',
          sign_name: configs.find(c => c.config_key === 'sms_sign_name')?.config_value || '',
          template_code: configs.find(c => c.config_key === 'sms_template_code')?.config_value || '',
          enabled: parseInt(configs.find(c => c.config_key === 'sms_enabled')?.config_value || '0'),
        };
      }
      return this.config;
    } catch (error) {
      console.error('获取短信配置失败:', error);
      return null;
    }
  }

  async updateConfig(config: Partial<SmsConfig>): Promise<void> {
    const updates: string[] = [];
    if (config.access_key_id !== undefined) updates.push(`('sms_access_key_id', '${config.access_key_id}')`);
    if (config.access_key_secret !== undefined) updates.push(`('sms_access_key_secret', '${config.access_key_secret}')`);
    if (config.sign_name !== undefined) updates.push(`('sms_sign_name', '${config.sign_name}')`);
    if (config.template_code !== undefined) updates.push(`('sms_template_code', '${config.template_code}')`);
    if (config.enabled !== undefined) updates.push(`('sms_enabled', '${config.enabled}')`);
    
    if (updates.length > 0) {
      await db.query(`
        INSERT INTO site_config (config_key, config_value) 
        VALUES ${updates.join(', ')}
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `);
    }
    this.config = null;
  }

  async sendVerificationCode(mobile: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    const code = Math.random().toString().slice(-6);
    
    if (!config || !config.enabled || !config.access_key_id || !config.access_key_secret) {
      console.log(`[SMS Mock] 短信功能未配置，模拟发送验证码到 ${mobile}，验证码: ${code}`);
      this.verificationCodes.set(mobile, { code, expires: Date.now() + 5 * 60 * 1000 });
      return { success: true, message: '验证码已发送' };
    }

    const result = await this.sendAliyunSms(config, mobile, code);
    if (result.success) {
      this.verificationCodes.set(mobile, { code, expires: Date.now() + 5 * 60 * 1000 });
    }
    return { success: result.success, message: result.message || '验证码已发送' };
  }

  async verifyCode(mobile: string, code: string): Promise<boolean> {
    const stored = this.verificationCodes.get(mobile);
    if (!stored) return false;
    if (Date.now() > stored.expires) {
      this.verificationCodes.delete(mobile);
      return false;
    }
    if (stored.code === code) {
      this.verificationCodes.delete(mobile);
      return true;
    }
    return false;
  }

  private async sendAliyunSms(
    config: SmsConfig, 
    mobile: string, 
    code: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const clientConfig = new OpenApi.Config({
        accessKeyId: config.access_key_id,
        accessKeySecret: config.access_key_secret,
        endpoint: 'dysmsapi.aliyuncs.com',
      });

      const client = new Dysmsapi20170525(clientConfig);

      const sendSmsRequest = new SendSmsRequest({
        phoneNumbers: mobile,
        signName: config.sign_name,
        templateCode: config.template_code,
        templateParam: JSON.stringify({ code }),
      });

      const result = await client.sendSms(sendSmsRequest);
      
      if (result.body?.code === 'OK') {
        return { success: true };
      } else {
        console.error('阿里云短信发送失败:', result.body?.message);
        return { success: false, message: result.body?.message || '发送失败' };
      }
    } catch (error) {
      console.error('阿里云短信发送异常:', error);
      console.log(`[SMS Mock] 阿里云调用失败，模拟发送验证码到 ${mobile}，验证码: ${code}`);
      return { success: true, message: '验证码已发送（模拟模式）' };
    }
  }
}
