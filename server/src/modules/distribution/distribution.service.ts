import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class DistributionService {
  /**
   * 获取邀请信息
   */
  async getInviteInfo(userId: number) {
    // 获取用户基本信息
    const users = await executeQuery(`
      SELECT id, nickname, avatar, inviter_id, invite_code
      FROM users WHERE id = ?
    `, [userId]);

    const user = users[0] as any;

    // 统计一级邀请人数
    const [level1Result] = await executeQuery(`
      SELECT COUNT(*) as count FROM users WHERE inviter_id = ?
    `, [userId]);

    // 统计二级邀请人数
    const [level2Result] = await executeQuery(`
      SELECT COUNT(*) as count FROM users WHERE inviter_2nd_id = ?
    `, [userId]);

    // 统计佣金
    const commissionStats = await executeQuery(`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as settled,
        COALESCE(SUM(CASE WHEN status = 2 THEN amount ELSE 0 END), 0) as withdrawn
      FROM commissions WHERE user_id = ?
    `, [userId]);

    const stats = commissionStats[0] as any;
    const totalCommission = parseFloat(stats?.total || 0);
    const settledCommission = parseFloat(stats?.settled || 0);
    const withdrawnCommission = parseFloat(stats?.withdrawn || 0);

    // 生成或获取邀请码
    let inviteCode = user?.invite_code;
    if (!inviteCode) {
      inviteCode = this.generateInviteCode(userId);
      // 更新用户的邀请码
      await executeQuery(`
        UPDATE users SET invite_code = ? WHERE id = ?
      `, [inviteCode, userId]);
    }

    return {
      user: {
        id: user?.id,
        nickname: user?.nickname,
        avatar: user?.avatar,
      },
      inviter_id: user?.inviter_id,
      invite_code: inviteCode,
      invite_link: `https://your-domain.com/invite?code=${inviteCode}`,
      statistics: {
        level1_count: (level1Result as any)?.count || 0,
        level2_count: (level2Result as any)?.count || 0,
        total_commission: totalCommission.toFixed(2),
        settled_commission: settledCommission.toFixed(2),
        withdrawn_commission: withdrawnCommission.toFixed(2),
        available_commission: (settledCommission - withdrawnCommission).toFixed(2),
      },
    };
  }

  /**
   * 生成邀请码
   */
  private generateInviteCode(userId: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    let num = userId;
    
    while (num > 0 || code.length < 4) {
      code = chars[num % chars.length] + code;
      num = Math.floor(num / chars.length);
    }
    
    return code.padStart(6, 'X');
  }

  /**
   * 绑定邀请关系
   */
  async bindInviter(userId: number, inviteCode: string) {
    // 解析邀请码获取推荐人ID
    const inviterId = this.parseInviteCode(inviteCode);
    if (!inviterId) {
      throw new Error('邀请码无效');
    }

    // 不能邀请自己
    if (inviterId === userId) {
      throw new Error('不能使用自己的邀请码');
    }

    // 检查用户是否已有推荐人
    const users = await executeQuery(`
      SELECT inviter_id FROM users WHERE id = ?
    `, [userId]);

    const user = users[0] as any;
    if (user?.inviter_id) {
      throw new Error('您已有推荐人，无法重复绑定');
    }

    // 验证推荐人是否存在并获取其推荐人
    const inviters = await executeQuery(`
      SELECT id, inviter_id FROM users WHERE id = ?
    `, [inviterId]);

    if (inviters.length === 0) {
      throw new Error('推荐人不存在');
    }

    const inviter = inviters[0] as any;

    // 更新邀请关系
    await executeQuery(`
      UPDATE users SET inviter_id = ?, inviter_2nd_id = ?, updated_at = NOW()
      WHERE id = ?
    `, [inviterId, inviter.inviter_id || null, userId]);

    return {
      success: true,
      inviter_id: inviterId,
    };
  }

  /**
   * 解析邀请码
   */
  private parseInviteCode(code: string): number | null {
    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let num = 0;
      
      for (let i = 0; i < code.length; i++) {
        const index = chars.indexOf(code[i].toUpperCase());
        if (index === -1) continue;
        num = num * chars.length + index;
      }
      
      return num > 0 ? num : null;
    } catch {
      return null;
    }
  }

  /**
   * 获取佣金明细
   */
  async getCommissionList(userId: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const list = await executeQuery(`
      SELECT c.*, u.nickname as from_nickname, u.avatar as from_avatar
      FROM commissions c
      LEFT JOIN users u ON c.from_user_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);

    const [countResult] = await executeQuery(`
      SELECT COUNT(*) as total FROM commissions WHERE user_id = ?
    `, [userId]);

    return {
      list,
      total: (countResult as any)?.total || 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(((countResult as any)?.total || 0) / pageSize),
    };
  }

  /**
   * 申请提现
   */
  async applyWithdraw(userId: number, amount: number, accountInfo: { type: string; account: string; name: string }) {
    // 检查可提现余额
    const balanceResult = await executeQuery(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as settled,
        COALESCE(SUM(CASE WHEN status = 2 THEN amount ELSE 0 END), 0) as withdrawn
      FROM commissions WHERE user_id = ?
    `, [userId]);

    const balance = balanceResult[0] as any;
    const available = parseFloat(balance?.settled || 0) - parseFloat(balance?.withdrawn || 0);

    if (available < amount) {
      throw new Error('可提现余额不足');
    }

    // 创建提现记录
    await executeQuery(`
      INSERT INTO withdraw_records (user_id, amount, account_type, account_no, account_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `, [userId, amount, accountInfo.type, accountInfo.account, accountInfo.name]);

    return {
      success: true,
      message: '提现申请已提交，预计1-3个工作日到账',
    };
  }

  /**
   * 获取邀请列表
   */
  async getInviteList(userId: number, level: number = 1, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    const field = level === 2 ? 'inviter_2nd_id' : 'inviter_id';

    const list = await executeQuery(`
      SELECT id, nickname, avatar, created_at
      FROM users
      WHERE ${field} = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);

    const [countResult] = await executeQuery(`
      SELECT COUNT(*) as total FROM users WHERE ${field} = ?
    `, [userId]);

    return {
      list,
      total: (countResult as any)?.total || 0,
      page,
      page_size: pageSize,
      level,
    };
  }
}
