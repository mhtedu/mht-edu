import { PaymentService } from './payment.service';
import { Request as ExpressRequest, Response } from 'express';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    createMembershipPayment(req: any, body: {
        planId: number;
    }): Promise<{
        appId: string;
        timeStamp: string;
        nonceStr: string;
        package: string;
        signType: string;
        paySign: string;
        paymentNo: string;
        mock?: undefined;
        message?: undefined;
    } | {
        paymentNo: string;
        mock: boolean;
        message: string;
    }>;
    createProductPayment(req: any, body: {
        productId: number;
        quantity: number;
    }): Promise<{
        appId: string;
        timeStamp: string;
        nonceStr: string;
        package: string;
        signType: string;
        paySign: string;
        paymentNo: string;
        mock?: undefined;
        message?: undefined;
    } | {
        paymentNo: string;
        mock: boolean;
        message: string;
    }>;
    wechatNotify(req: ExpressRequest, res: Response): Promise<void>;
    getPaymentStatus(req: any, paymentNo: string): Promise<any>;
    getPaymentRecords(req: any, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    mockPay(req: any, body: {
        paymentNo: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
