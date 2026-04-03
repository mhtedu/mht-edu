import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Loader } from 'lucide-react-taro';
import { Network } from '@/network';
import './index.css';

// 商品类型
interface Product {
  id: number;
  name: string;
  image: string;
  price: number | string;
  original_price: number | string;
  sales: number;
  category_id?: number;
  category_name?: string;
  description: string;
  type: number;
  delivery_type: number;
  stock: number;
  status: number;
}

// 分类
interface Category {
  id: number;
  name: string;
}

// 获取完整的图片URL
const getFullImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // 如果是本地路径，使用远程服务器地址（数据库中的图片存储在远程服务器）
  // 开发环境下，静态文件会通过代理访问
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  // 尝试使用远程服务器地址
  const remoteServer = 'http://119.91.193.179';
  
  // 如果是开发环境（localhost），使用远程服务器地址
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('dev.coze.site')) {
    return `${remoteServer}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
  
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

/**
 * 商城页面
 */
const MallPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      console.log('加载商品分类请求:', { url: '/api/products/categories' });
      const res = await Network.request({
        url: '/api/products/categories',
        method: 'GET'
      });
      console.log('加载商品分类响应:', res.data);
      if (res.data && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('加载商品分类失败:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: 1, pageSize: 50 };
      if (selectedCategory) {
        params.category_id = selectedCategory;
      }
      console.log('加载商品列表请求:', { url: '/api/products/list', params });
      const res = await Network.request({
        url: '/api/products/list',
        data: params,
        method: 'GET'
      });
      console.log('加载商品列表响应:', res.data);
      
      if (res.data && res.data.list) {
        setProducts(res.data.list);
      } else if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('加载商品失败:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId: number) => {
    Taro.navigateTo({ url: `/pages/product-detail/index?id=${productId}` });
  };

  const handleAddToCart = (_productId: number, e: any) => {
    e.stopPropagation();
    setCartCount(prev => prev + 1);
    Taro.showToast({ title: '已加入购物车', icon: 'success' });
  };

  // 格式化价格（后端返回的是字符串，单位是元）
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row items-center gap-2">
          <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex flex-row items-center">
            <Search size={16} color="#9CA3AF" className="mr-2" />
            <Text className="text-gray-400 text-sm">搜索商品</Text>
          </View>
          <View className="relative">
            <ShoppingCart size={24} color="#374151" />
            {cartCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                <Text className="text-white text-xs">{cartCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 分类筛选 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row gap-2 overflow-x-auto">
          <View
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === null ? 'bg-blue-500' : 'bg-gray-100'
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            <Text className={selectedCategory === null ? 'text-white' : 'text-gray-700'}>
              全部
            </Text>
          </View>
          {categories.map((cat) => (
            <View
              key={cat.id}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === cat.id ? 'bg-blue-500' : 'bg-gray-100'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Text className={selectedCategory === cat.id ? 'text-white' : 'text-gray-700'}>
                {cat.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 商品列表 */}
      <View className="p-4">
        {loading ? (
          <View className="flex flex-col items-center justify-center py-8">
            <Loader size={32} color="#3B82F6" className="animate-spin" />
            <Text className="text-gray-500 mt-2">加载中...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-8">
            <Text className="text-gray-500">暂无商品</Text>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-3">
            {products.map((product) => {
              const imageUrl = getFullImageUrl(product.image);
              return (
                <Card 
                  key={product.id} 
                  className="bg-white overflow-hidden"
                  onClick={() => handleProductClick(product.id)}
                >
                  {imageUrl ? (
                    <Image 
                      src={imageUrl}
                      className="w-full h-36"
                      mode="aspectFill"
                    />
                  ) : (
                    <View className="w-full h-36 bg-gray-200 flex items-center justify-center">
                      <Text className="text-gray-400">暂无图片</Text>
                    </View>
                  )}
                  <CardContent className="p-3">
                    <Text className="text-sm font-medium line-clamp-2">{product.name}</Text>
                    
                    {product.category_name && (
                      <View className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <Text className="text-xs">{product.category_name}</Text>
                        </Badge>
                      </View>
                    )}
                    
                    <View className="flex flex-row items-center justify-between mt-2">
                      <View className="flex flex-row items-baseline">
                        <Text className="text-red-500 font-bold text-lg">¥{formatPrice(product.price)}</Text>
                        {product.original_price && parseFloat(String(product.original_price)) > parseFloat(String(product.price)) && (
                          <Text className="text-gray-400 text-xs line-through ml-1">
                            ¥{formatPrice(product.original_price)}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View className="flex flex-row items-center justify-between mt-2">
                      <Text className="text-gray-400 text-xs">已售 {product.sales || 0}</Text>
                      <Button 
                        size="sm" 
                        className="bg-blue-500 px-3"
                        onClick={(e) => handleAddToCart(product.id, e)}
                      >
                        <Text className="text-white text-xs">查看详情</Text>
                      </Button>
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

export default MallPage;
