import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { NotificationService } from './notification.service';
import * as db from '@/storage/database/mysql-client';

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 获取用户通知列表
   */
  @Get('list')
  async getNotifications(
    @Request() req,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('type') type?: string,
  ) {
    const userId = req.user?.id;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (type) {
      whereClause += ' AND JSON_EXTRACT(data, "$.type") = ?';
      params.push(type);
    }

    try {
      const [list] = await db.query(
        `SELECT * FROM notifications ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSizeNum, offset],
      );

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
        params,
      );

      return {
        list,
        total: countResult[0]?.total || 0,
        page: pageNum,
        pageSize: pageSizeNum,
      };
    } catch (error) {
      console.error('获取通知列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 获取未读消息数量
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user?.id;

    try {
      const [result] = await db.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId],
      );

      return { count: result[0]?.count || 0 };
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      return { count: 0 };
    }
  }

  /**
   * 标记消息为已读
   */
  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id;

    try {
      await db.update(
        'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
        [parseInt(id), userId],
      );

      return { success: true };
    } catch (error) {
      console.error('标记已读失败:', error);
      return { success: false };
    }
  }

  /**
   * 标记所有消息为已读
   */
  @Put('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user?.id;

    try {
      await db.update(
        'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
        [userId],
      );

      return { success: true };
    } catch (error) {
      console.error('标记全部已读失败:', error);
      return { success: false };
    }
  }

  /**
   * 删除通知
   */
  @Post(':id/delete')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id;

    try {
      await db.update(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [parseInt(id), userId],
      );

      return { success: true };
    } catch (error) {
      console.error('删除通知失败:', error);
      return { success: false };
    }
  }

  // ==================== 管理员接口 ====================

  /**
   * 发送系统通知（管理员）
   */
  @Post('admin/send')
  async sendSystemNotification(
    @Body() body: { userIds: number[]; title: string; content: string },
  ) {
    let successCount = 0;
    let failCount = 0;

    for (const userId of body.userIds) {
      try {
        await db.update(
          `INSERT INTO notifications (user_id, title, content, data, is_read, created_at)
           VALUES (?, ?, ?, '{}', 0, NOW())`,
          [userId, body.title, body.content],
        );
        successCount++;
      } catch (error) {
        console.error(`发送通知给用户${userId}失败:`, error);
        failCount++;
      }
    }

    return {
      success: true,
      successCount,
      failCount,
    };
  }

  /**
   * 批量发送通知（管理员）
   */
  @Post('admin/broadcast')
  async broadcastNotification(
    @Body() body: { title: string; content: string; role?: string },
  ) {
    try {
      // 根据角色筛选用户
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (body.role) {
        const roleMap: Record<string, number> = {
          parent: 0,
          teacher: 1,
          org: 2,
        };
        whereClause += ' AND role = ?';
        params.push(roleMap[body.role] ?? 0);
      }

      // 批量插入通知
      await db.update(
        `INSERT INTO notifications (user_id, title, content, data, is_read, created_at)
         SELECT id, ?, ?, '{}', 0, NOW() FROM users ${whereClause}`,
        [body.title, body.content, ...params],
      );

      // 获取受影响的用户数
      const [countResult] = await db.query(
        `SELECT COUNT(*) as count FROM users ${whereClause}`,
        params,
      );

      return {
        success: true,
        sentCount: countResult[0]?.count || 0,
      };
    } catch (error) {
      console.error('批量发送通知失败:', error);
      return { success: false, message: '发送失败' };
    }
  }
}
