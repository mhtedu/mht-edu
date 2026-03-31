"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
const crypto = require("crypto");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let PaymentService = class PaymentService {
    constructor() {
        this.appId = process.env.WECHAT_APPID || 'wx_test_appid';
        this.mchId = process.env.WECHAT_MCH_ID || '1234567890';
        this.apiKey = process.env.WECHAT_PAY_KEY || 'test_api_key_32_characters_long';
        this.notifyUrl = process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/payment/notify/wechat';
    }
    async createMembershipPayment(userId, planId) {
        const plans = await executeQuery(`
      SELECT * FROM membership_plans WHERE id = ? AND is_active = 1
    `, [planId]);
        if (plans.length === 0) {
            throw new Error('套餐不存在');
        }
        const plan = plans[0];
        const paymentNo = this.generatePaymentNo();
        await executeQuery(`
      INSERT INTO payments (user_id, target_type, target_id, amount, payment_no, status)
      VALUES (?, 1, ?, ?, ?, 0)
    `, [userId, planId, plan.price, paymentNo]);
        const users = await executeQuery(`
      SELECT openid FROM users WHERE id = ?
    `, [userId]);
        const openid = users[0]?.openid || '';
        if (process.env.NODE_ENV === 'production') {
            const payParams = await this.createWechatOrder({
                body: `棉花糖教育-${plan.name}`,
                outTradeNo: paymentNo,
                totalFee: Math.round(plan.price * 100),
                openid,
                attach: JSON.stringify({ type: 'membership', planId }),
            });
            return { paymentNo, ...payParams };
        }
        else {
            return {
                paymentNo,
                mock: true,
                message: '开发环境，请使用 mock-pay 接口模拟支付',
            };
        }
    }
    async createProductPayment(userId, productId, quantity) {
        const products = await executeQuery(`
      SELECT * FROM products WHERE id = ? AND is_active = 1
    `, [productId]);
        if (products.length === 0) {
            throw new Error('商品不存在');
        }
        const product = products[0];
        if (product.stock < quantity) {
            throw new Error('库存不足');
        }
        const totalAmount = Number(product.price) * quantity;
        const paymentNo = this.generatePaymentNo();
        await executeQuery(`
      INSERT INTO payments (user_id, target_type, target_id, amount, payment_no, status)
      VALUES (?, 2, ?, ?, ?, 0)
    `, [userId, productId, totalAmount, paymentNo]);
        const users = await executeQuery(`
      SELECT openid FROM users WHERE id = ?
    `, [userId]);
        const openid = users[0]?.openid || '';
        if (process.env.NODE_ENV === 'production') {
            const payParams = await this.createWechatOrder({
                body: `棉花糖教育-${product.name}`,
                outTradeNo: paymentNo,
                totalFee: Math.round(totalAmount * 100),
                openid,
                attach: JSON.stringify({ type: 'product', productId, quantity }),
            });
            return { paymentNo, ...payParams };
        }
        else {
            return {
                paymentNo,
                mock: true,
                message: '开发环境，请使用 mock-pay 接口模拟支付',
            };
        }
    }
    async createWechatOrder(params) {
        const orderParams = {
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
        orderParams.sign = this.generateSign(orderParams);
        const prepayId = 'wx' + Date.now();
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonceStr = this.generateNonceStr();
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
    async handleWechatNotify(xml) {
        const data = this.parseXml(xml);
        const sign = data.sign;
        delete data.sign;
        const expectedSign = this.generateSign(data);
        if (sign !== expectedSign) {
            throw new Error('签名验证失败');
        }
        const paymentNo = data.out_trade_no;
        const transactionId = data.transaction_id;
        await this.updatePaymentSuccess(paymentNo, transactionId);
        return { success: true };
    }
    async updatePaymentSuccess(paymentNo, transactionId) {
        const payments = await executeQuery(`
      SELECT * FROM payments WHERE payment_no = ?
    `, [paymentNo]);
        if (payments.length === 0) {
            throw new Error('支付记录不存在');
        }
        const payment = payments[0];
        if (payment.status === 1) {
            return;
        }
        await executeQuery(`
      UPDATE payments SET status = 1, transaction_id = ?, paid_at = NOW()
      WHERE payment_no = ?
    `, [transactionId, paymentNo]);
        if (payment.target_type === 1) {
            await this.handleMembershipPayment(payment);
        }
        else if (payment.target_type === 2) {
            await this.handleProductPayment(payment);
        }
        await this.handleCommission(payment);
    }
    async handleMembershipPayment(payment) {
        const plans = await executeQuery(`
      SELECT * FROM membership_plans WHERE id = ?
    `, [payment.target_id]);
        const plan = plans[0];
        const currentMember = await executeQuery(`
      SELECT membership_expire_at FROM users WHERE id = ?
    `, [payment.user_id]);
        let expireAt = new Date();
        const currentExpire = currentMember[0]?.membership_expire_at;
        if (currentExpire && new Date(currentExpire) > expireAt) {
            expireAt = new Date(currentExpire);
        }
        expireAt.setDate(expireAt.getDate() + plan.duration_days);
        await executeQuery(`
      UPDATE users SET membership_type = 1, membership_expire_at = ?
      WHERE id = ?
    `, [expireAt, payment.user_id]);
    }
    async handleProductPayment(payment) {
        await executeQuery(`
      UPDATE products SET stock = stock - 1, sales = sales + 1
      WHERE id = ?
    `, [payment.target_id]);
    }
    async handleCommission(payment) {
        const users = await executeQuery(`
      SELECT inviter_id, inviter_2nd_id, city_agent_id, affiliated_org_id, role
      FROM users WHERE id = ?
    `, [payment.user_id]);
        const user = users[0];
        const amount = Number(payment.amount);
        if (user.inviter_id) {
            const commissionAmount = amount * 0.2;
            await executeQuery(`
        INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate)
        VALUES (?, ?, ?, 1, ?, 20.00)
      `, [user.inviter_id, payment.user_id, payment.id, commissionAmount]);
        }
        if (user.inviter_2nd_id) {
            const commissionAmount = amount * 0.1;
            await executeQuery(`
        INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate)
        VALUES (?, ?, ?, 2, ?, 10.00)
      `, [user.inviter_2nd_id, payment.user_id, payment.id, commissionAmount]);
        }
        if (user.city_agent_id) {
            const commissionAmount = amount * 0.05;
            await executeQuery(`
        INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate)
        VALUES (?, ?, ?, 3, ?, 5.00)
      `, [user.city_agent_id, payment.user_id, payment.id, commissionAmount]);
        }
        if (user.role === 1 && user.affiliated_org_id) {
            const commissionAmount = amount * 0.1;
            await executeQuery(`
        INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate)
        VALUES (?, ?, ?, 4, ?, 10.00)
      `, [user.affiliated_org_id, payment.user_id, payment.id, commissionAmount]);
        }
    }
    async getPaymentStatus(userId, paymentNo) {
        const payments = await executeQuery(`
      SELECT p.*, mp.name as plan_name, pr.name as product_name
      FROM payments p
      LEFT JOIN membership_plans mp ON p.target_type = 1 AND p.target_id = mp.id
      LEFT JOIN products pr ON p.target_type = 2 AND p.target_id = pr.id
      WHERE p.payment_no = ? AND p.user_id = ?
    `, [paymentNo, userId]);
        if (payments.length === 0) {
            throw new Error('支付记录不存在');
        }
        return payments[0];
    }
    async getPaymentRecords(userId, page, pageSize) {
        const offset = (page - 1) * pageSize;
        const records = await executeQuery(`
      SELECT p.*, mp.name as plan_name, pr.name as product_name
      FROM payments p
      LEFT JOIN membership_plans mp ON p.target_type = 1 AND p.target_id = mp.id
      LEFT JOIN products pr ON p.target_type = 2 AND p.target_id = pr.id
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
    async mockPay(userId, paymentNo) {
        const payments = await executeQuery(`
      SELECT * FROM payments WHERE payment_no = ? AND user_id = ?
    `, [paymentNo, userId]);
        if (payments.length === 0) {
            throw new Error('支付记录不存在');
        }
        const payment = payments[0];
        if (payment.status === 1) {
            throw new Error('该订单已支付');
        }
        await this.updatePaymentSuccess(paymentNo, 'mock_transaction_' + Date.now());
        return { success: true, message: '模拟支付成功' };
    }
    generatePaymentNo() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `MHT${year}${month}${day}${random}`;
    }
    generateNonceStr() {
        return Math.random().toString(36).substring(2, 18);
    }
    generateSign(params) {
        const sortedKeys = Object.keys(params).sort();
        const stringA = sortedKeys
            .filter(key => params[key] !== '' && params[key] !== undefined)
            .map(key => `${key}=${params[key]}`)
            .join('&');
        const stringSignTemp = `${stringA}&key=${this.apiKey}`;
        return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
    }
    parseXml(xml) {
        const result = {};
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
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)()
], PaymentService);
//# sourceMappingURL=payment.service.js.map