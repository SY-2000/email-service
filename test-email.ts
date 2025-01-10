import { connect, ConnectionUrl } from 'amqp-connection-manager';
import * as dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';
import { Channel } from 'amqplib';

dotenv.config();

if (!process.env.AMQP_URL) {
  throw new Error('AMQP_URL environment variable is required');
}
if (!process.env.EMAIL_EXCHANGE) {
  throw new Error('EMAIL_EXCHANGE environment variable is required');
}
if (!process.env.EMAIL_ROUTING_KEY) {
  throw new Error('EMAIL_ROUTING_KEY environment variable is required');
}

const AMQP_URL = process.env.AMQP_URL as ConnectionUrl;
const EMAIL_EXCHANGE = process.env.EMAIL_EXCHANGE;
const EMAIL_ROUTING_KEY = process.env.EMAIL_ROUTING_KEY;

async function sendTestEmails() {
  const logger = {
    info: (...args: any[]) =>
      console.log(new Date().toISOString(), '- INFO:', ...args),
    error: (...args: any[]) =>
      console.error(new Date().toISOString(), '- ERROR:', ...args),
  };

  try {
    logger.info('Connecting to RabbitMQ...');
    const connection = connect([AMQP_URL]);

    connection.on('connect', () =>
      logger.info('Successfully connected to RabbitMQ!'),
    );

    const channelWrapper = connection.createChannel({
      setup: async (channel: Channel) => {
        try {
          // Assert the exchange
          logger.info(`Asserting exchange: ${EMAIL_EXCHANGE}`);
          await channel.assertExchange(EMAIL_EXCHANGE, 'topic', {
            durable: true,
          });

          // Assert the queue
          logger.info(`Asserting queue: ${EMAIL_EXCHANGE}`);
          await channel.assertQueue(EMAIL_EXCHANGE, {
            durable: true,
          });

          // Bind the queue to the exchange
          logger.info(
            `Binding queue to exchange with routing key: ${EMAIL_ROUTING_KEY}`,
          );
          await channel.bindQueue(
            EMAIL_EXCHANGE,
            EMAIL_EXCHANGE,
            EMAIL_ROUTING_KEY,
          );

          const testEmails = [
            {
              to: 'salama.yabahddou@gmail.com',
              from: 'syabahddou@gmail.com',
              subject: 'Test Email 1',
              content: 'This is a test email 1',
              date: new Date().toISOString(),
            },
            {
              to: 'salama.yabahddou@gmail.com',
              from: 'syabahddou@gmail.com',
              subject: 'Test Email 2',
              content: 'This is a test email 2',
              date: new Date().toISOString(),
            },
          ];

          // Publish messages with pattern property
          for (const email of testEmails) {
            logger.info(
              `Publishing message to exchange: ${EMAIL_EXCHANGE} with routing key: ${EMAIL_ROUTING_KEY}`,
            );
            const published = await channel.publish(
              EMAIL_EXCHANGE,
              EMAIL_ROUTING_KEY,
              Buffer.from(
                JSON.stringify({
                  pattern: 'send_email',
                  data: email,
                }),
              ),
              {
                persistent: true,
                contentType: 'application/json',
              },
            );
            logger.info('Message published:', published);
          }
        } catch (error) {
          logger.error('Error in channel setup:', error);
          throw error;
        }
      },
    });

    // Wait for messages to be processed
    await setTimeout(5000);

    // Cleanup
    logger.info('Cleaning up...');
    await channelWrapper.close();
    await connection.close();
    logger.info('Test completed successfully');
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

console.log('Starting email service test...');
sendTestEmails().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
