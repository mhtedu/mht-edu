interface SmsConfig {
    access_key_id: string;
    access_key_secret: string;
    sign_name: string;
    template_code: string;
    enabled: number;
}
export declare class SmsService {
    private config;
    getConfig(): Promise<SmsConfig | null>;
    updateConfig(config: Partial<SmsConfig>): Promise<boolean>;
    sendVerificationCode(mobile: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyCode(mobile: string, code: string): Promise<boolean>;
    private sendAliyunSms;
}
export {};
