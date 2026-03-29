export declare class ConfigService {
    private configCache;
    private cacheTime;
    private readonly CACHE_TTL;
    getAllConfig(): Promise<import("mysql2").RowDataPacket[]>;
    getConfigByGroup(group: string): Promise<import("mysql2").RowDataPacket[]>;
    getConfig(key: string): Promise<{
        key: string;
        value: any;
    }>;
    getConfigValue(key: string, defaultValue?: string): Promise<string>;
    getConfigNumber(key: string, defaultValue?: number): Promise<number>;
    updateConfig(key: string, value: string): Promise<{
        success: boolean;
        message: string;
    }>;
    batchUpdateConfig(configs: {
        key: string;
        value: string;
    }[]): Promise<{
        success: boolean;
        message: string;
    }>;
    getPublicSiteConfig(): Promise<Record<string, string>>;
    getWechatPayConfig(): Promise<{
        appId: string;
        mchId: string;
        apiKey: string;
        cert: string;
        key: string;
    }>;
    clearCache(): void;
}
