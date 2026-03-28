import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private reflector: Reflector) {
    super();
  }

  // LocalAuthGuard 始终需要执行护照验证来设置 req.user
  // 不需要检查 @Public() 装饰器
}
