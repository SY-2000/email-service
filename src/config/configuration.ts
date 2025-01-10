export default () => {
  // Validate required environment variables
  const requiredEnvVars = [
    'SMTP_PORT',
    'SMTP_HOST',
    'AMQP_URL',
    'EMAIL_EXCHANGE',
    'EMAIL_ROUTING_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} is required`);
    }
  }

  return {
    node_env: process.env.NODE_ENV || 'development',
    amqp: {
      url: process.env.AMQP_URL,
      email_exchange:
        process.env.EMAIL_EXCHANGE || 'dakaai_microservices/email',
      email_routing_key: process.env.EMAIL_ROUTING_KEY || 'send_email',
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      secure: process.env.SMTP_SECURE === 'true',
    },
  };
};
