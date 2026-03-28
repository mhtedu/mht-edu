import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search } from 'lucide-react-taro';
import './index.css';

// 商品类型
interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  original_price: number;
  sales: number;
  category: string;
  tags: string[];
  description: string;
  product_type: 'physical' | 'virtual'; // 实体商品或虚拟商品
  file_type?: 'download' | 'link'; // 虚拟商品类型
  file_size?: string;
  file_url?: string; // 文件下载地址或网盘链接
}

// 分类
const categories = ['全部', '资料下载', '教辅书籍', '学习用品', '文具', '电子产品', '课程包'];

/**
 * 商城页面
 */
const MallPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    // 模拟数据 - 包含实体商品和虚拟商品
    const mockProducts: Product[] = [
      // 虚拟商品 - 资料下载
      {
        id: 101,
        name: '高考数学压轴题解析',
        image: 'https://placehold.co/200/2563EB/white?text=数学',
        price: 2990,
        original_price: 5900,
        sales: 1256,
        category: '资料下载',
        tags: ['高考', '数学', 'PDF'],
        description: '精选近5年高考数学压轴题详细解析，含解题思路',
        product_type: 'virtual',
        file_type: 'download',
        file_size: '15.2MB',
      },
      {
        id: 102,
        name: '英语语法大全PDF',
        image: 'https://placehold.co/200/10B981/white?text=英语',
        price: 1990,
        original_price: 3900,
        sales: 892,
        category: '资料下载',
        tags: ['英语', '语法', 'PDF'],
        description: '完整英语语法知识点汇总，例句丰富',
        product_type: 'virtual',
        file_type: 'download',
        file_size: '8.5MB',
      },
      {
        id: 103,
        name: '初中物理实验视频合集',
        image: 'https://placehold.co/200/F59E0B/white?text=物理',
        price: 4990,
        original_price: 9900,
        sales: 567,
        category: '资料下载',
        tags: ['物理', '实验', '视频'],
        description: '包含50+物理实验演示视频，百度网盘链接',
        product_type: 'virtual',
        file_type: 'link',
        file_size: '',
      },
      {
        id: 104,
        name: '高考语文作文素材库',
        image: 'https://placehold.co/200/EC4899/white?text=语文',
        price: 990,
        original_price: 1900,
        sales: 2341,
        category: '资料下载',
        tags: ['高考', '语文', '作文'],
        description: '1000+作文素材，分类整理',
        product_type: 'virtual',
        file_type: 'download',
        file_size: '3.2MB',
      },
      // 实体商品
      {
        id: 1,
        name: '高考数学必刷题1000道',
        image: 'https://placehold.co/200/2563EB/white?text=数学',
        price: 3990,
        original_price: 5900,
        sales: 1256,
        category: '教辅书籍',
        tags: ['高考', '数学'],
        description: '覆盖高考数学所有考点，精选真题',
        product_type: 'physical',
      },
      {
        id: 2,
        name: '英语单词速记手册',
        image: 'https://placehold.co/200/10B981/white?text=英语',
        price: 1990,
        original_price: 2900,
        sales: 892,
        category: '教辅书籍',
        tags: ['高考', '英语'],
        description: '词根词缀记忆法，高效背单词',
        product_type: 'physical',
      },
      {
        id: 3,
        name: '学生专用计算器',
        image: 'https://placehold.co/200/F59E0B/white?text=计算器',
        price: 5900,
        original_price: 8900,
        sales: 567,
        category: '电子产品',
        tags: ['考试专用', '函数计算'],
        description: '符合高考规定，功能齐全',
        product_type: 'physical',
      },
      {
        id: 4,
        name: '错题本套装（3本装）',
        image: 'https://placehold.co/200/EC4899/white?text=错题本',
        price: 2990,
        original_price: 4500,
        sales: 2341,
        category: '文具',
        tags: ['错题整理', '复习神器'],
        description: '高效整理错题，提升学习效率',
        product_type: 'physical',
      },
      {
        id: 5,
        name: '初中物理实验套装',
        image: 'https://placehold.co/200/8B5CF6/white?text=实验',
        price: 12800,
        original_price: 16800,
        sales: 345,
        category: '学习用品',
        tags: ['物理', '实验'],
        description: '家庭实验必备，培养动手能力',
        product_type: 'physical',
      },
      {
        id: 6,
        name: '一对一辅导课程（10课时）',
        image: 'https://placehold.co/200/EF4444/white?text=课程',
        price: 29900,
        original_price: 49900,
        sales: 89,
        category: '课程包',
        tags: ['一对一', '名师'],
        description: '名师一对一辅导，专属学习计划',
        product_type: 'physical',
      },
    ];

    const filtered = selectedCategory === '全部' 
      ? mockProducts 
      : mockProducts.filter(p => p.category === selectedCategory);
    
    setProducts(filtered);
    setLoading(false);
  };

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
    Taro.showModal({
      title: '确认购买',
      content: `确定购买《${product.name}》？价格：¥${formatPrice(product.price)}`,
      success: (res) => {
        if (res.confirm) {
          // 模拟支付成功
          Taro.showToast({ title: '购买成功', icon: 'success' });
          // 如果是文件下载类型，直接下载
          if (product.file_type === 'download') {
            setTimeout(() => {
              Taro.showModal({
                title: '下载资料',
                content: '资料已准备好，点击确认开始下载',
                success: (downloadRes) => {
                  if (downloadRes.confirm) {
                    Taro.showToast({ title: '下载中...', icon: 'loading' });
                  }
                },
              });
            }, 1000);
          } else {
            // 百度网盘链接类型
            setTimeout(() => {
              Taro.showModal({
                title: '获取链接',
                content: `链接: ${product.file_url || 'https://pan.baidu.com/s/xxxxx'}\n提取码: abcd`,
                confirmText: '复制链接',
                success: (linkRes) => {
                  if (linkRes.confirm) {
                    Taro.setClipboardData({ data: 'https://pan.baidu.com/s/xxxxx 提取码: abcd' });
                  }
                },
              });
            }, 1000);
          }
        }
      },
    });
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
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
          {categories.map((cat) => (
            <View
              key={cat}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === cat ? 'bg-blue-500' : 'bg-gray-100'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              <Text className={selectedCategory === cat ? 'text-white' : 'text-gray-700'}>
                {cat}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 商品列表 */}
      <View className="p-4">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-8">
            <Text className="text-gray-500">暂无商品</Text>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="bg-white overflow-hidden"
                onClick={() => handleProductClick(product.id)}
              >
                <Image 
                  src={product.image}
                  className="w-full h-36"
                  mode="aspectFill"
                />
                <CardContent className="p-3">
                  <View className="flex flex-row items-center gap-1">
                    <Text className="text-sm font-medium line-clamp-1 flex-1">{product.name}</Text>
                    {product.product_type === 'virtual' && (
                      <Badge className="bg-purple-100 text-purple-600">
                        <Text className="text-xs">资料</Text>
                      </Badge>
                    )}
                  </View>
                  
                  <View className="flex flex-row gap-1 mt-2">
                    {product.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Text className="text-xs">{tag}</Text>
                      </Badge>
                    ))}
                  </View>
                  
                  <View className="flex flex-row items-center justify-between mt-2">
                    <View className="flex flex-row items-baseline">
                      <Text className="text-red-500 font-bold">¥{formatPrice(product.price)}</Text>
                      {product.original_price > product.price && (
                        <Text className="text-gray-400 text-xs line-through ml-1">
                          ¥{formatPrice(product.original_price)}
                        </Text>
                      )}
                    </View>
                    {product.file_size && (
                      <Text className="text-gray-400 text-xs">{product.file_size}</Text>
                    )}
                  </View>
                  
                  <View className="flex flex-row items-center justify-between mt-2">
                    <Text className="text-gray-400 text-xs">已售 {product.sales}</Text>
                    {product.product_type === 'virtual' ? (
                      <Button 
                        size="sm" 
                        className="bg-purple-500 px-3"
                        onClick={(e) => handleBuyVirtual(product, e)}
                      >
                        <Text className="text-white text-xs">立即购买</Text>
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-blue-500 px-3"
                        onClick={(e) => handleAddToCart(product.id, e)}
                      >
                        <Text className="text-white text-xs">加购</Text>
                      </Button>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default MallPage;
