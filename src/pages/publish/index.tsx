import { View, Text, Picker } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MapPin, DollarSign, User, BookOpen, Building2, Share2, Users } from 'lucide-react-taro';
import { Network } from '@/network';
import './index.css';

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const grades = ['小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级', '初一', '初二', '初三', '高一', '高二', '高三'];
const genderOptions = ['男', '女'];

interface Child {
  id: number;
  name: string;
  gender: number;
  birth_date: string;
  grade: string;
}

/**
 * 发布需求页面 - 支持家长发布和机构代录
 */
const PublishPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isOrgMode, setIsOrgMode] = useState(false); // 是否机构代录模式
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(-1); // -1表示手动输入
  
  const [formData, setFormData] = useState({
    subject: '数学',
    student_grade: '初二',
    student_gender: '男',
    hourly_rate: '',
    address: '',
    description: '',
    // 机构代录额外字段
    parent_name: '',
    parent_phone: '',
    share_to_parent: true, // 是否分享给家长
  });
  
  const [subjectIndex, setSubjectIndex] = useState(1);
  const [gradeIndex, setGradeIndex] = useState(7);
  const [genderIndex, setGenderIndex] = useState(0);

  useDidShow(() => {
    loadChildren();
  });

  useEffect(() => {
    // 检查是否是机构代录模式
    if (router.params.mode === 'org') {
      setIsOrgMode(true);
    }
  }, [router.params]);

  const loadChildren = async () => {
    try {
      const res = await Network.request({ url: '/api/user/children' });
      if (Array.isArray(res)) {
        setChildren(res);
      }
    } catch (error) {
      console.log('获取孩子列表失败:', error);
    }
  };

  const handleSelectChild = (index: number) => {
    setSelectedChildIndex(index);
    if (index >= 0 && children[index]) {
      const child = children[index];
      // 自动填充性别和年级
      const newGenderIndex = child.gender === 2 ? 1 : 0; // 2=女，1=男
      setGenderIndex(newGenderIndex);
      
      // 自动填充年级
      const gradeIdx = grades.indexOf(child.grade);
      if (gradeIdx >= 0) {
        setGradeIndex(gradeIdx);
        setFormData(prev => ({
          ...prev,
          student_grade: child.grade,
          student_gender: newGenderIndex === 0 ? '男' : '女',
        }));
      }
    }
  };

  const handleSubmit = async () => {
    // 验证
    if (!formData.hourly_rate) {
      Taro.showToast({ title: '请输入课时费', icon: 'none' });
      return;
    }
    if (!formData.address) {
      Taro.showToast({ title: '请输入上课地址', icon: 'none' });
      return;
    }
    
    // 机构代录模式额外验证
    if (isOrgMode) {
      if (!formData.parent_name) {
        Taro.showToast({ title: '请输入家长姓名', icon: 'none' });
        return;
      }
      if (!formData.parent_phone) {
        Taro.showToast({ title: '请输入家长电话', icon: 'none' });
        return;
      }
    }

    setLoading(true);
    try {
      // 获取位置
      let latitude = 39.995;
      let longitude = 116.473;
      
      try {
        const location = await Taro.getLocation({ type: 'gcj02' });
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (e) {
        console.log('获取位置失败，使用默认位置');
      }

      // 调用后端API创建订单
      const result = await Network.request({
        url: '/api/order/create',
        method: 'POST',
        data: {
          subject: formData.subject,
          student_grade: formData.student_grade,
          student_gender: genderIndex === 0 ? 1 : 2, // 1=男，2=女
          hourly_rate: parseFloat(formData.hourly_rate) || 0,
          address: formData.address,
          latitude: latitude,
          longitude: longitude,
          description: formData.description,
          // 机构代录额外数据
          is_org_proxy: isOrgMode,
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          share_to_parent: formData.share_to_parent,
        },
      });

      console.log('订单创建结果:', result);

      // 显示成功提示
      Taro.showModal({
        title: isOrgMode ? '代录成功' : '发布成功',
        content: isOrgMode 
          ? '需求已代录成功，对话将由机构承接。' + (formData.share_to_parent ? '已发送分享链接给家长。' : '')
          : '需求已发布，等待牛师抢单',
        showCancel: false,
        success: () => {
          Taro.navigateBack();
        },
      });
    } catch (error) {
      console.error('发布失败:', error);
      Taro.showToast({ title: '发布失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <View className="bg-blue-500 px-4 py-6">
        <View className="flex flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-bold">
              {isOrgMode ? '代录需求' : '发布家教需求'}
            </Text>
            <Text className="text-blue-100 text-sm mt-1">
              {isOrgMode ? '为家长代录需求，对话由机构承接' : '填写详细信息，让优质老师找到您'}
            </Text>
          </View>
          {isOrgMode && (
            <View className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs">机构模式</Text>
            </View>
          )}
        </View>
      </View>

      <View className="p-4">
        {/* 机构代录 - 家长信息 */}
        {isOrgMode && (
          <Card className="mb-4 border-2 border-blue-200">
            <CardHeader className="pb-2">
              <View className="flex flex-row items-center">
                <Building2 size={18} color="#2563EB" className="mr-2" />
                <CardTitle>家长信息</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex flex-col gap-3">
                <View className="flex flex-row items-center">
                  <Text className="text-gray-600 w-20">家长姓名</Text>
                  <View className="flex-1 bg-gray-50 rounded-lg px-3">
                    <Input
                      placeholder="请输入家长姓名"
                      value={formData.parent_name}
                      onInput={(e) => setFormData({ ...formData, parent_name: e.detail.value })}
                      className="bg-transparent py-2"
                    />
                  </View>
                </View>
                <View className="flex flex-row items-center">
                  <Text className="text-gray-600 w-20">联系电话</Text>
                  <View className="flex-1 bg-gray-50 rounded-lg px-3">
                    <Input
                      type="number"
                      placeholder="请输入家长电话"
                      value={formData.parent_phone}
                      onInput={(e) => setFormData({ ...formData, parent_phone: e.detail.value })}
                      className="bg-transparent py-2"
                    />
                  </View>
                </View>
                <View className="flex flex-row items-center justify-between py-2">
                  <View className="flex flex-row items-center">
                    <Share2 size={16} color="#2563EB" className="mr-2" />
                    <Text className="text-gray-600">分享链接给家长</Text>
                  </View>
                  <Switch
                    checked={formData.share_to_parent}
                    onCheckedChange={(checked) => setFormData({ ...formData, share_to_parent: checked })}
                  />
                </View>
                <Text className="text-xs text-gray-400">
                  开启后，家长可通过链接查看需求进度并与机构沟通
                </Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* 学科选择 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <BookOpen size={18} color="#2563EB" className="mr-2" />
              <CardTitle>指导科目</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Picker
              mode="selector"
              range={subjects}
              value={subjectIndex}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setSubjectIndex(index);
                setFormData({ ...formData, subject: subjects[index] });
              }}
            >
              <View className="bg-gray-50 rounded-lg px-4 py-3 flex flex-row justify-between items-center">
                <Text>{formData.subject}</Text>
                <Text className="text-gray-400">▼</Text>
              </View>
            </Picker>
          </CardContent>
        </Card>

        {/* 选择孩子（仅家长模式且有孩子时显示） */}
        {!isOrgMode && children.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <View className="flex flex-row items-center">
                <Users size={18} color="#2563EB" className="mr-2" />
                <CardTitle>选择孩子</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex flex-col gap-3">
                <View className="flex flex-row flex-wrap gap-2">
                  <View
                    className={`px-3 py-2 rounded-lg border ${
                      selectedChildIndex === -1
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleSelectChild(-1)}
                  >
                    <Text className={selectedChildIndex === -1 ? 'text-blue-600' : 'text-gray-600'}>
                      手动输入
                    </Text>
                  </View>
                  {children.map((child, index) => (
                    <View
                      key={child.id}
                      className={`px-3 py-2 rounded-lg border ${
                        selectedChildIndex === index
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => handleSelectChild(index)}
                    >
                      <Text className={selectedChildIndex === index ? 'text-blue-600' : 'text-gray-600'}>
                        {child.name} ({child.grade})
                      </Text>
                    </View>
                  ))}
                </View>
                {selectedChildIndex >= 0 && (
                  <Text className="text-xs text-gray-400">
                    已自动填充该孩子的年级和性别
                  </Text>
                )}
              </View>
            </CardContent>
          </Card>
        )}

        {/* 学生信息 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <User size={18} color="#2563EB" className="mr-2" />
              <CardTitle>学生信息</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-gray-600">年级</Text>
                <Picker
                  mode="selector"
                  range={grades}
                  value={gradeIndex}
                  onChange={(e) => {
                    const index = Number(e.detail.value);
                    setGradeIndex(index);
                    setFormData({ ...formData, student_grade: grades[index] });
                  }}
                >
                  <View className="bg-gray-50 rounded-lg px-3 py-2 flex flex-row items-center">
                    <Text>{formData.student_grade}</Text>
                    <Text className="text-gray-400 ml-2">▼</Text>
                  </View>
                </Picker>
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-gray-600">性别</Text>
                <Picker
                  mode="selector"
                  range={genderOptions}
                  value={genderIndex}
                  onChange={(e) => {
                    const index = Number(e.detail.value);
                    setGenderIndex(index);
                    setFormData({ ...formData, student_gender: genderOptions[index] });
                  }}
                >
                  <View className="bg-gray-50 rounded-lg px-3 py-2 flex flex-row items-center">
                    <Text>{formData.student_gender}</Text>
                    <Text className="text-gray-400 ml-2">▼</Text>
                  </View>
                </Picker>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 课时费 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <DollarSign size={18} color="#2563EB" className="mr-2" />
              <CardTitle>期望课时费</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row items-center bg-gray-50 rounded-lg px-4">
              <Text className="text-orange-500 text-lg font-bold mr-1">¥</Text>
              <Input
                type="number"
                placeholder="请输入每小时课时费"
                value={formData.hourly_rate}
                onInput={(e) => setFormData({ ...formData, hourly_rate: e.detail.value })}
                className="flex-1 bg-transparent py-3"
              />
              <Text className="text-gray-500">/小时</Text>
            </View>
          </CardContent>
        </Card>

        {/* 上课地址 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <MapPin size={18} color="#2563EB" className="mr-2" />
              <CardTitle>上课地址</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="bg-gray-50 rounded-lg px-4">
              <Input
                placeholder="请输入详细地址，如：北京市朝阳区望京SOHO"
                value={formData.address}
                onInput={(e) => setFormData({ ...formData, address: e.detail.value })}
                className="bg-transparent py-3"
              />
            </View>
          </CardContent>
        </Card>

        {/* 补充说明 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>补充说明</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="bg-gray-50 rounded-lg p-3">
              <Textarea
                placeholder="请描述孩子的学习情况、期望的老师类型、上课时间等..."
                value={formData.description}
                onInput={(e) => setFormData({ ...formData, description: e.detail.value })}
                maxlength={500}
                className="w-full bg-transparent"
                style={{ minHeight: '100px' }}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2">{formData.description.length}/500</Text>
          </CardContent>
        </Card>
      </View>

      {/* 底部提交按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          className="w-full bg-blue-500"
          size="lg"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold">
            {loading 
              ? '发布中...' 
              : isOrgMode 
                ? '确认代录' 
                : '发布需求'}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default PublishPage;
