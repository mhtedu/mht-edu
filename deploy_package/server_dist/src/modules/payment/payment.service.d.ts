export declare class PaymentService {
    private readonly appId;
    private readonly mchId;
    private readonly apiKey;
    private readonly notifyUrl;
    createMembershipPayment(userId: number, planId: number): Promise<{
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
    createProductPayment(userId: number, productId: number, quantity: number): Promise<{
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
    private createWechatOrder;
    handleWechatNotify(xml: any): Promise<{
        success: boolean;
    }>;
    private updatePaymentSuccess;
    private handleMembershipPayment;
    private handleProductPayment;
    private handleCommission;
    getPaymentStatus(userId: number, paymentNo: string): Promise<any>;
    getPaymentRecords(userId: number, page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    mockPay(userId: number, paymentNo: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generatePaymentNo;
    private generateNonceStr;
    private generateSign;
    private parseXml;
}
