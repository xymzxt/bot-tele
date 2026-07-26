import type { DeploymentRecord } from '../types/database';

export class DeployService {
  async listProviders(): Promise<string> {
    return [
      '🚀 <b>Deploy</b>',
      '',
      'Provider yang disiapkan:',
      '• Vercel',
      '• Netlify',
      '• Render',
      '',
      'MVP ini sudah menyediakan menu, status, dan skeleton service. Tambahkan token provider di tabel settings/user secrets untuk mengaktifkan deploy otomatis.',
    ].join('\n');
  }

  async getHistory(): Promise<DeploymentRecord[]> {
    return [];
  }
}
