import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailContentDto } from './dto/email.dto';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host'),
      port: this.configService.get<number>('smtp.port'),
      auth: {
        user: this.configService.get<string>('smtp.user'),
        pass: this.configService.get<string>('smtp.pass'),
      },
      secure: this.configService.get<boolean>('smtp.secure'),
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('SMTP connection verification failed:', error);
      throw error;
    }
  }

  async sendEmail(emailData: EmailContentDto): Promise<void> {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        await this.transporter.sendMail({
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
          text: emailData.content,
        });

        this.logEmailAttempt(emailData, true);
        return;
      } catch (error) {
        attempts++;
        this.logEmailAttempt(emailData, false, error);

        if (attempts === this.maxRetries) {
          throw error;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * attempts),
        );
      }
    }
  }

  private logEmailAttempt(
    emailData: EmailContentDto,
    success: boolean,
    error?: any,
  ) {
    const logData = {
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date(),
      success,
      error: error?.message,
      attempt: error ? 'retry' : 'initial',
    };

    if (success) {
      this.logger.log('Email sent successfully', logData);
    } else {
      this.logger.error('Email sending failed', logData);
    }
  }

  async checkHealth() {
    try {
      await this.verifyConnection();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        smtp: 'connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        smtp: 'disconnected',
        error: error.message,
      };
    }
  }
}
