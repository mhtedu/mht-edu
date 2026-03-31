import { SmsService } from './sms.service';
export declare class SmsController {
    private readonly smsService;
    constructor(smsService: SmsService);
    getConfig(): Promise<{
        access_key_id: string;
        access_key_secret: string;
        sign_name: string;
        template_code: string;
        enabled: number;
    }>;
    updateConfig(body: {
        access_key_id?: string;
        access_key_secret?: string;
        sign_name?: string;
        template_code?: string;
        enabled?: number;
    }): Promise<{
        success: boolean;
    }>;
    sendCode(body: {
        mobile: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyCode(body: {
        mobile: string;
        code: string;
    }): Promise<{
        success: boolean;
    }>;
    testSms(body: {
        mobile: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
