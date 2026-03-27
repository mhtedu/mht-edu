import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class OrgAssignService {
  // ==================== 机构教师管理 ====================

  /**
   * 获取机构旗下教师列表
   */
  async getOrgTeachers(orgId: number, status?: number) {
    const conditions = ['ot.org_id = ?'];
    const params: any[] = [orgId];

    if (status !== undefined) {
      conditions.push('ot.status = ?');
      params.push(status);
    }

    return executeQuery(`
      SELECT ot.*, 
        u.nickname, u.avatar, u.mobile,
        tp.real_name, tp.subjects, tp.education, tp.rating, tp.teaching_years
      FROM org_teachers ot
      LEFT JOIN users u ON ot.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON ot.teacher_id = tp.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ot.bind_at DESC
    `, params);
  }

  /**
   * 邀请教师加入机构
   */
  async inviteTeacher(orgId: number, teacherId: number, commissionRate?: number) {
    // 检查是否已绑定
    const existing = await executeQuery(`
      SELECT id, status FROM org_teachers WHERE org_id = ? AND teacher_id = ?
    `, [orgId, teacherId]);

    if (existing.length > 0) {
      const record = existing[0] as any;
      if (record.status === 1) {
        throw new Error('教师已绑定该机构');
      }
      // 重新发送邀请
      await executeQuery(`
        UPDATE org_teachers SET status = 0, bind_at = NULL
        WHERE org_id = ? AND teacher_id = ?
      `, [orgId, teacherId]);
      return { success: true, message: '邀请已重新发送' };
    }

    await executeQuery(`
      INSERT INTO org_teachers (org_id, teacher_id, status, commission_rate)
      VALUES (?, ?, 0, ?)
    `, [orgId, teacherId, commissionRate || 10]);

    return { success: true, message: '邀请已发送' };
  }

  /**
   * 教师接受/拒绝机构邀请
   */
  async handleInvite(teacherId: number, orgId: number, accept: boolean) {
    if (accept) {
      await executeQuery(`
        UPDATE org_teachers 
        SET status = 1, bind_at = NOW()
        WHERE org_id = ? AND teacher_id = ? AND status = 0
      `, [orgId, teacherId]);

      // 更新教师的所属机构
      await executeQuery(`
        UPDATE users SET affiliated_org_id = ? WHERE id = ?
      `, [orgId, teacherId]);
    } else {
      await executeQuery(`
        UPDATE org_teachers SET status = 2, unbind_at = NOW()
        WHERE org_id = ? AND teacher_id = ? AND status = 0
      `, [orgId, teacherId]);
    }

    return { success: true };
  }

  /**
   * 解绑教师
   */
  async unbindTeacher(orgId: number, teacherId: number) {
    await executeQuery(`
      UPDATE org_teachers SET status = 2, unbind_at = NOW()
      WHERE org_id = ? AND teacher_id = ?
    `, [orgId, teacherId]);

    // 清除教师的所属机构
    await executeQuery(`
      UPDATE users SET affiliated_org_id = NULL WHERE id = ?
    `, [teacherId]);

    return { success: true };
  }

  /**
   * 设置教师分佣比例
   */
  async setTeacherCommission(orgId: number, teacherId: number, rate: number) {
    await executeQuery(`
      UPDATE org_teachers SET commission_rate = ?
      WHERE org_id = ? AND teacher_id = ?
    `, [rate, orgId, teacherId]);

    return { success: true };
  }

  // ==================== 机构派单 ====================

  /**
   * 机构派单给教师
   */
  async assignOrder(data: {
    orgId: number;
    orderId: number;
    teacherId: number;
    assignType: number; // 1推荐 2指派
    note?: string;
  }) {
    // 验证教师是否属于该机构
    const teachers = await executeQuery(`
      SELECT id FROM org_teachers 
      WHERE org_id = ? AND teacher_id = ? AND status = 1
    `, [data.orgId, data.teacherId]);

    if (teachers.length === 0) {
      throw new Error('该教师不属于您的机构');
    }

    // 检查订单是否存在
    const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [data.orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    // 创建派单记录
    await executeQuery(`
      INSERT INTO org_assignments (org_id, order_id, teacher_id, assign_type, assign_note)
      VALUES (?, ?, ?, ?, ?)
    `, [data.orgId, data.orderId, data.teacherId, data.assignType, data.note || '']);

    // 如果是直接指派，同时创建抢单记录
    if (data.assignType === 2) {
      await executeQuery(`
        INSERT INTO order_matches (order_id, teacher_id, status)
        VALUES (?, ?, 1)
      `, [data.orderId, data.teacherId]);

      // 更新订单状态
      await executeQuery(`
        UPDATE orders SET status = 1, matched_teacher_id = ?, matched_at = NOW()
        WHERE id = ?
      `, [data.teacherId, data.orderId]);
    }

    return { success: true };
  }

  /**
   * 教师处理机构派单
   */
  async handleAssignment(teacherId: number, assignmentId: number, accept: boolean, note?: string) {
    const assignments = await executeQuery(`
      SELECT * FROM org_assignments WHERE id = ? AND teacher_id = ?
    `, [assignmentId, teacherId]);

    if (assignments.length === 0) {
      throw new Error('派单记录不存在');
    }

    const assignment = assignments[0] as any;

    if (assignment.status !== 0) {
      throw new Error('该派单已处理');
    }

    const status = accept ? 1 : 2;
    await executeQuery(`
      UPDATE org_assignments SET status = ?, teacher_note = ?
      WHERE id = ?
    `, [status, note || '', assignmentId]);

    if (accept) {
      // 接受派单
      await executeQuery(`
        INSERT INTO order_matches (order_id, teacher_id, status)
        VALUES (?, ?, 1)
      `, [assignment.order_id, teacherId]);

      await executeQuery(`
        UPDATE orders SET status = 1, matched_teacher_id = ?, matched_at = NOW()
        WHERE id = ?
      `, [teacherId, assignment.order_id]);
    }

    return { success: true };
  }

  /**
   * 获取机构的派单记录
   */
  async getOrgAssignments(orgId: number, status?: number) {
    const conditions = ['oa.org_id = ?'];
    const params: any[] = [orgId];

    if (status !== undefined) {
      conditions.push('oa.status = ?');
      params.push(status);
    }

    return executeQuery(`
      SELECT oa.*,
        o.order_no, o.subject, o.student_grade, o.hourly_rate,
        u.nickname as teacher_nickname, u.avatar as teacher_avatar,
        tp.real_name as teacher_name
      FROM org_assignments oa
      LEFT JOIN orders o ON oa.order_id = o.id
      LEFT JOIN users u ON oa.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON oa.teacher_id = tp.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY oa.created_at DESC
    `, params);
  }

  /**
   * 获取教师的派单通知
   */
  async getTeacherAssignments(teacherId: number, status?: number) {
    const conditions = ['oa.teacher_id = ?'];
    const params: any[] = [teacherId];

    if (status !== undefined) {
      conditions.push('oa.status = ?');
      params.push(status);
    }

    return executeQuery(`
      SELECT oa.*,
        o.order_no, o.subject, o.student_grade, o.hourly_rate, o.address,
        org.org_name
      FROM org_assignments oa
      LEFT JOIN orders o ON oa.order_id = o.id
      LEFT JOIN organizations org ON oa.org_id = org.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY oa.created_at DESC
    `, params);
  }

  /**
   * 机构推荐教师给家长
   */
  async recommendTeachers(orgId: number, orderId: number) {
    // 获取订单信息
    const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0] as any;

    // 获取机构教师，按匹配度排序
    const teachers = await executeQuery(`
      SELECT ot.commission_rate,
        u.id, u.nickname, u.avatar, u.latitude, u.longitude,
        tp.real_name, tp.subjects, tp.education, tp.rating, tp.teaching_years, tp.hourly_rate,
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(u.latitude))
          ), 2
        ) as distance
      FROM org_teachers ot
      LEFT JOIN users u ON ot.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON ot.teacher_id = tp.user_id
      WHERE ot.org_id = ? AND ot.status = 1
        AND FIND_IN_SET(?, tp.subjects) > 0
      ORDER BY tp.rating DESC, distance ASC
      LIMIT 10
    `, [order.latitude, order.longitude, order.latitude, orgId, order.subject]);

    return teachers;
  }
}
