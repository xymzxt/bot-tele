import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../config/env';
import { logger } from '../config/logger';

let client: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;

  if (!client) {
    client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'x-application-name': 'bot-tele',
        },
      },
    });
    logger.info('Supabase admin client initialized');
  }

  return client;
};
