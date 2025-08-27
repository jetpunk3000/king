import * as fs from 'fs';
import * as path from 'path';
import { Database, ChatState, User, King, INITIAL_USER_BALANCE } from './types';

/**
 * Database manager for JSON file storage
 */
export class DatabaseManager {
  private data: Database;
  private filePath: string;

  constructor(filePath: string = './data.json') {
    this.filePath = filePath;
    this.data = { chats: {} };
    this.load();
  }

  /**
   * Load data from JSON file
   */
  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Error loading database:', error);
      this.data = { chats: {} };
    }
  }

  /**
   * Save data to JSON file
   */
  private save(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  /**
   * Get or create chat state
   */
  private getChatState(chatId: number): ChatState {
    if (!this.data.chats[chatId]) {
      this.data.chats[chatId] = {
        chatId,
        users: {},
        lastMessageId: undefined
      };
    }
    return this.data.chats[chatId];
  }

  /**
   * Get or create user in chat
   */
  private getUser(chatId: number, userId: number, username?: string, firstName?: string): User {
    const chatState = this.getChatState(chatId);

    if (!chatState.users[userId]) {
      chatState.users[userId] = {
        id: userId,
        username,
        firstName,
        balance: INITIAL_USER_BALANCE
      };
    }

    // Update username/firstName if provided
    if (username) chatState.users[userId].username = username;
    if (firstName) chatState.users[userId].firstName = firstName;

    return chatState.users[userId];
  }

  /**
   * Get user balance
   */
  getUserBalance(chatId: number, userId: number, username?: string, firstName?: string): number {
    const user = this.getUser(chatId, userId, username, firstName);
    return user.balance;
  }

  /**
   * Update user balance
   */
  updateUserBalance(chatId: number, userId: number, amount: number, username?: string, firstName?: string): number {
    const user = this.getUser(chatId, userId, username, firstName);
    user.balance += amount;
    this.save();
    return user.balance;
  }

  /**
   * Get current king
   */
  getKing(chatId: number): King | null {
    const chatState = this.getChatState(chatId);
    return chatState.king || null;
  }

  /**
   * Set new king
   */
  setKing(chatId: number, king: King): void {
    const chatState = this.getChatState(chatId);
    chatState.king = king;
    this.save();
  }

  /**
   * Remove king (when cashed out or defeated)
   */
  removeKing(chatId: number): void {
    const chatState = this.getChatState(chatId);
    chatState.king = undefined;
    this.save();
  }

  /**
   * Get last message ID for chat
   */
  getLastMessageId(chatId: number): number | null {
    const chatState = this.getChatState(chatId);
    return chatState.lastMessageId || null;
  }

  /**
   * Set last message ID for chat
   */
  setLastMessageId(chatId: number, messageId: number): void {
    const chatState = this.getChatState(chatId);
    chatState.lastMessageId = messageId;
    this.save();
  }

  /**
   * Check if user can afford bet
   */
  canAffordBet(chatId: number, userId: number, betAmount: number, username?: string, firstName?: string): boolean {
    const balance = this.getUserBalance(chatId, userId, username, firstName);
    return balance >= betAmount;
  }

  /**
   * Get all users in chat
   */
  getAllUsers(chatId: number): Record<number, User> {
    const chatState = this.getChatState(chatId);
    return chatState.users;
  }

  /**
   * Reset chat state (for testing)
   */
  resetChat(chatId: number): void {
    if (this.data.chats[chatId]) {
      delete this.data.chats[chatId];
      this.save();
    }
  }

  /**
   * Get database statistics
   */
  getStats(): { totalChats: number; totalUsers: number } {
    const totalChats = Object.keys(this.data.chats).length;
    let totalUsers = 0;

    for (const chatId in this.data.chats) {
      totalUsers += Object.keys(this.data.chats[chatId].users).length;
    }

    return { totalChats, totalUsers };
  }
}
