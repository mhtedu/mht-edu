import { Controller, Post, Body } from '@nestjs/common';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

@Controller('admin/miniprogram')
export class MiniprogramController {
  private readonly projectPath = '/www/wwwroot/mht-edu';

  /**
   * 构建小程序
   */
  @Post('build')
  async build() {
    try {
      console.log('[小程序] 开始构建...');
      
      const { stdout, stderr } = await execAsync('pnpm build:weapp', {
        cwd: this.projectPath,
        timeout: 120000, // 2分钟超时
      });

      console.log('[小程序] 构建完成');
      
      return {
        success: true,
        message: '构建成功',
        logs: stdout.slice(-500), // 返回最后500字符
      };
    } catch (error: any) {
      console.error('[小程序] 构建失败:', error.message);
      return {
        success: false,
        message: '构建失败: ' + error.message,
        logs: error.stderr?.slice(-500) || error.message,
      };
    }
  }

  /**
   * 上传小程序
   */
  @Post('upload')
  async upload(@Body() body: { version?: string; desc?: string }) {
    try {
      const version = body.version || this.autoVersion();
      const desc = body.desc || `自动构建 - ${new Date().toLocaleString('zh-CN')}`;

      console.log(`[小程序] 开始上传，版本: ${version}`);
      
      // 清理dist-weapp中的非小程序文件（admin.js等PC后台文件）
      const fs = require('fs');
      const distPath = path.join(this.projectPath, 'dist-weapp');
      const filesToRemove = ['admin.js', 'admin.css', 'admin.html', 'login.html'];
      for (const file of filesToRemove) {
        const filePath = path.join(distPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[小程序] 已清理: ${file}`);
        }
      }
      
      // 执行上传脚本
      const { stdout, stderr } = await execAsync(
        `node scripts/upload.js -v "${version}" -d "${desc}"`,
        {
          cwd: this.projectPath,
          timeout: 120000,
        }
      );

      console.log('[小程序] 上传完成');
      
      // 检查是否成功
      const success = stdout.includes('上传成功') || !stdout.includes('失败');
      
      return {
        success,
        version,
        message: success ? '上传成功' : '上传失败',
        logs: stdout.slice(-1000),
      };
    } catch (error: any) {
      console.error('[小程序] 上传失败:', error.message);
      
      // 解析错误信息
      let errorMsg = error.message;
      if (errorMsg.includes('IP')) {
        errorMsg = 'IP白名单未配置，请在微信公众平台添加服务器IP: 119.91.193.179';
      } else if (errorMsg.includes('privateKey')) {
        errorMsg = '上传密钥未配置，请将密钥文件保存到 scripts/private.wxkey';
      }
      
      return {
        success: false,
        message: '上传失败: ' + errorMsg,
        logs: error.stderr?.slice(-500) || error.message,
      };
    }
  }

  /**
   * 生成预览二维码
   */
  @Post('preview')
  async preview() {
    try {
      console.log('[小程序] 生成预览二维码...');
      
      const { stdout, stderr } = await execAsync(
        'node scripts/upload.js --preview',
        {
          cwd: this.projectPath,
          timeout: 60000,
        }
      );

      console.log('[小程序] 预览二维码已生成');
      
      return {
        success: true,
        message: '预览二维码已生成',
        logs: stdout.slice(-1000),
      };
    } catch (error: any) {
      console.error('[小程序] 生成预览失败:', error.message);
      return {
        success: false,
        message: '生成预览失败: ' + error.message,
        logs: error.stderr?.slice(-500) || error.message,
      };
    }
  }

  /**
   * 获取配置状态
   */
  @Post('status')
  async getStatus() {
    const fs = require('fs');
    
    // 检查密钥文件
    const keyPath = path.join(this.projectPath, 'scripts/private.wxkey');
    const hasKey = fs.existsSync(keyPath);
    
    // 检查 AppID
    const configPath = path.join(this.projectPath, 'dist-weapp/project.config.json');
    let appid = '';
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        appid = config.appid || '';
      } catch (e) {}
    }
    
    return {
      hasKey,
      appid,
      serverIP: '119.91.193.179',
    };
  }

  /**
   * 自动生成版本号
   */
  private autoVersion(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `1.0.${month}${day}`;
  }
}
