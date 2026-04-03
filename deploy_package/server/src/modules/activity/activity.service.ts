import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';


@Injectable()
export class ActivityService {
  /**
   * 获取活动列表
   */
  async getActivityList(params: {
    role?: number;
    type?: string;
    status?: string;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = ['is_active = 1'];
    const sqlParams: any[] = [];

    // 角色筛选：查找target_roles包含该角色的活动
    if (params.role !== undefined) {
      conditions.push('JSON_CONTAINS(target_roles, ?)');
      sqlParams.push(params.role.toString());
    }

    // 类型筛选
    if (params.type) {
      conditions.push('type = ?');
      sqlParams.push(params.type);
    }

    // 状态筛选
    if (params.status) {
      conditions.push('status = ?');
      sqlParams.push(params.status);
    }

    const whereClause = conditions.join(' AND ');

    const [activities] = await db.query(`
      SELECT 
        id, title, type, cover_image, start_time, end_time,
        address, online_price, offline_price, max_participants,
        current_participants, target_roles, status, is_online,
        created_at
      FROM activities
      WHERE ${whereClause}
      ORDER BY start_time ASC, created_at DESC
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);

    // 获取总数
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM activities WHERE ${whereClause}
    `, sqlParams);

    return {
      list: activities,
      total: countResult[0]?.total || 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * 获取活动详情
   */
  async getActivityDetail(activityId: number) {
    const [activities] = await db.query(`
      SELECT * FROM activities WHERE id = ? AND is_active = 1
    `, [activityId]);

    if (activities.length === 0) {
      throw new Error('活动不存在');
    }

    const activity = activities[0] as any;

    // 获取报名人数统计
    const [signupStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN participation_type = 1 THEN 1 ELSE 0 END) as online_count,
        SUM(CASE WHEN participation_type = 2 THEN 1 ELSE 0 END) as offline_count
      FROM activity_signups
      WHERE activity_id = ? AND status = 1
    `, [activityId]);

    return {
      ...activity,
      signup_stats: signupStats[0],
    };
  }

  /**
   * 报名活动
   */
  async signupActivity(
    activityId: number,
    userId: number,
    signupType: number,
    participantName: string,
    participantPhone: string,
    participantCount: number,
  ) {
    // 检查活动是否存在
    const [activities] = await db.query(`
      SELECT * FROM activities WHERE id = ? AND is_active = 1 FOR UPDATE
    `, [activityId]);

    if (activities.length === 0) {
      throw new Error('活动不存在');
    }

    const activity = activities[0] as any;

    // 检查活动状态
    if (activity.status === 'ended') {
      throw new Error('活动已结束');
    }

    // 检查人数限制
    if (activity.max_participants > 0) {
      if ((activity.current_participants + participantCount) > activity.max_participants) {
        throw new Error('报名人数已满');
      }
    }

    // 检查是否已报名
    const [existing] = await db.query(`
      SELECT id FROM activity_signups 
      WHERE activity_id = ? AND user_id = ? AND status != 2
    `, [activityId, userId]);

    if (existing.length > 0) {
      throw new Error('您已报名该活动');
    }

    // 计算费用
    const price = signupType === 1 ? activity.online_price : activity.offline_price;
    const totalAmount = price * participantCount;

    // 创建报名记录
    const [result] = await db.query(`
      INSERT INTO activity_signups 
      (activity_id, user_id, participation_type, status)
      VALUES (?, ?, ?, 1)
    `, [activityId, userId, signupType]);

    // 更新活动报名人数
    await db.query(`
      UPDATE activities 
      SET current_participants = current_participants + ?
      WHERE id = ?
    `, [participantCount, activityId]);

    return {
      success: true,
      signupId: (result as any).insertId,
      totalAmount,
      message: totalAmount > 0 ? '请完成支付' : '报名成功',
    };
  }

  /**
   * 获取用户报名的活动
   */
  async getUserSignedActivities(
    userId: number,
    page: number,
    pageSize: number,
    status?: string,
  ) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = ['s.user_id = ?', 's.status != 2'];
    const params: any[] = [userId];

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    const [activities] = await db.query(`
      SELECT 
        a.id, a.title, a.type, a.cover_image, a.start_time, a.end_time,
        a.address, a.status, a.is_online,
        s.id as signup_id, s.participation_type as signup_type, s.status as signup_status,
        s.created_at as signup_time
      FROM activity_signups s
      LEFT JOIN activities a ON s.activity_id = a.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM activity_signups s
      LEFT JOIN activities a ON s.activity_id = a.id
      WHERE ${conditions.join(' AND ')}
    `, params);

    return {
      list: activities,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 取消报名
   */
  async cancelSignup(activityId: number, userId: number) {
    // 检查报名记录
    const [signups] = await db.query(`
      SELECT * FROM activity_signups 
      WHERE activity_id = ? AND user_id = ? AND status = 1
    `, [activityId, userId]);

    if (signups.length === 0) {
      throw new Error('未找到报名记录');
    }

    const signup = signups[0] as any;

    // 更新报名状态
    await db.query(`
      UPDATE activity_signups SET status = 2 WHERE id = ?
    `, [signup.id]);

    // 更新活动人数
    await db.query(`
      UPDATE activities 
      SET current_participants = current_participants - 1
      WHERE id = ?
    `, [activityId]);

    return { success: true, message: '取消报名成功' };
  }

  /**
   * 获取活动参与者列表
   */
  async getActivityParticipants(
    activityId: number,
    page: number,
    pageSize: number,
  ) {
    const offset = (page - 1) * pageSize;

    const [participants] = await db.query(`
      SELECT 
        s.id, s.participation_type as signup_type, s.created_at,
        u.nickname, u.avatar
      FROM activity_signups s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.activity_id = ? AND s.status = 1
      ORDER BY s.created_at ASC
      LIMIT ? OFFSET ?
    `, [activityId, pageSize, offset]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM activity_signups 
      WHERE activity_id = ? AND status = 1
    `, [activityId]);

    return {
      list: participants,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }
}
