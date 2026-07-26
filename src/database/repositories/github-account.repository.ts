import { logger } from '../../config/logger';
import { getSupabaseAdmin } from '../supabase';
import type { GitHubAccountRecord } from '../../types/database';
import { nowIso } from '../../utils/format';

const memoryAccounts = new Map<number, GitHubAccountRecord>();

export class GitHubAccountRepository {
  async upsert(record: GitHubAccountRecord): Promise<GitHubAccountRecord> {
    const payload: GitHubAccountRecord = {
      ...record,
      connected_at: record.connected_at ?? nowIso(),
      updated_at: nowIso(),
    };
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      memoryAccounts.set(payload.telegram_user_id, payload);
      return payload;
    }

    const { data, error } = await supabase
      .from('github_accounts')
      .upsert(payload, { onConflict: 'telegram_user_id' })
      .select('*')
      .single();

    if (error) {
      logger.error({ error, telegramId: payload.telegram_user_id }, 'Failed to upsert GitHub account');
      memoryAccounts.set(payload.telegram_user_id, payload);
      return payload;
    }

    return data as GitHubAccountRecord;
  }

  async findByTelegramId(telegramId: number): Promise<GitHubAccountRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return memoryAccounts.get(telegramId) ?? null;

    const { data, error } = await supabase
      .from('github_accounts')
      .select('*')
      .eq('telegram_user_id', telegramId)
      .maybeSingle();

    if (error) {
      logger.error({ error, telegramId }, 'Failed to find GitHub account');
      return memoryAccounts.get(telegramId) ?? null;
    }

    return (data as GitHubAccountRecord | null) ?? null;
  }

  async deleteByTelegramId(telegramId: number): Promise<void> {
    const supabase = getSupabaseAdmin();
    memoryAccounts.delete(telegramId);

    if (!supabase) return;

    const { error } = await supabase.from('github_accounts').delete().eq('telegram_user_id', telegramId);
    if (error) logger.error({ error, telegramId }, 'Failed to delete GitHub account');
  }

  async countConnectedAccounts(): Promise<number> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return memoryAccounts.size;

    const { count, error } = await supabase
      .from('github_accounts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      logger.error({ error }, 'Failed to count GitHub accounts');
      return memoryAccounts.size;
    }

    return count ?? 0;
  }
}
