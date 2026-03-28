import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components';
import Taro, { useLoad, useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, Building2, ChevronDown, Users, Share2, GraduationCap, BookOpen, Gift } from 'lucide-react-taro';
import CitySelector from '@/components/city-selector';
import './index.css';

// 订单类型
interface Order {
  id: number;
  subject: string;
  hourly_rate: number;
  student_grade: string;
  student_gender: number;
  address: string;
  description: string;
  status: number;
  created_at: string;
  distance: number;
  distance_text: string;
}

// 教师类型
interface Teacher {
  id: number;
  nickname: string;
  avatar: string;
  real_name: string;
  gender: number;
  education: string;
  subjects: string[];
  hourly_rate_min: number;
  hourly_rate_max: number;
  intro: string;
  distance: number;
  distance_text: string;
}

// 轮播图类型
interface Banner {
  id: number;
  image_url: string;
  title: string;
  link_url: string;
}

// 信息流广告类型
interface FeedAd {
  id: number;
  title: string;
  content: string;
  image_url: string;
  link_url: string;
  ad_type: number;
}

// 活动类型
interface Activity {
  id: number;
  title: string;
  type: 'visit' | 'training' | 'lecture' | 'other';
  cover_image: string;
  start_time: string;
  end_time: string;
  address: string;
  online_price: number;
  offline_price: number;
  max_participants: number;
  current_participants: number;
  target_roles: number[];
  status: 'upcoming' | 'ongoing' | 'ended';
  is_online: boolean;
}

// 城市类型
interface City {
  id: number;
  name: string;
  pinyin: string;
  first_letter: string;
  is_hot: number;
}

