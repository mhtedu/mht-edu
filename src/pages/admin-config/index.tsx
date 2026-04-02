import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from '@/network';

interface ConfigItem {
  id: number;
  config_key: string;
  config_value: string;
  config_type: string;
  config_group: string;
  label: string;
  description: string;
  sort_order: number;
}

interface ConfigGroup {
  [key: string]: ConfigItem[];
}

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<ConfigGroup>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/config',
        method: 'GET',
      });
      
      // 按分组整理配置
      const grouped: ConfigGroup = {};
      const configList = res.data || [];
      
      configList.forEach((item: ConfigItem) => {
        if (!grouped[item.config_group]) {
          grouped[item.config_group] = [];
        }
        grouped[item.config_group].push(item);
      });
      
      setConfigs(grouped);
    } catch (error) {
      console.error('加载配置失败', error);
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (group: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [group]: prev[group].map(item => 
        item.config_key === key ? { ...item, config_value: value } : item
      ),
    }));
  };

  const handleSave = async (group: string) => {
    setSaving(true);
    try {
      const configList = configs[group] || [];
      const updates = configList.map(item => ({
        key: item.config_key,
        value: item.config_value,
      }));

      await Network.request({
        url: '/api/admin/config/batch-update',
        method: 'POST',
        data: { configs: updates },
      });

      Taro.showToast({ title: '保存成功', icon: 'success' });
    } catch (error) {
      console.error('保存配置失败', error);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderConfigItem = (item: ConfigItem, group: string) => {
    return (
      <View key={item.config_key} className="mb-4">
        <Text className="block text-sm font-medium text-gray-700 mb-1">
          {item.label}
        </Text>
        {item.description && (
          <Text className="block text-xs text-gray-500 mb-2">
            {item.description}
          </Text>
        )}
        <Input
          value={item.config_value || ''}
          onInput={(e) => handleValueChange(group, item.config_key, e.detail.value)}
          placeholder={`请输入${item.label}`}
          className="w-full"
        />
      </View>
    );
  };

  const tabs = [
    { key: 'basic', label: '基础配置' },
    { key: 'wechat', label: '微信小程序' },
    { key: 'payment', label: '微信支付' },
    { key: 'sms', label: '短信配置' },
    { key: 'map', label: '地图配置' },
    { key: 'member', label: '会员配置' },
    { key: 'commission', label: '分佣配置' },
    { key: 'order', label: '订单配置' },
  ];

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 标题栏 */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <Text className="text-lg font-bold">系统配置</Text>
      </View>

      {/* 标签页 */}
      <View className="bg-white flex border-b border-gray-200">
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`flex-1 py-3 text-center ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className="text-sm">{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 配置内容 */}
      <ScrollView scrollY className="p-4" style={{ height: 'calc(100vh - 120px)' }}>
        <Card>
          <CardHeader>
            <CardTitle>
              {(() => { const tab = tabs.find(t => t.key === activeTab); return tab ? tab.label : ''; })()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(configs[activeTab] || []).map(item => renderConfigItem(item, activeTab))}
            
            <Button
              className="w-full mt-4"
              disabled={saving}
              onClick={() => handleSave(activeTab)}
            >
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}
