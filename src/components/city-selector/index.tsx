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
  latitude?: number
  longitude?: number
}

interface CitySelectorProps {
  visible: boolean
  currentCity: string
  onClose: () => void
  onSelect: (city: City) => void
}

// 本地城市数据（作为降级方案，不依赖后端API）
const LOCAL_CITIES: City[] = [
  { id: 1, name: '北京', pinyin: 'beijing', first_letter: 'B', is_hot: 1, latitude: 39.9042, longitude: 116.4074 },
  { id: 2, name: '上海', pinyin: 'shanghai', first_letter: 'S', is_hot: 1, latitude: 31.2304, longitude: 121.4737 },
  { id: 3, name: '广州', pinyin: 'guangzhou', first_letter: 'G', is_hot: 1, latitude: 23.1291, longitude: 113.2644 },
  { id: 4, name: '深圳', pinyin: 'shenzhen', first_letter: 'S', is_hot: 1, latitude: 22.5431, longitude: 114.0579 },
  { id: 5, name: '杭州', pinyin: 'hangzhou', first_letter: 'H', is_hot: 1, latitude: 30.2741, longitude: 120.1551 },
  { id: 6, name: '成都', pinyin: 'chengdu', first_letter: 'C', is_hot: 1, latitude: 30.5728, longitude: 104.0668 },
  { id: 7, name: '武汉', pinyin: 'wuhan', first_letter: 'W', is_hot: 1, latitude: 30.5928, longitude: 114.3055 },
  { id: 8, name: '南京', pinyin: 'nanjing', first_letter: 'N', is_hot: 1, latitude: 32.0603, longitude: 118.7969 },
  { id: 9, name: '天津', pinyin: 'tianjin', first_letter: 'T', is_hot: 0, latitude: 39.0842, longitude: 117.2009 },
  { id: 10, name: '重庆', pinyin: 'chongqing', first_letter: 'C', is_hot: 0, latitude: 29.4316, longitude: 106.9123 },
  { id: 11, name: '苏州', pinyin: 'suzhou', first_letter: 'S', is_hot: 0, latitude: 31.2989, longitude: 120.5853 },
  { id: 12, name: '西安', pinyin: 'xian', first_letter: 'X', is_hot: 0, latitude: 34.3416, longitude: 108.9398 },
  { id: 13, name: '长沙', pinyin: 'changsha', first_letter: 'C', is_hot: 0, latitude: 28.2282, longitude: 112.9388 },
  { id: 14, name: '郑州', pinyin: 'zhengzhou', first_letter: 'Z', is_hot: 0, latitude: 34.7466, longitude: 113.6254 },
  { id: 15, name: '青岛', pinyin: 'qingdao', first_letter: 'Q', is_hot: 0, latitude: 36.0671, longitude: 120.3826 },
  { id: 16, name: '大连', pinyin: 'dalian', first_letter: 'D', is_hot: 0, latitude: 38.9140, longitude: 121.6147 },
  { id: 17, name: '厦门', pinyin: 'xiamen', first_letter: 'X', is_hot: 0, latitude: 24.4798, longitude: 118.0894 },
  { id: 18, name: '宁波', pinyin: 'ningbo', first_letter: 'N', is_hot: 0, latitude: 29.8683, longitude: 121.5440 },
  { id: 19, name: '无锡', pinyin: 'wuxi', first_letter: 'W', is_hot: 0, latitude: 31.4912, longitude: 120.3119 },
  { id: 20, name: '合肥', pinyin: 'hefei', first_letter: 'H', is_hot: 0, latitude: 31.8206, longitude: 117.2272 },
  { id: 21, name: '福州', pinyin: 'fuzhou', first_letter: 'F', is_hot: 0, latitude: 26.0745, longitude: 119.2965 },
  { id: 22, name: '哈尔滨', pinyin: 'haerbin', first_letter: 'H', is_hot: 0, latitude: 45.8038, longitude: 126.5350 },
  { id: 23, name: '沈阳', pinyin: 'shenyang', first_letter: 'S', is_hot: 0, latitude: 41.8057, longitude: 123.4315 },
  { id: 24, name: '长春', pinyin: 'changchun', first_letter: 'C', is_hot: 0, latitude: 43.8171, longitude: 125.3235 },
  { id: 25, name: '昆明', pinyin: 'kunming', first_letter: 'K', is_hot: 0, latitude: 25.0389, longitude: 102.7183 },
  { id: 26, name: '南宁', pinyin: 'nanning', first_letter: 'N', is_hot: 0, latitude: 22.8170, longitude: 108.3665 },
  { id: 27, name: '贵阳', pinyin: 'guiyang', first_letter: 'G', is_hot: 0, latitude: 26.6470, longitude: 106.6302 },
  { id: 28, name: '海口', pinyin: 'haikou', first_letter: 'H', is_hot: 0, latitude: 20.0440, longitude: 110.1999 },
  { id: 29, name: '石家庄', pinyin: 'shijiazhuang', first_letter: 'S', is_hot: 0, latitude: 38.0428, longitude: 114.5149 },
  { id: 30, name: '太原', pinyin: 'taiyuan', first_letter: 'T', is_hot: 0, latitude: 37.8706, longitude: 112.5489 },
]