// 城市数据配置
const CITY_DATA: Record<string, { lat: number; lng: number; teachers: Teacher[]; orders: Order[] }> = {
  '北京': {
    lat: 39.9042,
    lng: 116.4074,
    teachers: [
      { id: 1, nickname: '张老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', real_name: '张明', gender: 1, education: '北京大学·硕士', subjects: ['数学', '物理'], hourly_rate_min: 150, hourly_rate_max: 200, intro: '8年教学经验，擅长中考数学提分，帮助学生快速掌握解题技巧', distance: 1200, distance_text: '1.2km' },
      { id: 2, nickname: '李老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', real_name: '李芳', gender: 2, education: '清华大学·本科', subjects: ['英语', '语文'], hourly_rate_min: 120, hourly_rate_max: 180, intro: '英语专八，口语流利，留学英国两年，纯正英式发音', distance: 2500, distance_text: '2.5km' },
      { id: 3, nickname: '王老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', real_name: '王强', gender: 1, education: '北京师范大学·博士', subjects: ['化学', '生物'], hourly_rate_min: 200, hourly_rate_max: 300, intro: '重点中学在职教师，10年一线教学经验', distance: 3800, distance_text: '3.8km' },
      { id: 4, nickname: '刘老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu', real_name: '刘婷', gender: 2, education: '中国人民大学·硕士', subjects: ['语文', '历史'], hourly_rate_min: 130, hourly_rate_max: 180, intro: '擅长语文阅读写作指导，帮助学生培养良好阅读习惯', distance: 1500, distance_text: '1.5km' },
      { id: 5, nickname: '陈老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen', real_name: '陈浩', gender: 1, education: '北京航空航天大学·本科', subjects: ['数学', '物理'], hourly_rate_min: 100, hourly_rate_max: 150, intro: '年轻有活力，善于与中小学生沟通，注重培养逻辑思维', distance: 4200, distance_text: '4.2km' },
    ],
    orders: [
      { id: 1, subject: '数学', hourly_rate: 180, student_grade: '初三', student_gender: 1, address: '朝阳区望京西园', description: '需要数学指导，目标中考110分以上', status: 0, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), distance: 800, distance_text: '0.8km' },
      { id: 2, subject: '英语', hourly_rate: 150, student_grade: '高二', student_gender: 2, address: '海淀区中关村', description: '英语口语提升，准备出国留学', status: 0, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), distance: 1500, distance_text: '1.5km' },
      { id: 3, subject: '物理', hourly_rate: 200, student_grade: '高一', student_gender: 1, address: '西城区金融街', description: '物理成绩不稳定，需要系统提升', status: 0, created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), distance: 2800, distance_text: '2.8km' },
      { id: 4, subject: '化学', hourly_rate: 160, student_grade: '高三', student_gender: 1, address: '丰台区方庄', description: '高三冲刺阶段，化学需要快速提分', status: 0, created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), distance: 3500, distance_text: '3.5km' },
    ],
  },
  '上海': {
    lat: 31.2304,
    lng: 121.4737,
    teachers: [
      { id: 11, nickname: '周老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou', real_name: '周雪', gender: 2, education: '复旦大学·硕士', subjects: ['英语', '法语'], hourly_rate_min: 160, hourly_rate_max: 220, intro: '精通英语和法语，可进行双语教学，适合有留学需求的学生', distance: 1800, distance_text: '1.8km' },
      { id: 12, nickname: '吴老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wu', real_name: '吴杰', gender: 1, education: '上海交通大学·博士', subjects: ['数学', '物理'], hourly_rate_min: 180, hourly_rate_max: 280, intro: '数学博士，对高中数学有独到理解，善于培养数学思维', distance: 2200, distance_text: '2.2km' },
      { id: 13, nickname: '孙老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun', real_name: '孙伟', gender: 1, education: '同济大学·硕士', subjects: ['物理', '化学'], hourly_rate_min: 150, hourly_rate_max: 200, intro: '工科背景，物理知识扎实，善于将物理与工程实践结合', distance: 3100, distance_text: '3.1km' },
      { id: 14, nickname: '赵老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao', real_name: '赵敏', gender: 2, education: '华东师范大学·本科', subjects: ['语文', '英语'], hourly_rate_min: 120, hourly_rate_max: 160, intro: '师范专业毕业，教学方法规范，耐心细致', distance: 900, distance_text: '0.9km' },
      { id: 15, nickname: '钱老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qian', real_name: '钱浩', gender: 1, education: '上海财经大学·硕士', subjects: ['数学', '经济'], hourly_rate_min: 140, hourly_rate_max: 190, intro: '擅长数学和经济类科目，对高考有深入研究', distance: 2600, distance_text: '2.6km' },
    ],
    orders: [
      { id: 11, subject: '数学', hourly_rate: 200, student_grade: '高三', student_gender: 1, address: '浦东新区陆家嘴', description: '高考数学冲刺，目标130分以上', status: 0, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), distance: 1200, distance_text: '1.2km' },
      { id: 12, subject: '英语', hourly_rate: 180, student_grade: '初一', student_gender: 2, address: '静安区南京西路', description: '初中英语入门，希望培养兴趣', status: 0, created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), distance: 2000, distance_text: '2.0km' },
      { id: 13, subject: '物理', hourly_rate: 190, student_grade: '高二', student_gender: 1, address: '徐汇区漕河泾', description: '高中物理竞赛准备', status: 0, created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), distance: 3400, distance_text: '3.4km' },
    ],
  },
  '广州': {
    lat: 23.1291,
    lng: 113.2644,
    teachers: [
      { id: 21, nickname: '黄老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huang', real_name: '黄丽', gender: 2, education: '中山大学·硕士', subjects: ['语文', '历史'], hourly_rate_min: 130, hourly_rate_max: 180, intro: '文科综合能力强，善于构建知识体系', distance: 1600, distance_text: '1.6km' },
      { id: 22, nickname: '林老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lin', real_name: '林峰', gender: 1, education: '华南理工大学·本科', subjects: ['数学', '物理'], hourly_rate_min: 140, hourly_rate_max: 200, intro: '理工科背景，逻辑思维清晰，善于解题', distance: 2100, distance_text: '2.1km' },
      { id: 23, nickname: '何老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=he', real_name: '何静', gender: 2, education: '暨南大学·硕士', subjects: ['英语'], hourly_rate_min: 150, hourly_rate_max: 200, intro: '英语专业八级，口语流利，留学经历丰富', distance: 2800, distance_text: '2.8km' },
      { id: 24, nickname: '罗老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luo', real_name: '罗燕', gender: 2, education: '广东外语外贸大学·本科', subjects: ['英语', '日语'], hourly_rate_min: 120, hourly_rate_max: 170, intro: '英日双语教学，适合多语种学习需求', distance: 1400, distance_text: '1.4km' },
    ],
    orders: [
      { id: 21, subject: '英语', hourly_rate: 160, student_grade: '初三', student_gender: 2, address: '天河区珠江新城', description: '中考英语冲刺，目标115分以上', status: 0, created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), distance: 1000, distance_text: '1.0km' },
      { id: 22, subject: '数学', hourly_rate: 150, student_grade: '初二', student_gender: 1, address: '越秀区东山口', description: '初中数学基础巩固，提升解题能力', status: 0, created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), distance: 2300, distance_text: '2.3km' },
      { id: 23, subject: '语文', hourly_rate: 140, student_grade: '高一', student_gender: 2, address: '海珠区江南西', description: '高中语文入门，重点提升作文', status: 0, created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), distance: 3100, distance_text: '3.1km' },
    ],
  },
  '深圳': {
    lat: 22.5431,
    lng: 114.0579,
    teachers: [
      { id: 31, nickname: '郑老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zheng', real_name: '郑凯', gender: 1, education: '深圳大学·硕士', subjects: ['数学', '编程'], hourly_rate_min: 160, hourly_rate_max: 220, intro: '数学与编程双修，适合有编程兴趣的学生', distance: 1900, distance_text: '1.9km' },
      { id: 32, nickname: '马老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ma', real_name: '马欣', gender: 2, education: '香港大学·硕士', subjects: ['英语', '语文'], hourly_rate_min: 180, hourly_rate_max: 250, intro: '港大硕士，国际化视野，双语教学', distance: 2400, distance_text: '2.4km' },
      { id: 33, nickname: '徐老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xu', real_name: '徐涛', gender: 1, education: '南方科技大学·博士', subjects: ['物理', '化学'], hourly_rate_min: 200, hourly_rate_max: 300, intro: '理工科博士，对物理化学有深入研究', distance: 3200, distance_text: '3.2km' },
      { id: 34, nickname: '冯老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=feng', real_name: '冯雨', gender: 2, education: '深圳职业技术学院·本科', subjects: ['美术', '设计'], hourly_rate_min: 100, hourly_rate_max: 150, intro: '艺术设计专业，培养创意思维', distance: 1100, distance_text: '1.1km' },
    ],
    orders: [
      { id: 31, subject: '数学', hourly_rate: 180, student_grade: '高二', student_gender: 1, address: '南山区科技园', description: '高中数学竞赛准备，目标省赛获奖', status: 0, created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), distance: 800, distance_text: '0.8km' },
      { id: 32, subject: '英语', hourly_rate: 200, student_grade: '高三', student_gender: 2, address: '福田区CBD', description: '高考英语冲刺，目标135分以上', status: 0, created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), distance: 1500, distance_text: '1.5km' },
      { id: 33, subject: '编程', hourly_rate: 220, student_grade: '初一', student_gender: 1, address: '罗湖区东门', description: '编程入门，培养逻辑思维', status: 0, created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), distance: 2700, distance_text: '2.7km' },
    ],
  },
  '杭州': {
    lat: 30.2741,
    lng: 120.1551,
    teachers: [
      { id: 41, nickname: '朱老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhu', real_name: '朱琳', gender: 2, education: '浙江大学·硕士', subjects: ['语文', '政治'], hourly_rate_min: 140, hourly_rate_max: 190, intro: '文科综合高手，善于构建知识体系', distance: 1500, distance_text: '1.5km' },
      { id: 42, nickname: '许老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xu2', real_name: '许强', gender: 1, education: '浙江大学·博士', subjects: ['化学', '生物'], hourly_rate_min: 190, hourly_rate_max: 280, intro: '化学博士，对化学有深入研究', distance: 2000, distance_text: '2.0km' },
      { id: 43, nickname: '沈老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shen', real_name: '沈浩', gender: 1, education: '中国美术学院·硕士', subjects: ['美术', '书法'], hourly_rate_min: 150, hourly_rate_max: 200, intro: '美院毕业，专业美术书法指导', distance: 2600, distance_text: '2.6km' },
      { id: 44, nickname: '韦老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wei', real_name: '韦婷', gender: 2, education: '浙江工业大学·本科', subjects: ['英语'], hourly_rate_min: 110, hourly_rate_max: 160, intro: '英语专业毕业，口语流利', distance: 1200, distance_text: '1.2km' },
    ],
    orders: [
      { id: 41, subject: '数学', hourly_rate: 170, student_grade: '初三', student_gender: 2, address: '西湖区文三路', description: '中考数学冲刺，目标满分', status: 0, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), distance: 1000, distance_text: '1.0km' },
      { id: 42, subject: '美术', hourly_rate: 150, student_grade: '小学六年级', student_gender: 2, address: '滨江区', description: '美术兴趣培养，考级指导', status: 0, created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), distance: 1800, distance_text: '1.8km' },
      { id: 43, subject: '英语', hourly_rate: 160, student_grade: '高一', student_gender: 1, address: '余杭区', description: '高中英语基础巩固', status: 0, created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), distance: 3500, distance_text: '3.5km' },
    ],
  },
  '南京': {
    lat: 32.0603,
    lng: 118.7969,
    teachers: [
      { id: 51, nickname: '杨老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yang', real_name: '杨帆', gender: 1, education: '南京大学·硕士', subjects: ['物理', '数学'], hourly_rate_min: 160, hourly_rate_max: 230, intro: '工科背景，物理知识扎实', distance: 1700, distance_text: '1.7km' },
      { id: 52, nickname: '韩老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=han', real_name: '韩磊', gender: 1, education: '东南大学·硕士', subjects: ['地理'], hourly_rate_min: 130, hourly_rate_max: 180, intro: '地理专业，善于图表教学', distance: 2200, distance_text: '2.2km' },
      { id: 53, nickname: '冯老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=feng2', real_name: '冯雨', gender: 2, education: '南京师范大学·本科', subjects: ['语文', '历史'], hourly_rate_min: 120, hourly_rate_max: 160, intro: '师范专业，教学方法规范', distance: 1100, distance_text: '1.1km' },
    ],
    orders: [
      { id: 51, subject: '物理', hourly_rate: 180, student_grade: '高三', student_gender: 1, address: '鼓楼区新街口', description: '高考物理冲刺，目标90分以上', status: 0, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), distance: 900, distance_text: '0.9km' },
      { id: 52, subject: '语文', hourly_rate: 140, student_grade: '初二', student_gender: 2, address: '玄武区', description: '语文阅读写作提升', status: 0, created_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), distance: 2400, distance_text: '2.4km' },
    ],
  },
  '成都': {
    lat: 30.5728,
    lng: 104.0668,
    teachers: [
      { id: 61, nickname: '唐老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tang', real_name: '唐莉', gender: 2, education: '四川大学·硕士', subjects: ['英语', '语文'], hourly_rate_min: 140, hourly_rate_max: 200, intro: '文科双修，教学经验丰富', distance: 1300, distance_text: '1.3km' },
      { id: 62, nickname: '邓老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=deng', real_name: '邓超', gender: 1, education: '电子科技大学·博士', subjects: ['数学', '物理'], hourly_rate_min: 180, hourly_rate_max: 280, intro: '中科大毕业，理科专家', distance: 1900, distance_text: '1.9km' },
      { id: 63, nickname: '曹老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cao', real_name: '曹敏', gender: 2, education: '西南财经大学·硕士', subjects: ['英语', '日语'], hourly_rate_min: 130, hourly_rate_max: 180, intro: '英日双语教学，留学经历', distance: 2500, distance_text: '2.5km' },
    ],
    orders: [
      { id: 61, subject: '数学', hourly_rate: 160, student_grade: '高一', student_gender: 1, address: '锦江区春熙路', description: '高中数学入门，打好基础', status: 0, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), distance: 1100, distance_text: '1.1km' },
      { id: 62, subject: '英语', hourly_rate: 150, student_grade: '初三', student_gender: 2, address: '武侯区', description: '中考英语冲刺', status: 0, created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), distance: 2000, distance_text: '2.0km' },
    ],
  },
  '武汉': {
    lat: 30.5928,
    lng: 114.3055,
    teachers: [
      { id: 71, nickname: '蒋老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jiang', real_name: '蒋丽', gender: 2, education: '武汉大学·硕士', subjects: ['语文', '历史'], hourly_rate_min: 130, hourly_rate_max: 180, intro: '文科综合，善于知识体系构建', distance: 1600, distance_text: '1.6km' },
      { id: 72, nickname: '沈老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shen2', real_name: '沈浩', gender: 1, education: '华中科技大学·博士', subjects: ['物理', '化学'], hourly_rate_min: 190, hourly_rate_max: 290, intro: '理工博士，理科教学专家', distance: 2100, distance_text: '2.1km' },
      { id: 73, nickname: '韦老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wei2', real_name: '韦婷', gender: 2, education: '华中师范大学·本科', subjects: ['英语', '语文'], hourly_rate_min: 110, hourly_rate_max: 150, intro: '师范专业，教学方法规范', distance: 900, distance_text: '0.9km' },
    ],
    orders: [
      { id: 71, subject: '物理', hourly_rate: 170, student_grade: '高二', student_gender: 1, address: '洪山区光谷', description: '高中物理竞赛准备', status: 0, created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), distance: 1300, distance_text: '1.3km' },
      { id: 72, subject: '英语', hourly_rate: 140, student_grade: '初一', student_gender: 2, address: '武昌区', description: '初中英语入门', status: 0, created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), distance: 1800, distance_text: '1.8km' },
    ],
  },
};

