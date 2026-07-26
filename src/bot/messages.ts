import type { InlineKeyboardMarkup } from 'telegraf/types';
import type { BotContext } from './context';
import { mainReplyKeyboard } from './keyboards';

type ReplyExtra = NonNullable<Parameters<BotContext['reply']>[1]>;

type InlineReplyExtra = Omit<ReplyExtra, 'reply_markup'>;

const isMessageNotModifiedError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('message is not modified');
};

const canEditCurrentMessage = (ctx: BotContext): boolean =>
  Boolean(ctx.callbackQuery && 'message' in ctx.callbackQuery && ctx.callbackQuery.message);

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
  replyMarkup: InlineKeyboardMarkup,
  extra: InlineReplyExtra = {},
): Promise<void> => {
  await ctx.reply(text, {
    parse_mode: 'HTML',
    ...extra,
    reply_markup: replyMarkup,
  });
};

export const editOrReplyWithInlineKeyboard = async (
  ctx: BotContext,
  text: string,
  replyMarkup: InlineKeyboardMarkup,
  extra: InlineReplyExtra = {},
): Promise<void> => {
  if (canEditCurrentMessage(ctx)) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...extra,
        reply_markup: replyMarkup,
      });
      return;
    } catch (error) {
      if (isMessageNotModifiedError(error)) return;
    }
  }

  await replyWithInlineKeyboard(ctx, text, replyMarkup, extra);
};
