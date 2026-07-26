import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const KEY = createHash('sha256').update(env.ENCRYPTION_KEY).digest();

export const encryptSecret = (plainText: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join(':');
};

export const decryptSecret = (payload: string): string => {
  const [version, ivRaw, tagRaw, encryptedRaw] = payload.split(':');
  if (version !== 'v1' || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error('Invalid encrypted payload format');
  }

  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
};
