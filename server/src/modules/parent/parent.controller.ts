import { Controller, Get, Query, Param } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';

@Controller('admin/parents')
export class ParentController {
  
  @Get()
  async getList(
    @Query('page') page = '1', 
    @Query('limit') limit = '20', 
    @Query('keyword') keyword = '',
    @Query('start_date') startDate = '',
    @Query('end_date') endDate = ''
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    let whereClause = 'WHERE u.role = 0';
    const params: any[] = [];
    
    if (keyword) {
      whereClause += ' AND (u.nickname LIKE ? OR u.mobile LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (startDate) {
      whereClause += ' AND u.created_at >= ?';
      params.push(startDate + ' 00:00:00');
    }
    
    if (endDate) {
      whereClause += ' AND u.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }
    
    const [list] = await db.query(`
      SELECT 
        u.id, u.openid, u.nickname, u.mobile, u.avatar, u.role, u.status, 
        u.membership_type, u.membership_expire_at, u.created_at,
        u.inviter_id, u.inviter_2nd_id,
        inv1.nickname as inviter_name,
        inv1.mobile as inviter_mobile,
        inv2.nickname as inviter_2nd_name,
        inv2.mobile as inviter_2nd_mobile,
        (SELECT COUNT(*) FROM children c WHERE c.parent_id = u.id) as children_count
      FROM users u
      LEFT JOIN users inv1 ON u.inviter_id = inv1.id
      LEFT JOIN users inv2 ON u.inviter_2nd_id = inv2.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);
    
    // 获取每个家长的孩子年龄信息
    const parentIds = (list as any[]).map((p: any) => p.id);
    let childrenMap: Record<number, any[]> = {};
    
    if (parentIds.length > 0) {
      // 使用字符串拼接而不是数组参数
      const idList = parentIds.join(',');
      const [children] = await db.query(`
        SELECT parent_id, name, birth_date, grade,
          TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) as age
        FROM children 
        WHERE parent_id IN (${idList})
      `);
      
      (children as any[]).forEach((c: any) => {
        if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
        childrenMap[c.parent_id].push(c);
      });
    }
    
    // 组装数据
    const resultList = (list as any[]).map((p: any) => ({
      ...p,
      children: childrenMap[p.id] || [],
      children_ages: (childrenMap[p.id] || []).map((c: any) => c.age).join('/') || '-'
    }));
    
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM users u ${whereClause}`, params);
    
    return { list: resultList, total: countResult[0]?.total || 0, page: pageNum };
  }

  @Get('export')
  async exportParents(
    @Query('keyword') keyword = '',
    @Query('start_date') startDate = '',
    @Query('end_date') endDate = ''
  ) {
    try {
      let whereClause = 'WHERE u.role = 0';
      const params: any[] = [];
      
      if (keyword) {
        whereClause += ' AND (u.nickname LIKE ? OR u.mobile LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      if (startDate) {
        whereClause += ' AND u.created_at >= ?';
        params.push(startDate + ' 00:00:00');
      }
      
      if (endDate) {
        whereClause += ' AND u.created_at <= ?';
        params.push(endDate + ' 23:59:59');
      }
      
      const [parents] = await db.query(`
        SELECT 
          u.id as 'ID',
          u.nickname as '昵称',
          u.mobile as '手机号',
          u.city_name as '城市',
          CASE u.membership_type WHEN 1 THEN '会员' ELSE '普通' END as '会员状态',
          DATE_FORMAT(u.membership_expire_at, '%Y-%m-%d') as '会员到期日',
          inv1.nickname as '一级上级',
          inv1.mobile as '一级上级手机',
          inv2.nickname as '二级上级',
          inv2.mobile as '二级上级手机',
          (SELECT GROUP_CONCAT(CONCAT(c.name, '(', TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()), '岁)') SEPARATOR ', ') 
           FROM children c WHERE c.parent_id = u.id) as '孩子信息',
          (SELECT COUNT(*) FROM orders o WHERE o.parent_id = u.id) as '订单数',
          (SELECT COUNT(*) FROM orders o WHERE o.parent_id = u.id AND o.status = 4) as '完成订单',
          DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i') as '注册时间'
        FROM users u
        LEFT JOIN users inv1 ON u.inviter_id = inv1.id
        LEFT JOIN users inv2 ON u.inviter_2nd_id = inv2.id
        ${whereClause}
        ORDER BY u.id DESC
        LIMIT 10000
      `, params);

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(parents as any[]);
      
      // 设置列宽
      worksheet['!cols'] = [
        { wch: 6 },  // ID
        { wch: 12 }, // 昵称
        { wch: 12 }, // 手机号
        { wch: 8 },  // 城市
        { wch: 8 },  // 会员状态
        { wch: 12 }, // 会员到期日
        { wch: 12 }, // 一级上级
        { wch: 14 }, // 一级上级手机
        { wch: 12 }, // 二级上级
        { wch: 14 }, // 二级上级手机
        { wch: 20 }, // 孩子信息
        { wch: 8 },  // 订单数
        { wch: 10 }, // 完成订单
        { wch: 18 }  // 注册时间
      ];
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '家长数据');
      
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      return { 
        success: true, 
        data: excelBuffer,
        filename: `parents_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('导出家长数据失败:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const [users] = await db.query(`
      SELECT 
        u.*,
        inv1.nickname as inviter_name,
        inv1.mobile as inviter_mobile,
        inv2.nickname as inviter_2nd_name,
        inv2.mobile as inviter_2nd_mobile
      FROM users u
      LEFT JOIN users inv1 ON u.inviter_id = inv1.id
      LEFT JOIN users inv2 ON u.inviter_2nd_id = inv2.id
      WHERE u.id = ?
    `, [parseInt(id)]);
    
    if ((users as any[]).length === 0) {
      return { success: false, message: '用户不存在' };
    }
    
    // 获取孩子信息
    const [children] = await db.query(`
      SELECT id, name, gender, birth_date, grade, school, subjects, notes,
        TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) as age
      FROM children 
      WHERE parent_id = ?
    `, [parseInt(id)]);
    
    // 获取订单统计
    const [orderStats] = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending_orders
      FROM orders 
      WHERE parent_id = ?
    `, [parseInt(id)]);
    
    return { 
      success: true, 
      data: {
        ...(users as any[])[0],
        children: children || [],
        orderStats: (orderStats as any[])[0] || {}
      }
    };
  }
}
