export declare class ActivityService {
    getActivityList(params: {
        role?: number;
        type?: string;
        status?: string;
        page: number;
        pageSize: number;
    }): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getActivityDetail(activityId: number): Promise<any>;
    signupActivity(activityId: number, userId: number, signupType: number, participantName: string, participantPhone: string, participantCount: number): Promise<{
        success: boolean;
        signupId: any;
        totalAmount: number;
        message: string;
    }>;
    getUserSignedActivities(userId: number, page: number, pageSize: number, status?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    cancelSignup(activityId: number, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getActivityParticipants(activityId: number, page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
}