/**
 * 首页 - 根据用户角色显示不同内容
 * 家长角色：显示教师列表
 * 教师角色：显示需求订单
 */
const IndexPage = () => {
  // 用户状态
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState(0); // 0-家长, 1-教师

  // 位置状态
  const [currentCity, setCurrentCity] = useState('定位中...');
  const [showCitySelector, setShowCitySelector] = useState(false);
  
  // 数据状态
  const [orders, setOrders] = useState<Order[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [feedAds, setFeedAds] = useState<FeedAd[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('全部');

  const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'];

  // 模拟轮播图数据
  const mockBanners: Banner[] = [
    { id: 1, image_url: 'https://placehold.co/750x300/2563EB/white?text=棉花糖教育', title: '欢迎来到棉花糖教育', link_url: '' },
    { id: 2, image_url: 'https://placehold.co/750x300/F59E0B/white?text=会员特权', title: '开通会员享更多权益', link_url: '/pages/membership/index' },
    { id: 3, image_url: 'https://placehold.co/750x300/10B981/white?text=邀请好友', title: '邀请好友赚佣金', link_url: '/pages/distribution/index' },
  ];

  // 模拟信息流广告数据
  const mockFeedAds: FeedAd[] = [
    { id: 1, title: '优秀教师推荐', content: '精选优质教师，教学质量有保障', image_url: 'https://placehold.co/750x200/10B981/white?text=优秀教师', link_url: '', ad_type: 1 },
    { id: 2, title: '新用户福利', content: '首次开通会员享5折优惠', image_url: 'https://placehold.co/750x200/EC4899/white?text=新人福利', link_url: '/pages/membership/index', ad_type: 1 },
  ];

  useLoad(() => {
    console.log('Page loaded.');
  });

  // 配置分享给好友
  useShareAppMessage(() => {
    const title = userRole === 0 
      ? '棉花糖教育 - 找好老师，上棉花糖' 
      : '棉花糖教育 - 接好需求，上棉花糖';
    return {
      title,
      path: '/pages/index/index?invite=1',
      imageUrl: 'https://placehold.co/500x400/2563EB/white?text=棉花糖教育',
    };
  });

  // 配置分享到朋友圈
  useShareTimeline(() => {
    return {
      title: '棉花糖教育成长平台 - 专业家教信息撮合',
      query: 'invite=1',
      imageUrl: 'https://placehold.co/500x400/2563EB/white?text=棉花糖教育',
    };
  });

  // 每次页面显示时重新读取角色
  useDidShow(() => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      // 未登录也显示演示数据
      console.log('未登录，使用演示数据');
    }
    
    // 重新读取角色
    const savedRole = Taro.getStorageSync('userRole');
    const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0);
    console.log('useDidShow - 读取到的角色值:', savedRole, '转换后:', role);
    
    if (role !== userRole) {
      setUserRole(role);
    }
    
    // 检查会员状态
    const memberExpire = Taro.getStorageSync('member_expire');
    if (memberExpire && new Date(memberExpire) > new Date()) {
      setIsMember(true);
    }
    
    // 读取用户选择的城市
    const savedCity = Taro.getStorageSync('selectedCity');
    if (savedCity) {
      setCurrentCity(savedCity);
    }
  });

  useEffect(() => {
    // 初始化
    initPage();
  }, []);

  useEffect(() => {
    // 角色或筛选变化后加载数据
    if (currentCity !== '定位中...') {
      loadData();
    }
  }, [currentCity, userRole, selectedSubject]);

  // 初始化页面
  const initPage = async () => {
    // 设置模拟轮播图
    setBanners(mockBanners);
    // 设置模拟信息流广告
    setFeedAds(mockFeedAds);
    
    // 读取用户选择的城市
    const savedCity = Taro.getStorageSync('selectedCity');
    if (savedCity) {
      setCurrentCity(savedCity);
    } else {
      // 默认北京
      setCurrentCity('北京');
    }
  };

  // 选择城市
  const handleSelectCity = async (city: City) => {
    setCurrentCity(city.name);
    Taro.setStorageSync('selectedCity', city.name);
    setShowCitySelector(false);
  };

  // 加载数据
  const loadData = async () => {
    // 根据城市获取数据
    const cityKey = currentCity.replace(/·.*$/, '').replace('·', '');
    const cityData = CITY_DATA[cityKey] || CITY_DATA['北京'];
    
    if (userRole === 0) {
      // 家长：加载教师列表
      const filteredTeachers = selectedSubject === '全部' 
        ? cityData.teachers 
        : cityData.teachers.filter(t => t.subjects.includes(selectedSubject));
      setTeachers(filteredTeachers);
    } else if (userRole === 1) {
      // 教师：加载订单列表
      const filteredOrders = selectedSubject === '全部'
        ? cityData.orders
        : cityData.orders.filter(o => o.subject === selectedSubject);
      setOrders(filteredOrders);
    }
    
    // 设置活动数据
    setActivities(getMockActivities());
    setLoading(false);
  };

  // 模拟活动数据
  const getMockActivities = (): Activity[] => [
    {
      id: 1,
      title: '北京四中探校活动',
      type: 'visit',
      cover_image: 'https://placehold.co/400x200/2563EB/white?text=探校活动',
      start_time: '2024-04-15 09:00',
      end_time: '2024-04-15 12:00',
      address: '北京市西城区北京四中',
      online_price: 0,
      offline_price: 99,
      max_participants: 50,
      current_participants: 32,
      target_roles: [0],
      status: 'upcoming',
      is_online: false,
    },
    {
      id: 2,
      title: '新高考政策解读讲座',
      type: 'lecture',
      cover_image: 'https://placehold.co/400x200/10B981/white?text=政策讲座',
      start_time: '2024-04-20 14:00',
      end_time: '2024-04-20 16:00',
      address: '线上直播',
      online_price: 29,
      offline_price: 0,
      max_participants: 200,
      current_participants: 156,
      target_roles: [0, 1],
      status: 'upcoming',
      is_online: true,
    },
    {
      id: 3,
      title: '教师教学技能提升研修',
      type: 'training',
      cover_image: 'https://placehold.co/400x200/EC4899/white?text=教师研修',
      start_time: '2024-04-25 09:00',
      end_time: '2024-04-26 17:00',
      address: '海淀区教师进修学校',
      online_price: 0,
      offline_price: 299,
      max_participants: 30,
      current_participants: 28,
      target_roles: [1],
      status: 'upcoming',
      is_online: false,
    },
  ];

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  // 获取性别图标
  const getGenderText = (gender: number) => {
    return gender === 1 ? '男' : '女';
  };

  // 处理轮播图点击
  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      Taro.navigateTo({ url: banner.link_url });
    }
  };

  // 查看教师详情
  const handleViewTeacher = (teacherId: number) => {
    Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${teacherId}` });
  };

  // 查看订单详情
  const handleViewOrder = (orderId: number) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  // 分享订单
  const handleShareOrder = (_order: Order) => {
    // 设置分享内容
    Taro.showShareMenu({
      withShareTicket: true,
    } as any);
    
    Taro.showModal({
      title: '分享需求',
      content: '分享到微信好友、群或朋友圈，有人通过您的分享签约，您可获得佣金奖励！',
      confirmText: '立即分享',
      success: (res) => {
        if (res.confirm) {
          // 触发分享
        }
      },
    });
  };

  // 获取活动类型标签
  const getActivityTypeTag = (type: Activity['type']) => {
    const typeMap = {
      visit: { label: '探校', color: 'bg-blue-100 text-blue-600' },
      training: { label: '研修', color: 'bg-green-100 text-green-600' },
      lecture: { label: '讲座', color: 'bg-purple-100 text-purple-600' },
      other: { label: '活动', color: 'bg-gray-100 text-gray-600' },
    };
    return typeMap[type];
  };

  // 过滤当前角色可见的活动
  const visibleActivities = activities.filter(a => a.target_roles.includes(userRole));

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部定位和角色显示 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row items-center justify-between">
          <View 
            className="flex flex-row items-center"
            onClick={() => setShowCitySelector(true)}
          >
            <MapPin size={16} color="#2563EB" className="mr-1" />
            <Text className="text-sm text-gray-700">{currentCity}</Text>
            <ChevronDown size={14} color="#9CA3AF" />
          </View>
          {/* 角色切换入口 */}
          <View 
            className="flex flex-row items-center bg-blue-500 px-3 py-1 rounded-full"
            onClick={() => Taro.navigateTo({ url: '/pages/role-switch/index' })}
          >
            {userRole === 0 ? (
              <GraduationCap size={14} color="white" />
            ) : userRole === 1 ? (
              <BookOpen size={14} color="white" />
            ) : (
              <Building2 size={14} color="white" />
            )}
            <Text className="text-xs text-white ml-1">
              {userRole === 0 ? '家长端' : userRole === 1 ? '教师端' : '机构端'}
            </Text>
            <ChevronDown size={12} color="white" className="ml-1" />
          </View>
        </View>
      </View>

      {/* 快捷入口 - 根据角色显示不同功能 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex flex-row justify-around">
          {userRole === 0 ? (
            // 家长端快捷入口
            <>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}>
                <View className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Text className="text-blue-600 text-lg">+</Text>
                </View>
                <Text className="text-xs text-gray-600 mt-1">发布需求</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/elite-class/index' })}>
                <View className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <GraduationCap size={18} color="#6366F1" />
                </View>
                <Text className="text-xs text-gray-600 mt-1">牛师班</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/favorites/index' })}>
                <View className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Text className="text-pink-600 text-lg">♥</Text>
                </View>
                <Text className="text-xs text-gray-600 mt-1">收藏教师</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}>
                <View className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Text className="text-yellow-600 text-lg">👑</Text>
                </View>
                <Text className="text-xs text-gray-600 mt-1">会员中心</Text>
              </View>
            </>
          ) : userRole === 1 ? (
            // 教师端快捷入口
            <>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/teacher-workbench/index' })}>
                <View className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <BookOpen size={18} color="#22C55E" />
                </View>
                <Text className="text-xs text-gray-600 mt-1">工作台</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/create-elite-class/index' })}>
                <View className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <GraduationCap size={18} color="#6366F1" />
                </View>
                <Text className="text-xs text-gray-600 mt-1">创建牛师班</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/share-center/index' })}>
                <View className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Share2 size={18} color="#F97316" />
                </View>
                <Text className="text-xs text-gray-600 mt-1">转发赚钱</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/earnings/index' })}>
                <View className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Text className="text-blue-600 text-lg">¥</Text>
                </View>
                <Text className="text-xs text-gray-600 mt-1">收益中心</Text>
              </View>
            </>
          ) : (
            // 机构端快捷入口
            <>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/org-dashboard/index' })}>
                <View className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Building2 size={18} color="#9333EA" />
                </View>
                <Text className="text-xs text-gray-600 mt-1">机构管理</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/publish/index?mode=org' })}>
                <View className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Text className="text-blue-600 text-lg">+</Text>
                </View>
                <Text className="text-xs text-gray-600 mt-1">代录需求</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/org-teachers/index' })}>
                <View className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Users size={18} color="#22C55E" />
                </View>
                <Text className="text-xs text-gray-600 mt-1">教师管理</Text>
              </View>
              <View className="flex flex-col items-center" onClick={() => Taro.navigateTo({ url: '/pages/distribution/index' })}>
                <View className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Gift size={18} color="#F97316" />
                </View>
                <Text className="text-xs text-gray-600 mt-1">推广招生</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* 轮播图广告位 */}
      <View className="bg-white px-4 py-3">
        <Swiper
          className="w-full h-32 rounded-xl overflow-hidden"
          indicatorDots
          autoplay
          circular
          indicatorColor="rgba(255,255,255,0.5)"
          indicatorActiveColor="#2563EB"
        >
          {banners.map((banner) => (
            <SwiperItem key={banner.id} onClick={() => handleBannerClick(banner)}>
              <Image
                src={banner.image_url}
                className="w-full h-full"
                mode="aspectFill"
              />
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      {/* 标题区域 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800">
          {userRole === 0 ? '附近教师' : userRole === 1 ? '附近需求' : '机构工作台'}
        </Text>
      </View>

      {/* 学科筛选 - 仅家长和教师端显示 */}
      {userRole !== 2 && (
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex flex-row gap-2 overflow-x-auto">
            {subjects.map((subject) => (
              <View
                key={subject}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedSubject === subject 
                    ? 'bg-blue-500' 
                    : 'bg-gray-100'
                }`}
                onClick={() => setSelectedSubject(subject)}
              >
                <Text className={selectedSubject === subject ? 'text-white' : 'text-gray-700'}>
                  {subject}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 非会员提示 */}
      {!isMember && (
        <View className="bg-yellow-50 px-4 py-2 flex flex-row items-center justify-between">
          <View className="flex flex-row items-center">
            <Lock size={14} color="#F59E0B" className="mr-2" />
            <Text className="text-xs text-yellow-700">
              开通会员可查看完整信息与联系方式
            </Text>
          </View>
          <View 
            className="px-2 py-1 bg-yellow-500 rounded"
            onClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}
          >
            <Text className="text-xs text-white">立即开通</Text>
          </View>
        </View>
      )}

      {/* 内容区域 */}
      <View className="p-4 pb-24">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : userRole === 0 ? (
          // ========== 家长端：教师列表 ==========
          teachers.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-8">
              <Text className="text-gray-500 mb-2">暂无教师</Text>
              <Text className="text-sm text-gray-400">附近暂无合适的教师</Text>
            </View>
          ) : (
            <View className="flex flex-col gap-3">
              {teachers.map((teacher) => (
                <Card key={teacher.id} className="bg-white">
                  <CardContent className="p-4">
                    <View className="flex flex-row gap-3">
                      {/* 头像 */}
                      <Image 
                        src={teacher.avatar} 
                        className="w-16 h-16 rounded-full"
                        mode="aspectFill"
                      />
                      {/* 信息 */}
                      <View className="flex-1 flex flex-col gap-1">
                        <View className="flex flex-row items-center justify-between">
                          <View className="flex flex-row items-center gap-2">
                            <Text className="text-base font-semibold">
                              {teacher.real_name || teacher.nickname}
                            </Text>
                            <Text className="text-xs text-gray-500">{getGenderText(teacher.gender)}</Text>
                          </View>
                          <Text className="text-xs text-gray-400">{teacher.distance_text}</Text>
                        </View>
                        <Text className="text-xs text-gray-500">{teacher.education}</Text>
                        <View className="flex flex-row gap-1 flex-wrap">
                          {teacher.subjects.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </View>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm text-blue-600 font-medium">
                            ¥{teacher.hourly_rate_min}-{teacher.hourly_rate_max}/小时
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="mt-2 pt-2 border-t border-gray-100">
                      <Text className="text-xs text-gray-600 line-clamp-2">{teacher.intro}</Text>
                    </View>
                    <View className="mt-3 flex flex-row gap-2">
                      <View 
                        className="flex-1 bg-blue-500 rounded-lg py-2 items-center"
                        onClick={() => handleViewTeacher(teacher.id)}
                      >
                        <Text className="text-white text-sm">查看详情</Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )
        ) : userRole === 1 ? (
          // ========== 教师端：订单列表 ==========
          orders.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-8">
              <Text className="text-gray-500 mb-2">暂无订单</Text>
              <Text className="text-sm text-gray-400 mb-4">附近暂无新的需求</Text>
              <View className="flex flex-row gap-2">
                <View 
                  className="px-4 py-2 bg-blue-500 rounded-lg"
                  onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}
                >
                  <Text className="text-white text-sm">发布需求</Text>
                </View>
                <Button open-type="share" className="px-4 py-2 bg-green-500 rounded-lg">
                  <Text className="text-white text-sm">分享获客</Text>
                </Button>
              </View>
            </View>
          ) : (
            <View className="flex flex-col gap-3">
              {orders.map((order, index) => (
                <View key={order.id}>
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <View className="flex flex-row justify-between items-start mb-2">
                        <View className="flex flex-row items-center gap-2">
                          <Text className="text-lg font-semibold">{order.subject}</Text>
                          <Badge variant="default">待抢单</Badge>
                        </View>
                        <Text className="text-xs text-gray-400">{formatTime(order.created_at)}</Text>
                      </View>
                      
                      <View className="flex flex-row items-center gap-4 mb-2">
                        <Text className="text-sm text-gray-600">年级: {order.student_grade}</Text>
                        <Text className="text-sm text-gray-600">性别: {getGenderText(order.student_gender)}</Text>
                      </View>
                      
                      <View className="flex flex-row items-center gap-2 mb-2">
                        <MapPin size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-600">{order.address}</Text>
                        <Text className="text-xs text-gray-400">{order.distance_text}</Text>
                      </View>
                      
                      <Text className="text-sm text-gray-700 mb-3">{order.description}</Text>
                      
                      <View className="flex flex-row justify-between items-center">
                        <Text className="text-lg font-bold text-blue-600">¥{order.hourly_rate}/小时</Text>
                        <View className="flex flex-row gap-2">
                          <View 
                            className="flex flex-row items-center gap-1 px-3 py-1 border border-gray-300 rounded"
                            onClick={() => handleShareOrder(order)}
                          >
                            <Share2 size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600">分享</Text>
                          </View>
                          <View 
                            className="flex flex-row items-center gap-1 px-3 py-1 bg-blue-500 rounded"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <Text className="text-sm text-white">抢单</Text>
                          </View>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                  
                  {/* 信息流广告 - 在第2个订单后显示 */}
                  {index === 1 && feedAds.map((ad) => (
                    <Card key={ad.id} className="bg-gradient-to-r from-green-50 to-blue-50">
                      <CardContent className="p-3">
                        <View className="flex flex-row items-center gap-3">
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-800">{ad.title}</Text>
                            <Text className="text-xs text-gray-600">{ad.content}</Text>
                          </View>
                          <View className="px-3 py-1 bg-blue-500 rounded">
                            <Text className="text-xs text-white">了解</Text>
                          </View>
                        </View>
                      </CardContent>
                    </Card>
                  ))}
                </View>
              ))}
            </View>
          )
        ) : (
          // ========== 机构端 ==========
          <View className="flex flex-col items-center justify-center py-8">
            <Building2 size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2 mb-4">机构工作台</Text>
            <View className="flex flex-row gap-2">
              <View 
                className="px-4 py-2 bg-blue-500 rounded-lg"
                onClick={() => Taro.navigateTo({ url: '/pages/org-teachers/index' })}
              >
                <Text className="text-white text-sm">管理教师</Text>
              </View>
              <View 
                className="px-4 py-2 bg-green-500 rounded-lg"
                onClick={() => Taro.navigateTo({ url: '/pages/publish/index?mode=org' })}
              >
                <Text className="text-white text-sm">代录需求</Text>
              </View>
            </View>
          </View>
        )}

        {/* 活动区域 */}
        {visibleActivities.length > 0 && (
          <View className="mt-4">
            <View className="flex flex-row justify-between items-center mb-2">
              <Text className="text-base font-semibold">热门活动</Text>
              <Text 
                className="text-sm text-blue-600"
                onClick={() => Taro.navigateTo({ url: '/pages/activities/index' })}
              >
                更多 →
              </Text>
            </View>
            <ScrollView scrollX className="flex flex-row gap-3">
              {visibleActivities.map((activity) => {
                const typeTag = getActivityTypeTag(activity.type);
                return (
                  <View 
                    key={activity.id}
                    className="flex-shrink-0 w-64 bg-white rounded-lg overflow-hidden shadow-sm"
                    onClick={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${activity.id}` })}
                  >
                    <Image 
                      src={activity.cover_image} 
                      className="w-full h-28"
                      mode="aspectFill"
                    />
                    <View className="p-3">
                      <View className="flex flex-row items-center gap-2 mb-1">
                        <View className={`px-2 py-1 rounded text-xs ${typeTag.color}`}>
                          {typeTag.label}
                        </View>
                        {activity.is_online && (
                          <View className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs">
                            线上
                          </View>
                        )}
                      </View>
                      <Text className="text-sm font-medium line-clamp-1">{activity.title}</Text>
                      <View className="flex flex-row items-center gap-1 mt-1">
                        <Users size={12} color="#9CA3AF" />
                        <Text className="text-xs text-gray-500">
                          {activity.current_participants}/{activity.max_participants}人
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 城市选择器 */}
      {showCitySelector && (
        <CitySelector
          visible={showCitySelector}
          currentCity={currentCity}
          onClose={() => setShowCitySelector(false)}
          onSelect={handleSelectCity}
        />
      )}
    </View>
  );
};

export default IndexPage;
