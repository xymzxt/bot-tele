import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';

const MAX_STATE_AGE_MS = 15 * 60 * 1000;

export interface OAuthStatePayload {
  telegramId: number;
  createdAt: number;
  nonce: string;
}

const sign = (payload: string): string =>
  createHmac('sha256', env.ENCRYPTION_KEY).update(payload).digest('base64url');

export const createOAuthState = (telegramId: number): string => {
  const payload = `${telegramId}.${Date.now()}.${randomBytes(12).toString('base64url')}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString('base64url');
};

export const verifyOAuthState = (state: string): OAuthStatePayload => {
  const decoded = Buffer.from(state, 'base64url').toString('utf8');
  const [telegramIdRaw, createdAtRaw, nonce, signature] = decoded.split('.');
  if (!telegramIdRaw || !createdAtRaw || !nonce || !signature) throw new Error('Invalid OAuth state');

  const payload = `${telegramIdRaw}.${createdAtRaw}.${nonce}`;
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error('Invalid OAuth state signature');
  }

  const telegramId = Number(telegramIdRaw);
  const createdAt = Number(createdAtRaw);
  if (!Number.isSafeInteger(telegramId) || !Number.isSafeInteger(createdAt)) throw new Error('Invalid OAuth state payload');
  if (Date.now() - createdAt > MAX_STATE_AGE_MS) throw new Error('OAuth state expired');

  return { telegramId, createdAt, nonce };
};
