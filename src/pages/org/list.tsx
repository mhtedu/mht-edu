import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, useReachBottom, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { Star, MapPin, Users, ChevronRight } from 'lucide-react-taro'
import './list.css'

interface OrgItem {
  id: number
  name: string
  logo: string
  description: string
  teacher_count: number
  rating: number
  review_count: number
  address: string
  distance_text?: string
}

const OrgListPage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState<OrgItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [keyword, setKeyword] = useState('')

  useLoad(() => {
    console.log('Org list page loaded.')
  })

  useDidShow(() => {
    loadOrgs(true)
  })

  useReachBottom(() => {
    if (hasMore && !loading) {
      loadOrgs(false)
    }
  })

  usePullDownRefresh(() => {
    loadOrgs(true).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadOrgs = async (refresh: boolean = false) => {
    if (loading && !refresh) return

    setLoading(true)
    const currentPage = refresh ? 1 : page

    try {
      const params = {
        page: currentPage,
        pageSize: 20,
        keyword: keyword || undefined,
      }

      console.log('加载机构列表请求:', { url: '/api/org/list', params })
      const res = await Network.request({
        url: '/api/org/list',
        data: params
      })
      console.log('加载机构列表响应:', res.data)

      const list = Array.isArray(res.data) ? res.data : res.data.list || []
      
      if (refresh) {
        setOrgs(list)
        setPage(2)
      } else {
        setOrgs([...orgs, ...list])
        setPage(currentPage + 1)
      }

      setHasMore(list.length >= 20)
    } catch (error) {
      console.error('加载机构列表失败:', error)
      // 使用模拟数据
      const mockOrgs: OrgItem[] = [
        {
          id: 1,
          name: '优学教育',
          logo: '',
          description: '专注中小学全科辅导，师资力量雄厚，教学环境优良',
          teacher_count: 50,
          rating: 4.7,
          review_count: 256,
          address: '北京市海淀区中关村大街1号',
          distance_text: '1.2km'
        },
        {
          id: 2,
          name: '启航教育',
          logo: '',
          description: '专业中高考辅导，提分效果显著，多年办学经验',
          teacher_count: 35,
          rating: 4.6,
          review_count: 189,
          address: '北京市朝阳区建国路88号',
          distance_text: '2.8km'
        },
        {
          id: 3,
          name: '智慧树教育',
          logo: '',
          description: '幼小衔接、小学全科辅导，培养学习习惯',
          teacher_count: 28,
          rating: 4.8,
          review_count: 142,
          address: '北京市西城区西单北大街',
          distance_text: '3.5km'
        },
      ]

      if (refresh) {
        setOrgs(mockOrgs)
        setPage(2)
      } else {
        setOrgs([...orgs, ...mockOrgs])
        setPage(currentPage + 1)
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/org/detail?id=${id}` })
  }

  return (
    <View className="org-list-page">
      {/* 搜索栏 */}
      <View className="search-bar">
        <Input
          className="search-input"
          type="text"
          placeholder="搜索机构名称..."
          value={keyword}
          onInput={(e) => setKeyword(e.detail.value)}
          onConfirm={() => loadOrgs(true)}
        />
      </View>

      {/* 机构列表 */}
      <ScrollView scrollY className="org-scroll">
        {orgs.map((org) => (
          <Card key={org.id} className="org-card" onClick={() => goToDetail(org.id)}>
            <CardContent className="org-content">
              <View className="org-header">
                <View className="org-logo">
                  {org.logo ? (
                    <Image src={org.logo} className="logo-img" mode="aspectFill" />
                  ) : (
                    <View className="logo-placeholder">
                      <Text className="logo-text">{org.name && org.name[0]}</Text>
                    </View>
                  )}
                </View>
                <View className="org-basic">
                  <View className="name-row">
                    <Text className="org-name">{org.name}</Text>
                    <View className="rating-row">
                      <Star size={14} color="#F59E0B" />
                      <Text className="rating-text">{org.rating}</Text>
                    </View>
                  </View>
                  <Text className="org-desc">{org.description}</Text>
                </View>
                <ChevronRight size={20} color="#D1D5DB" />
              </View>

              <View className="org-footer">
                <View className="meta-row">
                  <View className="meta-item">
                    <Users size={14} color="#6B7280" />
                    <Text className="meta-text">{org.teacher_count}位老师</Text>
                  </View>
                  <View className="meta-item">
                    <MapPin size={14} color="#6B7280" />
                    <Text className="meta-text">{org.distance_text || org.address}</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}

        {loading && (
          <>
            <Skeleton className="h-24 rounded-lg mx-3 mb-3" />
            <Skeleton className="h-24 rounded-lg mx-3 mb-3" />
          </>
        )}

        {!loading && orgs.length === 0 && (
          <View className="empty-state">
            <Text className="empty-text">暂无符合条件的机构</Text>
            <Button variant="outline" className="retry-btn" onClick={() => loadOrgs(true)}>
              重新加载
            </Button>
          </View>
        )}

        {!hasMore && orgs.length > 0 && (
          <View className="no-more">
            <Text className="no-more-text">没有更多了</Text>
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default OrgListPage
