import { TeacherProfileService } from './teacher-profile.service';
export declare class TeacherProfileController {
    private readonly teacherProfileService;
    constructor(teacherProfileService: TeacherProfileService);
    getTeacherProfile(id: string, req: any): Promise<any>;
    updateTeacherProfile(body: Partial<{
        realName: string;
        gender: number;
        birthYear: number;
        education: string;
        subjects: string[];
        hourlyRateMin: number;
        hourlyRateMax: number;
        intro: string;
        oneLineIntro: string;
        photos: string[];
        videos: string[];
        coverPhoto: string;
        teachingYears: number;
    }>, req: any): Promise<{
        success: boolean;
    }>;
    getTeacherStats(id: string): Promise<any>;
    publishMoment(body: {
        content: string;
        images?: string[];
        videoUrl?: string;
        videoCover?: string;
    }, req: any): Promise<{
        success: boolean;
        id: any;
    }>;
    getMoments(id: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    deleteMoment(momentId: string, req: any): Promise<{
        success: boolean;
    }>;
    likeMoment(momentId: string, req: any): Promise<{
        success: boolean;
        liked: boolean;
    }>;
    getTeacherReviews(id: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
        ratingStats: any[];
    }>;
    replyReview(reviewId: string, body: {
        reply: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    unlockContact(body: {
        targetUserId: number;
        orderId?: number;
        unlockType: number;
    }, req: any): Promise<any>;
    updateWechat(body: {
        wechatId: string;
        qrcode?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
}
