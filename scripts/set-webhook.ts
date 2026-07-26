import axios from 'axios';
import { env } from '../src/config/env';

async function main() {
  if (!env.PUBLIC_APP_URL) throw new Error('PUBLIC_APP_URL is required');

  const url = `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/api/webhook`;
  const endpoint = `https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`;
  const { data } = await axios.post(endpoint, {
    url,
    secret_token: env.TELEGRAM_SECRET_TOKEN || undefined,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  });

  console.log(JSON.stringify(data, null, 2));
  console.log(`Webhook set to: ${url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
