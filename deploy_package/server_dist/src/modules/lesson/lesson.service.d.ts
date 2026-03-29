export declare class LessonService {
    createLessonRecord(data: {
        orderId: number;
        teacherId: number;
        parentId: number;
        lessonDate: string;
        lessonStartTime: string;
        lessonEndTime: string;
        lessonHours: number;
        lessonContent?: string;
        homework?: string;
        studentPerformance?: string;
        nextLessonPlan?: string;
    }): Promise<{
        success: boolean;
        id: any;
    }>;
    getLessonRecords(params: {
        orderId?: number;
        teacherId?: number;
        parentId?: number;
        startDate?: string;
        endDate?: string;
        status?: number;
        page: number;
        pageSize: number;
    }): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getLessonRecordDetail(id: number): Promise<any>;
    updateLessonRecord(id: number, userId: number, data: Partial<{
        lessonContent: string;
        homework: string;
        studentPerformance: string;
        nextLessonPlan: string;
        parentComment: string;
    }>): Promise<{
        success: boolean;
    }>;
    confirmLesson(id: number, parentId: number, comment?: string): Promise<{
        success: boolean;
    }>;
    disputeLesson(id: number, parentId: number, comment: string): Promise<{
        success: boolean;
    }>;
    getLessonStats(teacherId: number, month?: string): Promise<any>;
    private updateOrderLessonStats;
    getTeacherSchedules(teacherId: number): Promise<any[]>;
    setTeacherSchedule(teacherId: number, schedules: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
        note?: string;
    }>): Promise<{
        success: boolean;
    }>;
    checkTeacherAvailability(teacherId: number, date: string, startTime: string, endTime: string): Promise<{
        available: boolean;
        reason: string;
    } | {
        available: boolean;
        reason?: undefined;
    }>;
    getTeacherMonthlyLessons(teacherId: number, year: number, month: number): Promise<Record<string, any[]>>;
}
