import type { User } from 'telegraf/types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { getSupabaseAdmin } from '../supabase';
import type { UserRecord, UserRole } from '../../types/database';
import { nowIso } from '../../utils/format';

const memoryUsers = new Map<number, UserRecord>();

const toRecord = (telegramUser: User): UserRecord => {
  const role: UserRole = telegramUser.id === env.OWNER_TELEGRAM_ID ? 'owner' : 'user';
  return {
    telegram_id: telegramUser.id,
    username: telegramUser.username ?? null,
    first_name: telegramUser.first_name ?? null,
    last_name: telegramUser.last_name ?? null,
    language_code: telegramUser.language_code ?? null,
    role,
    is_banned: false,
    updated_at: nowIso(),
    last_seen_at: nowIso(),
  };
};

export class UserRepository {
  async upsertFromTelegram(telegramUser: User): Promise<UserRecord> {
    const base = toRecord(telegramUser);
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      const existing = memoryUsers.get(base.telegram_id);
      const record = {
        ...existing,
        ...base,
        is_banned: existing?.is_banned ?? false,
        role: existing?.role ?? base.role,
        created_at: existing?.created_at ?? nowIso(),
      } satisfies UserRecord;
      memoryUsers.set(base.telegram_id, record);
      return record;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(base, { onConflict: 'telegram_id' })
      .select('*')
      .single();

    if (error) {
      logger.error({ error, telegramId: base.telegram_id }, 'Failed to upsert user, falling back to memory');
      memoryUsers.set(base.telegram_id, base);
      return base;
    }

    return data as UserRecord;
  }

  async findByTelegramId(telegramId: number): Promise<UserRecord | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return memoryUsers.get(telegramId) ?? null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (error) {
      logger.error({ error, telegramId }, 'Failed to find user');
      return memoryUsers.get(telegramId) ?? null;
    }

    return (data as UserRecord | null) ?? null;
  }

  async setBanned(telegramId: number, isBanned: boolean): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const existing = memoryUsers.get(telegramId);
      if (existing) memoryUsers.set(telegramId, { ...existing, is_banned: isBanned });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ is_banned: isBanned, updated_at: nowIso() })
      .eq('telegram_id', telegramId);

    if (error) logger.error({ error, telegramId, isBanned }, 'Failed to update ban state');
  }

  async countUsers(): Promise<number> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return memoryUsers.size;

    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) {
      logger.error({ error }, 'Failed to count users');
      return memoryUsers.size;
    }
    return count ?? 0;
  }

  async countActiveToday(): Promise<number> {
    const supabase = getSupabaseAdmin();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!supabase) {
      return Array.from(memoryUsers.values()).filter((user) => {
        const lastSeen = user.last_seen_at ? new Date(user.last_seen_at) : null;
        return lastSeen ? lastSeen >= today : false;
      }).length;
    }

    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen_at', today.toISOString());

    if (error) {
      logger.error({ error }, 'Failed to count active users');
      return 0;
    }
    return count ?? 0;
  }
}
