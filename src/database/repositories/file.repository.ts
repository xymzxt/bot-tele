import { logger } from '../../config/logger';
import { getSupabaseAdmin } from '../supabase';
import type { FileRecord } from '../../types/database';

const memoryFiles: FileRecord[] = [];

export class FileRepository {
  async create(record: FileRecord): Promise<void> {
    memoryFiles.push(record);
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const { error } = await supabase.from('files').insert(record);
    if (error) logger.error({ error, telegramId: record.telegram_user_id }, 'Failed to create file record');
  }

  async countByTelegramId(telegramId: number): Promise<number> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return memoryFiles.filter((file) => file.telegram_user_id === telegramId).length;

    const { count, error } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('telegram_user_id', telegramId);

    if (error) {
      logger.error({ error, telegramId }, 'Failed to count files');
      return 0;
    }
    return count ?? 0;
  }
}
