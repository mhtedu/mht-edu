"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanUnlockContactGuard = exports.CanViewOrderPoolGuard = exports.CanSearchTeacherGuard = exports.CanGrabOrderGuard = exports.MembershipGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_client_1 = require("../../storage/database/supabase-client");
let MembershipGuard = class MembershipGuard {
    constructor(requiredFeature) {
        this.requiredFeature = requiredFeature;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userId = request.body?.user_id || request.query?.userId;
        if (!userId) {
            throw new common_1.ForbiddenException('请先登录');
        }
        const client = (0, supabase_client_1.getSupabaseClient)();
        const { data: user, error } = await client
            .from('users')
            .select('role, membership_type, membership_expire_at')
            .eq('id', userId)
            .maybeSingle();
        if (error || !user) {
            throw new common_1.ForbiddenException('用户不存在');
        }
        const isMemberActive = user.membership_type === 1 &&
            user.membership_expire_at &&
            new Date(user.membership_expire_at) > new Date();
        const permissionCheck = this.checkPermission(user.role, isMemberActive, this.requiredFeature);
        if (!permissionCheck.allowed) {
            throw new common_1.ForbiddenException(permissionCheck.message);
        }
        return true;
    }
    checkPermission(role, isMember, feature) {
        const permissions = {
            'grab_order': {
                0: { free: false, paid: false },
                1: { free: false, paid: true },
                2: { free: false, paid: true },
                3: { free: true, paid: true },
            },
            'search_teacher': {
                0: { free: false, paid: true },
                1: { free: false, paid: false },
                2: { free: true, paid: true },
                3: { free: true, paid: true },
            },
            'view_order_pool': {
                0: { free: false, paid: false },
                1: { free: false, paid: true },
                2: { free: false, paid: true },
                3: { free: true, paid: true },
            },
            'unlock_contact': {
                0: { free: false, paid: true },
                1: { free: false, paid: true },
                2: { free: true, paid: true },
                3: { free: true, paid: true },
            },
            'publish_order': {
                0: { free: true, paid: true },
                1: { free: false, paid: false },
                2: { free: false, paid: false },
                3: { free: true, paid: true },
            },
        };
        const featurePermission = permissions[feature];
        if (!featurePermission) {
            return { allowed: true, message: '' };
        }
        const rolePermission = featurePermission[role];
        if (!rolePermission) {
            return { allowed: false, message: '当前角色无此权限' };
        }
        if (isMember) {
            return rolePermission.paid
                ? { allowed: true, message: '' }
                : { allowed: false, message: '会员无此权限' };
        }
        else {
            return rolePermission.free
                ? { allowed: true, message: '' }
                : { allowed: false, message: '该功能仅对会员开放，请开通会员' };
        }
    }
};
exports.MembershipGuard = MembershipGuard;
exports.MembershipGuard = MembershipGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], MembershipGuard);
let CanGrabOrderGuard = class CanGrabOrderGuard extends MembershipGuard {
    constructor() {
        super('grab_order');
    }
};
exports.CanGrabOrderGuard = CanGrabOrderGuard;
exports.CanGrabOrderGuard = CanGrabOrderGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CanGrabOrderGuard);
let CanSearchTeacherGuard = class CanSearchTeacherGuard extends MembershipGuard {
    constructor() {
        super('search_teacher');
    }
};
exports.CanSearchTeacherGuard = CanSearchTeacherGuard;
exports.CanSearchTeacherGuard = CanSearchTeacherGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CanSearchTeacherGuard);
let CanViewOrderPoolGuard = class CanViewOrderPoolGuard extends MembershipGuard {
    constructor() {
        super('view_order_pool');
    }
};
exports.CanViewOrderPoolGuard = CanViewOrderPoolGuard;
exports.CanViewOrderPoolGuard = CanViewOrderPoolGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CanViewOrderPoolGuard);
let CanUnlockContactGuard = class CanUnlockContactGuard extends MembershipGuard {
    constructor() {
        super('unlock_contact');
    }
};
exports.CanUnlockContactGuard = CanUnlockContactGuard;
exports.CanUnlockContactGuard = CanUnlockContactGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CanUnlockContactGuard);
//# sourceMappingURL=membership.guard.js.map