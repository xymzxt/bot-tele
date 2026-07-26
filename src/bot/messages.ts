import type { BotContext } from './context';
import { mainReplyKeyboard } from './keyboards';

type ReplyExtra = NonNullable<Parameters<BotContext['reply']>[1]>;

export const replyWithMainKeyboard = async (
  ctx: BotContext,
  text: string,
  extra: ReplyExtra = {},
): Promise<void> => {
  await ctx.reply(text, {
    parse_mode: 'HTML',
    ...extra,
    reply_markup: mainReplyKeyboard,
  });
};

export const replyWithInlineKeyboard = async (
  ctx: BotContext,
  text: string,
  replyMarkup: NonNullable<ReplyExtra['reply_markup']>,
  extra: Omit<ReplyExtra, 'reply_markup'> = {},
): Promise<void> => {
  await ctx.reply(text, {
    parse_mode: 'HTML',
    ...extra,
    reply_markup: replyMarkup,
  });
};
