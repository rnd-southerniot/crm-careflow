import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LorawanWebhookService } from './lorawan-webhook.service';

@Module({
  imports: [ConfigModule],
  providers: [LorawanWebhookService],
  exports: [LorawanWebhookService],
})
export class LorawanModule {}
