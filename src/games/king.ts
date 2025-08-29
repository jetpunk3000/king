import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { DatabaseManager } from '../database/database';
import { ImageUtils, PermissionUtils, MessageManager, GameLogic, GameEconomy } from '../utils';
import { King } from '../database/types';

/**
 * Handle /king command - refactored from KingCommandHandler
 */
export async function handleKingCommand(ctx: Context, amount: number, db: DatabaseManager): Promise<void> {
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

    // Check if KING game can be started (duplicate prevention)
    if (!db.canStartGame(chatId, 'king')) {
      await ctx.reply('❗ KING is already ruling this chat! Finish the game first!');
      return;
    }

    // Validate bet amount
    if (!GameLogic.isValidBet(amount)) {
      await ctx.reply('❌ Please specify a valid bet amount (1-10000)\nExample: `/king 100`');
      return;
    }

    // Check if user has enough balance
    if (!db.canAffordBet(chatId, userId, amount, username, firstName)) {
      const balance = db.getUserBalance(chatId, userId, username, firstName);
      await ctx.reply(`❌ Insufficient balance! You have ${balance} coins, but need ${amount} coins.`);
      return;
    }

    // Check if there's already a king (legacy check - should be redundant with new duplicate prevention)
    const currentKing = db.getKing(chatId);
    if (currentKing) {
      await ctx.reply('❌ There\'s already a king! Use the DUMP button to challenge them.');
      return;
    }

    // Create new king
    const newKing: King = {
      userId,
      username,
      firstName,
      betAmount: amount,
      streak: 0,
      timestamp: Date.now()
    };

    // Deduct bet from user balance
    db.updateUserBalance(chatId, userId, -amount, username, firstName);

    // Set as king
    db.setKing(chatId, newKing);

    // Mark game as started
    db.markGameStarted(chatId, 'king', userId);

    // Create inline keyboard - all players see the same buttons attached to message
    const keyboardMarkup = Markup.inlineKeyboard([
      [Markup.button.callback('👊 DUMP', 'dump'), Markup.button.callback('💰 CASHOUT', 'cashout')]
    ]);

    console.log(`🎮 Created inline keyboard with 2 buttons (dump + cashout)`);
    console.log(`📱 Keyboard markup:`, JSON.stringify(keyboardMarkup.reply_markup, null, 2));

    // Initialize message manager
    const messageManager = new MessageManager(db);

    // Generate game message
    const userBalance = db.getUserBalance(chatId, userId, username, firstName);
    const messageText = GameLogic.generateGameMessage(newKing, userBalance, userId, true);

    // Send game message with image if available
    const imagePath = ImageUtils.imageExists() ? ImageUtils.getImagePath() : 'text-only';
    console.log(`🎯 Creating first game message for chat ${chatId}, king: @${username || firstName || 'Unknown'}`);

    const newMessageId = await messageManager.updateGameMessage(ctx, messageText, keyboardMarkup, imagePath);

    if (!newMessageId) {
      console.error('❌ Failed to create first game message!');
      await ctx.reply('❌ Error creating game. Please try again.');
      // Refund the bet and cleanup
      db.updateUserBalance(chatId, userId, amount, username, firstName);
      db.removeKing(chatId);
      db.endGame(chatId, 'king');
      return;
    }

    console.log(`✅ First game message created successfully: ${newMessageId}`);

    // Send status message
    await messageManager.sendStatusMessage(
      ctx,
      `👑 @${username || firstName || 'Unknown'} is the new KING! Bet: ${amount}`
    );

  } catch (error) {
    console.error('Error in king command handler:', error);
    await ctx.reply('❌ An error occurred while processing your request.');
  }
}

/**
 * Handle KING game callbacks - refactored from CallbackHandler
 */
