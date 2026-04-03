import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';


@Injectable()
export class CityService {
  /**
   * 获取所有城市列表
   */
  async getAllCities() {
    try {
      const [cities] = await db.query(`
        SELECT * FROM cities WHERE is_active = 1 ORDER BY sort_order ASC, name ASC
      `) as [any[], any];

      // 按首字母分组
      const grouped: Record<string, any[]> = {};
      for (const city of cities) {
        const firstLetter = (city as any).first_letter?.toUpperCase() || '#';
        if (!grouped[firstLetter]) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(city);
      }

      // 转换为数组并排序
      const result = Object.entries(grouped)
        .map(([letter, cities]) => ({ letter, cities }))
        .sort((a, b) => a.letter.localeCompare(b.letter));

      return result;
    } catch (error: any) {
      console.error('获取城市列表失败:', error.message);
      // 返回空数据，不影响其他功能
      return [];
    }
  }

  /**
   * 获取热门城市
   */
  async getHotCities() {
    try {
      const [cities] = await db.query(`
        SELECT * FROM cities WHERE is_hot = 1 AND is_active = 1
        ORDER BY sort_order ASC LIMIT 20
      `) as [any[], any];

      return cities;
    } catch (error: any) {
      console.error('获取热门城市失败:', error.message);
      return [];
    }
  }

  /**
   * 搜索城市
   */
  async searchCities(keyword: string) {
    try {
      const [cities] = await db.query(`
        SELECT * FROM cities 
        WHERE is_active = 1 
        AND (name LIKE ? OR pinyin LIKE ?)
        ORDER BY sort_order ASC
        LIMIT 50
      `, [`%${keyword}%`, `%${keyword}%`]) as [any[], any];

      return cities;
    } catch (error: any) {
      console.error('搜索城市失败:', error.message);
      return [];
    }
  }

  /**
   * 根据经纬度获取最近的城市
   */
  async getNearestCity(latitude: number, longitude: number) {
    try {
      // 使用 Haversine 公式计算距离
      const [cities] = await db.query(`
        SELECT *,
          (
            6371 * acos(
              cos(radians(?)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians(?)) +
              sin(radians(?)) * sin(radians(latitude))
            )
          ) as distance
        FROM cities
        WHERE is_active = 1
        ORDER BY distance ASC
        LIMIT 1
      `, [latitude, longitude, latitude]) as [any[], any];

      if (cities.length > 0) {
        const city = cities[0] as any;
        return {
          ...city,
          distance: Math.round(city.distance * 10) / 10, // 保留一位小数
        };
      }

      return null;
    } catch (error: any) {
      console.error('获取最近城市失败:', error.message);
      return null;
    }
  }

  /**
   * 更新用户选择的城市
   */
  async updateUserCity(userId: number, cityId: number) {
    const [cities] = await db.query(`
      SELECT id, name FROM cities WHERE id = ?
    `, [cityId]) as [any[], any];

    if (cities.length === 0) {
      throw new Error('城市不存在');
    }

    const city = cities[0] as any;

    await db.query(`
      UPDATE users SET city_name = ? WHERE id = ?
    `, [city.name, userId]);

    return { success: true, cityName: city.name };
  }

  /**
   * 获取城市详情
   */
  async getCityDetail(cityId: number) {
    const [cities] = await db.query(`
      SELECT * FROM cities WHERE id = ?
    `, [cityId]) as [any[], any];

    if (cities.length === 0) {
      throw new Error('城市不存在');
    }

    const city = cities[0];

    // 获取城市统计数据
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE city_name = ? AND role = 2) as teacher_count,
        (SELECT COUNT(*) FROM orders WHERE city = ? AND status = 0) as pending_order_count
    `, [(city as any).name, (city as any).name]) as [any[], any];

    return {
      ...city,
      stats: stats[0] || { teacher_count: 0, pending_order_count: 0 },
    };
  }

  /**
   * 获取城市教师列表
   */
  async getCityTeachers(cityName: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const [teachers] = await db.query(`
      SELECT u.id, u.nickname, u.avatar, u.membership_type,
        tp.real_name, tp.subjects, tp.hourly_rate_min, tp.hourly_rate_max,
        tp.rating, tp.review_count, tp.success_count, tp.view_count,
        tp.one_line_intro, tp.cover_photo
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.city_name = ? AND u.role = 2 AND u.membership_type = 1
      ORDER BY tp.rating DESC, tp.view_count DESC
      LIMIT ? OFFSET ?
    `, [cityName, pageSize, offset]) as [any[], any];

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM users 
      WHERE city_name = ? AND role = 2 AND membership_type = 1
    `, [cityName]) as [any[], any];

    return {
      list: teachers,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }
}
