import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { getSupabaseAdmin } from '../database/supabase';

export class SupabaseStorageService {
  isConfigured(): boolean {
    return Boolean(getSupabaseAdmin());
  }

  async uploadFromUrl(params: {
    telegramUserId: number;
    url: string;
    fileName: string;
    contentType?: string;
  }): Promise<{ path: string; publicUrl: string | null }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Supabase belum dikonfigurasi');

    const response = await axios.get<ArrayBuffer>(params.url, { responseType: 'arraybuffer', timeout: 60_000 });
    const path = `${params.telegramUserId}/${Date.now()}-${params.fileName}`.replaceAll(' ', '_');

    const { error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(path, Buffer.from(response.data), {
        contentType: params.contentType ?? 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      logger.error({ error, path }, 'Failed to upload to Supabase Storage');
      throw error;
    }

    const { data } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl ?? null };
  }
}
