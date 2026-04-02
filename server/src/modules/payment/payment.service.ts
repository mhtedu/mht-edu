import { Injectable } from '@nestjs/common';
import { query, getConnection } from '@/storage/database/mysql-client';
import * as crypto from 'crypto';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class PaymentService {
  private readonly appId = process.env.WECHAT_APPID || 'wx_test_appid';
  private readonly mchId = process.env.WECHAT_MCH_ID || '1234567890';
  private readonly apiKey = process.env.WECHAT_PAY_KEY || 'test_api_key_32_characters_long';
  private readonly notifyUrl = process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/payment/notify/wechat';

  /**
   * 创建会员支付订单
   */
  async createMembershipPayment(userId: number, planId: number) {
    // 获取套餐信息
    const plans = await executeQuery(`
      SELECT * FROM membership_plans WHERE id = ? AND is_active = 1
    `, [planId]);

    if (plans.length === 0) {
      throw new Error('套餐不存在');
    }

    const plan = plans[0] as any;

    // 生成支付单号
    const paymentNo = this.generatePaymentNo();

    // 创建支付记录 - 使用现有的表结构（membership_id字段）
    await executeQuery(`
      INSERT INTO payments (user_id, membership_id, amount, payment_no, status)
      VALUES (?, ?, ?, ?, 0)
    `, [userId, planId, plan.price, paymentNo]);

    // 获取用户openid
    const users = await executeQuery(`
      SELECT openid FROM users WHERE id = ?
    `, [userId]);

    const openid = (users[0] as any)?.openid || '';

    // 生产环境：调用微信支付统一下单
    // 开发环境：返回模拟数据
    if (process.env.NODE_ENV === 'production') {
      const payParams = await this.createWechatOrder({
        body: `棉花糖教育-${plan.name}`,
        outTradeNo: paymentNo,
        totalFee: Math.round(plan.price * 100), // 转换为分
        openid,
        attach: JSON.stringify({ type: 'membership', planId }),
      });
      return { paymentNo, ...payParams };
    } else {
      // 开发环境返回模拟数据
      return {
        paymentNo,
        mock: true,
        message: '开发环境，请使用 mock-pay 接口模拟支付',
      };
    }
  }

  /**
   * 创建商品支付订单
   */
  async createProductPayment(userId: number, productId: number, quantity: number) {
    // 获取商品信息
    const products = await executeQuery(`
      SELECT * FROM products WHERE id = ? AND is_active = 1
    `, [productId]);

    if (products.length === 0) {
      throw new Error('商品不存在');
    }

    const product = products[0] as any;

    if (product.stock < quantity) {
      throw new Error('库存不足');
    }

    const totalAmount = Number(product.price) * quantity;
    const paymentNo = this.generatePaymentNo();

    // 创建支付记录 - 使用现有的表结构（order_id字段）
    await executeQuery(`
      INSERT INTO payments (user_id, order_id, amount, payment_no, status)
      VALUES (?, ?, ?, ?, 0)
    `, [userId, productId, totalAmount, paymentNo]);

    // 获取用户openid
    const users = await executeQuery(`
      SELECT openid FROM users WHERE id = ?
    `, [userId]);

    const openid = (users[0] as any)?.openid || '';

    if (process.env.NODE_ENV === 'production') {
      const payParams = await this.createWechatOrder({
        body: `棉花糖教育-${product.name}`,
        outTradeNo: paymentNo,
        totalFee: Math.round(totalAmount * 100),
        openid,
        attach: JSON.stringify({ type: 'product', productId, quantity }),
      });
      return { paymentNo, ...payParams };
    } else {
      return {
        paymentNo,
        mock: true,
        message: '开发环境，请使用 mock-pay 接口模拟支付',
      };
    }
  }

  /**
   * 创建微信支付订单
   */
  private async createWechatOrder(params: {
    body: string;
    outTradeNo: string;
    totalFee: number;
    openid: string;
    attach: string;
  }) {
    // 构建统一下单参数
    const orderParams: Record<string, string> = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr(),
      body: params.body,
      out_trade_no: params.outTradeNo,
      total_fee: params.totalFee.toString(),
      spbill_create_ip: '127.0.0.1',
      notify_url: this.notifyUrl,
      trade_type: 'JSAPI',
      openid: params.openid,
      attach: params.attach,
    };

    // 生成签名
    orderParams.sign = this.generateSign(orderParams);

    // 实际调用微信支付API（这里省略HTTP请求代码）
    // const response = await this.callWechatApi('https://api.mch.weixin.qq.com/pay/unifiedorder', orderParams);

    // 模拟返回
    const prepayId = 'wx' + Date.now();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();

    // 生成小程序支付参数
    const paySign = this.generateSign({
      appId: this.appId,
      timeStamp: timestamp,
      nonceStr,
      package: `prepay_id=${prepayId}`,
      signType: 'MD5',
    });

    return {
      appId: this.appId,
      timeStamp: timestamp,
      nonceStr,
      package: `prepay_id=${prepayId}`,
      signType: 'MD5',
      paySign,
    };
  }

  /**
   * 处理微信支付回调
   */
  async handleWechatNotify(xml: any) {
    // 解析XML并验证签名（实际项目中需要实现）
    const data = this.parseXml(xml);

    // 验证签名
    const sign = data.sign;
    delete data.sign;
    const expectedSign = this.generateSign(data);

    if (sign !== expectedSign) {
      throw new Error('签名验证失败');
    }

    const paymentNo = data.out_trade_no;
    const transactionId = data.transaction_id;

    // 更新支付状态
    await this.updatePaymentSuccess(paymentNo, transactionId);

    return { success: true };
  }

  /**
   * 支付成功处理
   */
  private async updatePaymentSuccess(paymentNo: string, transactionId: string) {
    // 获取支付记录
    const payments = await executeQuery(`
      SELECT * FROM payments WHERE payment_no = ?
    `, [paymentNo]);

    if (payments.length === 0) {
      throw new Error('支付记录不存在');
    }

    const payment = payments[0] as any;

    if (payment.status === 1) {
      return; // 已处理过
    }

    // 更新支付状态
    await executeQuery(`
      UPDATE payments SET status = 1, transaction_id = ?, paid_at = NOW()
      WHERE payment_no = ?
    `, [transactionId, paymentNo]);

    // 根据支付类型处理（通过字段是否为空判断）
    if (payment.membership_id) {
      // 会员支付
      await this.handleMembershipPayment(payment);
    } else if (payment.order_id) {
      // 订单支付
      await this.handleOrderPayment(payment);
    }

    // 处理分佣
    await this.handleCommission(payment);
  }

  /**
   * 处理会员支付
   */
  private async handleMembershipPayment(payment: any) {
    // 获取套餐信息
    const plans = await executeQuery(`
      SELECT * FROM membership_plans WHERE id = ?
    `, [payment.membership_id]);

    const plan = plans[0] as any;

    // 计算过期时间
    const currentMember = await executeQuery(`
      SELECT membership_expire_at FROM users WHERE id = ?
    `, [payment.user_id]);

    let expireAt = new Date();
    const currentExpire = (currentMember[0] as any)?.membership_expire_at;
    if (currentExpire && new Date(currentExpire) > expireAt) {
      expireAt = new Date(currentExpire);
    }
    expireAt.setDate(expireAt.getDate() + plan.duration_days);

    // 更新用户会员状态
    await executeQuery(`
      UPDATE users SET membership_type = 1, membership_expire_at = ?
      WHERE id = ?
    `, [expireAt, payment.user_id]);
  }

  /**
   * 处理订单支付
   */
  private async handleOrderPayment(payment: any) {
    // 更新订单状态为已支付
    await executeQuery(`
      UPDATE orders SET status = 1 WHERE id = ?
    `, [payment.order_id]);
  }

  /**
   * 处理分佣
   */
  private async handleCommission(payment: any) {
    // 获取用户邀请关系
    const users = await executeQuery(`
      SELECT inviter_id, inviter_2nd_id, city_agent_id, affiliated_org_id, role
      FROM users WHERE id = ?
    `, [payment.user_id]);

    const user = users[0] as any;
    const amount = Number(payment.amount);

    // 一级分佣 20%
    if (user.inviter_id) {
      const commissionAmount = amount * 0.2;
      await executeQuery(`
        INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate)
        VALUES (?, ?, ?, 1, ?, 20.00)
      `, [user.inviter_id, payment.user_id, payment.id, commissionAmount]);
    }

    // 二级分佣 10%
    if (user.inviter_2nd_id) {
      const commissionAmount = amount * 0.1;
      await executeQuery(`
        INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate)
        VALUES (?, ?, ?, 2, ?, 10.00)
      `, [user.inviter_2nd_id, payment.user_id, payment.id, commissionAmount]);
    }

    // 城市代理分佣 5%
    if (user.city_agent_id) {
      const commissionAmount = amount * 0.05;
      await executeQuery(`
        INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate)
        VALUES (?, ?, ?, 3, ?, 5.00)
      `, [user.city_agent_id, payment.user_id, payment.id, commissionAmount]);
    }

    // 机构分佣 10%（如果是教师付款）
    if (user.role === 1 && user.affiliated_org_id) {
      const commissionAmount = amount * 0.1;
      await executeQuery(`
        INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate)
        VALUES (?, ?, ?, 4, ?, 10.00)
      `, [user.affiliated_org_id, payment.user_id, payment.id, commissionAmount]);
    }
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(userId: number, paymentNo: string) {
    const payments = await executeQuery(`
      SELECT p.*, mp.name as plan_name
      FROM payments p
      LEFT JOIN membership_plans mp ON p.membership_id = mp.id
      WHERE p.payment_no = ? AND p.user_id = ?
    `, [paymentNo, userId]);

    if (payments.length === 0) {
      throw new Error('支付记录不存在');
    }

    return payments[0];
  }

  /**
   * 获取支付记录列表
   */
  async getPaymentRecords(userId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const records = await executeQuery(`
      SELECT p.*, mp.name as plan_name
      FROM payments p
      LEFT JOIN membership_plans mp ON p.membership_id = mp.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM payments WHERE user_id = ?
    `, [userId]);

    return {
      list: records,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 模拟支付（开发环境测试用）
   */
  async mockPay(userId: number, paymentNo: string) {
    const payments = await executeQuery(`
      SELECT * FROM payments WHERE payment_no = ? AND user_id = ?
    `, [paymentNo, userId]);

    if (payments.length === 0) {
      throw new Error('支付记录不存在');
    }

    const payment = payments[0] as any;

    if (payment.status === 1) {
      throw new Error('该订单已支付');
    }

    // 模拟支付成功
    await this.updatePaymentSuccess(paymentNo, 'mock_transaction_' + Date.now());

    return { success: true, message: '模拟支付成功' };
  }

  /**
   * 生成支付单号
   */
  private generatePaymentNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `MHT${year}${month}${day}${random}`;
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(): string {
    return Math.random().toString(36).substring(2, 18);
  }

  /**
   * 生成签名
   */
  private generateSign(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys
      .filter(key => params[key] !== '' && params[key] !== undefined)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    const stringSignTemp = `${stringA}&key=${this.apiKey}`;
    return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
  }

  /**
   * 解析XML
   */
  private parseXml(xml: any): Record<string, string> {
    // 简单XML解析（实际项目建议使用 xml2js 库）
    const result: Record<string, string> = {};
    if (typeof xml === 'string') {
      const matches = xml.matchAll(/<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g);
      for (const match of matches) {
        const key = match[1] || match[3];
        const value = match[2] || match[4];
        if (key && value) {
          result[key] = value;
        }
      }
    }
    return result;
  }
}
