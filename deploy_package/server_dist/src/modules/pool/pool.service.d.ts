export declare class PoolService {
    releaseToPool(data: {
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
    getPoolOrders(params: {
        status?: number;
        subject?: string;
        cityCode?: string;
        latitude?: number;
        longitude?: number;
        radius?: number;
        page: number;
        pageSize: number;
    }): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    grabFromPool(poolId: number, teacherId: number): Promise<{
        success: boolean;
    }>;
    getPoolStats(): Promise<any>;
    cleanExpiredOrders(): Promise<{
        success: boolean;
        cleaned: number;
    }>;
    assignFromPool(poolId: number, teacherId: number): Promise<{
        success: boolean;
    }>;
}
