import { Controller, Get, Query, Param } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';

@Controller('admin/teachers-new')
export class TeacherAdminController {
  
  @Get()
  async getList(
    @Query('page') page = '1', 
    @Query('limit') limit = '20',
    @Query('keyword') keyword = '',
    @Query('status') status = '',
    @Query('start_date') startDate = '',
    @Query('end_date') endDate = ''
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (keyword) {
      whereClause += ' AND (tp.real_name LIKE ? OR u.nickname LIKE ? OR u.mobile LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (status === 'pending') {
      whereClause += ' AND tp.verify_status = 0';
    } else if (status === 'approved') {
      whereClause += ' AND tp.verify_status = 1';
    } else if (status === 'rejected') {
      whereClause += ' AND tp.verify_status = 2';
    }
    
    if (startDate) {
      whereClause += ' AND tp.created_at >= ?';
      params.push(startDate + ' 00:00:00');
    }
    
    if (endDate) {
      whereClause += ' AND tp.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }
    
    const [list] = await db.query(`
      SELECT 
        tp.user_id as id, tp.user_id, tp.real_name, tp.education,
        tp.school, tp.major, tp.subjects, tp.intro,
        tp.teaching_years, tp.hourly_rate_min, tp.hourly_rate_max,
        tp.rating, tp.rating_count, tp.student_count, tp.order_count,
        tp.verify_status, tp.verify_time, tp.created_at,
        u.nickname, u.avatar, u.mobile, u.city_name,
        inv1.nickname as inviter_name,
        inv1.mobile as inviter_mobile,
        inv2.nickname as inviter_2nd_name,
        inv2.mobile as inviter_2nd_mobile
      FROM teacher_profiles tp
      LEFT JOIN users u ON tp.user_id = u.id
      LEFT JOIN users inv1 ON u.inviter_id = inv1.id
      LEFT JOIN users inv2 ON u.inviter_2nd_id = inv2.id
      ${whereClause}
      ORDER BY tp.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);
    
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM teacher_profiles tp
      LEFT JOIN users u ON tp.user_id = u.id
      ${whereClause}
    `, params);
    
    // 处理数据
    const resultList = (list as any[]).map(t => ({
      ...t,
      subjects_text: Array.isArray(t.subjects) ? t.subjects.join('、') : (t.subjects || '-'),
      verify_status_text: ['待审核', '已认证', '已拒绝'][t.verify_status] || '未知'
    }));
    
    return { list: resultList, total: countResult[0]?.total || 0, page: pageNum };
  }

  @Get('export')
  async exportTeachers(
    @Query('keyword') keyword = '',
    @Query('status') status = '',
    @Query('start_date') startDate = '',
    @Query('end_date') endDate = ''
  ) {
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      
      if (keyword) {
        whereClause += ' AND (tp.real_name LIKE ? OR u.nickname LIKE ? OR u.mobile LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      if (status === 'pending') {
        whereClause += ' AND tp.verify_status = 0';
      } else if (status === 'approved') {
        whereClause += ' AND tp.verify_status = 1';
      } else if (status === 'rejected') {
        whereClause += ' AND tp.verify_status = 2';
      }
      
      if (startDate) {
        whereClause += ' AND tp.created_at >= ?';
        params.push(startDate + ' 00:00:00');
      }
      
      if (endDate) {
        whereClause += ' AND tp.created_at <= ?';
        params.push(endDate + ' 23:59:59');
      }
      
      const [teachers] = await db.query(`
        SELECT 
          tp.user_id as 'ID',
          tp.real_name as '真实姓名',
          u.nickname as '昵称',
          u.mobile as '手机号',
          u.city_name as '城市',
          tp.education as '学历',
          tp.school as '毕业院校',
          tp.major as '专业',
          CASE WHEN tp.subjects IS NOT NULL THEN 
            JSON_UNQUOTE(JSON_EXTRACT(tp.subjects, '$')) 
          ELSE '' END as '教授科目',
          tp.teaching_years as '教龄',
          tp.hourly_rate_min as '最低时薪',
          tp.hourly_rate_max as '最高时薪',
          tp.rating as '评分',
          tp.rating_count as '评价数',
          tp.student_count as '学生数',
          tp.order_count as '订单数',
          CASE tp.verify_status WHEN 0 THEN '待审核' WHEN 1 THEN '已认证' WHEN 2 THEN '已拒绝' END as '认证状态',
          inv1.nickname as '一级上级',
          inv1.mobile as '一级上级手机',
          inv2.nickname as '二级上级',
          inv2.mobile as '二级上级手机',
          DATE_FORMAT(tp.created_at, '%Y-%m-%d %H:%i') as '注册时间'
        FROM teacher_profiles tp
        LEFT JOIN users u ON tp.user_id = u.id
        LEFT JOIN users inv1 ON u.inviter_id = inv1.id
        LEFT JOIN users inv2 ON u.inviter_2nd_id = inv2.id
        ${whereClause}
        ORDER BY tp.created_at DESC
        LIMIT 10000
      `, params);

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(teachers as any[]);
      
      worksheet['!cols'] = [
        { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
        { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 6 }, { wch: 8 },
        { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
        { wch: 18 }
      ];
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '牛师数据');
      
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      return { 
        success: true, 
        data: excelBuffer,
        filename: `teachers_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('导出牛师数据失败:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const [teachers] = await db.query(`
      SELECT 
        tp.*, 
        u.nickname, u.avatar, u.mobile, u.city_name, u.membership_type,
        u.inviter_id, u.inviter_2nd_id,
        inv1.nickname as inviter_name,
        inv1.mobile as inviter_mobile,
        inv2.nickname as inviter_2nd_name,
        inv2.mobile as inviter_2nd_mobile
      FROM teacher_profiles tp
      LEFT JOIN users u ON tp.user_id = u.id
      LEFT JOIN users inv1 ON u.inviter_id = inv1.id
      LEFT JOIN users inv2 ON u.inviter_2nd_id = inv2.id
      WHERE tp.user_id = ?
    `, [parseInt(id)]);
    
    if ((teachers as any[]).length === 0) {
      return { success: false, message: '牛师不存在' };
    }
    
    // 获取订单统计
    const [orderStats] = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending_orders
      FROM orders 
      WHERE matched_teacher_id = ?
    `, [parseInt(id)]);
    
    return { 
      success: true, 
      data: {
        ...(teachers as any[])[0],
        orderStats: (orderStats as any[])[0] || {}
      }
    };
  }
}
