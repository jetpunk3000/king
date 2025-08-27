import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { DatabaseManager } from '../database/database';
import { ImageUtils, PermissionUtils, MessageManager, GameLogic } from '../utils';
import { King } from '../database/types';

/**
 * Handler for callback queries (inline button presses)
 */
export class CallbackHandler {
  private db: DatabaseManager;
  private messageManager: MessageManager;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.messageManager = new MessageManager(db);
  }

  /**
   * Handle callback queries
   */
  async handle(ctx: Context): Promise<void> {
    try {
      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;
      const callbackData = (ctx.callbackQuery as any)?.data;

      console.log(`🎮 Callback received: ${callbackData} from @${username || firstName || 'Unknown'} (${userId})`);

      if (!chatId || !userId || !callbackData) {
        console.log(`❌ Invalid callback request`);
        await ctx.answerCbQuery('❌ Invalid request');
        return;
      }

      // Check bot permissions first
      const permissions = await PermissionUtils.checkBotPermissions(ctx);
      if (!permissions.hasPermissions) {
        console.log(`❌ Bot permissions missing`);
        await ctx.answerCbQuery('❌ Bot permissions required');
        return;
      }

      const currentKing = this.db.getKing(chatId);
      if (!currentKing) {
        console.log(`❌ No king in chat ${chatId}`);
        await ctx.answerCbQuery('❌ No king currently');
        return;
      }

      console.log(`👑 Current king: @${currentKing.username || currentKing.firstName || 'Unknown'} (${currentKing.userId})`);

      switch (callbackData) {
        case 'dump':
          console.log(`🔥 Processing DUMP request`);
          await this.handleDump(ctx, chatId, userId, username, firstName, currentKing);
          break;

        case 'cashout':
          console.log(`💰 Processing CASHOUT request`);
          // Additional security check for cashout
          if (currentKing.userId !== userId) {
            console.log(`❌ Unauthorized cashout attempt by ${userId}, king is ${currentKing.userId}`);
            await ctx.answerCbQuery('❌ Only the king can cash out!');
            return;
          }
          await this.handleCashout(ctx, chatId, userId, username, firstName, currentKing);
          break;

        default:
          console.log(`❌ Unknown callback action: ${callbackData}`);
          await ctx.answerCbQuery('❌ Unknown action');
      }

    } catch (error) {
      console.error('Error in callback handler:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      await ctx.answerCbQuery('❌ An error occurred');
    }
  }

  /**
   * Handle DUMP button (attack king)
   */
  private async handleDump(
    ctx: Context,
    chatId: number,
    userId: number,
    username: string | undefined,
    firstName: string | undefined,
    currentKing: King
  ): Promise<void> {
    // Check if user can attack
    if (!GameLogic.canAttackKing(currentKing, userId)) {
      await ctx.answerCbQuery('❌ You can\'t attack yourself!');
      return;
    }

    // Check if user has enough balance
    const attackerBalance = this.db.getUserBalance(chatId, userId, username, firstName);
    if (attackerBalance < currentKing.betAmount) {
      await ctx.answerCbQuery(`❌ Need ${currentKing.betAmount} coins to attack`);
      return;
    }

    // Deduct bet from attacker
    this.db.updateUserBalance(chatId, userId, -currentKing.betAmount, username, firstName);

    // Simulate attack
    const attackResult = GameLogic.simulateAttack(currentKing.streak);

    if (attackResult.success) {
      // Attacker wins - becomes new king
      const newKing: King = {
        userId,
        username,
        firstName,
        betAmount: currentKing.betAmount,
        streak: 0,
        timestamp: Date.now()
      };

      // Pay out winner
      const payout = GameLogic.calculatePayout(currentKing.betAmount);
      this.db.updateUserBalance(chatId, userId, payout, username, firstName);

      // Remove old king
      this.db.removeKing(chatId);

      // Set new king
      this.db.setKing(chatId, newKing);

      // Send status message
      await this.messageManager.sendStatusMessage(
        ctx,
        `💥 @${username || firstName || 'Unknown'} defeated the king!`
      );

      // Update game message
      await this.updateGameMessage(ctx, chatId, newKing, userId);

    } else {
      // King wins - increase streak
      currentKing.streak++;
      this.db.setKing(chatId, currentKing);

      // Pay out king
      const payout = GameLogic.calculatePayout(currentKing.betAmount);
      this.db.updateUserBalance(chatId, currentKing.userId, payout);

      // Send status message
      await this.messageManager.sendStatusMessage(
        ctx,
        `🛡️ King survived! Streak: ${currentKing.streak}`
      );

      // Update game message
      await this.updateGameMessage(ctx, chatId, currentKing, userId);
    }

    await ctx.answerCbQuery();
  }

  /**
   * Handle CASHOUT button (king withdraws)
   */
  private async handleCashout(
    ctx: Context,
    chatId: number,
    userId: number,
    username: string | undefined,
    firstName: string | undefined,
    currentKing: King
  ): Promise<void> {
    // Only king can cash out
    if (currentKing.userId !== userId) {
      await ctx.answerCbQuery('❌ Only the king can cash out!');
      return;
    }

    // Calculate payout (original bet + streak bonus)
    const payout = GameLogic.calculatePayout(currentKing.betAmount);
    this.db.updateUserBalance(chatId, userId, payout, username, firstName);

    // Send status message
    await this.messageManager.sendStatusMessage(
      ctx,
      `💰 King cashed out ${payout} coins`
    );

    // Remove king
    this.db.removeKing(chatId);

    // Send no king message
    await this.sendNoKingMessage(ctx, chatId, userId, username, firstName);

    await ctx.answerCbQuery();
  }

  /**
   * Update game message after state change
   */
  private async updateGameMessage(ctx: Context, chatId: number, king: King, userId: number): Promise<void> {
    try {
      // Create inline keyboard - all players see the same buttons attached to message
      const keyboardMarkup = Markup.inlineKeyboard([
        [Markup.button.callback('👊 DUMP', 'dump'), Markup.button.callback('💰 CASHOUT', 'cashout')]
      ]);

      const userBalance = this.db.getUserBalance(chatId, userId);
      const messageText = GameLogic.generateGameMessage(king, userBalance, userId, king.userId === userId);

      const imagePath = ImageUtils.imageExists() ? ImageUtils.getImagePath() : 'text-only';

      console.log(`🔄 Updating game message for chat ${chatId}, king: @${king.username || king.firstName || 'Unknown'}`);
      console.log(`🎮 Inline keyboard has 2 buttons (dump + cashout)`);

      const newMessageId = await this.messageManager.updateGameMessage(ctx, messageText, keyboardMarkup, imagePath);

      if (!newMessageId) {
        console.error('❌ Failed to update game message!');
        await ctx.reply('❌ Error updating game state. Please try again.');
      } else {
        console.log(`✅ Game message updated successfully: ${newMessageId}`);
      }
    } catch (error) {
      console.error('Error in updateGameMessage:', error);
      await ctx.reply('❌ Error updating game state. Please try again.');
    }
  }

  /**
   * Send no king message
   */
  private async sendNoKingMessage(
    ctx: Context,
    chatId: number,
    userId: number,
    username: string | undefined,
    firstName: string | undefined
  ): Promise<void> {
    try {
      // No king message - everyone sees the same buttons (can start new game)
      const keyboardMarkup = Markup.inlineKeyboard([
        [Markup.button.callback('🔥 DUMP', 'dump'), Markup.button.callback('💰 CASHOUT', 'cashout')]
      ]);

      const userBalance = this.db.getUserBalance(chatId, userId, username, firstName);
      const messageText = GameLogic.generateNoKingMessage(userBalance);

      const imagePath = ImageUtils.imageExists() ? ImageUtils.getImagePath() : 'text-only';

      console.log(`🔄 Sending no-king message for chat ${chatId}`);
      console.log(`🎮 No-king inline keyboard has 2 buttons (dump + cashout)`);

      const newMessageId = await this.messageManager.updateGameMessage(ctx, messageText, keyboardMarkup, imagePath);

      if (!newMessageId) {
        console.error('❌ Failed to send no-king message!');
        await ctx.reply('❌ Error updating game state. Please try again.');
      } else {
        console.log(`✅ No-king message sent successfully: ${newMessageId}`);
      }
    } catch (error) {
      console.error('Error in sendNoKingMessage:', error);
      await ctx.reply('❌ Error updating game state. Please try again.');
    }
  }
}
