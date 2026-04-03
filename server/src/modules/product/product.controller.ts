import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import * as db from '@/storage/database/mysql-client';

@Controller('products')
export class ProductController {

  /**
   * 获取商品分类列表
   */
  @Get('categories')
  @Public()
  async getCategories() {
    try {
      const [categories] = await db.query(`
        SELECT id, name, sort_order, status
        FROM product_categories
        WHERE status = 1
        ORDER BY sort_order ASC, id ASC
      `) as [any[], any];
      return categories;
    } catch (error) {
      console.error('获取商品分类失败:', error);
      return [];
    }
  }

  /**
   * 获取商品列表
   */
  @Get('list')
  @Public()
  async getProductList(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('category_id') categoryId = '',
    @Query('keyword') keyword = '',
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    let whereClause = 'WHERE p.status = 1';
    const params: any[] = [];

    if (categoryId) {
      whereClause += ' AND p.category_id = ?';
      params.push(parseInt(categoryId));
    }

    if (keyword) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    try {
      const [products] = await db.query(`
        SELECT 
          p.id, p.category_id, p.name, p.description, p.price, p.original_price,
          p.image, p.images, p.stock, p.sales, p.virtual_sales,
          (p.virtual_sales + p.sales) as total_sales,
          p.type, p.delivery_type, p.status, p.commission_1_rate, p.commission_2_rate,
          pc.name as category_name
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        ${whereClause}
        ORDER BY p.sales DESC, p.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]) as [any[], any];

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM products p ${whereClause}`,
        params
      ) as [any[], any];

      return {
        list: products,
        total: countResult[0]?.total || 0,
        page: pageNum,
        pageSize: pageSizeNum
      };
    } catch (error) {
      console.error('获取商品列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 获取商品详情
   */
  @Get(':id')
  @Public()
  async getProductDetail(@Param('id') id: string) {
    try {
      const [products] = await db.query(`
        SELECT 
          p.id, p.category_id, p.name, p.description, p.price, p.original_price,
          p.image, p.images, p.stock, p.sales, p.virtual_sales,
          (p.virtual_sales + p.sales) as total_sales,
          p.type, p.delivery_type, p.delivery_info,
          p.file_url, p.pan_url, p.commission_1_rate, p.commission_2_rate,
          p.detail_content, p.video_url, p.status, p.created_at,
          pc.name as category_name
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.id = ?
      `, [parseInt(id)]) as [any[], any];

      if (!products || products.length === 0) {
        return { success: false, message: '商品不存在' };
      }

      return products[0];
    } catch (error) {
      console.error('获取商品详情失败:', error);
      return { success: false, message: '获取商品详情失败' };
    }
  }
}
