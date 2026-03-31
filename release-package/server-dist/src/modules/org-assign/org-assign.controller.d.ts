import { OrgAssignService } from './org-assign.service';
export declare class OrgAssignController {
    private readonly orgAssignService;
    constructor(orgAssignService: OrgAssignService);
    getOrgTeachers(status?: string, req?: any): Promise<any[]>;
    inviteTeacher(body: {
        teacherId: number;
        commissionRate?: number;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    handleInvite(body: {
        orgId: number;
        accept: boolean;
    }, req: any): Promise<{
        success: boolean;
    }>;
    unbindTeacher(body: {
        teacherId: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    setTeacherCommission(body: {
        teacherId: number;
        rate: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    assignOrder(body: {
        orderId: number;
        teacherId: number;
        assignType: number;
        note?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    handleAssignment(id: string, body: {
        accept: boolean;
        note?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getOrgAssignments(status?: string, req?: any): Promise<any[]>;
    getTeacherAssignments(status?: string, req?: any): Promise<any[]>;
    recommendTeachers(orderId: string, req?: any): Promise<any[]>;
}
