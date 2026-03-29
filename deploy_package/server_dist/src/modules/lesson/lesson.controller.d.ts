import { LessonService } from './lesson.service';
export declare class LessonController {
    private readonly lessonService;
    constructor(lessonService: LessonService);
    createLessonRecord(body: {
        orderId: number;
        lessonDate: string;
        lessonStartTime: string;
        lessonEndTime: string;
        lessonHours: number;
        lessonContent?: string;
        homework?: string;
        studentPerformance?: string;
        nextLessonPlan?: string;
    }, req: any): Promise<{
        success: boolean;
        id: any;
    }>;
    getLessonRecords(orderId?: string, teacherId?: string, parentId?: string, startDate?: string, endDate?: string, status?: string, page?: string, pageSize?: string, req?: any): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getLessonRecordDetail(id: string): Promise<any>;
    updateLessonRecord(id: string, body: Partial<{
        lessonContent: string;
        homework: string;
        studentPerformance: string;
        nextLessonPlan: string;
        parentComment: string;
    }>, req: any): Promise<{
        success: boolean;
    }>;
    confirmLesson(id: string, body: {
        comment?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    disputeLesson(id: string, body: {
        comment: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getLessonStats(teacherId?: string, month?: string, req?: any): Promise<any>;
    getTeacherSchedules(teacherId?: string, req?: any): Promise<any[]>;
    setTeacherSchedule(body: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
        note?: string;
    }>, req: any): Promise<{
        success: boolean;
    }>;
    checkTeacherAvailability(teacherId: string, date: string, startTime: string, endTime: string): Promise<{
        available: boolean;
        reason: string;
    } | {
        available: boolean;
        reason?: undefined;
    }>;
    getTeacherMonthlyLessons(teacherId?: string, year?: string, month?: string, req?: any): Promise<Record<string, any[]>>;
}
