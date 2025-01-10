import { Controller, Get, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { EmailService } from './email.service';
import { EmailContentDto } from './dto/email.dto';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('send_email')
  async handleEmailSending(
    @Payload() data: EmailContentDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log('Received email request:', {
      to: data.to,
      subject: data.subject,
      pattern: context.getPattern(),
    });

    try {
      await this.emailService.sendEmail(data);
      channel.ack(originalMsg);
      this.logger.log('Successfully sent email and acknowledged message');
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process email request:', error);
      channel.nack(originalMsg, false, false);
      throw error;
    }
  }

  @Get('health')
  async checkHealth() {
    return this.emailService.checkHealth();
  }
}
