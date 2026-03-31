"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributionService = void 0;
const common_1 = require("@nestjs/common");
const supabase_client_1 = require("../../storage/database/supabase-client");
let DistributionService = class DistributionService {
    async getInviteInfo(userId) {
        const client = (0, supabase_client_1.getSupabaseClient)();
        const { data: user, error: userError } = await client
            .from('users')
            .select('id, nickname, avatar, inviter_id')
            .eq('id', userId)
            .maybeSingle();
        if (userError)
            throw new Error(`查询用户失败: ${userError.message}`);
        const { count: level1Count, error: count1Error } = await client
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('inviter_id', userId);
        if (count1Error)
            throw new Error(`统计邀请人数失败: ${count1Error.message}`);
        const { count: level2Count, error: count2Error } = await client
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('inviter_2nd_id', userId);
        if (count2Error)
            throw new Error(`统计二级邀请人数失败: ${count2Error.message}`);
        const { data: commissionStats, error: statsError } = await client
            .from('commissions')
            .select('amount, status')
            .eq('user_id', userId);
        if (statsError)
            throw new Error(`统计佣金失败: ${statsError.message}`);
        const totalCommission = commissionStats?.reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
        const settledCommission = commissionStats?.filter(c => c.status === 1).reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
        const withdrawnCommission = commissionStats?.filter(c => c.status === 2).reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
        const inviteCode = this.generateInviteCode(userId);
        return {
            user: {
                id: user?.id,
                nickname: user?.nickname,
                avatar: user?.avatar,
            },
            inviter_id: user?.inviter_id,
            invite_code: inviteCode,
            invite_link: `https://your-domain.com/invite?code=${inviteCode}`,
            statistics: {
                level1_count: level1Count || 0,
                level2_count: level2Count || 0,
                total_commission: totalCommission.toFixed(2),
                settled_commission: settledCommission.toFixed(2),
                withdrawn_commission: withdrawnCommission.toFixed(2),
                available_commission: (settledCommission - withdrawnCommission).toFixed(2),
            },
        };
    }
    generateInviteCode(userId) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        let num = userId;
        while (num > 0 || code.length < 4) {
            code = chars[num % chars.length] + code;
            num = Math.floor(num / chars.length);
        }
        return code.padStart(6, 'X');
    }
    async bindInviter(userId, inviteCode) {
        const client = (0, supabase_client_1.getSupabaseClient)();
        const inviterId = this.parseInviteCode(inviteCode);
        if (!inviterId) {
            throw new Error('邀请码无效');
        }
        if (inviterId === userId) {
            throw new Error('不能使用自己的邀请码');
        }
        const { data: user, error: userError } = await client
            .from('users')
            .select('inviter_id')
            .eq('id', userId)
            .maybeSingle();
        if (userError)
            throw new Error(`查询用户失败: ${userError.message}`);
        if (user?.inviter_id) {
            throw new Error('您已有推荐人，无法重复绑定');
        }
        const { data: inviter, error: inviterError } = await client
            .from('users')
            .select('id, inviter_id')
            .eq('id', inviterId)
            .maybeSingle();
        if (inviterError || !inviter) {
            throw new Error('推荐人不存在');
        }
        const { error: updateError } = await client
            .from('users')
            .update({
            inviter_id: inviterId,
            inviter_2nd_id: inviter.inviter_id || null,
            updated_at: new Date().toISOString(),
        })
            .eq('id', userId);
        if (updateError)
            throw new Error(`绑定邀请关系失败: ${updateError.message}`);
        return {
            success: true,
            inviter_id: inviterId,
        };
    }
    parseInviteCode(code) {
        try {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let num = 0;
            for (let i = 0; i < code.length; i++) {
                const index = chars.indexOf(code[i].toUpperCase());
                if (index === -1)
                    continue;
                num = num * chars.length + index;
            }
            return num > 0 ? num : null;
        }
        catch {
            return null;
        }
    }
    async getCommissionList(userId, page = 1, pageSize = 20) {
        const client = (0, supabase_client_1.getSupabaseClient)();
        const { data, error, count } = await client
            .from('commissions')
            .select(`
        *,
        users!commissions_from_user_id_fkey (id, nickname, avatar)
      `, { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);
        if (error)
            throw new Error(`查询佣金明细失败: ${error.message}`);
        return {
            list: data,
            total: count,
            page,
            page_size: pageSize,
            total_pages: Math.ceil((count || 0) / pageSize),
        };
    }
    async applyWithdraw(userId, amount, accountInfo) {
        const client = (0, supabase_client_1.getSupabaseClient)();
        const { data: commissions, error: commissionError } = await client
            .from('commissions')
            .select('amount, status')
            .eq('user_id', userId)
            .eq('status', 1);
        if (commissionError)
            throw new Error(`查询佣金失败: ${commissionError.message}`);
        const availableAmount = commissions?.reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
        if (availableAmount < amount) {
            throw new Error(`可提现金额不足，当前可提现：${availableAmount.toFixed(2)}元`);
        }
        if (amount < 10) {
            throw new Error('提现金额最低10元');
        }
        return {
            success: true,
            amount,
            message: '提现申请已提交，预计1-3个工作日到账',
        };
    }
    async getInviteList(userId, level = 1, page = 1, pageSize = 20) {
        const client = (0, supabase_client_1.getSupabaseClient)();
        const field = level === 1 ? 'inviter_id' : 'inviter_2nd_id';
        const { data, error, count } = await client
            .from('users')
            .select('id, nickname, avatar, created_at', { count: 'exact' })
            .eq(field, userId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);
        if (error)
            throw new Error(`查询邀请列表失败: ${error.message}`);
        return {
            list: data,
            total: count,
            page,
            page_size: pageSize,
            level,
        };
    }
};
exports.DistributionService = DistributionService;
exports.DistributionService = DistributionService = __decorate([
    (0, common_1.Injectable)()
], DistributionService);
//# sourceMappingURL=distribution.service.js.map