import { OrgService } from './org.service';
export declare class OrgController {
    private readonly orgService;
    constructor(orgService: OrgService);
    getTeachers(keyword?: string, status?: string, req?: any): Promise<{
        list: any[];
        stats: any;
    }>;
    approveTeacher(id: string, req: any): Promise<{
        success: boolean;
    }>;
    rejectTeacher(id: string, req: any): Promise<{
        success: boolean;
    }>;
    updateTeacherStatus(id: string, body: {
        status: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getCourses(keyword?: string, req?: any): Promise<{
        list: any[];
        stats: any;
    }>;
    saveCourse(body: {
        id?: number;
        title: string;
        subject: string;
        teacher_id: number;
        total_hours: number;
        price_per_hour: number;
        schedule: string;
        address: string;
        description: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    updateCourseStatus(id: string, body: {
        status: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getOrgInfo(req: any): Promise<any>;
    updateOrgInfo(body: Partial<{
        name: string;
        logo: string;
        description: string;
        address: string;
        contact_phone: string;
        contact_email: string;
        business_hours: string;
        subjects: string[];
        city: string;
    }>, req: any): Promise<{
        success: boolean;
    }>;
    getInviteInfo(req: any): Promise<{
        inviteLink: string;
        inviteCode: any;
    }>;
    sendInviteSms(body: {
        phone: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getInviteHistory(req: any): Promise<any[]>;
}
