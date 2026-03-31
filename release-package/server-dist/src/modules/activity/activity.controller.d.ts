import { ActivityService } from './activity.service';
export declare class ActivityController {
    private readonly activityService;
    constructor(activityService: ActivityService);
    getActivityList(role?: string, type?: string, status?: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getActivityDetail(id: string): Promise<any>;
    signupActivity(id: string, body: {
        signupType: number;
        participantName: string;
        participantPhone: string;
        participantCount: number;
    }, req: any): Promise<{
        success: boolean;
        signupId: any;
        totalAmount: number;
        message: string;
    }>;
    getUserSignedActivities(req: any, status?: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    cancelSignup(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getActivityParticipants(id: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
}
