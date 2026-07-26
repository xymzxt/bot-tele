export type UserRole = 'user' | 'owner';
export type GithubAuthType = 'oauth' | 'pat';

export interface UserRecord {
  id?: string;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  language_code?: string | null;
  role: UserRole;
  is_banned: boolean;
  created_at?: string;
  updated_at?: string;
  last_seen_at?: string;
}

export interface GitHubAccountRecord {
  id?: string;
  telegram_user_id: number;
  github_id: number;
  login: string;
  avatar_url?: string | null;
  token_encrypted: string;
  auth_type: GithubAuthType;
  scopes?: string[] | null;
  connected_at?: string;
  updated_at?: string;
}

export interface FileRecord {
  id?: string;
  telegram_user_id: number;
  file_id: string;
  file_unique_id?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  size?: number | null;
  storage_provider?: string | null;
  storage_path?: string | null;
  public_url?: string | null;
  created_at?: string;
}

export interface DeploymentRecord {
  id?: string;
  telegram_user_id: number;
  provider: 'vercel' | 'netlify' | 'render';
  project_name: string;
  status: string;
  url?: string | null;
  created_at?: string;
}

export interface StatusCounters {
  users: number;
  activeToday: number;
  repositories: number;
  deployments: number;
  uploads: number;
  requestsToday: number;
  databaseStatus: 'Normal' | 'Disabled' | 'Error';
  storageUsageLabel: string;
}
