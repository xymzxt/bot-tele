export type AIMode =
  | 'chat'
  | 'explain_code'
  | 'generate_code'
  | 'debug_code'
  | 'refactor_code'
  | 'translate'
  | 'summarize'
  | 'rewrite'
  | 'ocr_image'
  | 'image_caption'
  | 'tts';

export type DevToolMode =
  | 'qr_generate'
  | 'base64_encode'
  | 'base64_decode'
  | 'jwt_decode'
  | 'json_format'
  | 'password_generate'
  | 'hash_generate'
  | 'markdown_preview'
  | 'url_shortener'
  | 'website_ping'
  | 'website_headers'
  | 'dns_lookup'
  | 'ssl_checker';

export type ConversationState =
  | 'idle'
  | 'awaiting_github_pat'
  | 'awaiting_github_repo_name'
  | 'awaiting_ai_input'
  | 'awaiting_tool_input'
  | 'awaiting_owner_broadcast';

export interface BotSession {
  state: ConversationState;
  lastMenu?: string;
  aiMode?: AIMode;
  toolMode?: DevToolMode;
  temp?: Record<string, unknown>;
  updatedAt?: string;
}

export const defaultSession = (): BotSession => ({
  state: 'idle',
  temp: {},
  updatedAt: new Date().toISOString(),
});
