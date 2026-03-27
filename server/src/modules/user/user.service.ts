import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class UserService {
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
    const { page = 1, pageSize = 20 } = params;

    let query = client
      .from('users')
      .select(`
        *,
        teacher_profiles (*)
      `)
      .eq('role', 1) // 教师
      .eq('status', 1) // 正常状态
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error } = await query;

    if (error) throw new Error(`查询教师列表失败: ${error.message}`);
    return data;
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
