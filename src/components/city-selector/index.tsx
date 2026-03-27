import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search, X, Check } from 'lucide-react-taro'
import './index.css'

interface City {
  id: number
  name: string
  pinyin: string
  first_letter: string
  is_hot: number
}

interface CitySelectorProps {
  visible: boolean
  currentCity: string
  onClose: () => void
  onSelect: (city: City) => void
}

export default function CitySelector({ visible, currentCity, onClose, onSelect }: CitySelectorProps) {
  const [groupedCities, setGroupedCities] = useState<{ letter: string; cities: City[] }[]>([])
  const [hotCities, setHotCities] = useState<City[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<City[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<City | null>(null)

  useEffect(() => {
    if (visible) {
      fetchCities()
      fetchHotCities()
    }
  }, [visible])

  const fetchCities = async () => {
    try {
      const res = await Network.request({
        url: '/api/city/all',
        method: 'GET',
      })

      console.log('城市列表:', res.data)
      if (res.data?.data) {
        setGroupedCities(res.data.data)
      }
    } catch (error) {
      console.error('获取城市列表失败:', error)
    }
  }

  const fetchHotCities = async () => {
    try {
      const res = await Network.request({
        url: '/api/city/hot',
        method: 'GET',
      })

      console.log('热门城市:', res.data)
      if (res.data?.data) {
        setHotCities(res.data.data)
      }
    } catch (error) {
      console.error('获取热门城市失败:', error)
    }
  }

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword)

    if (!keyword.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      const res = await Network.request({
        url: '/api/city/search',
        method: 'GET',
        data: { keyword },
      })

      console.log('搜索结果:', res.data)
      if (res.data?.data) {
        setSearchResults(res.data.data)
      }
    } catch (error) {
      console.error('搜索城市失败:', error)
    }
  }

  // 定位当前城市
  const handleLocate = async () => {
    setLocating(true)

    try {
      // 获取位置
      const location = await Taro.getLocation({
        type: 'wgs84',
      })

      console.log('定位结果:', location)

      // 根据经纬度获取最近城市
      const res = await Network.request({
        url: '/api/city/nearest',
        method: 'GET',
        data: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      })

      console.log('最近城市:', res.data)
      if (res.data?.data) {
        setCurrentLocation(res.data.data)
      }
    } catch (error) {
      console.error('定位失败:', error)
      Taro.showToast({
        title: '定位失败',
        icon: 'error',
      })
    } finally {
      setLocating(false)
    }
  }

  const handleSelectCity = (city: City) => {
    onSelect(city)
    onClose()
  }

  if (!visible) return null

  return (
    <View className="city-selector">
      {/* 遮罩层 */}
      <View className="city-selector-mask" onClick={onClose} />

      {/* 选择器内容 */}
      <View className="city-selector-content">
        {/* 头部 */}
        <View className="city-selector-header">
          <Text className="text-lg font-bold">选择城市</Text>
          <View onClick={onClose}>
            <X size={20} color="#6B7280" />
          </View>
        </View>

        {/* 搜索框 */}
        <View className="city-selector-search">
          <View className="relative flex-1">
            <Input
              className="pl-8"
              placeholder="搜索城市"
              value={searchKeyword}
              onInput={(e) => handleSearch(e.detail.value)}
            />
            <Search size={16} color="#9CA3AF" />
          </View>
        </View>

        {/* 当前定位 */}
        <View className="city-selector-section">
          <View className="flex items-center justify-between mb-2">
            <Text className="text-gray-500 text-sm">当前定位</Text>
            <Button
              variant="link"
              size="sm"
              onClick={handleLocate}
              disabled={locating}
            >
              <MapPin size={14} color="#2563EB" />
              <Text>{locating ? '定位中...' : '重新定位'}</Text>
            </Button>
          </View>
          {currentLocation ? (
            <View
              className="city-tag active"
              onClick={() => handleSelectCity(currentLocation)}
            >
              <MapPin size={14} color="#2563EB" />
              <Text>{currentLocation.name}</Text>
            </View>
          ) : (
            <View className="city-tag" onClick={handleLocate}>
              <Text>{locating ? '定位中...' : '点击定位'}</Text>
            </View>
          )}
        </View>

        {/* 热门城市 */}
        {!isSearching && hotCities.length > 0 && (
          <View className="city-selector-section">
            <Text className="text-gray-500 text-sm mb-2">热门城市</Text>
            <View className="city-tags">
              {hotCities.map((city) => (
                <View
                  key={city.id}
                  className={`city-tag ${currentCity === city.name ? 'active' : ''}`}
                  onClick={() => handleSelectCity(city)}
                >
                  <Text>{city.name}</Text>
                  {currentCity === city.name && <Check size={12} color="#2563EB" />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 搜索结果 */}
        {isSearching ? (
          <ScrollView scrollY className="city-selector-list">
            {searchResults.length > 0 ? (
              searchResults.map((city) => (
                <View
                  key={city.id}
                  className={`city-list-item ${currentCity === city.name ? 'active' : ''}`}
                  onClick={() => handleSelectCity(city)}
                >
                  <Text>{city.name}</Text>
                  {currentCity === city.name && <Check size={16} color="#2563EB" />}
                </View>
              ))
            ) : (
              <View className="flex items-center justify-center py-8 text-gray-400">
                <Text>未找到匹配的城市</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          /* 城市列表 */
          <ScrollView scrollY className="city-selector-list">
            {groupedCities.map((group) => (
              <View key={group.letter}>
                <View className="city-letter-header">{group.letter}</View>
                {group.cities.map((city) => (
                  <View
                    key={city.id}
                    className={`city-list-item ${currentCity === city.name ? 'active' : ''}`}
                    onClick={() => handleSelectCity(city)}
                  >
                    <Text>{city.name}</Text>
                    {currentCity === city.name && <Check size={16} color="#2563EB" />}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  )
}
