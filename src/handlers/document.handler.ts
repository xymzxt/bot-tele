import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { BotContext } from '../bot/context';
import { replyWithMainKeyboard } from '../bot/messages';
import { FileRepository } from '../database/repositories/file.repository';
import { SupabaseStorageService } from '../storage/supabaseStorage.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { escapeHtml, formatBytes } from '../utils/format';

export const registerDocumentHandler = (
  bot: Telegraf<BotContext>,
  services = {
    files: new FileRepository(),
    supabaseStorage: new SupabaseStorageService(),
    cloudinary: new CloudinaryService(),
  },
): void => {
  bot.on(message('document'), async (ctx) => {
    const document = ctx.message.document;
    const telegramId = ctx.from!.id;
    let storagePath: string | null = null;
    let publicUrl: string | null = null;
    let storageProvider: string | null = null;

    if (services.supabaseStorage.isConfigured()) {
      const fileUrl = await ctx.telegram.getFileLink(document.file_id);
      const uploaded = await services.supabaseStorage.uploadFromUrl({
        telegramUserId: telegramId,
        url: fileUrl.toString(),
        fileName: document.file_name ?? document.file_unique_id,
        contentType: document.mime_type,
      });
      storageProvider = 'supabase';
      storagePath = uploaded.path;
      publicUrl = uploaded.publicUrl;
    }

    await services.files.create({
      telegram_user_id: telegramId,
      file_id: document.file_id,
      file_unique_id: document.file_unique_id,
      file_name: document.file_name ?? null,
      mime_type: document.mime_type ?? null,
      size: document.file_size ?? null,
      storage_provider: storageProvider,
      storage_path: storagePath,
      public_url: publicUrl,
    });

    await replyWithMainKeyboard(
      ctx,
      [
        '📤 <b>File diterima</b>',
        '',
        `Nama : <b>${escapeHtml(document.file_name ?? '-')}</b>`,
        `Tipe : <code>${escapeHtml(document.mime_type ?? '-')}</code>`,
        `Size : <b>${formatBytes(document.file_size ?? 0)}</b>`,
        `Storage : <b>${escapeHtml(storageProvider ?? 'metadata only')}</b>`,
        publicUrl ? `Public URL : ${escapeHtml(publicUrl)}` : '',
        '',
        'MVP berikutnya: multi-file queue, ZIP/TAR extract, preview struktur, conflict handling, dan Git Data API upload satu commit.',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  });
};
