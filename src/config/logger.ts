import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    app: 'bot-tele',
    version: env.BOT_VERSION,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'BOT_TOKEN',
      '*.token',
      '*.token_encrypted',
      '*.access_token',
      '*.password',
    ],
    censor: '[REDACTED]',
  },
});
