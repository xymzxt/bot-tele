import os from 'node:os';
import { env } from '../config/env';
import { GitHubAccountRepository } from '../database/repositories/github-account.repository';
import { StatsRepository } from '../database/repositories/stats.repository';
import { UserRepository } from '../database/repositories/user.repository';
import type { StatusCounters } from '../types/database';
import { formatBytes, formatDuration } from '../utils/format';
import { BOOT_TIME, getRuntimeMs } from '../utils/runtime';

interface CachedStatus {
  expiresAt: number;
  counters: StatusCounters;
}

export class StatusService {
  private cache: CachedStatus | null = null;

  constructor(
    private readonly users = new UserRepository(),
    private readonly github = new GitHubAccountRepository(),
    private readonly stats = new StatsRepository(),
  ) {}

  async ping(startedAt?: number): Promise<string> {
    const responseTime = startedAt ? Date.now() - startedAt : 0;
    return [
      '🏓 <b>Pong!</b>',
      '',
      `⚡ Response Time : <b>${responseTime} ms</b>`,
      '📡 Telegram API : <b>Online</b>',
      '🟢 Status : <b>Healthy</b>',
    ].join('\n');
  }

  runtime(): string {
    return [
      '⏱ <b>Bot Runtime</b>',
      '',
      '🟢 Online selama',
      '',
      formatDuration(getRuntimeMs()),
      '',
      `Started:\n${BOOT_TIME.toISOString()}`,
    ].join('\n');
  }

  async status(): Promise<string> {
    const counters = await this.getCounters();
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const cpuPercent = Math.min(100, Math.round((cpuUsage.user + cpuUsage.system) / 1_000_000));
    const uptimeLabel = formatDuration(getRuntimeMs()).replaceAll('\n', ', ');
    const region = env.VERCEL_REGION ?? env.APP_REGION;
    const loadAverage = os.loadavg()[0] ?? 0;

    return [
      '📈 <b>Bot Status</b>',
      '',
      '🟢 Online',
      `⏱ Uptime : <b>${uptimeLabel}</b>`,
      `👥 Users : <b>${counters.users.toLocaleString('id-ID')}</b>`,
      `🟢 User Aktif Hari Ini : <b>${counters.activeToday.toLocaleString('id-ID')}</b>`,
      `📁 Repository : <b>${counters.repositories.toLocaleString('id-ID')}</b>`,
      `🚀 Deployments : <b>${counters.deployments.toLocaleString('id-ID')}</b>`,
      `📤 Uploads : <b>${counters.uploads.toLocaleString('id-ID')}</b>`,
      `📡 Requests Today : <b>${counters.requestsToday.toLocaleString('id-ID')}</b>`,
      `💾 Database : <b>${counters.databaseStatus}</b>`,
      `☁️ Storage : <b>${counters.storageUsageLabel}</b>`,
      `🧠 Memory : <b>${formatBytes(memory.rss)}</b>`,
      `⚙️ CPU : <b>${cpuPercent}%</b>`,
      `🟩 Node.js : <b>${process.version}</b>`,
      `🤖 Bot Version : <b>${env.BOT_VERSION}</b>`,
      `🌍 Region : <b>${region}</b>`,
      `⚡ Avg Response : <b>${Math.max(10, Math.round(loadAverage * 10))} ms</b>`,
    ].join('\n');
  }

  private async getCounters(): Promise<StatusCounters> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) return this.cache.counters;

    const [users, activeToday, githubAccounts, stats] = await Promise.all([
      this.users.countUsers(),
      this.users.countActiveToday(),
      this.github.countConnectedAccounts(),
      this.stats.getCounters(),
    ]);

    const counters: StatusCounters = {
      users,
      activeToday,
      repositories: stats.repositories || githubAccounts,
      deployments: stats.deployments,
      uploads: stats.uploads,
      requestsToday: stats.requestsToday,
      databaseStatus: stats.databaseStatus,
      storageUsageLabel: stats.databaseStatus === 'Disabled' ? 'Not configured' : 'Normal',
    };

    this.cache = { counters, expiresAt: now + env.STATUS_CACHE_TTL_MS };
    return counters;
  }
}
