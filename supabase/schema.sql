-- Bot Tele schema
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  language_code text,
  role text not null default 'user' check (role in ('user', 'owner')),
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.github_accounts (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique references public.users(telegram_id) on delete cascade,
  github_id bigint not null,
  login text not null,
  avatar_url text,
  token_encrypted text not null,
  auth_type text not null check (auth_type in ('oauth', 'pat')),
  scopes text[] default '{}',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repositories (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null references public.users(telegram_id) on delete cascade,
  github_repo_id bigint,
  owner text,
  name text not null,
  full_name text,
  html_url text,
  default_branch text,
  private boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null references public.users(telegram_id) on delete cascade,
  provider text not null check (provider in ('vercel', 'netlify', 'render')),
  project_name text not null,
  status text not null default 'queued',
  url text,
  build_log text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null references public.users(telegram_id) on delete cascade,
  file_id text not null,
  file_unique_id text,
  file_name text,
  mime_type text,
  size bigint,
  storage_provider text,
  storage_path text,
  public_url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_history (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null references public.users(telegram_id) on delete cascade,
  mode text not null,
  prompt text not null,
  response text not null,
  provider text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique references public.users(telegram_id) on delete cascade,
  language text default 'id',
  theme text default 'default',
  timezone text default 'Asia/Jakarta',
  ai_provider text default 'openai-compatible',
  notifications boolean default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint references public.users(telegram_id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.upload_sessions (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null references public.users(telegram_id) on delete cascade,
  repository text,
  branch text,
  target_folder text,
  status text not null default 'draft',
  total_files integer not null default 0,
  uploaded_files integer not null default 0,
  failed_files integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_telegram_id on public.users(telegram_id);
create index if not exists idx_github_accounts_user on public.github_accounts(telegram_user_id);
create index if not exists idx_files_user on public.files(telegram_user_id);
create index if not exists idx_ai_history_user on public.ai_history(telegram_user_id);
create index if not exists idx_activity_logs_user_created on public.activity_logs(telegram_user_id, created_at desc);
create index if not exists idx_activity_logs_action_created on public.activity_logs(action, created_at desc);

-- Optional storage bucket. Run if the bucket does not exist yet.
insert into storage.buckets (id, name, public)
values ('telegram-dev-assistant', 'telegram-dev-assistant', true)
on conflict (id) do nothing;

-- RLS can be enabled for defense-in-depth. The bot uses service role key server-side.
alter table public.users enable row level security;
alter table public.github_accounts enable row level security;
alter table public.repositories enable row level security;
alter table public.deployments enable row level security;
alter table public.files enable row level security;
alter table public.ai_history enable row level security;
alter table public.settings enable row level security;
alter table public.activity_logs enable row level security;
alter table public.upload_sessions enable row level security;
alter table public.sessions enable row level security;