export async function handleKingCallback(ctx: Context, action: string, db: DatabaseManager): Promise<void> {
  try {
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    const callbackData = (ctx.callbackQuery as any)?.data;

    console.log(`🎮 KING callback received: ${callbackData} from @${username || firstName || 'Unknown'} (${userId})`);

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

    const currentKing = db.getKing(chatId);
    if (!currentKing) {
      console.log(`❌ No king in chat ${chatId}`);
      await ctx.answerCbQuery('❌ No king currently');
      return;
    }

    console.log(`👑 Current king: @${currentKing.username || currentKing.firstName || 'Unknown'} (${currentKing.userId})`);

    // Initialize message manager
    const messageManager = new MessageManager(db);

    switch (callbackData) {
      case 'dump':
        console.log(`🔥 Processing DUMP request`);
        await handleKingDump(ctx, chatId, userId, username, firstName, currentKing, db, messageManager);
        break;

      case 'cashout':
        console.log(`💰 Processing CASHOUT request`);
        // Additional security check for cashout
        if (currentKing.userId !== userId) {
          console.log(`❌ Unauthorized cashout attempt by ${userId}, king is ${currentKing.userId}`);
          await ctx.answerCbQuery('❌ Only the king can cash out!');
          return;
        }
        await handleKingCashout(ctx, chatId, userId, username, firstName, currentKing, db, messageManager);
        break;

      default:
        console.log(`❌ Unknown callback action: ${callbackData}`);
        await ctx.answerCbQuery('❌ Unknown action');
    }

  } catch (error) {
    console.error('Error in king callback handler:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    await ctx.answerCbQuery('❌ An error occurred');
  }
}

/**
 * Handle DUMP button (attack king) - extracted from CallbackHandler
 */
async function handleKingDump(
  ctx: Context,
  chatId: number,
  userId: number,
  username: string | undefined,
  firstName: string | undefined,
  currentKing: King,
  db: DatabaseManager,
  messageManager: MessageManager
): Promise<void> {
  // Check if user can attack
  if (!GameLogic.canAttackKing(currentKing, userId)) {
    await ctx.answerCbQuery('❌ You can\'t attack yourself!');
    return;
  }

  // Check if user has enough balance
  const attackerBalance = db.getUserBalance(chatId, userId, username, firstName);
  if (attackerBalance < currentKing.betAmount) {
    await ctx.answerCbQuery(`❌ Need ${currentKing.betAmount} coins to attack`);
    return;
  }

  // Deduct bet from attacker
  db.updateUserBalance(chatId, userId, -currentKing.betAmount, username, firstName);

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

    // Pay out winner using zero-sum economy
    const payout = GameEconomy.calculatePayout(currentKing.betAmount);
    db.updateUserBalance(chatId, userId, payout, username, firstName);

    // Remove old king
    db.removeKing(chatId);

    // Set new king
    db.setKing(chatId, newKing);

    // Send status message
    await messageManager.sendStatusMessage(
      ctx,
      `💥 @${username || firstName || 'Unknown'} defeated the king!`
    );

    // Update game message
    await updateKingGameMessage(ctx, chatId, newKing, userId, db, messageManager);

  } else {
    // King wins - increase streak
    currentKing.streak++;
    db.setKing(chatId, currentKing);

    // Pay out king using zero-sum economy
    const payout = GameEconomy.calculatePayout(currentKing.betAmount);
    db.updateUserBalance(chatId, currentKing.userId, payout);

    // Send status message
    await messageManager.sendStatusMessage(
      ctx,
      `🛡️ King survived! Streak: ${currentKing.streak}`
    );

    // Update game message
    await updateKingGameMessage(ctx, chatId, currentKing, userId, db, messageManager);
  }

  await ctx.answerCbQuery();
}

/**
 * Handle CASHOUT button (king withdraws) - extracted from CallbackHandler
 */
