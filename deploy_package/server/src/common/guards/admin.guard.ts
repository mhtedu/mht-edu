import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user) {
      throw new UnauthorizedException('未登录');
    }

    // 检查是否是管理员（role = 3 或者 id = 1）
    if (user.role === 3 || user.id === 1) {
      return true;
    }

    throw new UnauthorizedException('无管理员权限');
  }
}
