export declare class TeachingService {
    submitTeacherFeedback(data: {
        orderId: number;
        teacherId: number;
        studentLevel: string;
        teachingSuggestion: string;
        expectedGoals: string;
    }): Promise<{
        success: boolean;
        updated: boolean;
    } | {
        success: boolean;
        updated?: undefined;
    }>;
    submitParentFeedback(data: {
        orderId: number;
        parentId: number;
        teacherId: number;
        satisfaction: number;
        teacherAttitude: number;
        teachingQuality: number;
        willingness: number;
        comment?: string;
    }): Promise<{
        success: boolean;
        updated: boolean;
    } | {
        success: boolean;
        updated?: undefined;
    }>;
    getTrialFeedback(orderId: number): Promise<any>;
    createTeachingPlan(data: {
        orderId: number;
        teacherId: number;
        subject: string;
        totalLessons?: number;
        startDate?: string;
        endDate?: string;
        teachingGoals?: string;
        teachingMethods?: string;
        materials?: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        id: any;
    }>;
    getTeachingPlan(orderId: number): Promise<any>;
    updateTeachingPlan(orderId: number, teacherId: number, data: Partial<{
        totalLessons: number;
        startDate: string;
        endDate: string;
        teachingGoals: string;
        teachingMethods: string;
        materials: string;
        notes: string;
        completedLessons: number;
    }>): Promise<{
        success: boolean;
    }>;
    updateProgress(orderId: number, teacherId: number, completedLessons: number): Promise<{
        success: boolean;
    }>;
    getTeacherPlans(teacherId: number, status?: string): Promise<any[]>;
}
