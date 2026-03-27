import { View, Text, Image } from '@tarojs/components';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, MessageCircle, FileText, User } from 'lucide-react-taro';
import './index.css';

interface Message {
  id: number;
  type: 'system' | 'chat' | 'order' | 'teacher';
  title: string;
  content: string;
  time: string;
  unread: boolean;
  avatar?: string;
}

/**
 * 消息中心页面
 */
const MessagePage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'chat'>('all');

  // 模拟消息数据
  const messages: Message[] = [
    {
      id: 1,
      type: 'system',
      title: '系统通知',
      content: '您的会员即将到期，续费可享8折优惠',
      time: '刚刚',
      unread: true,
    },
    {
      id: 2,
      type: 'order',
      title: '订单通知',
      content: '您发布的【数学辅导】需求已被张老师接单',
      time: '10分钟前',
      unread: true,
    },
    {
      id: 3,
      type: 'chat',
      title: '张老师',
      content: '您好，我看过孩子的学习情况了...',
      time: '1小时前',
      unread: false,
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      id: 4,
      type: 'teacher',
      title: '新教师推荐',
      content: '发现一位数学优秀教师，距离您仅500米',
      time: '2小时前',
      unread: false,
    },
    {
      id: 5,
      type: 'chat',
      title: '李老师',
      content: '好的，那我们约周三下午见面',
      time: '昨天',
      unread: false,
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
  ];

  const filteredMessages = activeTab === 'all' 
    ? messages 
    : messages.filter(m => m.type === activeTab || (activeTab === 'chat' && m.type === 'chat'));

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return Bell;
      case 'chat': return MessageCircle;
      case 'order': return FileText;
      case 'teacher': return User;
      default: return Bell;
    }
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* Tab 切换 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row gap-4">
          {[
            { key: 'all', label: '全部' },
            { key: 'system', label: '系统通知' },
            { key: 'chat', label: '聊天' },
          ].map((tab) => (
            <View
              key={tab.key}
              className={`pb-2 ${activeTab === tab.key ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <Text className={activeTab === tab.key ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
                {tab.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 消息列表 */}
      <View className="p-4">
        {filteredMessages.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <MessageCircle size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无消息</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {filteredMessages.map((msg) => {
              const Icon = getIcon(msg.type);
              return (
                <Card key={msg.id} className="bg-white">
                  <CardContent className="p-4">
                    <View className="flex flex-row">
                      {/* 头像/图标 */}
                      {msg.avatar ? (
                        <Image src={msg.avatar} className="w-12 h-12 rounded-full" />
                      ) : (
                        <View className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                          <Icon size={24} color="#2563EB" />
                        </View>
                      )}
                      
                      {/* 内容 */}
                      <View className="flex-1 ml-3">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="font-semibold">{msg.title}</Text>
                          <Text className="text-xs text-gray-400">{msg.time}</Text>
                        </View>
                        <Text className="text-sm text-gray-500 mt-1 line-clamp-2">{msg.content}</Text>
                      </View>

                      {/* 未读标记 */}
                      {msg.unread && (
                        <View className="w-2 h-2 rounded-full bg-red-500 ml-2 mt-2" />
                      )}
                    </View>
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

export default MessagePage;
