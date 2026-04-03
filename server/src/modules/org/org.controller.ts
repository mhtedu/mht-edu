import { Controller, Get, Post, Put, Body, Query, Param, Request } from '@nestjs/common';
import { OrgService } from './org.service';
import { Public } from '../auth/decorators/public.decorator';
import * as db from '@/storage/database/mysql-client';

@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  // ==================== 公共接口 ====================

  /**
   * 获取机构列表（公共接口）
   */
  @Get('list')
  @Public()
  async getOrgList(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('keyword') keyword = '',
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    try {
      let whereClause = 'WHERE verify_status = 1';
      const params: any[] = [];

      if (keyword) {
        whereClause += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      const [orgs] = await db.query(`
        SELECT id, name, logo, description, teacher_count, rating, review_count,
               address, latitude, longitude, contact_phone, subjects
        FROM organizations
        ${whereClause}
        ORDER BY rating DESC, created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM organizations ${whereClause}`,
        params
      );

      // 计算距离
      const lat = latitude ? parseFloat(latitude) : null;
      const lng = longitude ? parseFloat(longitude) : null;

      const orgsWithDistance = orgs.map((org: any) => {
        let distance_text = '';
        if (lat && lng && org.latitude && org.longitude) {
          const distance = this.calculateDistance(lat, lng, org.latitude, org.longitude);
          distance_text = distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
        }
        return {
          ...org,
          distance_text,
          subjects: org.subjects ? (typeof org.subjects === 'string' ? JSON.parse(org.subjects) : org.subjects) : []
        };
      });

      return {
        list: orgsWithDistance,
        total: countResult[0]?.total || 0,
        page: pageNum,
        pageSize: pageSizeNum
      };
    } catch (error) {
      console.error('获取机构列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 计算两点距离（km）
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 获取机构详情（公共接口）
   */
  @Get('detail/:id')
  @Public()
  async getOrgDetail(@Param('id') id: string) {
    try {
      const [orgs] = await db.query(`
        SELECT id, name, logo, description, teacher_count, rating, review_count,
               address, latitude, longitude, contact_phone, subjects,
               business_hours, images, created_at
        FROM organizations
        WHERE id = ?
      `, [parseInt(id)]);

      if (!orgs || orgs.length === 0) {
        return { error: '机构不存在' };
      }

      const org = orgs[0];
      return {
        ...org,
        subjects: org.subjects ? (typeof org.subjects === 'string' ? JSON.parse(org.subjects) : org.subjects) : [],
        images: org.images ? (typeof org.images === 'string' ? JSON.parse(org.images) : org.images) : []
      };
    } catch (error) {
      console.error('获取机构详情失败:', error);
      return { error: '获取机构详情失败' };
    }
  }

  // ==================== 教师管理 ====================

  /**
   * 获取机构教师列表
   */
  @Get('teachers')
  async getTeachers(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getTeachers(orgId, {
      keyword,
      status: status ? parseInt(status) : undefined,
    });
  }

  /**
   * 审核通过教师
   */
  @Post('teachers/:id/approve')
  async approveTeacher(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.approveTeacher(orgId, parseInt(id));
  }

  /**
   * 拒绝教师
   */
  @Post('teachers/:id/reject')
  async rejectTeacher(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.rejectTeacher(orgId, parseInt(id));
  }

  /**
   * 更新教师状态
   */
  @Post('teachers/:id/status')
  async updateTeacherStatus(
    @Param('id') id: string,
    @Body() body: { status: number },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.updateTeacherStatus(orgId, parseInt(id), body.status);
  }

  // ==================== 课程管理 ====================

  /**
   * 获取机构课程列表
   */
  @Get('courses')
  async getCourses(
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getCourses(orgId, { keyword });
  }

  /**
   * 创建/更新课程
   */
  @Post('courses')
  async saveCourse(
    @Body() body: {
      id?: number;
      title: string;
      subject: string;
      teacher_id: number;
      total_hours: number;
      price_per_hour: number;
      schedule: string;
      address: string;
      description: string;
    },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.saveCourse(orgId, body);
  }

  /**
   * 更新课程状态
   */
  @Post('courses/:id/status')
  async updateCourseStatus(
    @Param('id') id: string,
    @Body() body: { status: number },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.updateCourseStatus(orgId, parseInt(id), body.status);
  }

  // ==================== 机构设置 ====================

  /**
   * 获取机构信息
   */
  @Get('info')
  async getOrgInfo(@Request() req: any) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getOrgInfo(orgId);
  }

  /**
   * 更新机构信息
   */
  @Put('info')
  async updateOrgInfo(
    @Body() body: Partial<{
      name: string;
      logo: string;
      description: string;
      address: string;
      contact_phone: string;
      contact_email: string;
      business_hours: string;
      subjects: string[];
      city: string;
    }>,
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.updateOrgInfo(orgId, body);
  }

  // ==================== 邀请功能 ====================

  /**
   * 获取邀请信息
   */
  @Get('invite/info')
  async getInviteInfo(@Request() req: any) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getInviteInfo(orgId);
  }

  /**
   * 发送邀请短信
   */
  @Post('invite/sms')
  async sendInviteSms(
    @Body() body: { phone: string },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.sendInviteSms(orgId, body.phone);
  }

  /**
   * 获取邀请记录
   */
  @Get('invite/history')
  async getInviteHistory(@Request() req: any) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getInviteHistory(orgId);
  }
}
