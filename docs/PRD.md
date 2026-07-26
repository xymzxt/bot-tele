# PRD — Bot Tele

## Tujuan

Menyediakan bot Telegram yang terasa seperti aplikasi developer assistant, bukan chat biasa. Bot membantu user mengelola GitHub, file, deployment, AI coding, tools developer, monitoring, dan settings.

## Target User

- Developer solo
- Pemilik website statis
- Admin repository
- Tim kecil yang ingin mengelola project dari Telegram

## Prinsip Produk

1. Multi-user aman: semua data dipisahkan berdasarkan Telegram User ID.
2. Token tidak pernah ditampilkan kembali.
3. Reply Keyboard permanen untuk navigasi utama.
4. Inline Keyboard untuk aksi di dalam fitur.
5. Modular dan scalable agar fitur bisa ditambah bertahap.

## Scope MVP

- Fondasi webhook Vercel
- Session Supabase/fallback memory
- User registration otomatis
- Rate limit dan error handling
- GitHub OAuth + PAT
- Repository list/create
- File metadata + optional storage
- Developer tools dasar
- Monitoring realtime saat tombol ditekan
- Owner panel skeleton

## Non-Goals MVP

- Full deployment automation ke Vercel/Netlify/Render
- ZIP/TAR extraction production flow
- Conflict resolution upload GitHub lengkap
- OCR image dan TTS real provider

## Acceptance Criteria

- Bot dapat deploy ke Vercel.
- `/start` menampilkan keyboard permanen.
- Keyboard tetap muncul setelah aksi selesai/error.
- PAT GitHub divalidasi dan disimpan terenkripsi.
- User A tidak dapat membaca data User B.
- Status/Ping/Runtime memberikan data realtime/cached.
