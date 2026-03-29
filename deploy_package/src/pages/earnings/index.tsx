import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Wallet, TrendingUp, Clock, 
  DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react-taro'

interface EarningRecord {
  id: number
  type: 'lesson' | 'bonus' | 'withdraw'
  amount: number
  status: 'pending' | 'settled' | 'withdrawn'
  student_name: string
  subject: string
  hours: number
  created_at: string
}

interface EarningStats {
  total_earnings: number
  month_earnings: number
  pending_amount: number
  withdrawn_amount: number
  today_earnings: number
  week_earnings: number
}

/**
 * 收益中心页面（教师端）
 */
export default function EarningsPage() {
  const [stats, setStats] = useState<EarningStats>({
    total_earnings: 0,
    month_earnings: 0,
    pending_amount: 0,
    withdrawn_amount: 0,
    today_earnings: 0,
    week_earnings: 0
  })
  const [records, setRecords] = useState<EarningRecord[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'settled'>('all')
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  useDidShow(() => {
    loadEarnings()
  })

  const loadEarnings = () => {
    // 模拟数据
    setStats({
      total_earnings: 45680,
      month_earnings: 8920,
      pending_amount: 3200,
      withdrawn_amount: 42480,
      today_earnings: 480,
      week_earnings: 2560
    })

    setRecords([
      {
        id: 1,
        type: 'lesson',
        amount: 480,
        status: 'settled',
        student_name: '王小明',
        subject: '高中数学',
        hours: 2,
        created_at: '2024-03-21 16:00'
      },
      {
        id: 2,
        type: 'lesson',
        amount: 300,
        status: 'pending',
        student_name: '李小红',
        subject: '初中英语',
        hours: 2,
        created_at: '2024-03-20 10:00'
      },
      {
        id: 3,
        type: 'bonus',
        amount: 200,
        status: 'settled',
        student_name: '系统奖励',
        subject: '邀请奖励',
        hours: 0,
        created_at: '2024-03-19 15:30'
      },
      {
        id: 4,
        type: 'lesson',
        amount: 500,
        status: 'settled',
        student_name: '张小华',
        subject: '高中物理',
        hours: 2,
        created_at: '2024-03-18 14:00'
      },
      {
        id: 5,
        type: 'withdraw',
        amount: -5000,
        status: 'withdrawn',
        student_name: '提现',
        subject: '银行卡提现',
        hours: 0,
        created_at: '2024-03-15 09:00'
      }
    ])
  }

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount < 100) {
      Taro.showToast({ title: '最低提现100元', icon: 'error' })
      return
    }
    if (amount > stats.pending_amount) {
      Taro.showToast({ title: '余额不足', icon: 'error' })
      return
    }
    
    Taro.showModal({
      title: '确认提现',
      content: `将提现 ¥${amount} 到您的银行卡`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '提现申请已提交', icon: 'success' })
          setShowWithdrawDialog(false)
          setWithdrawAmount('')
        }
      }
    })
  }

  const getStatusBadge = (status: EarningRecord['status']) => {
    const config = {
      pending: { label: '待结算', className: 'bg-yellow-100 text-yellow-700' },
      settled: { label: '已结算', className: 'bg-green-100 text-green-700' },
      withdrawn: { label: '已提现', className: 'bg-gray-100 text-gray-600' }
    }
    return config[status]
  }

  const filteredRecords = records.filter(r => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return r.status === 'pending'
    if (activeTab === 'settled') return r.status === 'settled'
    return true
  })

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 收益概览 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-6 pb-8">
        <View className="flex items-center justify-between mb-4">
          <Text className="text-white text-opacity-80">可提现余额（元）</Text>
          <Wallet size={20} color="white" />
        </View>
        <Text className="text-white text-4xl font-bold">{stats.pending_amount.toFixed(2)}</Text>
        <View className="flex items-center mt-2">
          <TrendingUp size={14} color="rgba(255,255,255,0.8)" />
          <Text className="text-white text-opacity-80 text-sm ml-1">
            本月收入 ¥{stats.month_earnings}
          </Text>
        </View>
        <Button 
          className="mt-4 bg-white"
          onClick={() => setShowWithdrawDialog(true)}
        >
          <Text className="text-blue-600 font-semibold">立即提现</Text>
        </Button>
      </View>

      {/* 统计卡片 */}
      <View className="px-4 -mt-4">
        <View className="grid grid-cols-3 gap-2">
          <Card className="bg-white">
            <CardContent className="p-3 text-center">
              <Text className="text-gray-500 text-xs">今日收入</Text>
              <Text className="text-lg font-bold text-green-600">¥{stats.today_earnings}</Text>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-3 text-center">
              <Text className="text-gray-500 text-xs">本周收入</Text>
              <Text className="text-lg font-bold text-green-600">¥{stats.week_earnings}</Text>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-3 text-center">
              <Text className="text-gray-500 text-xs">累计收入</Text>
              <Text className="text-lg font-bold">¥{stats.total_earnings}</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Tab 切换 */}
      <View className="flex bg-white mt-4 border-b border-gray-200">
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待结算' },
          { key: 'settled', label: '已结算' },
        ].map((tab) => (
          <View
            key={tab.key}
            className={`flex-1 py-3 text-center ${activeTab === tab.key ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <Text className={activeTab === tab.key ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      {/* 收益记录 */}
      <ScrollView scrollY className="p-4" style={{ height: 'calc(100vh - 380px)' }}>
        {filteredRecords.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <DollarSign size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无收益记录</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {filteredRecords.map((record) => {
              const statusConfig = getStatusBadge(record.status)
              const isIncome = record.amount > 0
              return (
                <Card key={record.id} className="bg-white">
                  <CardContent className="p-4">
                    <View className="flex items-center justify-between">
                      <View className="flex items-center">
                        <View className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100' : 'bg-orange-100'}`}>
                          {isIncome ? (
                            <ArrowUpRight size={20} color="#10B981" />
                          ) : (
                            <ArrowDownRight size={20} color="#F97316" />
                          )}
                        </View>
                        <View className="ml-3">
                          <View className="flex items-center">
                            <Text className="font-semibold">{record.student_name}</Text>
                            <Badge className={`ml-2 ${statusConfig.className}`}>
                              <Text className="text-xs">{statusConfig.label}</Text>
                            </Badge>
                          </View>
                          <View className="flex items-center mt-1">
                            {record.type === 'lesson' ? (
                              <>
                                <Clock size={12} color="#6B7280" />
                                <Text className="text-xs text-gray-500 ml-1">
                                  {record.subject} · {record.hours}小时
                                </Text>
                              </>
                            ) : (
                              <Text className="text-xs text-gray-500">{record.subject}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View className="text-right">
                        <Text className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-orange-500'}`}>
                          {isIncome ? '+' : ''}{record.amount}
                        </Text>
                        <Text className="text-xs text-gray-400">{record.created_at}</Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 提现弹窗 */}
      {showWithdrawDialog && (
        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <DialogContent className="w-80">
            <DialogHeader>
              <DialogTitle>申请提现</DialogTitle>
            </DialogHeader>
            <View className="mt-4 space-y-4">
              <View>
                <Text className="text-gray-500 text-sm mb-2">可提现金额：¥{stats.pending_amount}</Text>
                <View className="flex items-center border border-gray-200 rounded-lg px-3 py-2">
                  <Text className="text-lg mr-1">¥</Text>
                  <View className="flex-1">
                    <View 
                      className="text-xl"
                      style={{ minHeight: '28px' }}
                    >
                      <Text>{withdrawAmount || '请输入提现金额'}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View className="bg-gray-50 p-3 rounded-lg">
                <Text className="text-xs text-gray-500">提现说明：</Text>
                <Text className="text-xs text-gray-500 block">1. 最低提现金额100元</Text>
                <Text className="text-xs text-gray-500 block">2. 提现到绑定银行卡，1-3个工作日到账</Text>
                <Text className="text-xs text-gray-500 block">3. 每月最多提现5次</Text>
              </View>

              <View className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowWithdrawDialog(false)}
                >
                  <Text>取消</Text>
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleWithdraw}
                >
                  <Text className="text-white">确认提现</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  )
}
