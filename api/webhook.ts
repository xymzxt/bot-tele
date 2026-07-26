import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Update } from 'telegraf/types';
import { env } from '../src/config/env';
import { logger } from '../src/config/logger';
import { handleTelegramUpdate } from '../src/bot/createBot';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, service: 'bot-tele', version: env.BOT_VERSION });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (env.TELEGRAM_SECRET_TOKEN) {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== env.TELEGRAM_SECRET_TOKEN) {
      res.status(401).json({ ok: false, error: 'Invalid secret token' });
      return;
    }
  }

  try {
    await handleTelegramUpdate(req.body as Update);
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Webhook request failed');
    res.status(500).json({ ok: false, error: 'Webhook failed' });
  }
}
