import { logger } from '../../config/logger';
import { getSupabaseAdmin } from '../supabase';
import type { BotSession } from '../../types/session';
import { defaultSession } from '../../types/session';
import { nowIso } from '../../utils/format';

const memorySessions = new Map<string, BotSession>();

export class BotSessionStore {
  async get(key: string): Promise<BotSession | undefined> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return memorySessions.get(key) ?? defaultSession();

    const { data, error } = await supabase.from('sessions').select('value').eq('key', key).maybeSingle();
    if (error) {
      logger.error({ error, key }, 'Failed to read session');
      return memorySessions.get(key) ?? defaultSession();
    }

    if (!data) return defaultSession();
    return data.value as BotSession;
  }

  async set(key: string, value: BotSession): Promise<void> {
    const payload = { key, value: { ...value, updatedAt: nowIso() }, updated_at: nowIso() };
    memorySessions.set(key, payload.value as BotSession);

    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const { error } = await supabase.from('sessions').upsert(payload, { onConflict: 'key' });
    if (error) logger.error({ error, key }, 'Failed to write session');
  }

  async delete(key: string): Promise<void> {
    memorySessions.delete(key);
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const { error } = await supabase.from('sessions').delete().eq('key', key);
    if (error) logger.error({ error, key }, 'Failed to delete session');
  }
}
