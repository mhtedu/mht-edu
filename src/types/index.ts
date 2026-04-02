// 用户相关类型
export interface UserInfo {
  id: number
  phone?: string
  mobile?: string
  nickname?: string
  avatar?: string
  role: 'parent' | 'teacher' | 'org' | 'admin' | number
  status?: number
  created_at?: string
  updated_at?: string
  // 教师扩展字段
  teacher_profile?: TeacherProfile
  // 机构扩展字段
  org_profile?: OrgProfile
  // 家长扩展字段
  parent_profile?: ParentProfile
}

export interface TeacherProfile {
  id: number
  user_id: number
  name: string
  avatar?: string
  gender?: string
  birth_date?: string
  education?: string
  school?: string
  major?: string
  teaching_years?: number
  subjects: string[]
  grades: string[]
  price_min?: number
  price_max?: number
  bio?: string
  certificates?: string[]
  verify_status: number
  rating: number
  review_count: number
  location?: string
  latitude?: number
  longitude?: number
  service_area?: string
  teaching_mode?: string
  available_time?: string
}

export interface OrgProfile {
  id: number
  user_id: number
  name: string
  logo?: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  contact_phone?: string
  contact_name?: string
  verify_status: number
  rating: number
  review_count: number
  teacher_count: number
}

export interface ParentProfile {
  id: number
  user_id: number
  name?: string
  child_name?: string
  child_age?: number
  child_grade?: string
  address?: string
  latitude?: number
  longitude?: number
}

// 需求相关类型
export interface Demand {
  id: number
  user_id: number
  title: string
  description: string
  subject: string
  grade: string
  budget_min: number
  budget_max: number
  teaching_mode: string
  location?: string
  latitude?: number
  longitude?: number
  status: 'open' | 'matched' | 'closed'
  matched_teacher_id?: number
  created_at: string
  updated_at: string
}

// 订单相关类型
export interface Order {
  id: number
  demand_id: number
  teacher_id: number
  parent_id: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  price: number
  created_at: string
  updated_at: string
}

// 消息相关类型
export interface Message {
  id: number
  from_user_id: number
  to_user_id: number
  content: string
  type: 'text' | 'image' | 'system'
  is_read: boolean
  created_at: string
}

// 会员相关类型
export interface Membership {
  id: number
  user_id: number
  plan_id: number
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
}

// 分享相关类型
export interface ShareLink {
  id: number
  user_id: number
  code: string
  click_count: number
  register_count: number
  created_at: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 分页响应
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  page_size: number
}
