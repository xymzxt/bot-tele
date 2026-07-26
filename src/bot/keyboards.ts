import type { InlineKeyboardMarkup, ReplyKeyboardMarkup } from 'telegraf/types';
import { Buttons, UtilityButtons } from '../constants/buttons';
import { Callback } from '../constants/callbacks';

export const mainReplyKeyboard: ReplyKeyboardMarkup = {
  keyboard: [
    [{ text: Buttons.Ping }, { text: Buttons.Runtime }],
    [{ text: Buttons.Status }, { text: Buttons.Help }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  one_time_keyboard: false,
};

export const removeKeyboard = {
  remove_keyboard: true,
} as const;

export const navRow = [
  { text: UtilityButtons.Back, callback_data: Callback.NavBack },
  { text: UtilityButtons.Home, callback_data: Callback.NavHome },
  { text: UtilityButtons.Refresh, callback_data: Callback.NavRefresh },
];

export const cancelInlineKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: UtilityButtons.Cancel, callback_data: Callback.Cancel }]],
};

export const withNav = (rows: InlineKeyboardMarkup['inline_keyboard']): InlineKeyboardMarkup => ({
  inline_keyboard: [...rows, navRow],
});
