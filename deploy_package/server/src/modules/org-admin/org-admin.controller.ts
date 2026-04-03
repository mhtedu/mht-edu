import { Controller, Get, Query, Param } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';

@Controller('admin/orgs-new')
export class OrgAdminController {
  
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
      whereClause += ' AND (o.name LIKE ? OR o.contact_name LIKE ? OR o.contact_phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (status === 'pending') {
      whereClause += ' AND o.verify_status = 0';
    } else if (status === 'approved') {
      whereClause += ' AND o.verify_status = 1';
    } else if (status === 'rejected') {
      whereClause += ' AND o.verify_status = 2';
    }
    
    if (startDate) {
      whereClause += ' AND o.created_at >= ?';
      params.push(startDate + ' 00:00:00');
    }
    
    if (endDate) {
      whereClause += ' AND o.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }
    
    const [list] = await db.query(`
      SELECT 
        o.id, o.user_id, o.name, o.logo, o.description, o.address,
        o.contact_name, o.contact_phone, o.verify_status,
        o.teacher_count, o.student_count, o.created_at,
        u.nickname, u.avatar, u.mobile, u.city_name,
        (SELECT COUNT(*) FROM users WHERE affiliated_org_id = o.user_id) as actual_teacher_count
      FROM organizations o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);
    
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM organizations o ${whereClause}
    `, params);
    
    // 处理数据
    const resultList = (list as any[]).map(o => ({
      ...o,
      verify_status_text: ['待审核', '已认证', '已拒绝'][o.verify_status] || '未知'
    }));
    
    return { list: resultList, total: countResult[0]?.total || 0, page: pageNum };
  }

  @Get('export')
  async exportOrgs(
    @Query('keyword') keyword = '',
    @Query('status') status = '',
    @Query('start_date') startDate = '',
    @Query('end_date') endDate = ''
  ) {
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      
      if (keyword) {
        whereClause += ' AND (o.name LIKE ? OR o.contact_name LIKE ? OR o.contact_phone LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      if (status === 'pending') {
        whereClause += ' AND o.verify_status = 0';
      } else if (status === 'approved') {
        whereClause += ' AND o.verify_status = 1';
      } else if (status === 'rejected') {
        whereClause += ' AND o.verify_status = 2';
      }
      
      if (startDate) {
        whereClause += ' AND o.created_at >= ?';
        params.push(startDate + ' 00:00:00');
      }
      
      if (endDate) {
        whereClause += ' AND o.created_at <= ?';
        params.push(endDate + ' 23:59:59');
      }
      
      const [orgs] = await db.query(`
        SELECT 
          o.id as 'ID',
          o.name as '机构名称',
          u.mobile as '手机号',
          u.city_name as '城市',
          o.address as '地址',
          o.contact_name as '联系人',
          o.contact_phone as '联系电话',
          o.teacher_count as '教师数',
          o.student_count as '学生数',
          (SELECT COUNT(*) FROM users WHERE affiliated_org_id = o.user_id) as '入驻牛师数',
          CASE o.verify_status WHEN 0 THEN '待审核' WHEN 1 THEN '已认证' WHEN 2 THEN '已拒绝' END as '认证状态',
          u.membership_type as '会员类型',
          DATE_FORMAT(u.membership_expire_at, '%Y-%m-%d') as '会员到期日',
          DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') as '注册时间'
        FROM organizations o
        LEFT JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT 10000
      `, params);

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(orgs as any[]);
      
      worksheet['!cols'] = [
        { wch: 6 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 25 },
        { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
        { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 18 }
      ];
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '机构数据');
      
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      return { 
        success: true, 
        data: excelBuffer,
        filename: `organizations_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('导出机构数据失败:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const [orgs] = await db.query(`
      SELECT 
        o.*, 
        u.nickname, u.avatar, u.mobile, u.city_name, u.membership_type, u.membership_expire_at
      FROM organizations o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [parseInt(id)]);
    
    if ((orgs as any[]).length === 0) {
      return { success: false, message: '机构不存在' };
    }
    
    const org = (orgs as any[])[0];
    
    // 获取入驻牛师列表
    const [teachers] = await db.query(`
      SELECT u.id, u.nickname, u.avatar, tp.real_name, tp.subjects, tp.rating
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.affiliated_org_id = ?
      LIMIT 20
    `, [org.user_id]);
    
    return { 
      success: true, 
      data: {
        ...org,
        teachers: teachers || []
      }
    };
  }
}
