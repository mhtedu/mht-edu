import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class UserService {
  /**
   * 计算两点之间的距离（米）- Haversine 公式
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}米`;
    }
    return `${(meters / 1000).toFixed(1)}公里`;
  }

  async createUser(userData: {
    openid?: string;
    mobile?: string;
    nickname?: string;
    avatar?: string;
    role: number;
    inviter_id?: number;
  }) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .insert({
        ...userData,
        status: 1,
        membership_type: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`创建用户失败: ${error.message}`);
    return data;
  }

  async getUserById(id: number) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`查询用户失败: ${error.message}`);
    return data;
  }

  async getUserByOpenid(openid: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('openid', openid)
      .maybeSingle();

    if (error) throw new Error(`查询用户失败: ${error.message}`);
    return data;
  }

  async updateUser(id: number, userData: Partial<{
    nickname: string;
    avatar: string;
    mobile: string;
    latitude: string;
    longitude: string;
    city_code: string;
  }>) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新用户失败: ${error.message}`);
    return data;
  }

  async updateUserLocation(id: number, latitude: string, longitude: string, cityCode?: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .update({
        latitude,
        longitude,
        city_code: cityCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新位置失败: ${error.message}`);
    return data;
  }

  async getTeachers(params: {
    latitude?: string;
    longitude?: string;
    subject?: string;
    maxDistance?: number;
    page?: number;
    pageSize?: number;
  }) {
    const client = getSupabaseClient();
    const { page = 1, pageSize = 20, maxDistance = 50000, subject } = params;
    const userLat = parseFloat(params.latitude || '0');
    const userLng = parseFloat(params.longitude || '0');
    const hasLocation = userLat !== 0 && userLng !== 0;

    // 查询教师列表
    let query = client
      .from('users')
      .select('*')
      .eq('role', 1) // 教师
      .eq('status', 1); // 正常状态

    const { data, error } = await query;

    if (error) throw new Error(`查询教师列表失败: ${error.message}`);

    // 获取教师资料
    const teacherIds = (data || []).map(t => t.id);
    const { data: profiles } = await client
      .from('teacher_profiles')
      .select('*')
      .in('user_id', teacherIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // 计算距离并组装数据
    let teachersWithDistance = (data || []).map(teacher => {
      const profile = profileMap.get(teacher.id) || {};
      const teacherLat = parseFloat(teacher.latitude) || 0;
      const teacherLng = parseFloat(teacher.longitude) || 0;
      const distance = hasLocation
        ? this.calculateDistance(userLat, userLng, teacherLat, teacherLng)
        : 0;

      return {
        ...teacher,
        ...profile,
        distance,
        distance_text: hasLocation ? this.formatDistance(distance) : '未知',
      };
    });

    // 按学科筛选
    if (subject && subject !== '全部') {
      teachersWithDistance = teachersWithDistance.filter(t =>
        t.subjects && Array.isArray(t.subjects) && t.subjects.includes(subject)
      );
    }

    // 有位置时按距离过滤和排序
    if (hasLocation) {
      teachersWithDistance = teachersWithDistance
        .filter(t => t.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);
    }

    // 分页
    return teachersWithDistance.slice((page - 1) * pageSize, page * pageSize);
  }

  async getTeacherProfile(userId: number) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(`查询教师资料失败: ${error.message}`);
    return data;
  }

  async updateTeacherProfile(userId: number, profileData: Partial<{
    real_name: string;
    gender: number;
    birth_year: string;
    education: string;
    certificates: any[];
    subjects: string[];
    max_distance: number;
    hourly_rate_min: string;
    hourly_rate_max: string;
    intro: string;
    photos: string[];
  }>) {
    const client = getSupabaseClient();
    
    // 先查询是否存在
    const existing = await this.getTeacherProfile(userId);
    
    if (existing) {
      // 更新
      const { data, error } = await client
        .from('teacher_profiles')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(`更新教师资料失败: ${error.message}`);
      return data;
    } else {
      // 新建
      const { data, error } = await client
        .from('teacher_profiles')
        .insert({
          user_id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) throw new Error(`创建教师资料失败: ${error.message}`);
      return data;
    }
  }
}
