import axios from 'axios';
import { env } from '../src/config/env';

async function main() {
  const endpoint = `https://api.telegram.org/bot${env.BOT_TOKEN}/deleteWebhook`;
  const { data } = await axios.post(endpoint, { drop_pending_updates: false });
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
