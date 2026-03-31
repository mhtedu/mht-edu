export declare class OrgService {
    getTeachers(orgId: number, options?: {
        keyword?: string;
        status?: number;
    }): Promise<{
        list: any[];
        stats: any;
    }>;
    approveTeacher(orgId: number, teacherId: number): Promise<{
        success: boolean;
    }>;
    rejectTeacher(orgId: number, teacherId: number): Promise<{
        success: boolean;
    }>;
    updateTeacherStatus(orgId: number, teacherId: number, status: number): Promise<{
        success: boolean;
    }>;
    getCourses(orgId: number, options?: {
        keyword?: string;
    }): Promise<{
        list: any[];
        stats: any;
    }>;
    saveCourse(orgId: number, data: {
        id?: number;
        title: string;
        subject: string;
        teacher_id: number;
        total_hours: number;
        price_per_hour: number;
        schedule: string;
        address: string;
        description: string;
    }): Promise<{
        success: boolean;
    }>;
    updateCourseStatus(orgId: number, courseId: number, status: number): Promise<{
        success: boolean;
    }>;
    getOrgInfo(orgId: number): Promise<any>;
    updateOrgInfo(orgId: number, data: Partial<{
        name: string;
        logo: string;
        description: string;
        address: string;
        contact_phone: string;
        contact_email: string;
        business_hours: string;
        subjects: string[];
        city: string;
    }>): Promise<{
        success: boolean;
    }>;
    getInviteInfo(orgId: number): Promise<{
        inviteLink: string;
        inviteCode: any;
    }>;
    sendInviteSms(orgId: number, phone: string): Promise<{
        success: boolean;
    }>;
    getInviteHistory(orgId: number): Promise<any[]>;
}
