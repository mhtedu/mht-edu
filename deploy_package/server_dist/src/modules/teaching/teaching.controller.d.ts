import { TeachingService } from './teaching.service';
export declare class TeachingController {
    private readonly teachingService;
    constructor(teachingService: TeachingService);
    submitTeacherFeedback(body: {
        orderId: number;
        studentLevel: string;
        teachingSuggestion: string;
        expectedGoals: string;
    }, req: any): Promise<{
        success: boolean;
        updated: boolean;
    } | {
        success: boolean;
        updated?: undefined;
    }>;
    submitParentFeedback(body: {
        orderId: number;
        teacherId: number;
        satisfaction: number;
        teacherAttitude: number;
        teachingQuality: number;
        willingness: number;
        comment?: string;
    }, req: any): Promise<{
        success: boolean;
        updated: boolean;
    } | {
        success: boolean;
        updated?: undefined;
    }>;
    getTrialFeedback(orderId: string): Promise<any>;
    createTeachingPlan(body: {
        orderId: number;
        subject: string;
        totalLessons?: number;
        startDate?: string;
        endDate?: string;
        teachingGoals?: string;
        teachingMethods?: string;
        materials?: string;
        notes?: string;
    }, req: any): Promise<{
        success: boolean;
        id: any;
    }>;
    getTeachingPlan(orderId: string): Promise<any>;
    updateTeachingPlan(orderId: string, body: Partial<{
        totalLessons: number;
        startDate: string;
        endDate: string;
        teachingGoals: string;
        teachingMethods: string;
        materials: string;
        notes: string;
        completedLessons: number;
    }>, req: any): Promise<{
        success: boolean;
    }>;
    updateProgress(orderId: string, body: {
        completedLessons: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getTeacherPlans(status?: string, req?: any): Promise<any[]>;
}
