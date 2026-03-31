import { PoolService } from './pool.service';
export declare class PoolController {
    private readonly poolService;
    constructor(poolService: PoolService);
    getPoolOrders(subject?: string, cityCode?: string, latitude?: string, longitude?: string, radius?: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    grabFromPool(poolId: string, req: any): Promise<{
        success: boolean;
    }>;
    getPoolStats(): Promise<any>;
    releaseToPool(body: {
        orderId: number;
        originalParentId: number;
        originalTeacherId?: number;
        releaseReason: string;
        releaseType: number;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    cleanExpiredOrders(): Promise<{
        success: boolean;
        cleaned: number;
    }>;
    assignFromPool(poolId: string, body: {
        teacherId: number;
    }): Promise<{
        success: boolean;
    }>;
}
