import { GitHubAccountRepository } from '../database/repositories/github-account.repository';
import { decryptSecret } from '../utils/crypto';
import { escapeHtml } from '../utils/format';
import { repositoryNameSchema } from '../utils/validation';
import { createGitHubClient } from './githubClient';

interface RepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  updated_at: string;
}

export class GitHubService {
  constructor(private readonly accounts = new GitHubAccountRepository()) {}

  async getStatusText(telegramId: number): Promise<string> {
    const account = await this.accounts.findByTelegramId(telegramId);
    if (!account) {
      return [
        '📄 <b>GitHub Status</b>',
        '',
        '❌ Belum terhubung.',
        'Gunakan tombol <b>🔑 Connect GitHub</b> untuk login via OAuth atau PAT.',
      ].join('\n');
    }

    return [
      '📄 <b>GitHub Status</b>',
      '',
      '✅ Terhubung',
      `👤 Account : <b>${escapeHtml(account.login)}</b>`,
      `🔐 Auth : <b>${account.auth_type.toUpperCase()}</b>`,
      `🧩 Scopes : <code>${escapeHtml(account.scopes?.join(', ') || '-')}</code>`,
      '',
      'Token terenkripsi dan tidak pernah ditampilkan kembali.',
    ].join('\n');
  }

  async listRepositories(telegramId: number): Promise<string> {
    const client = await this.getClient(telegramId);
    const { data } = await client.get<RepositoryResponse[]>('/user/repos', {
      params: { sort: 'updated', per_page: 10, affiliation: 'owner,collaborator' },
    });

    if (data.length === 0) return '📁 <b>Repository List</b>\n\nBelum ada repository.';

    const rows = data.map((repo, index) =>
      [
        `${index + 1}. <b>${escapeHtml(repo.full_name)}</b> ${repo.private ? '🔒' : '🌍'}`,
        `   Branch: <code>${escapeHtml(repo.default_branch)}</code>`,
        `   Updated: <code>${escapeHtml(repo.updated_at)}</code>`,
        `   ${escapeHtml(repo.html_url)}`,
      ].join('\n'),
    );

    return ['📁 <b>Repository List</b>', '', ...rows].join('\n\n');
  }

  async createRepository(telegramId: number, rawName: string): Promise<string> {
    const name = repositoryNameSchema.parse(rawName);
    const client = await this.getClient(telegramId);
    const { data } = await client.post<RepositoryResponse>('/user/repos', {
      name,
      private: false,
      auto_init: true,
    });

    return [
      '✅ <b>Repository dibuat</b>',
      `Nama : <b>${escapeHtml(data.full_name)}</b>`,
      `URL : ${escapeHtml(data.html_url)}`,
    ].join('\n');
  }

  async disconnect(telegramId: number): Promise<void> {
    await this.accounts.deleteByTelegramId(telegramId);
  }

  private async getClient(telegramId: number) {
    const account = await this.accounts.findByTelegramId(telegramId);
    if (!account) throw new Error('GitHub belum terhubung. Connect GitHub terlebih dahulu.');
    return createGitHubClient(decryptSecret(account.token_encrypted));
  }
}
