import type { InlineKeyboardMarkup } from 'telegraf/types';
import type { BotContext } from '../bot/context';
import {
  editOrReplyWithInlineKeyboard,
  replyWithInlineKeyboard,
  replyWithMainKeyboard,
} from '../bot/messages';
import { withNav } from '../bot/keyboards';
import { Callback } from '../constants/callbacks';
import { env } from '../config/env';
import { escapeHtml } from '../utils/format';

const setNavigationState = (
  ctx: BotContext,
  currentMenu: string,
  backTo?: string,
): void => {
  ctx.session.lastMenu = currentMenu;
  const temp: Record<string, unknown> = { ...(ctx.session.temp ?? {}), currentMenu };

  if (backTo) {
    temp.backTo = backTo;
  } else {
    delete temp.backTo;
  }

  ctx.session.temp = temp;
};

const homeMenuKeyboard = (isOwner: boolean): InlineKeyboardMarkup => {
  const rows: InlineKeyboardMarkup['inline_keyboard'] = [
    [
      { text: '🤖 AI Assistant', callback_data: 'menu:ai' },
      { text: '📁 GitHub Manager', callback_data: 'menu:github' },
    ],
    [
      { text: '📂 File Manager', callback_data: 'menu:file' },
      { text: '🚀 Deploy', callback_data: 'menu:deploy' },
    ],
    [
      { text: '🌐 Dev Tools', callback_data: 'menu:tools' },
      { text: '📊 Monitoring', callback_data: 'menu:monitoring' },
    ],
    [
      { text: '⚙️ Settings', callback_data: 'menu:settings' },
      { text: '👤 Profile', callback_data: 'menu:profile' },
    ],
  ];

  if (isOwner) {
    rows.push([{ text: '👑 Owner Panel', callback_data: 'menu:owner' }]);
  }

  return { inline_keyboard: rows };
};

export const showHome = async (ctx: BotContext): Promise<void> => {
  ctx.session.state = 'idle';
  setNavigationState(ctx, 'home');

  const name = ctx.from?.first_name ? escapeHtml(ctx.from.first_name) : 'Developer';
  await replyWithMainKeyboard(
    ctx,
    [
      '🏠 <b>Telegram Developer Assistant</b>',
      '',
      `Halo, <b>${name}</b>!`,
      'Bot siap membantu AI coding, GitHub manager, file manager, deployment, developer tools, monitoring, dan settings.',
      '',
      'Pilih fitur yang ingin digunakan melalui menu di bawah.',
    ].join('\n'),
  );

  await replyWithInlineKeyboard(
    ctx,
    '📌 <b>Menu Fitur</b>\n\nPilih fitur yang ingin dibuka:',
    homeMenuKeyboard(ctx.from?.id === env.OWNER_TELEGRAM_ID),
  );
};

export const showHomeMenu = async (ctx: BotContext): Promise<void> => {
  ctx.session.state = 'idle';
  setNavigationState(ctx, 'home');

  await editOrReplyWithInlineKeyboard(
    ctx,
    '📌 <b>Menu Fitur</b>\n\nPilih fitur yang ingin dibuka:',
    homeMenuKeyboard(ctx.from?.id === env.OWNER_TELEGRAM_ID),
  );
};

export const showHelp = async (ctx: BotContext): Promise<void> => {
  await replyWithMainKeyboard(
    ctx,
    [
      '❓ <b>Help</b>',
      '',
      '<b>Perintah:</b>',
      '/start - tampilkan home dan keyboard utama',
      '/help - bantuan',
      '/ping - cek latensi',
      '/runtime - cek uptime instance',
      '/status - cek status bot',
      '/github - buka GitHub manager',
      '/owner - buka owner panel',
      '',
      '📘 <b>Panduan lengkap tombol & command:</b>',
      'https://telegra.ph/Panduan-Rahizel-Assistant--bot-tele-07-26',
      '',
      '<b>Keamanan:</b>',
      '• Token GitHub disimpan terenkripsi.',
      '• Token tidak pernah ditampilkan kembali.',
      '• Semua data dipisah berdasarkan Telegram User ID.',
    ].join('\n'),
  );
};

