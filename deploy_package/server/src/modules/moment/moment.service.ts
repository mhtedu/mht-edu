import { Injectable } from '@nestjs/common';
import { query, insert, update } from '@/storage/database/mysql-client';
import { S3Storage } from 'coze-coding-dev-sdk';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class MomentService {
  private storage: S3Storage;

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
  }

  /**
   * 上传文件到对象存储
   */
  async uploadFile(file: Express.Multer.File): Promise<{ key: string; url: string }> {
    // 获取文件内容
    let buffer: Buffer;
    if (file.path) {
      // 小程序端：读取临时文件
      const fs = await import('fs/promises');
      buffer = await fs.readFile(file.path);
    } else if (file.buffer) {
      // H5端：直接使用 buffer
      buffer = file.buffer;
    } else {
      throw new Error('无法获取文件内容');
    }

    // 上传到对象存储
    const key = await this.storage.uploadFile({
      fileContent: buffer,
      fileName: `moments/${Date.now()}_${file.originalname}`,
      contentType: file.mimetype,
    });

    // 生成签名 URL
    const url = await this.storage.generatePresignedUrl({
      key,
      expireTime: 2592000, // 30天
    });

    return { key, url };
  }

  /**
   * 发布动态
   */
  async createMoment(userId: number, data: { content: string; media: { type: string; key: string }[] }) {
    const id = await insert(
      `INSERT INTO moments (user_id, content, media, created_at) VALUES (?, ?, ?, NOW())`,
      [userId, data.content, JSON.stringify(data.media)]
    );

    return { id };
  }

  /**
   * 获取动态列表
   */
  async getMoments(userId?: number, page: number = 1, pageSize: number = 10) {
    let sql = `
      SELECT m.*, u.nickname, u.avatar
      FROM moments m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.status = 1
    `;
    const params: any[] = [];

    if (userId) {
      sql += ' AND m.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const moments = await executeQuery(sql, params);

    // 解析 media JSON
    return moments.map((m: any) => ({
      ...m,
      media: JSON.parse(m.media || '[]'),
    }));
  }

  /**
   * 点赞动态
   */
  async likeMoment(userId: number, momentId: number) {
    // 检查是否已点赞
    const likes = await executeQuery(
      'SELECT id FROM moment_likes WHERE user_id = ? AND moment_id = ?',
      [userId, momentId]
    );

    if (likes.length > 0) {
      throw new Error('已经点赞过了');
    }

    // 添加点赞记录
    await insert(
      'INSERT INTO moment_likes (user_id, moment_id, created_at) VALUES (?, ?, NOW())',
      [userId, momentId]
    );

    // 更新点赞数
    await update(
      'UPDATE moments SET like_count = like_count + 1 WHERE id = ?',
      [momentId]
    );

    return { success: true };
  }

  /**
   * 评论动态
   */
  async commentMoment(userId: number, momentId: number, content: string) {
    const id = await insert(
      'INSERT INTO moment_comments (moment_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
      [momentId, userId, content]
    );

    // 更新评论数
    await update(
      'UPDATE moments SET comment_count = comment_count + 1 WHERE id = ?',
      [momentId]
    );

    return { id };
  }

  /**
   * 获取动态评论
   */
  async getComments(momentId: number, page: number = 1, pageSize: number = 20) {
    const comments = await executeQuery(
      `SELECT mc.*, u.nickname, u.avatar
       FROM moment_comments mc
       LEFT JOIN users u ON mc.user_id = u.id
       WHERE mc.moment_id = ?
       ORDER BY mc.created_at DESC
       LIMIT ? OFFSET ?`,
      [momentId, pageSize, (page - 1) * pageSize]
    );

    return comments;
  }
}