async function handleKingCashout(
  ctx: Context,
  chatId: number,
  userId: number,
  username: string | undefined,
  firstName: string | undefined,
  currentKing: King,
  db: DatabaseManager,
  messageManager: MessageManager
): Promise<void> {
  // Only king can cash out
  if (currentKing.userId !== userId) {
    await ctx.answerCbQuery('❌ Only the king can cash out!');
    return;
  }

  // Calculate payout using zero-sum economy (original bet minus house edge)
  const payout = GameEconomy.calculatePayout(currentKing.betAmount);
  db.updateUserBalance(chatId, userId, payout, username, firstName);

  // Send status message
  await messageManager.sendStatusMessage(
    ctx,
    `💰 King cashed out ${payout} coins`
  );

  // Remove king and end game
  db.removeKing(chatId);
  db.endGame(chatId, 'king');

  // Send no king message
  await sendKingNoKingMessage(ctx, chatId, userId, username, firstName, db, messageManager);

  await ctx.answerCbQuery();
}

/**
 * Update game message after state change - extracted from CallbackHandler
 */
async function updateKingGameMessage(
  ctx: Context,
  chatId: number,
  king: King,
  userId: number,
  db: DatabaseManager,
  messageManager: MessageManager
): Promise<void> {
  try {
    // Create inline keyboard - all players see the same buttons attached to message
    const keyboardMarkup = Markup.inlineKeyboard([
      [Markup.button.callback('👊 DUMP', 'dump'), Markup.button.callback('💰 CASHOUT', 'cashout')]
    ]);

    const userBalance = db.getUserBalance(chatId, userId);
    const messageText = GameLogic.generateGameMessage(king, userBalance, userId, king.userId === userId);

    const imagePath = ImageUtils.imageExists() ? ImageUtils.getImagePath() : 'text-only';

    console.log(`🔄 Updating game message for chat ${chatId}, king: @${king.username || king.firstName || 'Unknown'}`);
    console.log(`🎮 Inline keyboard has 2 buttons (dump + cashout)`);

    const newMessageId = await messageManager.updateGameMessage(ctx, messageText, keyboardMarkup, imagePath);

    if (!newMessageId) {
      console.error('❌ Failed to update game message!');
      await ctx.reply('❌ Error updating game state. Please try again.');
    } else {
      console.log(`✅ Game message updated successfully: ${newMessageId}`);
    }
  } catch (error) {
    console.error('Error in updateKingGameMessage:', error);
    await ctx.reply('❌ Error updating game state. Please try again.');
  }
}

/**
 * Send no king message - extracted from CallbackHandler
 */
async function sendKingNoKingMessage(
  ctx: Context,
  chatId: number,
  userId: number,
  username: string | undefined,
  firstName: string | undefined,
  db: DatabaseManager,
  messageManager: MessageManager
): Promise<void> {
  try {
    // No king message - everyone sees the same buttons (can start new game)
    const keyboardMarkup = Markup.inlineKeyboard([
      [Markup.button.callback('🔥 DUMP', 'dump'), Markup.button.callback('💰 CASHOUT', 'cashout')]
    ]);

    const userBalance = db.getUserBalance(chatId, userId, username, firstName);
    const messageText = GameLogic.generateNoKingMessage(userBalance);

    const imagePath = ImageUtils.imageExists() ? ImageUtils.getImagePath() : 'text-only';

    console.log(`🔄 Sending no-king message for chat ${chatId}`);
    console.log(`🎮 No-king inline keyboard has 2 buttons (dump + cashout)`);

    const newMessageId = await messageManager.updateGameMessage(ctx, messageText, keyboardMarkup, imagePath);

    if (!newMessageId) {
      console.error('❌ Failed to send no-king message!');
      await ctx.reply('❌ Error updating game state. Please try again.');
    } else {
      console.log(`✅ No-king message sent successfully: ${newMessageId}`);
    }
  } catch (error) {
    console.error('Error in sendKingNoKingMessage:', error);
    await ctx.reply('❌ Error updating game state. Please try again.');
  }
}
