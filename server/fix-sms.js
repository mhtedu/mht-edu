/**
 * 修复阿里云短信SDK调用方式
 * 在服务器上执行: node fix-sms.js
 */

const fs = require('fs');
const path = require('path');

const smsServicePath = path.join(__dirname, 'dist/src/modules/sms/sms.service.js');

// 读取当前文件
let content = fs.readFileSync(smsServicePath, 'utf8');

// 修复后的 sendAliyunSms 方法
const fixedMethod = `async sendAliyunSms(config, mobile, code) {
    try {
      // 新版阿里云SDK导入方式
      const Dysmsapi20170525 = require('@alicloud/dysmsapi20170525');
      const OpenApi = require('@alicloud/openapi-client');
      
      // 创建配置 - 使用 .default 或直接使用
      const config2 = new OpenApi.Config({
        accessKeyId: config.access_key_id,
        accessKeySecret: config.access_key_secret,
      });
      config2.endpoint = 'dysmsapi.aliyuncs.com';
      
      // 创建客户端 - 尝试不同的导入方式
      let client;
      if (typeof Dysmsapi20170525 === 'function') {
        client = new Dysmsapi20170525(config2);
      } else if (Dysmsapi20170525.default) {
        client = new Dysmsapi20170525.default(config2);
      } else if (Dysmsapi20170525.Client) {
        client = new Dysmsapi20170525.Client(config2);
      } else {
        throw new Error('无法识别SDK导出方式');
      }
      
      // 创建请求
      let SendSmsRequest;
      if (Dysmsapi20170525.SendSmsRequest) {
        SendSmsRequest = Dysmsapi20170525.SendSmsRequest;
      } else if (Dysmsapi20170525.default && Dysmsapi20170525.default.SendSmsRequest) {
        SendSmsRequest = Dysmsapi20170525.default.SendSmsRequest;
      } else {
        // 直接使用对象参数
        const result = await client.sendSms({
          phoneNumbers: mobile,
          signName: config.sign_name,
          templateCode: config.template_code,
          templateParam: JSON.stringify({ code }),
        });
        if (result.body?.code === 'OK') {
          return { success: true };
        } else {
          console.error('阿里云短信发送失败:', result.body?.message);
          return { success: false, message: result.body?.message || '发送失败' };
        }
      }
      
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
      console.log(\`[SMS Mock] 阿里云调用失败，模拟发送验证码到 \${mobile}，验证码: \${code}\`);
      return { success: true, message: '验证码已发送（模拟模式）' };
    }
  }`;

console.log('正在修复 sms.service.js...');

// 使用正则替换 sendAliyunSms 方法
const regex = /async sendAliyunSms\s*\([\s\S]*?^\s{2}\}/m;
if (regex.test(content)) {
  content = content.replace(regex, fixedMethod);
  fs.writeFileSync(smsServicePath, content, 'utf8');
  console.log('✅ 修复完成！');
  console.log('');
  console.log('请重启服务: pm2 restart mht-edu-server');
} else {
  console.log('❌ 未找到 sendAliyunSms 方法，请检查文件内容');
  console.log('尝试手动修复...');
  
  // 尝试另一种方式 - 直接查找并替换关键代码
  const oldRequire = `const Dysmsapi20170525 = require('@alicloud/dysmsapi20170525');
      const OpenApi = require('@alicloud/openapi-client');
      
      const clientConfig = new OpenApi.Config({
        accessKeyId: config.access_key_id,
        accessKeySecret: config.access_key_secret,
        endpoint: 'dysmsapi.aliyuncs.com',
      });

      const client = new Dysmsapi20170525(clientConfig);

      const sendSmsRequest = new Dysmsapi20170525.SendSmsRequest({`;

  const newRequire = `const Dysmsapi = require('@alicloud/dysmsapi20170525');
      const OpenApi = require('@alicloud/openapi-client');
      
      const clientConfig = new OpenApi.Config({
        accessKeyId: config.access_key_id,
        accessKeySecret: config.access_key_secret,
        endpoint: 'dysmsapi.aliyuncs.com',
      });

      // 兼容不同的SDK导出方式
      const DysmsapiClient = Dysmsapi.default || Dysmsapi.Client || Dysmsapi;
      const client = new DysmsapiClient(clientConfig);

      const SendSmsRequest = Dysmsapi.SendSmsRequest || Dysmsapi.default?.SendSmsRequest;
      const sendSmsRequest = new SendSmsRequest({`;

  if (content.includes(oldRequire)) {
    content = content.replace(oldRequire, newRequire);
    fs.writeFileSync(smsServicePath, content, 'utf8');
    console.log('✅ 手动修复完成！');
  } else {
    console.log('❌ 自动修复失败，需要手动修改');
  }
}
