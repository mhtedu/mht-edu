import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as db from '@/storage/database/postgres-client';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * 验证用户
   */
  async validateUser(username: string, password: string): Promise<any> {
    const result = await db.query(
      `SELECT 
        au.id, au.username, au.password, au.real_name, au.email, au.phone, 
        au.avatar, au.role_id, au.status,
        ar.role_name, ar.role_code, ar.permissions
      FROM admin_user au
      LEFT JOIN admin_role ar ON au.role_id = ar.id
      WHERE au.username = $1 AND au.status = 1`,
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // 更新最后登录信息
    await db.update(
      `UPDATE admin_user 
       SET last_login_at = NOW(), login_count = COALESCE(login_count, 0) + 1
       WHERE id = $1`,
      [user.id]
    );

    // 移除密码字段
    delete user.password;

    return user;
  }

  /**
   * 登录
   */
  async login(user: any) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role_code,
      permissions: JSON.parse(user.permissions || '[]'),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: {
          id: user.role_id,
          name: user.role_name,
          code: user.role_code,
        },
      },
    };
  }

  /**
   * 获取用户详情
   */
  async getProfile(userId: number) {
    const result = await db.query(
      `SELECT 
        au.id, au.username, au.real_name, au.email, au.phone, 
        au.avatar, au.role_id, au.last_login_at, au.login_count,
        ar.role_name, ar.role_code
      FROM admin_user au
      LEFT JOIN admin_role ar ON au.role_id = ar.id
      WHERE au.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('用户不存在');
    }

    return result.rows[0];
  }

  /**
   * 更新个人信息
   */
  async updateProfile(userId: number, data: {
    realName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }) {
    await db.update(
      `UPDATE admin_user 
       SET real_name = $1, email = $2, phone = $3, avatar = $4
       WHERE id = $5`,
      [data.realName, data.email, data.phone, data.avatar, userId]
    );

    return { success: true };
  }

  /**
   * 修改密码
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // 获取当前密码
    const result = await db.query(
      'SELECT password FROM admin_user WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, result.rows[0].password);
    if (!isPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db.update(
      'UPDATE admin_user SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    return { success: true };
  }

  /**
   * 退出登录
   */
  async logout(userId: number) {
    // 可以在这里记录退出日志
    return { success: true };
  }

  /**
   * 获取用户权限列表
   */
  async getPermissions(userId: number) {
    const result = await db.query(
      `SELECT ar.permissions 
       FROM admin_user au
       LEFT JOIN admin_role ar ON au.role_id = ar.id
       WHERE au.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return [];
    }

    return JSON.parse(result.rows[0].permissions || '[]');
  }
}
