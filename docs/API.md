# API Documentation

## Telegram Webhook

### `GET /api/webhook`

Health endpoint.

Response:

```json
{
  "ok": true,
  "service": "bot-tele",
  "version": "0.1.0"
}
```

### `POST /api/webhook`

Receives Telegram updates.

Security:

- If `TELEGRAM_SECRET_TOKEN` is set, request must include `x-telegram-bot-api-secret-token`.

## GitHub OAuth Callback

### `GET /api/github/oauth?code=...&state=...`

- Verifies signed state.
- Exchanges GitHub code to access token.
- Validates token via GitHub API.
- Stores encrypted token in `github_accounts`.
- Sends success message to Telegram user.

## Internal Services

- `AIService`: OpenAI-compatible chat completions.
- `GitHubAuthService`: OAuth/PAT authentication.
- `GitHubService`: repository operations.
- `ToolsService`: developer utilities.
- `StatusService`: ping/runtime/status formatting.
- `SupabaseStorageService`: upload Telegram files to Supabase Storage.
- `CloudinaryService`: upload remote files to Cloudinary.
