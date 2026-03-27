import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, FileText, User, Calendar } from 'lucide-react-taro';
import './index.css';

interface ChatMessage {
  id: number;
  type: 'chat';
  title: string;
  content: string;
  time: string;
  unread: boolean;
  avatar?: string;
  targetId: number;
  targetType: 'teacher' | 'parent';
  lastAction?: 'contact_request' | 'trial_request';
}

interface SystemMessage {
  id: number;
  type: 'system' | 'order' | 'teacher';
  title: string;
  content: string;
  time: string;
  unread: boolean;
}

type Message = ChatMessage | SystemMessage;

/**
 * 消息中心页面
 */
const MessagePage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'chat' | 'system'>('all');
  const [userRole, setUserRole] = useState(0); // 0-家长, 1-教师, 2-机构

  useDidShow(() => {
    const savedRole = Taro.getStorageSync('userRole');
    const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0);
    setUserRole(role);
  });

  // 根据角色生成模拟消息数据
  const getMessages = (): Message[] => {
    if (userRole === 1) {
      // 教师端 - 显示与家长的对话
      return [
        {
          id: 1,
          type: 'chat',
          title: '王家长',
          content: '您好，我想了解一下孩子的辅导进度',
          time: '刚刚',
          unread: true,
          avatar: 'https://placehold.co/100/2563EB/white?text=王',
          targetId: 101,
          targetType: 'parent',
        },
        {
          id: 2,
          type: 'chat',
          title: '李家长',
          content: '周三下午的试课时间可以吗？',
          time: '10分钟前',
          unread: true,
          avatar: 'https://placehold.co/100/EC4899/white?text=李',
          targetId: 102,
          targetType: 'parent',
          lastAction: 'trial_request',
        },
        {
          id: 3,
          type: 'system',
          title: '系统通知',
          content: '您有新的订单待处理',
          time: '1小时前',
          unread: false,
        },
        {
          id: 4,
          type: 'chat',
          title: '张家长',
          content: '好的，那我们约周五下午',
          time: '昨天',
          unread: false,
          avatar: 'https://placehold.co/100/10B981/white?text=张',
          targetId: 103,
          targetType: 'parent',
        },
        {
          id: 5,
          type: 'order',
          title: '订单通知',
          content: '您接单的【数学辅导】订单已完成试课',
          time: '2天前',
          unread: false,
        },
      ];
    } else {
      // 家长端 - 显示与教师的对话
      return [
        {
          id: 1,
          type: 'chat',
          title: '张老师',
          content: '您好，我看过孩子的学习情况了...',
          time: '刚刚',
          unread: true,
          avatar: 'https://placehold.co/100/2563EB/white?text=张',
          targetId: 201,
          targetType: 'teacher',
        },
        {
          id: 2,
          type: 'chat',
          title: '李老师',
          content: '同意交换联系方式，您可以查看我的微信了',
          time: '30分钟前',
          unread: true,
          avatar: 'https://placehold.co/100/EC4899/white?text=李',
          targetId: 202,
          targetType: 'teacher',
          lastAction: 'contact_request',
        },
        {
          id: 3,
          type: 'system',
          title: '系统通知',
          content: '您的会员即将到期，续费可享8折优惠',
          time: '1小时前',
          unread: false,
        },
        {
          id: 4,
          type: 'chat',
          title: '王老师',
          content: '试课时间我建议改到周六上午',
          time: '昨天',
          unread: false,
          avatar: 'https://placehold.co/100/10B981/white?text=王',
          targetId: 203,
          targetType: 'teacher',
          lastAction: 'trial_request',
        },
        {
          id: 5,
          type: 'order',
          title: '订单通知',
          content: '您发布的【英语辅导】需求已被李老师接单',
          time: '2天前',
          unread: false,
        },
        {
          id: 6,
          type: 'teacher',
          title: '新教师推荐',
          content: '发现一位数学优秀教师，距离您仅500米',
          time: '3天前',
          unread: false,
        },
      ];
    }
  };

  const messages = getMessages();

  const filteredMessages = activeTab === 'all' 
    ? messages 
    : messages.filter(m => {
        if (activeTab === 'chat') return m.type === 'chat';
        if (activeTab === 'system') return m.type !== 'chat';
        return true;
      });

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return Bell;
      case 'chat': return MessageCircle;
      case 'order': return FileText;
      case 'teacher': return User;
      default: return Bell;
    }
  };

  const handleChatClick = (msg: ChatMessage) => {
    Taro.navigateTo({ 
      url: `/pages/chat/index?id=${msg.targetId}&type=${msg.targetType}`
    });
  };

  const getActionTag = (lastAction?: string) => {
    if (lastAction === 'contact_request') {
      return <Badge className="bg-green-100 text-green-600 text-xs ml-2">交换联系方式</Badge>;
    }
    if (lastAction === 'trial_request') {
      return <Badge className="bg-blue-100 text-blue-600 text-xs ml-2"><Calendar size={10} color="#2563EB" className="mr-1" />试课邀请</Badge>;
    }
    return null;
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* Tab 切换 - 聊天放前面 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row gap-4">
          {[
            { key: 'all', label: '全部' },
            { key: 'chat', label: '聊天' },
            { key: 'system', label: '系统通知' },
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

      {/* 角色提示 */}
      <View className="bg-blue-50 px-4 py-2 flex items-center">
        <Text className="text-xs text-blue-600">
          {userRole === 1 ? '当前为教师端，可与家长沟通' : '当前为家长端，可与教师沟通'}
        </Text>
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
              const isChat = msg.type === 'chat';
              
              return (
                <Card 
                  key={msg.id} 
                  className="bg-white"
                  onClick={() => isChat ? handleChatClick(msg as ChatMessage) : undefined}
                >
                  <CardContent className="p-4">
                    <View className="flex flex-row">
                      {/* 头像/图标 */}
                      {isChat && (msg as ChatMessage).avatar ? (
                        <Image src={(msg as ChatMessage).avatar!} className="w-12 h-12 rounded-full" />
                      ) : (
                        <View className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                          <Icon size={24} color="#2563EB" />
                        </View>
                      )}
                      
                      {/* 内容 */}
                      <View className="flex-1 ml-3">
                        <View className="flex flex-row items-center justify-between">
                          <View className="flex items-center">
                            <Text className="font-semibold">{msg.title}</Text>
                            {isChat && getActionTag((msg as ChatMessage).lastAction)}
                          </View>
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
