export declare class RobotService {
    private readonly keywordRules;
    private readonly defaultResponses;
    private readonly welcomeMessages;
    handleMessage(userId: number, message: string, conversationId?: number): Promise<{
        success: boolean;
        message: string;
        is_robot: boolean;
        suggest_actions: {
            text: string;
            action: string;
        }[];
    }>;
    getWelcomeMessage(targetRole: number): Promise<{
        success: boolean;
        message: any;
        is_robot: boolean;
        suggest_actions: {
            text: string;
            action: string;
        }[];
    }>;
    private matchResponse;
    private getSuggestActions;
    private saveMessage;
}
