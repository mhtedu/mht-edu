export declare class AdminService {
    getStats(): Promise<{
        users: any;
        orders: any;
        payments: any;
        commissions: any;
    }>;
    getTrendStats(days: number): Promise<{
        users: any[];
        orders: any[];
        payments: any[];
    }>;
    getUsers(page: number, pageSize: number, role?: number, keyword?: string, status?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getUserDetail(id: number): Promise<any>;
    updateUserStatus(id: number, status: number, reason?: string): Promise<{
        success: boolean;
    }>;
    updateUserRole(id: number, role: number): Promise<{
        success: boolean;
    }>;
    grantMembership(id: number, days: number): Promise<{
        success: boolean;
        expireAt: Date;
    }>;
    getTeachers(page: number, pageSize: number, verifyStatus?: number, keyword?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    verifyTeacher(id: number, status: number, reason?: string): Promise<{
        success: boolean;
    }>;
    getOrders(page: number, pageSize: number, status?: number, keyword?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getOrderDetail(id: number): Promise<any>;
    updateOrderStatus(id: number, status: number): Promise<{
        success: boolean;
    }>;
    matchOrder(id: number, teacherId: number): Promise<{
        success: boolean;
    }>;
    deleteOrder(id: number): Promise<{
        success: boolean;
    }>;
    getOrgs(page: number, pageSize: number, status?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    auditOrg(id: number, status: number, reason?: string): Promise<{
        success: boolean;
    }>;
    getAgents(page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    createAgent(userId: number, cityCode: string, cityName: string, commissionRate: number): Promise<{
        success: boolean;
    }>;
    updateAgentRate(id: number, rate: number): Promise<{
        success: boolean;
    }>;
    getMembershipPlans(role?: number): Promise<any[]>;
    createMembershipPlan(data: {
        name: string;
        role: number;
        price: number;
        originalPrice: number;
        durationDays: number;
        features: string[];
    }): Promise<{
        name: string;
        role: number;
        price: number;
        originalPrice: number;
        durationDays: number;
        features: string[];
        id: any;
    }>;
    updateMembershipPlan(id: number, data: Partial<{
        name: string;
        price: number;
        originalPrice: number;
        durationDays: number;
        features: string[];
        isActive: number;
    }>): Promise<{
        success: boolean;
    }>;
    getProducts(page: number, pageSize: number, isActive?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    createProduct(data: {
        name: string;
        cover: string;
        images?: string[];
        description?: string;
        price: number;
        originalPrice?: number;
        stock: number;
        category?: string;
    }): Promise<{
        name: string;
        cover: string;
        images?: string[];
        description?: string;
        price: number;
        originalPrice?: number;
        stock: number;
        category?: string;
        id: any;
    }>;
    updateProduct(id: number, data: Partial<{
        name: string;
        cover: string;
        images: string[];
        description: string;
        price: number;
        originalPrice: number;
        stock: number;
        category: string;
        isActive: number;
    }>): Promise<{
        success: boolean;
    }>;
    deleteProduct(id: number): Promise<{
        success: boolean;
    }>;
    getBanners(position?: string): Promise<any[]>;
    createBanner(data: {
        position: string;
        title: string;
        imageUrl: string;
        linkUrl?: string;
        sortOrder?: number;
    }): Promise<{
        position: string;
        title: string;
        imageUrl: string;
        linkUrl?: string;
        sortOrder?: number;
        id: any;
    }>;
    updateBanner(id: number, data: Partial<{
        position: string;
        title: string;
        imageUrl: string;
        linkUrl: string;
        sortOrder: number;
        isActive: number;
    }>): Promise<{
        success: boolean;
    }>;
    deleteBanner(id: number): Promise<{
        success: boolean;
    }>;
    getCommissions(page: number, pageSize: number, status?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    settleCommissions(ids: number[]): Promise<{
        success: boolean;
    }>;
    getWithdrawals(page: number, pageSize: number, status?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    auditWithdrawal(id: number, status: number, reason?: string): Promise<{
        success: boolean;
    }>;
}
