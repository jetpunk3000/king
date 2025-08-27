import { Context } from 'telegraf';
import { DatabaseManager } from '../database/database';

/**
 * Message management utilities for cleanup and pinning
 */
export class MessageManager {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Clean up old game message and pin new one
   * SAFER APPROACH: Send new message first, then clean up old one
   */
  async updateGameMessage(
    ctx: Context,
    text: string,
    keyboard?: any,
    photoPath?: string
  ): Promise<number | null> {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) return null;

      // FIRST: Send new game message
      let newMessage;
      try {
        console.log(`📤 Sending message with keyboard:`, keyboard ? 'present' : 'null');
        console.log(`📤 Message text length: ${text.length} characters`);

        if (photoPath && photoPath !== 'text-only') {
          console.log(`🖼️  Sending photo message with caption`);
          newMessage = await ctx.replyWithPhoto(
            { source: photoPath },
            {
              caption: text,
              reply_markup: keyboard.reply_markup
            }
          );
        } else {
          console.log(`💬 Sending text message`);
          newMessage = await ctx.reply(text, {
            reply_markup: keyboard.reply_markup
          });
        }

        console.log(`✅ Message sent successfully with ID: ${newMessage.message_id}`);
      } catch (error) {
        console.error('Error sending new game message:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        throw new Error('Failed to send new game message');
      }

      // SECOND: Try to pin the new message
      let pinSuccess = false;
      try {
        await ctx.pinChatMessage(newMessage.message_id);
        pinSuccess = true;
        console.log(`✅ Successfully pinned message ${newMessage.message_id}`);
      } catch (error) {
        console.error(`❌ Failed to pin message ${newMessage.message_id}:`, error);
        // Continue anyway - message is sent, just not pinned
      }

      // THIRD: Update database with new message ID
      const oldMessageId = this.db.getLastMessageId(chatId);
      this.db.setLastMessageId(chatId, newMessage.message_id);

      // FOURTH: Clean up old message ONLY after new one is ready
      if (oldMessageId && oldMessageId !== newMessage.message_id) {
        // Unpin old message first (if it was pinned)
        try {
          await ctx.unpinChatMessage(oldMessageId);
          console.log(`✅ Unpinned old message ${oldMessageId}`);
        } catch (error) {
          // Old message might not be pinned or already unpinned
          console.log(`Could not unpin message ${oldMessageId} (might not be pinned):`, error);
        }

        // Delete old message
        try {
          await ctx.deleteMessage(oldMessageId);
          console.log(`✅ Deleted old message ${oldMessageId}`);
        } catch (error) {
          // Message might already be deleted or inaccessible
          console.log(`Could not delete message ${oldMessageId} (might already be deleted):`, error);
        }
      }

      if (!pinSuccess) {
        console.warn(`⚠️  WARNING: Message ${newMessage.message_id} was sent but not pinned!`);
        // Try to inform user about pinning issue
        try {
          await ctx.reply('⚠️ \\*Warning:\\* Could not pin the game message\\. Please check bot permissions\\.', {
            parse_mode: 'MarkdownV2'
          });
        } catch (replyError) {
          console.error('Could not send warning message:', replyError);
        }
      }

      return newMessage.message_id;
    } catch (error) {
      console.error('Error updating game message:', error);
      return null;
    }
  }

  /**
   * Send temporary status message
   */
  async sendStatusMessage(ctx: Context, text: string, deleteAfter: number = 3000): Promise<void> {
    try {
      const message = await ctx.reply(text);

      // Delete after specified time
      setTimeout(async () => {
        try {
          await ctx.deleteMessage(message.message_id);
        } catch (error) {
          // Message might already be deleted
          console.log(`Could not delete status message ${message.message_id}:`, error);
        }
      }, deleteAfter);
    } catch (error) {
      console.error('Error sending status message:', error);
    }
  }

  /**
   * Clean up all messages for a chat (for testing/reset)
   */
  async cleanupChat(ctx: Context): Promise<void> {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) return;

      const lastMessageId = this.db.getLastMessageId(chatId);
      if (lastMessageId) {
        try {
          await ctx.deleteMessage(lastMessageId);
          await ctx.unpinChatMessage(lastMessageId);
        } catch (error) {
          console.log(`Could not cleanup message ${lastMessageId}:`, error);
        }
      }

      // Remove from database
      this.db.setLastMessageId(chatId, 0);
    } catch (error) {
      console.error('Error cleaning up chat:', error);
    }
  }
}
