/**
 * Database types for the King of the Chat bot
 */

export interface User {
  id: number;
  username?: string;
  firstName?: string;
  balance: number;
}

export interface King {
  userId: number;
  username?: string;
  firstName?: string;
  betAmount: number;
  streak: number;
  timestamp: number;
}

export interface ChatState {
  chatId: number;
  king?: King;
  lastMessageId?: number;
  users: Record<number, User>;
}

export interface Database {
  chats: Record<number, ChatState>;
}

export const INITIAL_USER_BALANCE = 1000; // Starting balance for new users
