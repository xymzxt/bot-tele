import axios from 'axios';
import { env, isAiConfigured } from '../config/env';
import type { AIMode } from '../types/session';
import { escapeHtml } from '../utils/format';

const modeInstructions: Record<AIMode, string> = {
  chat: 'Jawab sebagai developer assistant yang ringkas, akurat, dan praktis.',
  explain_code: 'Jelaskan kode berikut dengan bahasa Indonesia yang mudah dipahami.',
  generate_code: 'Buatkan kode production-ready sesuai permintaan berikut.',
  debug_code: 'Cari bug, jelaskan penyebabnya, dan berikan solusi dari kode berikut.',
  refactor_code: 'Refactor kode berikut agar lebih bersih, modular, dan aman.',
  translate: 'Terjemahkan teks berikut tanpa mengubah makna teknis.',
  summarize: 'Ringkas teks berikut menjadi poin-poin penting.',
  rewrite: 'Tulis ulang teks berikut agar lebih jelas dan profesional.',
  ocr_image: 'Ekstrak teks dari gambar. Jika input bukan gambar, jelaskan bahwa OCR membutuhkan gambar.',
  image_caption: 'Buat caption/deskripsi untuk gambar. Jika input bukan gambar, jelaskan format yang dibutuhkan.',
  tts: 'Ubah teks menjadi naskah voice-over yang natural dan siap dibacakan.',
};

export class AIService {
  async run(mode: AIMode, input: string): Promise<{ text: string; provider: string }> {
    if (!isAiConfigured) {
      return {
        provider: 'local-fallback',
        text: [
          '🤖 <b>AI Assistant</b>',
          '',
          'AI provider belum dikonfigurasi.',
          'Isi <code>AI_API_BASE_URL</code>, <code>AI_API_KEY</code>, dan <code>AI_MODEL</code> untuk hasil AI asli.',
          '',
          `<b>Mode</b>: <code>${mode}</code>`,
          '<b>Input diterima</b>:',
          `<pre>${escapeHtml(input.slice(0, 2500))}</pre>`,
        ].join('\n'),
      };
    }

    const { data } = await axios.post(
      `${env.AI_API_BASE_URL!.replace(/\/$/, '')}/chat/completions`,
      {
        model: env.AI_MODEL,
        messages: [
          { role: 'system', content: modeInstructions[mode] },
          { role: 'user', content: input },
        ],
        temperature: 0.3,
      },
      {
        timeout: 60_000,
        headers: {
          Authorization: `Bearer ${env.AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const content = data?.choices?.[0]?.message?.content as string | undefined;
    return {
      provider: 'openai-compatible',
      text: content ? escapeHtml(content).slice(0, 3900) : 'AI tidak mengembalikan jawaban.',
    };
  }
}
