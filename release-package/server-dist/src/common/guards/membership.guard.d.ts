import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class MembershipGuard implements CanActivate {
    private requiredFeature;
    constructor(requiredFeature: string);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private checkPermission;
}
export declare class CanGrabOrderGuard extends MembershipGuard {
    constructor();
}
export declare class CanSearchTeacherGuard extends MembershipGuard {
    constructor();
}
export declare class CanViewOrderPoolGuard extends MembershipGuard {
    constructor();
}
export declare class CanUnlockContactGuard extends MembershipGuard {
    constructor();
}
