# Bot Tele

Bot Telegram modern untuk developer: AI assistant, GitHub manager, file manager, deployment menu, developer tools, monitoring, settings, dan owner panel.

Dibuat dari gabungan `prompt1.md` dan `prompt2.md` dengan fokus MVP production-ready:

- Node.js + TypeScript strict mode
- Telegraf
- Vercel Serverless Webhook
- Supabase Database + Storage
- Cloudinary service skeleton
- GitHub OAuth + Personal Access Token (PAT)
- Persistent Reply Keyboard
- Inline Keyboard untuk navigasi fitur
- Session management dengan Supabase fallback memory
- Rate limit, middleware, logger, Zod validation, error handler
- Token encryption AES-256-GCM
- Multi-user isolation berdasarkan Telegram User ID

## Struktur Proyek

```txt
project/
├── api/
│   ├── webhook.ts
│   └── github/oauth.ts
├── src/
│   ├── ai/
│   ├── auth/
│   ├── bot/
│   ├── commands/
│   ├── config/
│   ├── constants/
│   ├── database/
│   ├── deploy/
│   ├── github/
│   ├── handlers/
│   ├── menus/
│   ├── middleware/
│   ├── services/
│   ├── storage/
│   ├── types/
│   └── utils/
├── docs/
├── scripts/
├── supabase/schema.sql
├── package.json
├── tsconfig.json
├── vercel.json
└── .env.example
```

## Instalasi Lokal

```bash
npm install
cp .env.example .env
```

Isi minimal:

```env
BOT_TOKEN=token-dari-botfather
OWNER_TELEGRAM_ID=telegram-id-kamu
ENCRYPTION_KEY=random-secret-minimal-32-karakter
```

Untuk database/session production, isi juga:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
SUPABASE_STORAGE_BUCKET=telegram-dev-assistant
```

## Menjalankan Bot Lokal

Long polling:

```bash
npm run dev
```

Jika sebelumnya sudah memakai webhook, hapus webhook dulu:

```bash
npm run webhook:delete
npm run dev
```

## Konfigurasi Telegram Webhook

Setelah deploy ke Vercel dan `PUBLIC_APP_URL` sudah benar:

```bash
npm run webhook:set
```

Webhook endpoint:

```txt
POST /api/webhook
GET  /api/webhook
```

Jika `TELEGRAM_SECRET_TOKEN` diisi, endpoint hanya menerima request Telegram yang membawa header `x-telegram-bot-api-secret-token` sesuai env.

## Konfigurasi Supabase

1. Buat project Supabase.
2. Buka SQL Editor.
3. Jalankan isi file `supabase/schema.sql`.
4. Salin `SUPABASE_URL` dan `service_role key` ke Vercel env.
5. Bucket storage default: `telegram-dev-assistant`.

Bot menggunakan `service_role` hanya di server-side. Jangan pernah mengekspos key ini ke client.

## Konfigurasi Cloudinary

Isi env berikut jika ingin mengaktifkan Cloudinary service:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

MVP sudah menyediakan service upload remote file. Integrasikan ke flow file manager sesuai kebutuhan.

## GitHub OAuth

1. Buat OAuth App di GitHub Developer Settings.
2. Authorization callback URL:

```txt
https://your-project.vercel.app/api/github/oauth
```

3. Isi env:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_OAUTH_REDIRECT_URL=https://your-project.vercel.app/api/github/oauth
```

Flow:

```txt
Connect GitHub → Browser login → Authorize → /api/github/oauth → token dienkripsi → bot kirim notifikasi ke Telegram
```

## GitHub PAT

Menu: `📁 GitHub → 🔑 Connect GitHub → Personal Access Token`.

Bot akan:

1. Menyembunyikan Reply Keyboard sementara.
2. Meminta PAT.
3. Memvalidasi token via GitHub API `/user`.
4. Menyimpan token terenkripsi.
5. Memulihkan Reply Keyboard permanen.

Token tidak pernah ditampilkan kembali.

## Deploy ke Vercel

```bash
npm install -g vercel
vercel
vercel env add BOT_TOKEN
vercel env add TELEGRAM_SECRET_TOKEN
vercel env add PUBLIC_APP_URL
vercel env add OWNER_TELEGRAM_ID
vercel env add ENCRYPTION_KEY
# tambahkan Supabase/GitHub/Cloudinary/AI env sesuai kebutuhan
vercel --prod
npm run webhook:set
```

## Reply Keyboard Permanen

Keyboard utama selalu memakai:

```ts
resize_keyboard: true
is_persistent: true
one_time_keyboard: false
```

Layout:

```txt
🤖 AI              📁 GitHub
📂 File Manager    🚀 Deploy
🌐 Dev Tools       📊 Monitoring
⚙️ Settings        👤 Profile
🏓 Ping            ⏱ Runtime
📈 Status          ❓ Help
```

## Fitur MVP yang Sudah Ada

- `/start`, `/help`, `/ping`, `/runtime`, `/status`, `/github`, `/owner`
- Persistent Reply Keyboard
- AI Assistant dengan OpenAI-compatible provider dan fallback lokal
- GitHub OAuth URL + OAuth callback
- GitHub PAT validation dan encrypted token storage
- GitHub status, repository list, create repository
- File metadata handler + optional Supabase Storage upload
- Developer tools: QR generator, Base64, JWT decode, JSON formatter, UUID, password, hash, website ping, headers, DNS lookup, SSL checker
- Monitoring status dengan cache
- Owner panel skeleton: broadcast input, user stats, maintenance toggle, health check

## Pengembangan Berikutnya

Lihat `docs/ROADMAP.md` untuk roadmap lengkap: ZIP/TAR extractor, multi-file upload queue, Git Data API batch commit, deployment provider real integration, advanced settings, dan owner backup/restore.
