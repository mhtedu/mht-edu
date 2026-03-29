import { EliteClassService } from './elite-class.service';
export declare class EliteClassController {
    private readonly eliteClassService;
    constructor(eliteClassService: EliteClassService);
    checkSuperMember(req: any): Promise<{
        isSuper: boolean;
        reason?: string;
    }>;
    createClass(req: any, body: any): Promise<{
        success: boolean;
        id: any;
    }>;
    getClassList(latitude?: string, longitude?: string, subject?: string, keyword?: string, city?: string, page?: string, pageSize?: string): Promise<any[]>;
    getClassDetail(id: string, req: any): Promise<any>;
    enrollClass(req: any, body: {
        classId: number;
        referrerId?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    confirmEnrollment(req: any, body: {
        enrollmentId: number;
    }): Promise<{
        success: boolean;
    }>;
    updateProgress(req: any, body: {
        classId: number;
        lessonNo: number;
    }): Promise<{
        success: boolean;
    }>;
    getTeacherClasses(req: any, status?: string): Promise<any[]>;
    getStudents(req: any, classId: string): Promise<any[]>;
    closeClass(req: any, body: {
        classId: number;
        reason?: string;
    }): Promise<{
        success: boolean;
        status: number;
    }>;
}
