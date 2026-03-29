import { ConfigService } from './config.service';
export declare class ConfigController {
    private readonly configService;
    constructor(configService: ConfigService);
    getPublicSiteConfig(): Promise<Record<string, string>>;
    getAllConfig(): Promise<import("mysql2").RowDataPacket[]>;
    getConfigByGroup(group: string): Promise<import("mysql2").RowDataPacket[]>;
    getConfig(key: string): Promise<{
        key: string;
        value: any;
    }>;
    updateConfig(body: {
        key: string;
        value: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    batchUpdateConfig(body: {
        configs: {
            key: string;
            value: string;
        }[];
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