const featurePage = async (
  ctx: BotContext,
  menu: string,
  title: string,
  description: string,
  rows: InlineKeyboardMarkup['inline_keyboard'],
): Promise<void> => {
  ctx.session.state = 'idle';
  setNavigationState(ctx, menu, 'home');
  await editOrReplyWithInlineKeyboard(ctx, [`${title}`, '', description].join('\n'), withNav(rows));
};

export const showAIMenu = async (ctx: BotContext): Promise<void> =>
  featurePage(ctx, 'ai', '🤖 <b>AI Assistant</b>', 'Pilih mode AI. Setelah memilih mode, kirim teks/kode yang ingin diproses.', [
    [
      { text: '💬 Chat AI', callback_data: 'ai:chat' },
      { text: '🧠 Explain Code', callback_data: 'ai:explain_code' },
    ],
    [
      { text: '⚡ Generate Code', callback_data: 'ai:generate_code' },
      { text: '🐞 Debug Code', callback_data: 'ai:debug_code' },
    ],
    [
      { text: '♻️ Refactor', callback_data: 'ai:refactor_code' },
      { text: '🌐 Translate', callback_data: 'ai:translate' },
    ],
    [
      { text: '📝 Summarize', callback_data: 'ai:summarize' },
      { text: '✍️ Rewrite', callback_data: 'ai:rewrite' },
    ],
  ]);

export const showGitHubMenu = async (ctx: BotContext): Promise<void> =>
  featurePage(ctx, 'github', '📁 <b>GitHub Manager</b>', 'Kelola akun dan repository GitHub milik user saat ini.', [
    [
      { text: '🔑 Connect GitHub', callback_data: Callback.GithubConnect },
      { text: '📄 GitHub Status', callback_data: Callback.GithubStatus },
    ],
    [
      { text: '📁 Repository List', callback_data: Callback.GithubRepos },
      { text: '➕ Create Repository', callback_data: Callback.GithubCreateRepo },
    ],
    [{ text: '❌ Putuskan Akun', callback_data: Callback.GithubDisconnect }],
  ]);

export const showGitHubConnectMenu = async (ctx: BotContext): Promise<void> => {
  setNavigationState(ctx, 'github_connect', 'github');

  await editOrReplyWithInlineKeyboard(
    ctx,
    [
      '🔑 <b>Connect GitHub</b>',
      '',
      'Pilih metode autentikasi:',
      '1. OAuth untuk login via browser.',
      '2. PAT untuk memasukkan token manual.',
      '',
      'Token tidak akan pernah ditampilkan kembali.',
    ].join('\n'),
    withNav([
      [
        { text: '🌐 GitHub OAuth', callback_data: Callback.GithubOAuth },
        { text: '🔐 Personal Access Token', callback_data: Callback.GithubPat },
      ],
    ]),
  );
};

export const showFileManagerMenu = async (ctx: BotContext): Promise<void> =>
  featurePage(ctx, 'file', '📂 <b>File Manager</b>', 'Kirim file dokumen ke bot untuk disimpan sebagai metadata. Supabase Storage akan digunakan jika dikonfigurasi.', [
    [
      { text: '📤 Upload File', callback_data: 'file:upload' },
      { text: '📦 ZIP / Extract', callback_data: 'file:zip' },
    ],
    [
      { text: '☁️ Supabase Storage', callback_data: 'file:supabase' },
      { text: '🌁 Cloudinary', callback_data: 'file:cloudinary' },
    ],
  ]);

export const showDeployMenu = async (ctx: BotContext): Promise<void> =>
  featurePage(ctx, 'deploy', '🚀 <b>Deploy</b>', 'Integrasi deploy disiapkan untuk Vercel, Netlify, dan Render.', [
    [
      { text: '▲ Vercel', callback_data: Callback.DeployVercel },
      { text: '🌐 Netlify', callback_data: Callback.DeployNetlify },
    ],
    [
      { text: '🟣 Render', callback_data: Callback.DeployRender },
      { text: '🕘 Deployment History', callback_data: Callback.DeployHistory },
    ],
  ]);

