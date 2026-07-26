import crypto from 'node:crypto';
import axios from 'axios';
import { env, isCloudinaryConfigured } from '../config/env';

export class CloudinaryService {
  isConfigured(): boolean {
    return isCloudinaryConfigured;
  }

  async uploadRemoteFile(fileUrl: string, folder: string): Promise<{ secureUrl: string }> {
    if (!isCloudinaryConfigured) throw new Error('Cloudinary belum dikonfigurasi');

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');
    const form = new FormData();
    form.set('file', fileUrl);
    form.set('folder', folder);
    form.set('timestamp', String(timestamp));
    form.set('api_key', env.CLOUDINARY_API_KEY!);
    form.set('signature', signature);

    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      form,
      { timeout: 60_000 },
    );

    return { secureUrl: String(data.secure_url) };
  }
}
