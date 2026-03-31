import { RobotService } from './robot.service';
export declare class RobotController {
    private readonly robotService;
    constructor(robotService: RobotService);
    handleChat(body: {
        message: string;
        conversationId?: number;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        is_robot: boolean;
        suggest_actions: {
            text: string;
            action: string;
        }[];
    }>;
    getWelcome(body: {
        targetRole: number;
    }): Promise<{
        success: boolean;
        message: any;
        is_robot: boolean;
        suggest_actions: {
            text: string;
            action: string;
        }[];
    }>;
}
