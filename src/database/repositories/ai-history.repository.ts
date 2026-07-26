import { logger } from '../../config/logger';
import { getSupabaseAdmin } from '../supabase';
import type { AIMode } from '../../types/session';

interface AIHistoryRecord {
  telegram_user_id: number;
  mode: AIMode;
  prompt: string;
  response: string;
  provider: string;
}

const memoryHistory: AIHistoryRecord[] = [];

export class AIHistoryRepository {
  async create(record: AIHistoryRecord): Promise<void> {
    memoryHistory.push(record);
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const { error } = await supabase.from('ai_history').insert(record);
    if (error) logger.warn({ error, telegramId: record.telegram_user_id }, 'Failed to save AI history');
  }
}
