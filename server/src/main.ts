import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import * as express from 'express';
import { HttpStatusInterceptor } from '@/interceptors/http-status.interceptor';
import * as path from 'path';
import * as fs from 'fs';

function parsePort(): number {
  // 优先使用 SERVER_PORT 环境变量（专用于后端服务）
  if (process.env.SERVER_PORT) {
    const port = parseInt(process.env.SERVER_PORT, 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      return port;
    }
  }
  // 其次检查命令行参数 -p
  const args = process.argv.slice(2);
  const portIndex = args.indexOf('-p');
  if (portIndex !== -1 && args[portIndex + 1]) {
    const port = parseInt(args[portIndex + 1], 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      return port;
    }
  }
  // 最后检查 PORT 环境变量（但排除 5000，因为那是前端端口）
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (!isNaN(port) && port > 0 && port < 65536 && port !== 5000) {
      return port;
    }
  }
  return 3000;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 配置静态文件服务 - 访问 /uploads 路径
  // 检查可能的上传目录
  const serverDir = process.cwd();
  const possibleDirs = [
    '/www/wwwroot/mht-edu/uploads',  // 远程服务器路径
    path.join(serverDir, 'uploads'), // server/uploads
    path.join(serverDir, '..', 'uploads'), // 项目根目录/uploads
  ];

  let uploadDir = '';
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      uploadDir = dir;
      break;
    }
  }

  // 如果都不存在，创建 server/uploads 目录
  if (!uploadDir) {
    uploadDir = path.join(serverDir, 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadDir}`);
  }

  // 创建 admin 子目录
  const adminUploadDir = path.join(uploadDir, 'admin');
  if (!fs.existsSync(adminUploadDir)) {
    fs.mkdirSync(adminUploadDir, { recursive: true });
  }

  // 静态文件服务
  app.use('/uploads', express.static(uploadDir));
  console.log(`Static files served from: ${uploadDir}`);

  // 全局拦截器：统一将 POST 请求的 201 状态码改为 200
  app.useGlobalInterceptors(new HttpStatusInterceptor());
  // 1. 开启优雅关闭 Hooks (关键!)
  app.enableShutdownHooks();

  // 2. 解析端口
  const port = parsePort();
  try {
    await app.listen(port);
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ 端口 \({port} 被占用! 请运行 'npx kill-port \){port}' 然后重试。`);
      process.exit(1);
    } else {
      throw err;
    }
  }
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
