import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Package } from 'lucide-react-taro';
import './index.css';

interface ProductDetail {
  id: number;
  name: string;
  image: string;
  price: number;
  original_price: number;
  description: string;
  features: string[];
  stock: number;
  sales: number;
  rating: number;
}

/**
 * 商品详情页面
 */
const ProductDetailPage = () => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const productId = params?.id;
    
    if (productId) {
      fetchProductDetail(parseInt(productId));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProductDetail = async (id: number) => {
    // 模拟数据
    const mockProduct: ProductDetail = {
      id,
      name: '教辅资料套装',
      image: 'https://via.placeholder.com/400x300?text=Product',
      price: 9900,
      original_price: 19900,
      description: '包含语数外三科全套教辅资料，适合小学1-6年级使用。精选优质纸张印刷，内容全面覆盖知识点。',
      features: ['精选优质纸张', '内容全面', '适合小学全年级', '配套练习题'],
      stock: 999,
      sales: 1280,
      rating: 4.8,
    };
    
    setProduct(mockProduct);
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    Taro.showToast({ title: '已加入购物车', icon: 'success' });
  };

  const handleBuyNow = () => {
    if (!product) return;
    Taro.showToast({ title: '功能开发中', icon: 'none' });
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">商品不存在</Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 商品图片 */}
      <View className="bg-white">
        <View className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center">
          <Package size={64} color="#D1D5DB" />
        </View>
      </View>

      {/* 商品信息 */}
      <View className="bg-white mt-2 p-4">
        <View className="flex flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold">{product.name}</Text>
            <View className="flex flex-row items-center mt-2">
              <Text className="text-red-500 text-2xl font-bold">¥{formatPrice(product.price)}</Text>
              <Text className="text-gray-400 text-sm line-through ml-2">¥{formatPrice(product.original_price)}</Text>
            </View>
          </View>
          <Badge variant="secondary">
            <Text className="text-xs">已售 {product.sales}</Text>
          </Badge>
        </View>

        {/* 评分 */}
        <View className="flex flex-row items-center mt-3">
          <Star size={14} color="#FBBF24" filled />
          <Text className="text-sm text-gray-600 ml-1">{product.rating}</Text>
          <Text className="text-gray-300 mx-2">|</Text>
          <Text className="text-sm text-gray-600">库存 {product.stock}</Text>
        </View>
      </View>

      {/* 商品特点 */}
      <View className="bg-white mt-2 p-4">
        <Text className="font-semibold mb-3">商品特点</Text>
        <View className="flex flex-row flex-wrap gap-2">
          {product.features.map((feature, index) => (
            <Badge key={index} variant="outline">
              <Text className="text-xs">{feature}</Text>
            </Badge>
          ))}
        </View>
      </View>

      {/* 商品详情 */}
      <Card className="mx-4 mt-4">
        <CardContent className="p-4">
          <Text className="font-semibold mb-2">商品详情</Text>
          <Text className="text-gray-600 text-sm leading-relaxed">{product.description}</Text>
        </CardContent>
      </Card>

      {/* 底部操作栏 */}
      <View style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#fff',
        borderTop: '1px solid #E5E7EB',
        zIndex: 100
      }}
      >
        <View 
          className="flex flex-row items-center justify-center px-4"
          onClick={handleAddToCart}
        >
          <ShoppingCart size={20} color="#2563EB" />
          <Text className="text-blue-500 text-sm ml-1">加入购物车</Text>
        </View>
        <Button
          className="flex-1 bg-blue-500"
          onClick={handleBuyNow}
        >
          <Text className="text-white font-semibold">立即购买</Text>
        </Button>
      </View>
    </View>
  );
};

export default ProductDetailPage;
