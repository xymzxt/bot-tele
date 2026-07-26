import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegram } from 'telegraf';
import { env } from '../../src/config/env';
import { logger } from '../../src/config/logger';
import { verifyOAuthState } from '../../src/auth/oauthState';
import { GitHubAuthService } from '../../src/github/githubAuth.service';
import { mainReplyKeyboard } from '../../src/bot/keyboards';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
  const state = Array.isArray(req.query.state) ? req.query.state[0] : req.query.state;

  if (!code || !state) {
    res.status(400).send('Missing code/state');
    return;
  }

  try {
    const payload = verifyOAuthState(state);
    const auth = new GitHubAuthService();
    const exchanged = await auth.exchangeCode(code);
    const account = await auth.connectWithOAuthToken(payload.telegramId, exchanged.token, exchanged.scopes);

    const telegram = new Telegram(env.BOT_TOKEN);
    await telegram.sendMessage(
      payload.telegramId,
      `✅ GitHub OAuth berhasil terhubung.\n\nAccount: ${account.login}\nToken disimpan terenkripsi dan keyboard utama dipulihkan.`,
      { reply_markup: mainReplyKeyboard },
    );

    res.status(200).send(`
      <html>
        <head><title>GitHub Connected</title></head>
        <body style="font-family: system-ui; padding: 32px;">
          <h1>✅ GitHub connected</h1>
          <p>Kamu bisa kembali ke Telegram sekarang.</p>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error({ error }, 'GitHub OAuth callback failed');
    res.status(400).send(`GitHub OAuth failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
