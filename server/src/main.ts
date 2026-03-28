import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import * as express from 'express';
import { HttpStatusInterceptor } from '@/interceptors/http-status.interceptor';

function parsePort(): number {
  // 打印所有相关环境变量
  console.log('DEBUG: SERVER_PORT =', process.env.SERVER_PORT);
  console.log('DEBUG: PORT =', process.env.PORT);
  console.log('DEBUG: DEPLOY_RUN_PORT =', process.env.DEPLOY_RUN_PORT);
  console.log('DEBUG: NODE_ENV =', process.env.NODE_ENV);
  
  // 1. 优先从 SERVER_PORT 环境变量读取（避免与前端 PORT 冲突）
  if (process.env.SERVER_PORT) {
    const port = parseInt(process.env.SERVER_PORT, 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      console.log('DEBUG: Using SERVER_PORT:', port);
      return port;
    }
  }
  
  // 2. 开发环境固定使用 3000 端口
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log('DEBUG: Development mode, using default port 3000');
    return 3000;
  }
  
  // 3. 生产环境可以从 PORT 环境变量读取
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      console.log('DEBUG: Using PORT:', port);
      return port;
    }
  }
  
  // 4. 默认端口 3000
  console.log('DEBUG: Using default port 3000');
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

  // 全局拦截器：统一将 POST 请求的 201 状态码改为 200
  app.useGlobalInterceptors(new HttpStatusInterceptor());
  // 1. 开启优雅关闭 Hooks (关键!)
  app.enableShutdownHooks();

  // 2. 解析端口
  const port = parsePort();
  console.log('DEBUG: Final port =', port);
  
  try {
    await app.listen(port);
    console.log(`✅ Server running on http://localhost:${port}`);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${port} 被占用! 请运行 'npx kill-port ${port}' 然后重试。`);
      process.exit(1);
    } else {
      throw err;
    }
  }
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
