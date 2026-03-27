import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 会员权限守卫
 * 校验用户是否具有相应功能的访问权限
 */
@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(private requiredFeature: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.body?.user_id || request.query?.userId;

    if (!userId) {
      throw new ForbiddenException('请先登录');
    }

    const client = getSupabaseClient();
    const { data: user, error } = await client
      .from('users')
      .select('role, membership_type, membership_expire_at')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      throw new ForbiddenException('用户不存在');
    }

    // 检查会员是否过期
    const isMemberActive = 
      user.membership_type === 1 && 
      user.membership_expire_at && 
      new Date(user.membership_expire_at) > new Date();

    // 根据功能类型校验权限
    const permissionCheck = this.checkPermission(user.role, isMemberActive, this.requiredFeature);
    
    if (!permissionCheck.allowed) {
      throw new ForbiddenException(permissionCheck.message);
    }

    return true;
  }

  private checkPermission(role: number, isMember: boolean, feature: string): { allowed: boolean; message: string } {
    const permissions: Record<string, Record<number, { free: boolean; paid: boolean }>> = {
      // 抢单权限：仅付费教师可用
      'grab_order': {
        0: { free: false, paid: false }, // 家长
        1: { free: false, paid: true },  // 教师 - 仅付费
        2: { free: false, paid: true },  // 机构
        3: { free: true, paid: true },   // 代理商
      },
      // 主动搜索
      'search_teacher': {
        0: { free: false, paid: true },  // 家长 - 仅付费
        1: { free: false, paid: false }, // 教师
        2: { free: true, paid: true },   // 机构
        3: { free: true, paid: true },   // 代理商
      },
      // 查看订单池
      'view_order_pool': {
        0: { free: false, paid: false }, // 家长
        1: { free: false, paid: true },  // 教师 - 仅付费
        2: { free: false, paid: true },  // 机构
        3: { free: true, paid: true },   // 代理商
      },
      // 解锁联系方式
      'unlock_contact': {
        0: { free: false, paid: true },  // 家长 - 仅付费
        1: { free: false, paid: true },  // 教师 - 仅付费
        2: { free: true, paid: true },   // 机构
        3: { free: true, paid: true },   // 代理商
      },
      // 发布需求
      'publish_order': {
        0: { free: true, paid: true },   // 家长 - 可用
        1: { free: false, paid: false }, // 教师
        2: { free: false, paid: false }, // 机构
        3: { free: true, paid: true },   // 代理商
      },
    };

    const featurePermission = permissions[feature];
    if (!featurePermission) {
      return { allowed: true, message: '' };
    }

    const rolePermission = featurePermission[role];
    if (!rolePermission) {
      return { allowed: false, message: '当前角色无此权限' };
    }

    if (isMember) {
      return rolePermission.paid 
        ? { allowed: true, message: '' }
        : { allowed: false, message: '会员无此权限' };
    } else {
      return rolePermission.free
        ? { allowed: true, message: '' }
        : { allowed: false, message: '该功能仅对会员开放，请开通会员' };
    }
  }
}

/**
 * 抢单权限守卫
 */
@Injectable()
export class CanGrabOrderGuard extends MembershipGuard {
  constructor() {
    super('grab_order');
  }
}

/**
 * 搜索教师权限守卫
 */
@Injectable()
export class CanSearchTeacherGuard extends MembershipGuard {
  constructor() {
    super('search_teacher');
  }
}

/**
 * 查看订单池权限守卫
 */
@Injectable()
export class CanViewOrderPoolGuard extends MembershipGuard {
  constructor() {
    super('view_order_pool');
  }
}

/**
 * 解锁联系方式权限守卫
 */
@Injectable()
export class CanUnlockContactGuard extends MembershipGuard {
  constructor() {
    super('unlock_contact');
  }
}
