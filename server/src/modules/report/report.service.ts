import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class ReportService {
  /**
   * 获取运营概览数据
   */
  async getOverview() {
    // 用户数据
    const userStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 0 THEN 1 ELSE 0 END) as parent_count,
        SUM(CASE WHEN role = 1 THEN 1 ELSE 0 END) as teacher_count,
        SUM(CASE WHEN role = 2 THEN 1 ELSE 0 END) as org_count,
        SUM(CASE WHEN membership_type = 1 AND membership_expire_at > NOW() THEN 1 ELSE 0 END) as member_count,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_new_users,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_new_users,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as month_new_users
      FROM users
    `);

    // 订单数据
    const orderStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as matched_count,
        SUM(CASE WHEN status IN (2, 3) THEN 1 ELSE 0 END) as ongoing_count,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_new_orders,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_new_orders,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as month_new_orders
      FROM orders
    `);

    // 支付数据
    const paymentStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN DATE(paid_at) = CURDATE() THEN amount ELSE 0 END), 0) as today_amount,
        COALESCE(SUM(CASE WHEN paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN amount ELSE 0 END), 0) as week_amount,
        COALESCE(SUM(CASE WHEN paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END), 0) as month_amount
      FROM payments
      WHERE status = 1
    `);

    // 分佣数据
    const commissionStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_commissions,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 0 THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as settled_amount,
        COALESCE(SUM(CASE WHEN status = 2 THEN amount ELSE 0 END), 0) as withdrawn_amount
      FROM commissions
    `);

    return {
      users: userStats[0],
      orders: orderStats[0],
      payments: paymentStats[0],
      commissions: commissionStats[0],
    };
  }

  /**
   * 获取趋势数据（用于图表）
   */
  async getTrend(days: number = 30) {
    const userTrend = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    const orderTrend = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    const paymentTrend = await executeQuery(`
      SELECT 
        DATE(paid_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM payments
      WHERE status = 1 AND paid_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(paid_at)
      ORDER BY date
    `, [days]);

    return {
      users: this.fillMissingDates(userTrend, days),
      orders: this.fillMissingDates(orderTrend, days),
      payments: this.fillMissingDatesWithAmount(paymentTrend, days),
    };
  }

  /**
   * 获取用户分布数据
   */
  async getUserDistribution() {
    // 角色分布
    const roleDistribution = await executeQuery(`
      SELECT 
        role,
        CASE role
          WHEN 0 THEN '家长'
          WHEN 1 THEN '教师'
          WHEN 2 THEN '机构'
        END as role_name,
        COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `);

    // 会员分布
    const memberDistribution = await executeQuery(`
      SELECT 
        CASE 
          WHEN membership_type = 1 AND membership_expire_at > NOW() THEN '会员'
          ELSE '普通用户'
        END as member_type,
        COUNT(*) as count
      FROM users
      GROUP BY member_type
    `);

    // 邀请层级分布
    const inviteDistribution = await executeQuery(`
      SELECT 
        CASE 
          WHEN inviter_id IS NULL THEN '无邀请人'
          ELSE '有邀请人'
        END as invite_status,
        COUNT(*) as count
      FROM users
      GROUP BY invite_status
    `);

    return {
      by_role: roleDistribution,
      by_member: memberDistribution,
      by_invite: inviteDistribution,
    };
  }

  /**
   * 获取订单分布数据
   */
  async getOrderDistribution() {
    // 状态分布
    const statusDistribution = await executeQuery(`
      SELECT 
        status,
        CASE status
          WHEN 0 THEN '待匹配'
          WHEN 1 THEN '已匹配'
          WHEN 2 THEN '进行中'
          WHEN 3 THEN '已结课'
          WHEN 4 THEN '已完成'
          WHEN 5 THEN '已取消'
        END as status_name,
        COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);

    // 科目分布
    const subjectDistribution = await executeQuery(`
      SELECT 
        subject,
        COUNT(*) as count
      FROM orders
      WHERE subject IS NOT NULL AND subject != ''
      GROUP BY subject
      ORDER BY count DESC
      LIMIT 10
    `);

    // 年级分布
    const gradeDistribution = await executeQuery(`
      SELECT 
        student_grade as grade,
        COUNT(*) as count
      FROM orders
      WHERE student_grade IS NOT NULL AND student_grade != ''
      GROUP BY student_grade
      ORDER BY count DESC
      LIMIT 15
    `);

    return {
      by_status: statusDistribution,
      by_subject: subjectDistribution,
      by_grade: gradeDistribution,
    };
  }

  /**
   * 获取收入分析
   */
  async getRevenueAnalysis() {
    // 每日收入
    const dailyRevenue = await executeQuery(`
      SELECT 
        DATE(paid_at) as date,
        COUNT(*) as payment_count,
        SUM(amount) as amount
      FROM payments
      WHERE status = 1
      GROUP BY DATE(paid_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // 收入来源分布
    const revenueSource = await executeQuery(`
      SELECT 
        CASE 
          WHEN membership_id IS NOT NULL THEN '会员'
          WHEN order_id IS NOT NULL THEN '商品'
          ELSE '其他'
        END as source,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM payments
      WHERE status = 1
      GROUP BY source
    `);

    // 会员套餐销售统计
    const planSales = await executeQuery(`
      SELECT 
        mp.name as plan_name,
        mp.price,
        COUNT(*) as sales_count,
        SUM(p.amount) as total_amount
      FROM payments p
      JOIN membership_plans mp ON p.membership_id = mp.id
      WHERE p.status = 1 AND p.membership_id IS NOT NULL
      GROUP BY mp.id
      ORDER BY sales_count DESC
    `);

    return {
      daily: dailyRevenue,
      by_source: revenueSource,
      plan_sales: planSales,
    };
  }

  /**
   * 获取分销统计
   */
  async getDistributionStats() {
    // 分销商排行
    const topDistributors = await executeQuery(`
      SELECT 
        u.id,
        u.nickname,
        u.mobile,
        COUNT(DISTINCT c.from_user_id) as invite_count,
        SUM(c.amount) as total_commission
      FROM commissions c
      JOIN users u ON c.user_id = u.id
      GROUP BY u.id
      ORDER BY total_commission DESC
      LIMIT 20
    `);

    // 分佣层级统计
    const levelStats = await executeQuery(`
      SELECT 
        level_type,
        CASE level_type
          WHEN 1 THEN '一级邀请'
          WHEN 2 THEN '二级邀请'
          WHEN 3 THEN '城市代理'
          WHEN 4 THEN '机构分佣'
        END as level_name,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM commissions
      GROUP BY level_type
      ORDER BY level_type
    `);

    // 提现统计
    const withdrawStats = await executeQuery(`
      SELECT 
        status,
        CASE status
          WHEN 0 THEN '待审核'
          WHEN 1 THEN '已通过'
          WHEN 2 THEN '已拒绝'
          WHEN 3 THEN '已打款'
        END as status_name,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM withdraw_records
      GROUP BY status
    `);

    return {
      top_distributors: topDistributors,
      by_level: levelStats,
      withdraw_stats: withdrawStats,
    };
  }

  /**
   * 填充缺失日期（用于图表）
   */
  private fillMissingDates(data: any[], days: number) {
    const result: any[] = [];
    const dateMap = new Map(data.map((d: any) => [d.date, d.count]));
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      result.push({
        date: dateStr,
        count: dateMap.get(dateStr) || 0,
      });
    }
    
    return result;
  }

  /**
   * 填充缺失日期（带金额）
   */
  private fillMissingDatesWithAmount(data: any[], days: number) {
    const result: any[] = [];
    const dateMap = new Map(data.map((d: any) => [d.date, { count: d.count, amount: d.amount }]));
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const value = dateMap.get(dateStr) || { count: 0, amount: 0 };
      result.push({
        date: dateStr,
        count: value.count,
        amount: value.amount,
      });
    }
    
    return result;
  }
}
