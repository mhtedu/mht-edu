export declare class OrgAssignService {
    getOrgTeachers(orgId: number, status?: number): Promise<any[]>;
    inviteTeacher(orgId: number, teacherId: number, commissionRate?: number): Promise<{
        success: boolean;
        message: string;
    }>;
    handleInvite(teacherId: number, orgId: number, accept: boolean): Promise<{
        success: boolean;
    }>;
    unbindTeacher(orgId: number, teacherId: number): Promise<{
        success: boolean;
    }>;
    setTeacherCommission(orgId: number, teacherId: number, rate: number): Promise<{
        success: boolean;
    }>;
    assignOrder(data: {
        orgId: number;
        orderId: number;
        teacherId: number;
        assignType: number;
        note?: string;
    }): Promise<{
        success: boolean;
    }>;
    handleAssignment(teacherId: number, assignmentId: number, accept: boolean, note?: string): Promise<{
        success: boolean;
    }>;
    getOrgAssignments(orgId: number, status?: number): Promise<any[]>;
    getTeacherAssignments(teacherId: number, status?: number): Promise<any[]>;
    recommendTeachers(orgId: number, orderId: number): Promise<any[]>;
}
