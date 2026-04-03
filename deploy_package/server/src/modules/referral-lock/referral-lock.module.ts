import { Module } from '@nestjs/common';
import { ReferralLockController } from './referral-lock.controller';
import { ReferralLockService } from './referral-lock.service';

@Module({
  controllers: [ReferralLockController],
  providers: [ReferralLockService],
  exports: [ReferralLockService],
})
export class ReferralLockModule {}