export const showDevToolsMenu = async (ctx: BotContext): Promise<void> =>
  featurePage(ctx, 'tools', '🌐 <b>Developer Tools</b>', 'Pilih tool, lalu kirim input sesuai instruksi.', [
    [
      { text: '🔳 QR Generator', callback_data: 'tool:qr_generate' },
      { text: '🔐 Base64 Encode', callback_data: 'tool:base64_encode' },
    ],
    [
      { text: '🔓 Base64 Decode', callback_data: 'tool:base64_decode' },
      { text: '🧩 JWT Decoder', callback_data: 'tool:jwt_decode' },
    ],
    [
      { text: '🧾 JSON Formatter', callback_data: 'tool:json_format' },
      { text: '🆔 UUID Generator', callback_data: 'tool:uuid' },
    ],
    [
      { text: '🔑 Password Generator', callback_data: 'tool:password_generate' },
      { text: '🔐 Hash Generator', callback_data: 'tool:hash_generate' },
    ],
    [
      { text: '🌐 Ping Website', callback_data: 'tool:website_ping' },
      { text: '🧾 HTTP Header', callback_data: 'tool:website_headers' },
    ],
    [
      { text: '🧭 DNS Lookup', callback_data: 'tool:dns_lookup' },
      { text: '🔒 SSL Checker', callback_data: 'tool:ssl_checker' },
    ],
  ]);

export const showMonitoringMenu = async (ctx: BotContext): Promise<void> =>
  featurePage(ctx, 'monitoring', '📊 <b>Monitoring</b>', 'Gunakan tombol Status/Ping/Runtime untuk data realtime yang ringan dan dicache.', [
    [
      { text: '🏓 Ping', callback_data: 'monitor:ping' },
      { text: '⏱ Runtime', callback_data: 'monitor:runtime' },
      { text: '📈 Status', callback_data: 'monitor:status' },
    ],
  ]);

export const showSettingsMenu = async (ctx: BotContext): Promise<void> =>
  featurePage(ctx, 'settings', '⚙️ <b>Settings</b>', 'Konfigurasi bahasa, tema, timezone, provider AI, GitHub, Cloudinary, Supabase, dan notifikasi.', [
    [
      { text: '🌐 Bahasa', callback_data: 'settings:language' },
      { text: '🎨 Tema', callback_data: 'settings:theme' },
    ],
    [
      { text: '🕒 Timezone', callback_data: 'settings:timezone' },
      { text: '🤖 AI Provider', callback_data: 'settings:ai_provider' },
    ],
  ]);

export const showProfile = async (ctx: BotContext): Promise<void> => {
  const user = ctx.user;
  setNavigationState(ctx, 'profile', 'home');

  await editOrReplyWithInlineKeyboard(
    ctx,
    [
      '👤 <b>Profile</b>',
      '',
      `Telegram ID : <code>${ctx.from?.id ?? '-'}</code>`,
      `Username : <b>${escapeHtml(ctx.from?.username ? `@${ctx.from.username}` : '-')}</b>`,
      `Name : <b>${escapeHtml([ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ') || '-')}</b>`,
      `Role : <b>${escapeHtml(user?.role ?? 'user')}</b>`,
      `Banned : <b>${user?.is_banned ? 'Ya' : 'Tidak'}</b>`,
    ].join('\n'),
    withNav([]),
  );
};

export const showOwnerPanel = async (ctx: BotContext): Promise<void> => {
  if (ctx.from?.id !== env.OWNER_TELEGRAM_ID) {
    await replyWithMainKeyboard(ctx, '⛔ Owner Panel hanya untuk owner.');
    return;
  }

  setNavigationState(ctx, 'owner', 'home');
  await editOrReplyWithInlineKeyboard(
    ctx,
    '👑 <b>Owner Panel</b>\n\nKelola broadcast, statistik user, maintenance mode, backup, restore, log, dan health check.',
    withNav([
      [
        { text: '📢 Broadcast', callback_data: Callback.OwnerBroadcast },
        { text: '👥 Statistik User', callback_data: Callback.OwnerUsers },
      ],
      [
        { text: '🛠 Toggle Maintenance', callback_data: 'owner:maintenance_toggle' },
        { text: '🩺 Health Check', callback_data: Callback.OwnerHealth },
      ],
    ]),
  );
};
