import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Loader } from 'lucide-react-taro';
import { Network } from '@/network';
import './index.css';

// 商品类型 - 完整定义
interface Product {
  status?: number;
  id: number;
  name: string;
  description?: string;
  image: string;
  price: string | number;
  original_price: string | number;
  stock: number;
  sales: number;
  type: number; // 1-实体商品 2-虚拟商品
  delivery_type: number; // 1-快递 2-自提 3-下载 4-网盘
  file_url?: string;
  pan_url?: string;
  category_id?: number;
  category_name?: string;
}

// 分类
interface Category {
  id: number;
  name: string;
}

// 获取静态资源基础URL
const getStaticBaseUrl = () => {
  // 生产环境使用环境变量
  if (typeof PROJECT_DOMAIN !== 'undefined' && PROJECT_DOMAIN) {
    return PROJECT_DOMAIN;
  }
  // 开发环境
  return '';
};

// 处理图片URL - 将相对路径转换为完整URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // 如果是相对路径，拼接域名
  const baseUrl = getStaticBaseUrl();
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }
  return `${baseUrl}/${imageUrl}`;
};

/**
 * 商城页面
 */
const MallPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: 0, name: '全部' },
  ]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // 使用 useDidShow 确保每次页面显示时都加载数据
  useDidShow(() => {
    loadCategories();
    loadProducts();
  });

  const loadCategories = async () => {
    try {
      const res = await Network.request({
        url: '/api/products/categories',
        method: 'GET'
      });
      if (res.data && Array.isArray(res.data)) {
        const cats = res.data.map((c: any) => ({ id: c.id, name: c.name }));
        setCategories([{ id: 0, name: '全部' }, ...cats]);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: 1, pageSize: 50 };
      if (selectedCategory > 0) {
        params.category_id = selectedCategory;
      }
      
      const res = await Network.request({
        url: '/api/products/list',
        data: params,
        method: 'GET'
      });
      
      console.log('商品列表响应:', res.data);
      
      if (res.data && res.data.list) {
        let productList = res.data.list as Product[];
        // 过滤上架商品
        productList = productList.filter(p => p.status === 1);
        setProducts(productList);
      } else if (Array.isArray(res.data)) {
        let productList = res.data as Product[];
        productList = productList.filter(p => p.status === 1);
        setProducts(productList);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('加载商品列表失败:', error);
      setProducts([]);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId);
  };

  // 当分类变化时重新加载
  const handleProductClick = (productId: number) => {
    Taro.navigateTo({ url: `/pages/product-detail/index?id=${productId}` });
  };

  const handleAddToCart = (_productId: number, e: any) => {
    e.stopPropagation();
    setCartCount(prev => prev + 1);
    Taro.showToast({ title: '已加入购物车', icon: 'success' });
  };

  // 虚拟商品立即购买
  const handleBuyVirtual = (product: Product, e: any) => {
    e.stopPropagation();
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    Taro.showModal({
      title: '确认购买',
      content: `确定购买《${product.name}》？价格：¥${price.toFixed(2)}`,
      success: (res) => {
        if (res.confirm) {
          // 模拟支付成功
          Taro.showToast({ title: '购买成功', icon: 'success' });
          // 如果是文件下载类型
          if (product.delivery_type === 3 && product.file_url) {
            Taro.showModal({
              title: '下载地址',
              content: product.file_url,
              showCancel: false,
            });
          } else if (product.delivery_type === 4 && product.pan_url) {
            Taro.showModal({
              title: '网盘链接',
              content: product.pan_url,
              showCancel: false,
            });
          }
        }
      }
    });
  };

  // 格式化价格
  const formatPrice = (priceStr: string | number) => {
    const price = typeof priceStr === 'string' ? parseFloat(priceStr) : priceStr;
    return price.toFixed(2);
  };

  // 获取商品类型标签
  const getTypeTag = (product: Product) => {
    if (product.type === 2) {
      // 虚拟商品
      if (product.delivery_type === 3) {
        return { label: '资料下载', color: 'bg-purple-100 text-purple-600' };
      } else if (product.delivery_type === 4) {
        return { label: '网盘链接', color: 'bg-orange-100 text-orange-600' };
      }
      return { label: '虚拟商品', color: 'bg-blue-100 text-blue-600' };
    }
    return { label: '实物商品', color: 'bg-green-100 text-green-600' };
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 顶部搜索栏 */}
      <View className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-200">
        <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
          <Search size={18} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm">搜索商品</Text>
        </View>
        <View className="relative">
          <ShoppingCart size={24} color="#666" />
          {cartCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
              <Text className="text-white text-xs">{cartCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 分类标签 */}
      <View className="bg-white px-4 py-3 flex gap-3 overflow-x-auto">
        {categories.map((cat) => (
          <View
            key={cat.id}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            <Text>{cat.name}</Text>
          </View>
        ))}
      </View>

      {/* 商品列表 */}
      <View className="p-4">
        {loading ? (
          <View className="flex justify-center items-center py-20">
            <Loader size={32} color="#3B82F6" className="animate-spin" />
          </View>
        ) : products.length === 0 ? (
          <View className="text-center py-20">
            <Text className="text-gray-400">暂无商品</Text>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-3">
            {products.map((product) => {
              const typeTag = getTypeTag(product);
              const imageUrl = getImageUrl(product.image);
              return (
                <Card
                  key={product.id}
                  className="overflow-hidden"
                  onClick={() => handleProductClick(product.id)}
                >
                  <View className="relative">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        mode="aspectFill"
                        className="w-full h-40"
                        onError={(e) => {
                          console.log('图片加载失败:', imageUrl, e);
                        }}
                      />
                    ) : (
                      <View className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        <Text className="text-gray-400">暂无图片</Text>
                      </View>
                    )}
                    <Badge className={`absolute top-2 left-2 ${typeTag.color}`}>
                      <Text className="text-xs">{typeTag.label}</Text>
                    </Badge>
                  </View>
                  <CardContent className="p-3">
                    <Text className="font-medium text-sm line-clamp-2">{product.name}</Text>
                    <View className="flex items-baseline gap-2 mt-2">
                      <Text className="text-red-500 font-bold">¥{formatPrice(product.price)}</Text>
                      {product.original_price && formatPrice(product.original_price) !== formatPrice(product.price) && (
                        <Text className="text-gray-400 text-xs line-through">
                          ¥{formatPrice(product.original_price)}
                        </Text>
                      )}
                    </View>
                    <View className="flex items-center justify-between mt-2">
                      <Text className="text-gray-400 text-xs">已售 {product.sales || 0}</Text>
                      {product.type === 2 ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e: any) => handleBuyVirtual(product, e)}
                        >
                          <Text className="text-white text-xs">立即购买</Text>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e: any) => handleAddToCart(product.id, e)}
                        >
                          <Text className="text-xs">加购物车</Text>
                        </Button>
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

export default MallPage;
