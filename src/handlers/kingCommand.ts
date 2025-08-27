import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { DatabaseManager } from '../database/database';
import { ImageUtils, PermissionUtils, MessageManager, GameLogic } from '../utils';
import { King } from '../database/types';

/**
 * Handler for the /king command
 */
export class KingCommandHandler {
  private db: DatabaseManager;
  private messageManager: MessageManager;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.messageManager = new MessageManager(db);
  }

  /**
   * Handle /king command
   */
  async handle(ctx: Context): Promise<void> {
    try {
      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;

      if (!chatId || !userId) {
        await ctx.reply('❌ Unable to process command');
        return;
      }

      // Check bot permissions first
      const permissions = await PermissionUtils.checkBotPermissions(ctx);
      if (!permissions.hasPermissions) {
        await PermissionUtils.sendPermissionError(ctx, permissions.errorMessage);
        return;
      }

      // Parse bet amount
      const commandText = (ctx.message as any)?.text || '';
      const args = commandText.split(' ').slice(1);
      const betAmount = args.length > 0 ? parseInt(args[0]) : null;

      if (!betAmount || !GameLogic.isValidBet(betAmount)) {
        await ctx.reply('❌ Please specify a valid bet amount (1-10000)\nExample: `/king 100`');
        return;
      }

      // Check if user has enough balance
      if (!this.db.canAffordBet(chatId, userId, betAmount, username, firstName)) {
        const balance = this.db.getUserBalance(chatId, userId, username, firstName);
        await ctx.reply(`❌ Insufficient balance! You have ${balance} coins, but need ${betAmount} coins.`);
        return;
      }

      // Check if there's already a king
      const currentKing = this.db.getKing(chatId);
      if (currentKing) {
        await ctx.reply('❌ There\'s already a king! Use the DUMP button to challenge them.');
        return;
      }

      // Create new king
      const newKing: King = {
        userId,
        username,
        firstName,
        betAmount,
        streak: 0,
        timestamp: Date.now()
      };

      // Deduct bet from user balance
      this.db.updateUserBalance(chatId, userId, -betAmount, username, firstName);

      // Set as king
      this.db.setKing(chatId, newKing);

      // Create inline keyboard - all players see the same buttons attached to message
      const keyboardMarkup = Markup.inlineKeyboard([
        [Markup.button.callback('👊 DUMP', 'dump'), Markup.button.callback('💰 CASHOUT', 'cashout')]
      ]);

      console.log(`🎮 Created inline keyboard with 2 buttons (dump + cashout)`);
      console.log(`📱 Keyboard markup:`, JSON.stringify(keyboardMarkup.reply_markup, null, 2));

      // Generate game message
      const userBalance = this.db.getUserBalance(chatId, userId, username, firstName);
      const messageText = GameLogic.generateGameMessage(newKing, userBalance, userId, true);

      // Send game message with image if available
      const imagePath = ImageUtils.imageExists() ? ImageUtils.getImagePath() : 'text-only';
      console.log(`🎯 Creating first game message for chat ${chatId}, king: @${username || firstName || 'Unknown'}`);

      const newMessageId = await this.messageManager.updateGameMessage(ctx, messageText, keyboardMarkup, imagePath);

      if (!newMessageId) {
        console.error('❌ Failed to create first game message!');
        await ctx.reply('❌ Error creating game. Please try again.');
        // Refund the bet
        this.db.updateUserBalance(chatId, userId, betAmount, username, firstName);
        this.db.removeKing(chatId);
        return;
      }

      console.log(`✅ First game message created successfully: ${newMessageId}`);

      // Send status message
      await this.messageManager.sendStatusMessage(
        ctx,
        `👑 @${username || firstName || 'Unknown'} is the new KING! Bet: ${betAmount}`
      );

    } catch (error) {
      console.error('Error in king command handler:', error);
      await ctx.reply('❌ An error occurred while processing your request.');
    }
  }
}
