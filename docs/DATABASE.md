# Database Documentation

SQL schema tersedia di `supabase/schema.sql`.

## Tables

### `users`

Menyimpan profil Telegram user.

Key fields:

- `telegram_id` unique
- `role`: `user` atau `owner`
- `is_banned`
- `last_seen_at`

### `github_accounts`

Menyimpan GitHub account per Telegram user.

- `telegram_user_id` unique
- `token_encrypted` AES-256-GCM payload
- `auth_type`: `oauth` atau `pat`
- `scopes`

### `repositories`

Cache metadata repository GitHub per user.

### `deployments`

Riwayat deployment Vercel/Netlify/Render.

### `files`

Metadata file dan storage URL/path.

### `ai_history`

Riwayat prompt/response AI per user.

### `settings`

Settings per user: language, theme, timezone, AI provider, notifications.

### `activity_logs`

Audit log request dan aktivitas penting.

### `upload_sessions`

State upload multi-file/ZIP/TAR.

### `sessions`

Conversation/session store Telegraf.

## Multi-User Isolation

Semua tabel user-owned memiliki `telegram_user_id`. Semua service harus selalu query dengan Telegram User ID user saat ini.

## Token Security

Token GitHub disimpan sebagai encrypted payload:

```txt
v1:iv:authTag:cipherText
```

Kunci berasal dari SHA-256 hash `ENCRYPTION_KEY`.
