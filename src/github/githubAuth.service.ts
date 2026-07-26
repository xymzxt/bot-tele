import axios from 'axios';
import { env, isGithubOAuthConfigured } from '../config/env';
import { GitHubAccountRepository } from '../database/repositories/github-account.repository';
import type { GitHubAccountRecord, GithubAuthType } from '../types/database';
import { encryptSecret } from '../utils/crypto';
import { githubPatSchema } from '../utils/validation';
import { createOAuthState } from '../auth/oauthState';
import { createGitHubClient } from './githubClient';

interface GithubUserResponse {
  id: number;
  login: string;
  avatar_url?: string;
}

interface GithubTokenResponse {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export class GitHubAuthService {
  constructor(private readonly accounts = new GitHubAccountRepository()) {}

  getOAuthUrl(telegramId: number): string {
    if (!isGithubOAuthConfigured) {
      throw new Error('GitHub OAuth belum dikonfigurasi. Isi GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, dan GITHUB_OAUTH_REDIRECT_URL.');
    }

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', env.GITHUB_CLIENT_ID!);
    url.searchParams.set('redirect_uri', env.GITHUB_OAUTH_REDIRECT_URL!);
    url.searchParams.set('scope', 'repo user read:org');
    url.searchParams.set('state', createOAuthState(telegramId));
    return url.toString();
  }

  async exchangeCode(code: string): Promise<{ token: string; scopes: string[] }> {
    if (!isGithubOAuthConfigured) throw new Error('GitHub OAuth belum dikonfigurasi');

    const { data } = await axios.post<GithubTokenResponse>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_OAUTH_REDIRECT_URL,
      },
      {
        timeout: 20_000,
        headers: { Accept: 'application/json' },
      },
    );

    if (!data.access_token) {
      throw new Error(data.error_description ?? data.error ?? 'Gagal menukar OAuth code');
    }

    return {
      token: data.access_token,
      scopes: data.scope?.split(',').map((scope) => scope.trim()).filter(Boolean) ?? [],
    };
  }

  async connectWithPat(telegramId: number, rawToken: string): Promise<GitHubAccountRecord> {
    const token = githubPatSchema.parse(rawToken);
    const { user, scopes } = await this.validateToken(token);
    return this.saveAccount(telegramId, token, user, 'pat', scopes);
  }

  async connectWithOAuthToken(telegramId: number, token: string, scopes: string[]): Promise<GitHubAccountRecord> {
    const { user } = await this.validateToken(token);
    return this.saveAccount(telegramId, token, user, 'oauth', scopes);
  }

  async validateToken(token: string): Promise<{ user: GithubUserResponse; scopes: string[] }> {
    const client = createGitHubClient(token);
    const response = await client.get<GithubUserResponse>('/user');
    const scopesHeader = response.headers['x-oauth-scopes'];
    const scopes = typeof scopesHeader === 'string' ? scopesHeader.split(',').map((scope) => scope.trim()).filter(Boolean) : [];
    return { user: response.data, scopes };
  }

  private async saveAccount(
    telegramId: number,
    token: string,
    user: GithubUserResponse,
    authType: GithubAuthType,
    scopes: string[],
  ): Promise<GitHubAccountRecord> {
    return this.accounts.upsert({
      telegram_user_id: telegramId,
      github_id: user.id,
      login: user.login,
      avatar_url: user.avatar_url ?? null,
      token_encrypted: encryptSecret(token),
      auth_type: authType,
      scopes,
    });
  }
}
