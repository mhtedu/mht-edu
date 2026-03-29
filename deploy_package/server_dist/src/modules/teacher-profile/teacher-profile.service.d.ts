export declare class TeacherProfileService {
    getTeacherProfile(teacherId: number, viewerId?: number): Promise<any>;
    updateTeacherProfile(teacherId: number, data: Partial<{
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
    }>): Promise<{
        success: boolean;
    }>;
    publishMoment(teacherId: number, data: {
        content: string;
        images?: string[];
        videoUrl?: string;
        videoCover?: string;
    }): Promise<{
        success: boolean;
        id: any;
    }>;
    getMoments(teacherId: number, page?: number, pageSize?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    deleteMoment(teacherId: number, momentId: number): Promise<{
        success: boolean;
    }>;
    likeMoment(momentId: number, userId: number): Promise<{
        success: boolean;
        liked: boolean;
    }>;
    getTeacherReviews(teacherId: number, page?: number, pageSize?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
        ratingStats: any[];
    }>;
    replyReview(teacherId: number, reviewId: number, reply: string): Promise<{
        success: boolean;
    }>;
    unlockContact(data: {
        userId: number;
        targetUserId: number;
        orderId?: number;
        unlockType: number;
        isMember: boolean;
    }): Promise<any>;
    updateWechat(userId: number, wechatId: string, qrcode?: string): Promise<{
        success: boolean;
    }>;
    getTeacherStats(teacherId: number): Promise<any>;
    private maskMobile;
}
