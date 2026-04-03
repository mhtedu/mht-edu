import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { query, update as dbUpdate } from '@/storage/database/mysql-client';
import * as fs from 'fs';
import * as path from 'path';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

async function executeUpdate(sql: string, params: any[] = []): Promise<any> {
  return dbUpdate(sql, params);
}

@Injectable()
export class ResourceService {
  private readonly uploadDir = '/www/wwwroot/mht-edu/uploads/resources';

  /**
   * 获取资源分类列表
   */
  async getCategories() {
    const categories = await executeQuery(`
      SELECT * FROM resource_categories 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, id ASC
    `);
    return categories;
  }

  /**
   * 获取资源列表
   */
  async getResourceList(params: {
    category?: string;
    type?: string;
    keyword?: string;
    priceType?: string;
    sort?: string;
    page: number;
    pageSize: number;
    userId?: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = ['r.status = 1', 'r.is_active = 1'];
    const sqlParams: any[] = [];

    // 分类筛选
    if (params.category && params.category !== 'all') {
      conditions.push('r.category_id = ?');
      sqlParams.push(parseInt(params.category));
    }

    // 类型筛选
    if (params.type && params.type !== 'all') {
      conditions.push('r.type = ?');
      sqlParams.push(params.type);
    }

    // 关键词搜索
    if (params.keyword) {
      conditions.push('(r.title LIKE ? OR r.description LIKE ? OR r.tags LIKE ?)');
      sqlParams.push(`%${params.keyword}%`, `%${params.keyword}%`, `%${params.keyword}%`);
    }

    // 价格类型筛选
    if (params.priceType === 'free') {
      conditions.push('r.is_free = 1');
    } else if (params.priceType === 'paid') {
      conditions.push('r.is_free = 0');
    }

    const whereClause = conditions.join(' AND ');

    // 排序
    let orderBy = 'r.created_at DESC';
    if (params.sort === 'popular') {
      orderBy = 'r.download_count DESC, r.view_count DESC';
    } else if (params.sort === 'price_asc') {
      orderBy = 'r.price ASC';
    } else if (params.sort === 'price_desc') {
      orderBy = 'r.price DESC';
    }

    const resources = await executeQuery(`
      SELECT 
        r.*,
        c.name as category_name,
        u.nickname as author_name,
        u.avatar as author_avatar,
        tp.real_name as author_real_name,
        ${params.userId ? `EXISTS(SELECT 1 FROM resource_purchases WHERE resource_id = r.id AND user_id = ?) as has_purchased` : '0 as has_purchased'}
      FROM resources r
      LEFT JOIN resource_categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN teacher_profiles tp ON r.author_id = tp.user_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, params.userId ? [params.userId, ...sqlParams, params.pageSize, offset] : [...sqlParams, params.pageSize, offset]);

    // 获取总数
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM resources r WHERE ${whereClause}
    `, sqlParams);

    return {
      list: resources,
      total: countResult[0]?.total || 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * 获取资源详情
   */
  async getResourceDetail(resourceId: number, userId?: number) {
    const resources = await executeQuery(`
      SELECT 
        r.*,
        c.name as category_name,
        u.nickname as author_name,
        u.avatar as author_avatar,
        tp.real_name as author_real_name,
        tp.subjects as author_subjects,
        tp.rating as author_rating
      FROM resources r
      LEFT JOIN resource_categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN teacher_profiles tp ON r.author_id = tp.user_id
      WHERE r.id = ? AND r.status = 1 AND r.is_active = 1
    `, [resourceId]);

    if (resources.length === 0) {
      throw new NotFoundException('资源不存在');
    }

    const resource = resources[0];

    // 增加浏览量
    await executeUpdate(`
      UPDATE resources SET view_count = view_count + 1 WHERE id = ?
    `, [resourceId]);

    // 检查用户是否已购买
    if (userId) {
      const purchases = await executeQuery(`
        SELECT * FROM resource_purchases WHERE resource_id = ? AND user_id = ?
      `, [resourceId, userId]);
      resource.has_purchased = purchases.length > 0;
    } else {
      resource.has_purchased = false;
    }

    // 获取评价统计
    const reviewStats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as avg_rating
      FROM resource_reviews 
      WHERE resource_id = ?
    `, [resourceId]);

    resource.review_stats = {
      total: reviewStats[0]?.total || 0,
      avg_rating: parseFloat(reviewStats[0]?.avg_rating || 0).toFixed(1),
    };

    return resource;
  }

  /**
   * 上传资源
   */
  async uploadResource(userId: number, file: Express.Multer.File, data: any) {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // 生成文件名
    const ext = path.extname(file.originalname);
    const fileName = `resource_${userId}_${Date.now()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    // 保存文件
    fs.writeFileSync(filePath, file.buffer);

    // 文件访问URL
    const fileUrl = `/uploads/resources/${fileName}`;

    // 计算平台佣金比例
    const commissionRate = await this.getCommissionRate();

    // 插入数据库
    const result = await executeUpdate(`
      INSERT INTO resources (
        title, description, category_id, type, author_id,
        file_url, file_name, file_size, file_ext,
        price, is_free, cover_image, tags, 
        commission_rate, status, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())
    `, [
      data.title,
      data.description || '',
      data.category_id,
      data.type || 'document',
      userId,
      fileUrl,
      file.originalname,
      file.size,
      ext.replace('.', ''),
      data.is_free ? 0 : data.price,
      data.is_free ? 1 : 0,
      data.cover_image || '',
      JSON.stringify(data.tags || []),
      commissionRate,
    ]);

    return {
      success: true,
      resourceId: result.insertId,
      message: '资源上传成功',
    };
  }

  /**
   * 更新资源
   */
  async updateResource(resourceId: number, userId: number, data: any) {
    // 验证权限
    const resources = await executeQuery(`
      SELECT * FROM resources WHERE id = ? AND author_id = ?
    `, [resourceId, userId]);

    if (resources.length === 0) {
      throw new ForbiddenException('无权修改此资源');
    }

    await executeUpdate(`
      UPDATE resources SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category_id = COALESCE(?, category_id),
        price = COALESCE(?, price),
        is_free = COALESCE(?, is_free),
        cover_image = COALESCE(?, cover_image),
        tags = COALESCE(?, tags),
        updated_at = NOW()
      WHERE id = ?
    `, [
      data.title,
      data.description,
      data.category_id,
      data.price,
      data.is_free,
      data.cover_image,
      data.tags ? JSON.stringify(data.tags) : null,
      resourceId,
    ]);

    return { success: true, message: '资源更新成功' };
  }

  /**
   * 删除资源
   */
  async deleteResource(resourceId: number, userId: number) {
    // 验证权限
    const resources = await executeQuery(`
      SELECT * FROM resources WHERE id = ? AND author_id = ?
    `, [resourceId, userId]);

    if (resources.length === 0) {
      throw new ForbiddenException('无权删除此资源');
    }

    // 软删除
    await executeUpdate(`
      UPDATE resources SET is_active = 0, updated_at = NOW() WHERE id = ?
    `, [resourceId]);

    return { success: true, message: '资源已删除' };
  }

  /**
   * 购买资源
   */
  async purchaseResource(resourceId: number, userId: number) {
    // 获取资源信息
    const resources = await executeQuery(`
      SELECT * FROM resources WHERE id = ? AND status = 1 AND is_active = 1
    `, [resourceId]);

    if (resources.length === 0) {
      throw new NotFoundException('资源不存在');
    }

    const resource = resources[0];

    // 检查是否已购买
    const existingPurchases = await executeQuery(`
      SELECT * FROM resource_purchases WHERE resource_id = ? AND user_id = ?
    `, [resourceId, userId]);

    if (existingPurchases.length > 0) {
      throw new BadRequestException('您已购买过此资源');
    }

    // 检查是否是自己的资源
    if (resource.author_id === userId) {
      throw new BadRequestException('不能购买自己的资源');
    }

    // 免费资源直接添加购买记录
    if (resource.is_free || resource.price === 0) {
      await executeUpdate(`
        INSERT INTO resource_purchases (resource_id, user_id, price, actual_amount, author_income, platform_commission, status, created_at)
        VALUES (?, ?, 0, 0, 0, 0, 1, NOW())
      `, [resourceId, userId]);

      // 增加下载量
      await executeUpdate(`
        UPDATE resources SET download_count = download_count + 1 WHERE id = ?
      `, [resourceId]);

      return { success: true, message: '获取成功', isFree: true };
    }

    // 付费资源 - 创建支付订单
    const actualAmount = parseFloat(resource.price);
    const commissionRate = parseFloat(resource.commission_rate) || 0.1;
    const platformCommission = actualAmount * commissionRate;
    const authorIncome = actualAmount - platformCommission;

    // 生成订单号
    const orderNo = `RES${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // 创建购买记录（待支付）
    const result = await executeUpdate(`
      INSERT INTO resource_purchases (
        order_no, resource_id, user_id, 
        price, actual_amount, author_income, platform_commission,
        commission_rate, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
    `, [
      orderNo,
      resourceId,
      userId,
      resource.price,
      actualAmount,
      authorIncome,
      platformCommission,
      commissionRate,
    ]);

    return {
      success: true,
      orderId: result.insertId,
      orderNo,
      amount: actualAmount,
      message: '订单创建成功，请完成支付',
    };
  }

  /**
   * 确认支付（支付成功后调用）
   */
  async confirmPayment(orderId: number) {
    const purchases = await executeQuery(`
      SELECT rp.*, r.author_id, r.id as resource_id
      FROM resource_purchases rp
      LEFT JOIN resources r ON rp.resource_id = r.id
      WHERE rp.id = ? AND rp.status = 0
    `, [orderId]);

    if (purchases.length === 0) {
      throw new NotFoundException('订单不存在或已支付');
    }

    const purchase = purchases[0];

    // 更新购买状态
    await executeUpdate(`
      UPDATE resource_purchases SET status = 1, paid_at = NOW() WHERE id = ?
    `, [orderId]);

    // 增加下载量
    await executeUpdate(`
      UPDATE resources SET download_count = download_count + 1 WHERE id = ?
    `, [purchase.resource_id]);

    // 记录作者收益
    if (purchase.author_income > 0) {
      await executeUpdate(`
        INSERT INTO resource_earnings (user_id, resource_id, purchase_id, amount, status, created_at)
        VALUES (?, ?, ?, ?, 0, NOW())
      `, [purchase.author_id, purchase.resource_id, orderId, purchase.author_income]);
    }

    return { success: true, message: '支付成功' };
  }

  /**
   * 获取下载链接
   */
  async getDownloadUrl(resourceId: number, userId: number) {
    // 检查购买权限
    const purchases = await executeQuery(`
      SELECT rp.*, r.file_url, r.file_name
      FROM resource_purchases rp
      LEFT JOIN resources r ON rp.resource_id = r.id
      WHERE rp.resource_id = ? AND rp.user_id = ? AND rp.status = 1
    `, [resourceId, userId]);

    if (purchases.length === 0) {
      // 检查是否是自己的资源
      const resources = await executeQuery(`
        SELECT file_url, file_name FROM resources WHERE id = ? AND author_id = ?
      `, [resourceId, userId]);

      if (resources.length === 0) {
        throw new ForbiddenException('您没有权限下载此资源');
      }

      return {
        success: true,
        fileUrl: resources[0].file_url,
        fileName: resources[0].file_name,
      };
    }

    return {
      success: true,
      fileUrl: purchases[0].file_url,
      fileName: purchases[0].file_name,
    };
  }

  /**
   * 获取用户上传的资源
   */
  async getUserResources(userId: number, params: { status?: string; page: number; pageSize: number }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = ['author_id = ?'];
    const sqlParams: any[] = [userId];

    if (params.status === 'active') {
      conditions.push('status = 1 AND is_active = 1');
    } else if (params.status === 'inactive') {
      conditions.push('is_active = 0');
    }

    const whereClause = conditions.join(' AND ');

    const resources = await executeQuery(`
      SELECT r.*, c.name as category_name,
        (SELECT COUNT(*) FROM resource_purchases WHERE resource_id = r.id AND status = 1) as sales_count
      FROM resources r
      LEFT JOIN resource_categories c ON r.category_id = c.id
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM resources WHERE ${whereClause}
    `, sqlParams);

    return {
      list: resources,
      total: countResult[0]?.total || 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * 获取用户购买的资源
   */
  async getUserPurchases(userId: number, params: { page: number; pageSize: number }) {
    const offset = (params.page - 1) * params.pageSize;

    const purchases = await executeQuery(`
      SELECT 
        rp.*, 
        r.title, r.cover_image, r.type, r.file_ext,
        u.nickname as author_name
      FROM resource_purchases rp
      LEFT JOIN resources r ON rp.resource_id = r.id
      LEFT JOIN users u ON r.author_id = u.id
      WHERE rp.user_id = ? AND rp.status = 1
      ORDER BY rp.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, params.pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM resource_purchases WHERE user_id = ? AND status = 1
    `, [userId]);

    return {
      list: purchases,
      total: countResult[0]?.total || 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * 获取资源收入统计
   */
  async getResourceEarnings(userId: number) {
    // 总收益
    const totalEarnings = await executeQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM resource_earnings
      WHERE user_id = ?
    `, [userId]);

    // 待结算收益
    const pendingEarnings = await executeQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM resource_earnings
      WHERE user_id = ? AND status = 0
    `, [userId]);

    // 已结算收益
    const settledEarnings = await executeQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM resource_earnings
      WHERE user_id = ? AND status = 1
    `, [userId]);

    // 销售统计
    const salesStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_sales,
        (SELECT COUNT(DISTINCT resource_id) FROM resource_purchases rp 
         LEFT JOIN resources r ON rp.resource_id = r.id 
         WHERE r.author_id = ? AND rp.status = 1) as sold_resources
      FROM resource_purchases rp
      LEFT JOIN resources r ON rp.resource_id = r.id
      WHERE r.author_id = ? AND rp.status = 1
    `, [userId, userId]);

    // 最近收益记录
    const recentEarnings = await executeQuery(`
      SELECT 
        re.*, 
        r.title as resource_title,
        u.nickname as buyer_name
      FROM resource_earnings re
      LEFT JOIN resources r ON re.resource_id = r.id
      LEFT JOIN resource_purchases rp ON re.purchase_id = rp.id
      LEFT JOIN users u ON rp.user_id = u.id
      WHERE re.user_id = ?
      ORDER BY re.created_at DESC
      LIMIT 10
    `, [userId]);

    return {
      totalEarnings: totalEarnings[0]?.total || 0,
      pendingEarnings: pendingEarnings[0]?.total || 0,
      settledEarnings: settledEarnings[0]?.total || 0,
      totalSales: salesStats[0]?.total_sales || 0,
      soldResources: salesStats[0]?.sold_resources || 0,
      recentEarnings,
    };
  }

  /**
   * 获取平台佣金比例
   */
  private async getCommissionRate(): Promise<number> {
    const configs = await executeQuery(`
      SELECT config_value FROM system_configs WHERE config_key = 'resource_commission_rate'
    `);
    return configs.length > 0 ? parseFloat(configs[0].config_value) : 0.1; // 默认10%
  }

  /**
   * 初始化数据库表
   */
  async initTables() {
    // 创建资源分类表
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS resource_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL COMMENT '分类名称',
        icon VARCHAR(255) COMMENT '分类图标',
        sort_order INT DEFAULT 0 COMMENT '排序',
        is_active TINYINT DEFAULT 1 COMMENT '是否启用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源分类表'
    `);

    // 创建资源表
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL COMMENT '资源标题',
        description TEXT COMMENT '资源描述',
        category_id INT NOT NULL COMMENT '分类ID',
        type VARCHAR(20) DEFAULT 'document' COMMENT '类型: document/video/audio/other',
        author_id INT NOT NULL COMMENT '作者ID',
        file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
        file_name VARCHAR(200) COMMENT '原文件名',
        file_size INT COMMENT '文件大小(字节)',
        file_ext VARCHAR(20) COMMENT '文件扩展名',
        cover_image VARCHAR(500) COMMENT '封面图',
        price DECIMAL(10,2) DEFAULT 0 COMMENT '价格',
        is_free TINYINT DEFAULT 1 COMMENT '是否免费',
        tags JSON COMMENT '标签',
        view_count INT DEFAULT 0 COMMENT '浏览量',
        download_count INT DEFAULT 0 COMMENT '下载量',
        commission_rate DECIMAL(5,4) DEFAULT 0.1000 COMMENT '佣金比例',
        status TINYINT DEFAULT 1 COMMENT '状态: 0待审核 1已发布 2已下架',
        is_active TINYINT DEFAULT 1 COMMENT '是否有效',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        INDEX idx_author (author_id),
        INDEX idx_status (status, is_active),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教学资源表'
    `);

    // 创建购买记录表
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS resource_purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(50) COMMENT '订单号',
        resource_id INT NOT NULL COMMENT '资源ID',
        user_id INT NOT NULL COMMENT '购买者ID',
        price DECIMAL(10,2) DEFAULT 0 COMMENT '原价',
        actual_amount DECIMAL(10,2) DEFAULT 0 COMMENT '实付金额',
        author_income DECIMAL(10,2) DEFAULT 0 COMMENT '作者收益',
        platform_commission DECIMAL(10,2) DEFAULT 0 COMMENT '平台佣金',
        commission_rate DECIMAL(5,4) DEFAULT 0 COMMENT '佣金比例',
        status TINYINT DEFAULT 0 COMMENT '状态: 0待支付 1已支付 2已退款',
        paid_at DATETIME COMMENT '支付时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_resource (resource_id),
        INDEX idx_user (user_id),
        INDEX idx_order_no (order_no),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源购买记录表'
    `);

    // 创建收益记录表
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS resource_earnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '用户ID',
        resource_id INT NOT NULL COMMENT '资源ID',
        purchase_id INT NOT NULL COMMENT '购买记录ID',
        amount DECIMAL(10,2) DEFAULT 0 COMMENT '收益金额',
        status TINYINT DEFAULT 0 COMMENT '状态: 0待结算 1已结算',
        settled_at DATETIME COMMENT '结算时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源收益记录表'
    `);

    // 创建资源评价表
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS resource_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource_id INT NOT NULL COMMENT '资源ID',
        user_id INT NOT NULL COMMENT '用户ID',
        rating TINYINT NOT NULL COMMENT '评分1-5',
        content TEXT COMMENT '评价内容',
        status TINYINT DEFAULT 1 COMMENT '状态',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_resource (resource_id),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源评价表'
    `);

    // 插入默认分类
    await executeUpdate(`
      INSERT IGNORE INTO resource_categories (id, name, icon, sort_order) VALUES
      (1, '课件PPT', 'ppt', 1),
      (2, '教案设计', 'file-text', 2),
      (3, '习题试卷', 'file-question', 3),
      (4, '教学视频', 'video', 4),
      (5, '音频素材', 'audio', 5),
      (6, '图片素材', 'image', 6),
      (7, '教学工具', 'tool', 7),
      (8, '其他资源', 'folder', 8)
    `);

    return { success: true, message: '资源相关表创建成功' };
  }
}
