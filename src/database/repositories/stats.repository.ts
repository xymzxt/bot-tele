import { getSupabaseAdmin } from '../supabase';
import { logger } from '../../config/logger';
import type { StatusCounters } from '../../types/database';

const memory = {
  requests: [] as number[],
  uploads: 0,
  deployments: 0,
};

export class StatsRepository {
  async logActivity(telegramUserId: number | null, action: string, metadata?: Record<string, unknown>): Promise<void> {
    if (action === 'request') memory.requests.push(Date.now());

    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const { error } = await supabase.from('activity_logs').insert({
      telegram_user_id: telegramUserId,
      action,
      metadata: metadata ?? {},
    });

    if (error) logger.warn({ error, action }, 'Failed to log activity');
  }

  async getCounters(): Promise<Pick<StatusCounters, 'repositories' | 'deployments' | 'uploads' | 'requestsToday' | 'databaseStatus'>> {
    const supabase = getSupabaseAdmin();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!supabase) {
      memory.requests = memory.requests.filter((time) => time >= today.getTime());
      return {
        repositories: 0,
        deployments: memory.deployments,
        uploads: memory.uploads,
        requestsToday: memory.requests.length,
        databaseStatus: 'Disabled',
      };
    }

    try {
      const [repos, deployments, files, requests] = await Promise.all([
        supabase.from('repositories').select('*', { count: 'exact', head: true }),
        supabase.from('deployments').select('*', { count: 'exact', head: true }),
        supabase.from('files').select('*', { count: 'exact', head: true }),
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'request')
          .gte('created_at', today.toISOString()),
      ]);

      return {
        repositories: repos.count ?? 0,
        deployments: deployments.count ?? 0,
        uploads: files.count ?? 0,
        requestsToday: requests.count ?? 0,
        databaseStatus: repos.error || deployments.error || files.error || requests.error ? 'Error' : 'Normal',
      };
    } catch (error) {
      logger.error({ error }, 'Failed to read counters');
      return {
        repositories: 0,
        deployments: 0,
        uploads: 0,
        requestsToday: memory.requests.length,
        databaseStatus: 'Error',
      };
    }
  }
}
