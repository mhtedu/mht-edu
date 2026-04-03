import { View, Text, Image } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/stores/user';
import { Network } from '@/network';
import { Users, Crown } from 'lucide-react-taro';
import './index.css';

interface TeamMember {
  id: number;
  nickname: string;
  avatar: string;
  created_at: string;
}

interface TeamList {
  list: TeamMember[];
  total: number;
  page: number;
  level: number;
}

/**
 * 我的团队页面
 */
const TeamPage = () => {
  const getUserId = useUserStore(state => state.getUserId);
  const [level, setLevel] = useState(1);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [level1Count, setLevel1Count] = useState(0);
  const [level2Count, setLevel2Count] = useState(0);

  useDidShow(() => {
    loadTeam(1);
    loadTeam(2);
  });

  const loadTeam = async (lvl: number) => {
    const uid = getUserId();
    if (!uid) return;

    try {
      const res = await Network.request({
        url: `/api/distribution/invite-list/${uid}`,
        method: 'GET',
        data: { level: lvl, page: 1, pageSize: 100 },
      });

      const data = res.data as TeamList;
      if (data) {
        if (lvl === 1) {
          setLevel1Count(data.total);
          if (level === 1) setMembers(data.list);
        } else {
          setLevel2Count(data.total);
          if (level === 2) setMembers(data.list);
        }
      }
    } catch (error) {
      console.error('加载团队数据失败:', error);
    }
  };

  const handleTabChange = (value: string) => {
    const newLevel = parseInt(value);
    setLevel(newLevel);
    loadTeam(newLevel);
  };

  const currentCount = level === 1 ? level1Count : level2Count;

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部统计 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-6 pb-8">
        <View className="flex flex-row items-center justify-center mb-4">
          <Users size={28} color="white" />
          <Text className="text-white text-xl font-bold ml-2">我的团队</Text>
        </View>

        <View className="flex flex-row justify-around">
          <View
            className={`flex-1 p-4 rounded-lg mx-1 ${level === 1 ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-10'}`}
            onClick={() => handleTabChange('1')}
          >
            <View className="flex flex-row items-center justify-center">
              <Crown size={16} color="#FCD34D" className="mr-1" />
              <Text className="text-white text-sm">一级成员</Text>
            </View>
            <Text className="text-white text-2xl font-bold text-center mt-2">{level1Count}</Text>
          </View>
          <View
            className={`flex-1 p-4 rounded-lg mx-1 ${level === 2 ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-10'}`}
            onClick={() => handleTabChange('2')}
          >
            <View className="flex flex-row items-center justify-center">
              <Users size={16} color="#93C5FD" className="mr-1" />
              <Text className="text-white text-sm">二级成员</Text>
            </View>
            <Text className="text-white text-2xl font-bold text-center mt-2">{level2Count}</Text>
          </View>
        </View>
      </View>

      {/* 成员列表 */}
      <View className="px-4 -mt-4">
        <Card>
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle>{level === 1 ? '一级成员' : '二级成员'}</CardTitle>
              <Text className="text-gray-400 text-sm">共 {currentCount} 人</Text>
            </View>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <View className="flex flex-col items-center justify-center py-10">
                <Users size={48} color="#D1D5DB" />
                <Text className="text-gray-400 mt-4">暂无{level === 1 ? '一级' : '二级'}成员</Text>
                <Text className="text-gray-400 text-sm mt-1">分享邀请码邀请好友</Text>
              </View>
            ) : (
              <View className="flex flex-col gap-3">
                {members.map((member) => (
                  <View key={member.id} className="flex flex-row items-center py-2 border-b border-gray-100 last:border-0">
                    <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                      {member.avatar ? (
                        <Image src={member.avatar} className="w-full h-full" mode="aspectFill" />
                      ) : (
                        <View className="w-full h-full flex items-center justify-center">
                          <Text className="text-gray-500 text-sm">{(member.nickname || '用')[0]}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium">{member.nickname || '用户'}</Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        加入时间: {new Date(member.created_at).toLocaleDateString('zh-CN')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* 推广说明 */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <Text className="text-gray-700 font-medium">如何扩大团队？</Text>
            <View className="mt-3 space-y-2">
              <Text className="text-gray-500 text-sm block">1. 分享邀请码到微信群、朋友圈</Text>
              <Text className="text-gray-500 text-sm block">2. 一级成员邀请的好友成为你的二级成员</Text>
              <Text className="text-gray-500 text-sm block">3. 成员消费，你持续获得佣金</Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );
};

export default TeamPage;