export default function CitySelector({ visible, currentCity, onClose, onSelect }: CitySelectorProps) {
  const [groupedCities, setGroupedCities] = useState<{ letter: string; cities: City[] }[]>([])
  const [hotCities, setHotCities] = useState<City[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<City[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<City | null>(null)
  const [useLocalData, setUseLocalData] = useState(false)

  useEffect(() => {
    if (visible) {
      fetchCities()
    }
  }, [visible])

  // 从后端获取城市数据
  const fetchCities = async () => {
    try {
      // 获取所有城市
      const allRes = await Network.request({
        url: '/api/city/all',
        method: 'GET',
      })
      console.log('城市列表API响应:', allRes)
      
      // 获取热门城市
      const hotRes = await Network.request({
        url: '/api/city/hot',
        method: 'GET',
      })
      console.log('热门城市API响应:', hotRes)
      
      if (allRes && allRes.data && allRes.data.data) {
        setGroupedCities(allRes.data.data)
        setUseLocalData(false)
      } else {
        // API返回数据格式不对，使用本地数据
        initLocalCities()
      }
      
      if (hotRes && hotRes.data && hotRes.data.data) {
        setHotCities(hotRes.data.data)
      }
    } catch (error) {
      console.error('获取城市列表失败，使用本地数据:', error)
      initLocalCities()
    }
  }

  // 初始化本地城市数据（降级方案）
  const initLocalCities = () => {
    setUseLocalData(true)
    
    // 热门城市
    const hot = LOCAL_CITIES.filter(city => city.is_hot === 1)
    setHotCities(hot)

    // 按首字母分组
    const grouped: { letter: string; cities: City[] }[] = []
    const letterMap = new Map<string, City[]>()

    LOCAL_CITIES.forEach(city => {
      const letter = city.first_letter
      if (!letterMap.has(letter)) {
        letterMap.set(letter, [])
      }
      letterMap.get(letter)!.push(city)
    })

    // 按字母排序
    const sortedLetters = Array.from(letterMap.keys()).sort()
    sortedLetters.forEach(letter => {
      grouped.push({
        letter,
        cities: letterMap.get(letter) || []
      })
    })

    setGroupedCities(grouped)
  }

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword)

    if (!keyword.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)

    // 如果使用本地数据，则本地搜索
    if (useLocalData) {
      const results = LOCAL_CITIES.filter(city =>
        city.name.includes(keyword) ||
        city.pinyin.toLowerCase().includes(keyword.toLowerCase())
      )
      setSearchResults(results)
      return
    }

    // 否则调用后端API
    try {
      const res = await Network.request({
        url: '/api/city/search',
        method: 'GET',
        data: { keyword },
      })
      console.log('搜索结果:', res)
      if (res && res.data && res.data.data) {
        setSearchResults(res.data.data)
      }
    } catch (error) {
      console.error('搜索城市失败:', error)
      // 降级到本地搜索
      const results = LOCAL_CITIES.filter(city =>
        city.name.includes(keyword) ||
        city.pinyin.toLowerCase().includes(keyword.toLowerCase())
      )
      setSearchResults(results)
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

      // 如果使用本地数据，则本地查找
      if (useLocalData) {
        const nearestCity = findNearestCity(location.latitude, location.longitude, LOCAL_CITIES)
        if (nearestCity) {
          setCurrentLocation(nearestCity)
          Taro.showToast({ title: `定位成功: ${nearestCity.name}`, icon: 'success' })
        } else {
          Taro.showToast({ title: '未找到附近城市', icon: 'none' })
        }
        setLocating(false)
        return
      }

      // 否则调用后端API
      const res = await Network.request({
        url: '/api/city/nearest',
        method: 'GET',
        data: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      })
      console.log('最近城市:', res)
      if (res && res.data && res.data.data) {
        setCurrentLocation(res.data.data)
        Taro.showToast({ title: `定位成功: ${res.data.data.name}`, icon: 'success' })
      } else {
        Taro.showToast({ title: '未找到附近城市', icon: 'none' })
      }
    } catch (error) {
      console.error('定位失败:', error)
      Taro.showToast({ title: '定位失败，请检查权限', icon: 'error' })
    } finally {
      setLocating(false)
    }
  }

  // 根据经纬度查找最近城市（本地计算）
  const findNearestCity = (lat: number, lng: number, cities: City[]): City | null => {
    let minDistance = Infinity
    let nearestCity: City | null = null

    cities.forEach(city => {
      if (city.latitude && city.longitude) {
        const distance = calculateDistance(lat, lng, city.latitude, city.longitude)
        if (distance < minDistance) {
          minDistance = distance
          nearestCity = city
        }
      }
    })

    // 如果最近城市距离超过500km，返回null
    if (minDistance > 500) {
      return null
    }

    return nearestCity
  }

  // 计算两点间距离（km）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // 地球半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
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
