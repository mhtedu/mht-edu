import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';


@Injectable()
export class ExportService {
  /**
   * 导出用户数据
   */
  async exportUsers(filters: {
    role?: string;
    membership_type?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let sql = `
      SELECT 
        u.id,
        u.nickname,
        u.mobile,
        u.role,
        CASE u.role 
          WHEN 0 THEN '家长'
          WHEN 1 THEN '教师'
          WHEN 2 THEN '机构'
        END as role_name,
        u.membership_type,
        u.membership_expire_at,
        u.inviter_id,
        u.invite_code,
        u.created_at,
        u.last_login_at
      FROM users u
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.role !== undefined) {
      sql += ` AND u.role = ?`;
      params.push(filters.role);
    }

    if (filters.membership_type !== undefined) {
      sql += ` AND u.membership_type = ?`;
      params.push(filters.membership_type);
    }

    if (filters.start_date) {
      sql += ` AND DATE(u.created_at) >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND DATE(u.created_at) <= ?`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY u.created_at DESC`;

    const users = await db.query(sql, params);

    // 转换为CSV格式
    const headers = ['ID', '昵称', '手机号', '角色', '会员类型', '会员到期时间', '邀请人ID', '邀请码', '注册时间', '最后登录'];
    const rows = users.map((u: any) => [
      u.id,
      u.nickname || '',
      u.mobile || '',
      u.role_name,
      u.membership_type === 1 ? '会员' : '普通',
      u.membership_expire_at ? new Date(u.membership_expire_at).toLocaleDateString('zh-CN') : '',
      u.inviter_id || '',
      u.invite_code || '',
      new Date(u.created_at).toLocaleDateString('zh-CN'),
      u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('zh-CN') : '',
    ]);

    return this.generateCSV(headers, rows, 'users');
  }

  /**
   * 导出订单数据
   */
  async exportOrders(filters: {
    status?: string;
    subject?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let sql = `
      SELECT 
        o.id,
        o.order_no,
        o.subject,
        o.student_grade,
        o.budget,
        o.status,
        CASE o.status
          WHEN 0 THEN '待匹配'
          WHEN 1 THEN '已匹配'
          WHEN 2 THEN '进行中'
          WHEN 3 THEN '已结课'
          WHEN 4 THEN '已完成'
          WHEN 5 THEN '已取消'
        END as status_name,
        u1.nickname as parent_name,
        u1.mobile as parent_mobile,
        u2.nickname as teacher_name,
        u2.mobile as teacher_mobile,
        o.created_at,
        o.matched_at
      FROM orders o
      LEFT JOIN users u1 ON o.parent_id = u1.id
      LEFT JOIN users u2 ON o.teacher_id = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status !== undefined) {
      sql += ` AND o.status = ?`;
      params.push(filters.status);
    }

    if (filters.subject) {
      sql += ` AND o.subject LIKE ?`;
      params.push(`%${filters.subject}%`);
    }

    if (filters.start_date) {
      sql += ` AND DATE(o.created_at) >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND DATE(o.created_at) <= ?`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY o.created_at DESC`;

    const orders = await db.query(sql, params);

    const headers = ['订单ID', '订单号', '科目', '年级', '预算', '状态', '家长姓名', '家长电话', '教师姓名', '教师电话', '创建时间', '匹配时间'];
    const rows = orders.map((o: any) => [
      o.id,
      o.order_no,
      o.subject || '',
      o.student_grade || '',
      o.budget || '',
      o.status_name,
      o.parent_name || '',
      o.parent_mobile || '',
      o.teacher_name || '',
      o.teacher_mobile || '',
      new Date(o.created_at).toLocaleDateString('zh-CN'),
      o.matched_at ? new Date(o.matched_at).toLocaleDateString('zh-CN') : '',
    ]);

    return this.generateCSV(headers, rows, 'orders');
  }

  /**
   * 导出支付记录
   */
  async exportPayments(filters: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let sql = `
      SELECT 
        p.id,
        p.payment_no,
        p.amount,
        p.status,
        CASE p.status
          WHEN 0 THEN '待支付'
          WHEN 1 THEN '已支付'
          WHEN 2 THEN '已退款'
        END as status_name,
        p.payment_method,
        p.transaction_id,
        u.nickname as user_name,
        u.mobile as user_mobile,
        mp.name as plan_name,
        p.paid_at,
        p.created_at
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN membership_plans mp ON p.membership_id = mp.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status !== undefined) {
      sql += ` AND p.status = ?`;
      params.push(filters.status);
    }

    if (filters.start_date) {
      sql += ` AND DATE(p.created_at) >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND DATE(p.created_at) <= ?`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const payments = await db.query(sql, params);

    const headers = ['支付ID', '支付单号', '金额', '状态', '支付方式', '交易号', '用户姓名', '用户电话', '套餐名称', '支付时间', '创建时间'];
    const rows = payments.map((p: any) => [
      p.id,
      p.payment_no,
      p.amount,
      p.status_name,
      p.payment_method || '',
      p.transaction_id || '',
      p.user_name || '',
      p.user_mobile || '',
      p.plan_name || '',
      p.paid_at ? new Date(p.paid_at).toLocaleDateString('zh-CN') : '',
      new Date(p.created_at).toLocaleDateString('zh-CN'),
    ]);

    return this.generateCSV(headers, rows, 'payments');
  }

  /**
   * 导出佣金记录
   */
  async exportCommissions(filters: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let sql = `
      SELECT 
        c.id,
        c.amount,
        c.rate,
        c.level_type,
        CASE c.level_type
          WHEN 1 THEN '一级邀请'
          WHEN 2 THEN '二级邀请'
          WHEN 3 THEN '城市代理'
          WHEN 4 THEN '机构分佣'
        END as level_name,
        c.status,
        CASE c.status
          WHEN 0 THEN '待结算'
          WHEN 1 THEN '已结算'
          WHEN 2 THEN '已提现'
        END as status_name,
        u1.nickname as user_name,
        u1.mobile as user_mobile,
        u2.nickname as from_user_name,
        p.payment_no,
        c.created_at
      FROM commissions c
      LEFT JOIN users u1 ON c.user_id = u1.id
      LEFT JOIN users u2 ON c.from_user_id = u2.id
      LEFT JOIN payments p ON c.payment_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status !== undefined) {
      sql += ` AND c.status = ?`;
      params.push(filters.status);
    }

    if (filters.start_date) {
      sql += ` AND DATE(c.created_at) >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND DATE(c.created_at) <= ?`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const commissions = await db.query(sql, params);

    const headers = ['佣金ID', '金额', '比例(%)', '分佣类型', '状态', '用户姓名', '用户电话', '来源用户', '支付单号', '创建时间'];
    const rows = commissions.map((c: any) => [
      c.id,
      c.amount,
      c.rate,
      c.level_name,
      c.status_name,
      c.user_name || '',
      c.user_mobile || '',
      c.from_user_name || '',
      c.payment_no || '',
      new Date(c.created_at).toLocaleDateString('zh-CN'),
    ]);

    return this.generateCSV(headers, rows, 'commissions');
  }

  /**
   * 导出提现记录
   */
  async exportWithdrawals(filters: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let sql = `
      SELECT 
        w.id,
        w.amount,
        w.account_type,
        w.account_no,
        w.account_name,
        w.status,
        CASE w.status
          WHEN 0 THEN '待审核'
          WHEN 1 THEN '已通过'
          WHEN 2 THEN '已拒绝'
          WHEN 3 THEN '已打款'
        END as status_name,
        w.reject_reason,
        u.nickname as user_name,
        u.mobile as user_mobile,
        w.created_at,
        w.processed_at
      FROM withdraw_records w
      LEFT JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status !== undefined) {
      sql += ` AND w.status = ?`;
      params.push(filters.status);
    }

    if (filters.start_date) {
      sql += ` AND DATE(w.created_at) >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ` AND DATE(w.created_at) <= ?`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY w.created_at DESC`;

    const withdrawals = await db.query(sql, params);

    const headers = ['提现ID', '金额', '账户类型', '账号', '账户名', '状态', '拒绝原因', '用户姓名', '用户电话', '申请时间', '处理时间'];
    const rows = withdrawals.map((w: any) => [
      w.id,
      w.amount,
      w.account_type || '',
      w.account_no || '',
      w.account_name || '',
      w.status_name,
      w.reject_reason || '',
      w.user_name || '',
      w.user_mobile || '',
      new Date(w.created_at).toLocaleDateString('zh-CN'),
      w.processed_at ? new Date(w.processed_at).toLocaleDateString('zh-CN') : '',
    ]);

    return this.generateCSV(headers, rows, 'withdrawals');
  }

  /**
   * 生成CSV数据
   */
  private generateCSV(headers: string[], rows: any[][], filename: string) {
    // BOM for Excel UTF-8
    let csv = '\uFEFF';
    
    // 添加表头
    csv += headers.join(',') + '\n';
    
    // 添加数据行
    rows.forEach(row => {
      csv += row.map(cell => {
        // 处理包含逗号或换行的单元格
        if (cell && (cell.toString().includes(',') || cell.toString().includes('\n'))) {
          return `"${cell.toString().replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',') + '\n';
    });

    return {
      filename: `${filename}_${new Date().toISOString().slice(0, 10)}.csv`,
      content: csv,
      mimeType: 'text/csv;charset=utf-8',
    };
  }
}
