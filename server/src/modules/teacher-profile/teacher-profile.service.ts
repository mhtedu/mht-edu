import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class TeacherProfileService {
  // ==================== 教师主页 ====================

  /**
   * 获取教师主页信息
   */
  async getTeacherProfile(teacherId: number, viewerId?: number) {
    // 获取用户基本信息
    const users = await executeQuery(`
      SELECT id, nickname, avatar, mobile, wechat_id, role, 
        membership_type, membership_expire_at, city_name
      FROM users WHERE id = ?
    `, [teacherId]);

    if (users.length === 0) {
      throw new Error('教师不存在');
    }

    const user = users[0] as any;

    // 获取教师扩展信息
    const profiles = await executeQuery(`
      SELECT * FROM teacher_profiles WHERE user_id = ?
    `, [teacherId]);

    const profile = profiles[0] as any || {};

    // 检查是否已解锁联系方式
    let contactUnlocked = false;
    let wechatUnlocked = false;
    if (viewerId) {
      const unlocks = await executeQuery(`
        SELECT unlock_type FROM contact_unlocks 
        WHERE user_id = ? AND target_user_id = ?
        ORDER BY created_at DESC LIMIT 1
      `, [viewerId, teacherId]);

      if (unlocks.length > 0) {
        contactUnlocked = [1, 3].includes((unlocks[0] as any).unlock_type);
        wechatUnlocked = [2, 3].includes((unlocks[0] as any).unlock_type);
      }
    }

    // 增加浏览量
    await executeQuery(`
      UPDATE teacher_profiles SET view_count = view_count + 1 WHERE user_id = ?
    `, [teacherId]);

    return {
      ...user,
      ...profile,
      contact_unlocked: contactUnlocked,
      wechat_unlocked: wechatUnlocked,
      mobile: contactUnlocked ? user.mobile : this.maskMobile(user.mobile),
      wechat_id: wechatUnlocked ? user.wechat_id : null,
    };
  }

  /**
   * 更新教师主页信息
   */
  async updateTeacherProfile(teacherId: number, data: Partial<{
    realName: string;
    gender: number;
    birthYear: number;
    education: string;
    subjects: string[];
    hourlyRateMin: number;
    hourlyRateMax: number;
    intro: string;
    oneLineIntro: string;
    photos: string[];
    videos: string[];
    coverPhoto: string;
    teachingYears: number;
  }>) {
    // 检查是否存在记录
    const existing = await executeQuery(`
      SELECT user_id FROM teacher_profiles WHERE user_id = ?
    `, [teacherId]);

    if (existing.length === 0) {
      // 创建新记录
      await executeQuery(`
        INSERT INTO teacher_profiles (
          user_id, real_name, gender, birth_year, education,
          subjects, hourly_rate_min, hourly_rate_max, intro, one_line_intro,
          photos, videos, cover_photo, teaching_years
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        teacherId,
        data.realName || '',
        data.gender || null,
        data.birthYear || null,
        data.education || '',
        JSON.stringify(data.subjects || []),
        data.hourlyRateMin || 0,
        data.hourlyRateMax || 0,
        data.intro || '',
        data.oneLineIntro || '',
        JSON.stringify(data.photos || []),
        JSON.stringify(data.videos || []),
        data.coverPhoto || '',
        data.teachingYears || 0,
      ]);
    } else {
      // 更新记录
      const updates: string[] = [];
      const values: any[] = [];

      if (data.realName !== undefined) { updates.push('real_name = ?'); values.push(data.realName); }
      if (data.gender !== undefined) { updates.push('gender = ?'); values.push(data.gender); }
      if (data.birthYear !== undefined) { updates.push('birth_year = ?'); values.push(data.birthYear); }
      if (data.education !== undefined) { updates.push('education = ?'); values.push(data.education); }
      if (data.subjects !== undefined) { updates.push('subjects = ?'); values.push(JSON.stringify(data.subjects)); }
      if (data.hourlyRateMin !== undefined) { updates.push('hourly_rate_min = ?'); values.push(data.hourlyRateMin); }
      if (data.hourlyRateMax !== undefined) { updates.push('hourly_rate_max = ?'); values.push(data.hourlyRateMax); }
      if (data.intro !== undefined) { updates.push('intro = ?'); values.push(data.intro); }
      if (data.oneLineIntro !== undefined) { updates.push('one_line_intro = ?'); values.push(data.oneLineIntro); }
      if (data.photos !== undefined) { updates.push('photos = ?'); values.push(JSON.stringify(data.photos)); }
      if (data.videos !== undefined) { updates.push('videos = ?'); values.push(JSON.stringify(data.videos)); }
      if (data.coverPhoto !== undefined) { updates.push('cover_photo = ?'); values.push(data.coverPhoto); }
      if (data.teachingYears !== undefined) { updates.push('teaching_years = ?'); values.push(data.teachingYears); }

      if (updates.length > 0) {
        await executeQuery(`
          UPDATE teacher_profiles SET ${updates.join(', ')} WHERE user_id = ?
        `, [...values, teacherId]);
      }
    }

    return { success: true };
  }

  // ==================== 教师动态 ====================

  /**
   * 发布动态
   */
  async publishMoment(teacherId: number, data: {
    content: string;
    images?: string[];
    videoUrl?: string;
    videoCover?: string;
  }) {
    const result = await executeQuery(`
      INSERT INTO teacher_moments (teacher_id, content, images, video_url, video_cover)
      VALUES (?, ?, ?, ?, ?)
    `, [
      teacherId,
      data.content,
      JSON.stringify(data.images || []),
      data.videoUrl || null,
      data.videoCover || null,
    ]);

    return { success: true, id: (result as any).insertId };
  }

  /**
   * 获取教师动态列表
   */
  async getMoments(teacherId: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const moments = await executeQuery(`
      SELECT tm.*, 
        u.nickname, u.avatar
      FROM teacher_moments tm
      LEFT JOIN users u ON tm.teacher_id = u.id
      WHERE tm.teacher_id = ? AND tm.is_visible = 1
      ORDER BY tm.created_at DESC
      LIMIT ? OFFSET ?
    `, [teacherId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM teacher_moments 
      WHERE teacher_id = ? AND is_visible = 1
    `, [teacherId]);

    return {
      list: moments,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 删除动态
   */
  async deleteMoment(teacherId: number, momentId: number) {
    await executeQuery(`
      UPDATE teacher_moments SET is_visible = 0 
      WHERE id = ? AND teacher_id = ?
    `, [momentId, teacherId]);

    return { success: true };
  }

  /**
   * 点赞动态
   */
  async likeMoment(momentId: number, userId: number) {
    // 检查是否已点赞
    const existing = await executeQuery(`
      SELECT id FROM moment_likes WHERE moment_id = ? AND user_id = ?
    `, [momentId, userId]);

    if (existing.length > 0) {
      // 取消点赞
      await executeQuery(`DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?`, [momentId, userId]);
      await executeQuery(`UPDATE teacher_moments SET like_count = like_count - 1 WHERE id = ?`, [momentId]);
      return { success: true, liked: false };
    } else {
      // 点赞
      await executeQuery(`INSERT INTO moment_likes (moment_id, user_id) VALUES (?, ?)`, [momentId, userId]);
      await executeQuery(`UPDATE teacher_moments SET like_count = like_count + 1 WHERE id = ?`, [momentId]);
      return { success: true, liked: true };
    }
  }

  // ==================== 教师评价 ====================

  /**
   * 获取教师评价列表
   */
  async getTeacherReviews(teacherId: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const reviews = await executeQuery(`
      SELECT r.*,
        CASE WHEN r.is_anonymous = 1 THEN '匿名用户' ELSE u.nickname END as parent_nickname,
        CASE WHEN r.is_anonymous = 1 THEN NULL ELSE u.avatar END as parent_avatar
      FROM reviews r
      LEFT JOIN users u ON r.parent_id = u.id
      WHERE r.teacher_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [teacherId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM reviews WHERE teacher_id = ?
    `, [teacherId]);

    // 统计评分分布
    const ratingStats = await executeQuery(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE teacher_id = ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [teacherId]);

    return {
      list: reviews,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
      ratingStats,
    };
  }

  /**
   * 教师回复评价
   */
  async replyReview(teacherId: number, reviewId: number, reply: string) {
    // 验证评价归属
    const reviews = await executeQuery(`
      SELECT id FROM reviews WHERE id = ? AND teacher_id = ?
    `, [reviewId, teacherId]);

    if (reviews.length === 0) {
      throw new Error('评价不存在或无权限');
    }

    await executeQuery(`
      UPDATE reviews SET reply = ?, reply_at = NOW() WHERE id = ?
    `, [reply, reviewId]);

    return { success: true };
  }

  // ==================== 联系方式解锁 ====================

  /**
   * 解锁联系方式
   */
  async unlockContact(data: {
    userId: number;
    targetUserId: number;
    orderId?: number;
    unlockType: number; // 1手机 2微信 3全部
    isMember: boolean;
  }) {
    // 检查目标用户是否存在
    const targets = await executeQuery(`
      SELECT id, mobile, wechat_id FROM users WHERE id = ?
    `, [data.targetUserId]);

    if (targets.length === 0) {
      throw new Error('用户不存在');
    }

    const target = targets[0] as any;

    // 非会员需要付费解锁
    let costAmount = 0;
    if (!data.isMember) {
      costAmount = data.unlockType === 3 ? 29.9 : 19.9;
    }

    // 创建解锁记录
    await executeQuery(`
      INSERT INTO contact_unlocks (order_id, user_id, target_user_id, unlock_type, cost_amount)
      VALUES (?, ?, ?, ?, ?)
    `, [data.orderId || null, data.userId, data.targetUserId, data.unlockType, costAmount]);

    // 返回解锁的信息
    const result: any = { success: true, costAmount };
    if ([1, 3].includes(data.unlockType)) {
      result.mobile = target.mobile;
    }
    if ([2, 3].includes(data.unlockType)) {
      result.wechat_id = target.wechat_id;
    }

    return result;
  }

  /**
   * 更新用户微信号
   */
  async updateWechat(userId: number, wechatId: string, qrcode?: string) {
    await executeQuery(`
      UPDATE users SET wechat_id = ?, wechat_qrcode = ? WHERE id = ?
    `, [wechatId, qrcode || null, userId]);

    return { success: true };
  }

  // ==================== 教师主页统计 ====================

  /**
   * 获取教师主页统计数据
   */
  async getTeacherStats(teacherId: number) {
    const stats = await executeQuery(`
      SELECT 
        tp.view_count,
        tp.rating,
        tp.review_count,
        tp.success_count,
        tp.teaching_years,
        (SELECT COUNT(*) FROM teacher_moments WHERE teacher_id = ? AND is_visible = 1) as moment_count,
        (SELECT COUNT(*) FROM orders WHERE matched_teacher_id = ? AND status >= 3) as completed_orders
      FROM teacher_profiles tp
      WHERE tp.user_id = ?
    `, [teacherId, teacherId, teacherId]);

    return stats[0] || {
      view_count: 0,
      rating: 5.0,
      review_count: 0,
      success_count: 0,
      teaching_years: 0,
      moment_count: 0,
      completed_orders: 0,
    };
  }

  /**
   * 手机号脱敏
   */
  private maskMobile(mobile: string): string {
    if (!mobile || mobile.length < 7) return mobile;
    return mobile.substring(0, 3) + '****' + mobile.substring(mobile.length - 4);
  }
}
