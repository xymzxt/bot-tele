import type { Context } from 'telegraf';
import type { Update } from 'telegraf/types';
import type { BotSession } from '../types/session';
import type { UserRecord } from '../types/database';

export interface BotContext<U extends Update = Update> extends Context<U> {
  session: BotSession;
  user?: UserRecord;
  requestStartedAt?: number;
  requestId?: string;
}
