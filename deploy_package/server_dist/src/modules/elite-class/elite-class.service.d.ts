export declare class EliteClassService {
    checkSuperMember(userId: number): Promise<{
        isSuper: boolean;
        reason?: string;
    }>;
    grantSuperMember(userId: number, type: number, days?: number): Promise<void>;
    createClass(userId: number, data: any): Promise<{
        success: boolean;
        id: any;
    }>;
    getClassList(params: {
        latitude?: number;
        longitude?: number;
        subject?: string;
        keyword?: string;
        city?: string;
        page: number;
        pageSize: number;
    }): Promise<any[]>;
    getClassDetail(classId: number, userId?: number): Promise<any>;
    enrollClass(userId: number, classId: number, referrerId?: number): Promise<{
        success: boolean;
        message: string;
    }>;
    lockShareRelation(userId: number, lockerId: number, lockType: string, sourceId?: number): Promise<void>;
    confirmEnrollment(teacherId: number, enrollmentId: number): Promise<{
        success: boolean;
    }>;
    updateLessonProgress(teacherId: number, classId: number, lessonNo: number): Promise<{
        success: boolean;
    }>;
    getTeacherClasses(userId: number, status?: number): Promise<any[]>;
    getEnrolledStudents(teacherId: number, classId: number): Promise<any[]>;
    closeClass(teacherId: number, classId: number, reason?: string): Promise<{
        success: boolean;
        status: number;
    }>;
}
