import { Context } from 'telegraf';
import { DatabaseManager } from '../database/database';
import { MessageManager, GameEconomy } from '../utils';

/**
 * Handler for administrative commands (testing/debugging)
 */
export class AdminCommandHandler {
  private db: DatabaseManager;
  private messageManager: MessageManager;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.messageManager = new MessageManager(db);
  }

  /**
   * Handle /kingreset command - reset current king for testing
   */
  async handleKingReset(ctx: Context): Promise<void> {
    try {
      console.log(`🔄 King reset command received`);

      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;

      console.log(`📊 Chat ID: ${chatId}, User ID: ${userId}, Username: @${username || firstName || 'Unknown'}`);

      if (!chatId || !userId) {
        console.log(`❌ Missing chatId or userId`);
        await ctx.reply('❌ Unable to process command');
        return;
      }

      // Check if user is admin (for security)
      console.log(`🔍 Checking admin status for user ${userId}`);
      const isAdmin = await this.isUserAdmin(ctx, userId);
      console.log(`🔍 Admin status: ${isAdmin}`);

      if (!isAdmin) {
        console.log(`❌ User ${userId} is not admin - trying alternative check`);

        // Try alternative admin check for edge cases
        const isOwner = await this.isUserOwner(ctx, userId);
        if (!isOwner) {
          console.log(`❌ User ${userId} is not owner either`);
          await ctx.reply('❌ \\*Admin required:\\* Only administrators can use this command\\.', {
            parse_mode: 'MarkdownV2'
          });
          return;
        }

        console.log(`✅ User ${userId} is chat owner, proceeding with reset`);
      } else {
        console.log(`✅ User ${userId} is admin, proceeding with reset`);
      }

      await this.performKingReset(ctx, chatId, userId, username, firstName, false);

    } catch (error) {
      console.error('Error in kingreset command:', error);
      await ctx.reply('❌ An error occurred while resetting the king.');
    }
  }

  /**
   * Handle /kingstats command - show chat statistics
   */
  async handleKingStats(ctx: Context): Promise<void> {
    try {
      const chatId = ctx.chat?.id;

      if (!chatId) {
        await ctx.reply('❌ Unable to get chat information');
        return;
      }

      const currentKing = this.db.getKing(chatId);
      const chatStats = this.db.getAllUsers(chatId);
      const userCount = Object.keys(chatStats).length;

      let statsMessage = `📊 *KING OF THE CHAT - STATISTICS*

👥 **Total Users:** ${userCount}
`;

      if (currentKing) {
        statsMessage += `
👑 **Current King:** @${currentKing.username || currentKing.firstName || 'Unknown'}
💰 **Bet Amount:** ${currentKing.betAmount} coins
🔥 **Streak:** ${currentKing.streak}
⏰ **Reign Started:** ${new Date(currentKing.timestamp).toLocaleString()}
`;
      } else {
        statsMessage += `
👑 **Current King:** None (throne empty)
`;
      }

      // Show top users by balance
      const usersByBalance = Object.entries(chatStats)
        .sort(([, a], [, b]) => b.balance - a.balance)
        .slice(0, 5);

      if (usersByBalance.length > 0) {
        statsMessage += `
💰 **Top Balances:**
${usersByBalance.map(([userId, user], index) => {
  const username = user.username || user.firstName || 'Unknown';
  return `${index + 1}. @${username}: ${user.balance} coins`;
}).join('\n')}
`;
      }

      await ctx.reply(statsMessage, { parse_mode: 'MarkdownV2' });

    } catch (error) {
      console.error('Error in kingstats command:', error);
      await ctx.reply('❌ An error occurred while fetching statistics.');
    }
  }

  /**
   * Handle /kingresetforce command - force reset without admin check (emergency only)
   */
  async handleKingResetForce(ctx: Context): Promise<void> {
    try {
      console.log(`🚨 FORCE King reset command received`);

      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;

      console.log(`📊 Chat ID: ${chatId}, User ID: ${userId}, Username: @${username || firstName || 'Unknown'}`);

      if (!chatId || !userId) {
        console.log(`❌ Missing chatId or userId`);
        await ctx.reply('❌ Unable to process command');
        return;
      }

      console.log(`⚠️  FORCE RESET: Skipping admin check for emergency reset`);

      await this.performKingReset(ctx, chatId, userId, username, firstName, true);
    } catch (error) {
      console.error('Error in kingresetforce command:', error);
      await ctx.reply('❌ An error occurred while force resetting the king.');
    }
  }

  /**
   * Perform the actual king reset operation
   */
  private async performKingReset(
    ctx: Context,
    chatId: number,
    userId: number,
    username: string | undefined,
    firstName: string | undefined,
    isForceReset: boolean = false
  ): Promise<void> {
    const currentKing = this.db.getKing(chatId);

          if (!currentKing) {
        await ctx.reply('ℹ️ No king to reset: There is currently no king in this chat\\.', {
          parse_mode: 'MarkdownV2'
        });
        return;
      }

    // Get chat statistics before reset
    const chatStats = this.db.getAllUsers(chatId);
    const userCount = Object.keys(chatStats).length;

    console.log(`🔄 Starting king reset in chat ${chatId}`);
    console.log(`👑 Current king: @${currentKing.username || currentKing.firstName || 'Unknown'}`);

    // Reset king and message state
    this.db.removeKing(chatId);
    console.log(`✅ King removed from database`);

    // Clean up pinned message if it exists
    const lastMessageId = this.db.getLastMessageId(chatId);
    if (lastMessageId) {
      try {
        await ctx.unpinChatMessage(lastMessageId);
        console.log(`✅ Unpinned message ${lastMessageId}`);
      } catch (error) {
        console.log(`⚠️  Could not unpin message ${lastMessageId}:`, error);
      }

      try {
        await ctx.deleteMessage(lastMessageId);
        console.log(`✅ Deleted old game message ${lastMessageId}`);
      } catch (error) {
        console.log(`⚠️  Could not delete message ${lastMessageId}:`, error);
      }

      // Reset message ID in database
      this.db.setLastMessageId(chatId, undefined as any);
      console.log(`✅ Reset message ID in database`);
    } else {
      console.log(`ℹ️  No message ID found to clean up`);
    }

    // Send confirmation message
    const resetType = isForceReset ? 'FORCE ' : '';
    const safeUsername = (currentKing.username || currentKing.firstName || 'Unknown')
      .replace(/_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/`/g, '\\`')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]');

    const resetMessage = `🔄 KING ${resetType}RESET COMPLETED

✅ Previous King: @${safeUsername}
✅ Bet Amount: ${currentKing.betAmount} coins
✅ Streak: ${currentKing.streak} 🔥
✅ Chat Users: ${userCount}

The throne is now empty\\! Use \`/king <amount>\` to claim it\\.`;

    await ctx.reply(resetMessage, { parse_mode: 'MarkdownV2' });

    // Send status message
    await this.messageManager.sendStatusMessage(
      ctx,
      '👑 Throne has been reset - ready for new games!'
    );

    console.log(`🎉 King reset completed successfully in chat ${chatId}`);
    console.log(`📊 Previous king: @${currentKing.username || currentKing.firstName || 'Unknown'} (${currentKing.betAmount} coins, ${currentKing.streak} streak)`);
    console.log(`👤 Reset performed by: @${username || firstName || 'Unknown'}`);
  }

  /**
   * Check if user is administrator
   */
  private async isUserAdmin(ctx: Context, userId: number): Promise<boolean> {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        console.log(`❌ No chatId for admin check`);
        return false;
      }

      console.log(`🔍 Getting chat member info for user ${userId} in chat ${chatId}`);
      const member = await ctx.getChatMember(userId);
      console.log(`🔍 Member status: ${member.status}`);

      const isAdmin = member.status === 'administrator' || member.status === 'creator';
      console.log(`🔍 Final admin check result: ${isAdmin}`);

      return isAdmin;
    } catch (error) {
      console.error('Error checking user admin status:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));

      // If we can't check permissions, assume not admin for security
      return false;
    }
  }

  /**
   * Handle /kingeconomy command - show current economy settings
   */
  async handleKingEconomy(ctx: Context): Promise<void> {
    try {
      console.log(`💰 Economy info command received`);

      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;

      if (!chatId || !userId) {
        await ctx.reply('❌ Unable to process command');
        return;
      }

      // Check if user is admin
      const isAdmin = await this.isUserAdmin(ctx, userId);
      if (!isAdmin) {
        await ctx.reply('❌ *Admin required:* Only administrators can view economy settings.', {
          parse_mode: 'MarkdownV2'
        });
        return;
      }

      const economyInfo = GameEconomy.getEconomyInfo();

      const economyMessage = `🏦 *KING GAME ECONOMY SETTINGS*

💰 **House Edge:** ${economyInfo.description}
${economyInfo.isZeroSum ? '✅' : '⚠️'} **Zero-Sum:** ${economyInfo.isZeroSum ? 'Yes' : 'No'}

📊 **Current Payout Calculation:**
- **Bet Amount:** 100 coins
- **House Cut:** ${GameEconomy.getHouseCut(100)} coins
- **Winner Gets:** ${GameEconomy.calculatePayout(100)} coins

🎮 **Game Mechanics:**
- Winner takes loser's stake (minus house edge)
- No money creation exploits
- Fair zero-sum gaming${economyInfo.isZeroSum ? '' : ' (with house edge)'}

⚙️ **Admin Commands:**
• \`/kingeconomy\` - View settings
• \`/sethouseedge <percent>\` - Set house edge (0.0-0.5)`;

      await ctx.reply(economyMessage, { parse_mode: 'MarkdownV2' });

    } catch (error) {
      console.error('Error in kingeconomy command:', error);
      await ctx.reply('❌ An error occurred while fetching economy information.');
    }
  }

  /**
   * Handle /sethouseedge command - set house edge percentage
   */
  async handleSetHouseEdge(ctx: Context): Promise<void> {
    try {
      console.log(`⚙️ Set house edge command received`);

      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;
      const commandText = (ctx.message as any)?.text || '';

      if (!chatId || !userId) {
        await ctx.reply('❌ Unable to process command');
        return;
      }

      // Check if user is admin
      const isAdmin = await this.isUserAdmin(ctx, userId);
      if (!isAdmin) {
        await ctx.reply('❌ *Admin required:* Only administrators can change economy settings.', {
          parse_mode: 'MarkdownV2'
        });
        return;
      }

      // Parse the house edge percentage from command
      const args = commandText.split(' ').slice(1);
      const percentStr = args.length > 0 ? args[0] : null;

      if (!percentStr) {
        await ctx.reply('❌ *Usage:* `/sethouseedge <percent>`\n\nExample: `/sethouseedge 0.05` (5% house edge)\nUse `0.0` for zero-sum gaming', {
          parse_mode: 'MarkdownV2'
        });
        return;
      }

      const percent = parseFloat(percentStr);
      if (isNaN(percent) || percent < 0 || percent > 0.5) {
        await ctx.reply('❌ *Invalid percentage:* Must be between 0.0 and 0.5\n\n• `0.0` = Zero-sum (no house edge)\n• `0.05` = 5% house edge\n• `0.1` = 10% house edge', {
          parse_mode: 'MarkdownV2'
        });
        return;
      }

      // Set the house edge
      const success = GameEconomy.setHouseEdgePercent(percent);

      if (!success) {
        await ctx.reply('❌ *Error:* Failed to set house edge percentage', {
          parse_mode: 'MarkdownV2'
        });
        return;
      }

      const economyInfo = GameEconomy.getEconomyInfo();

      const confirmMessage = `✅ *HOUSE EDGE UPDATED*

🏦 **New House Edge:** ${economyInfo.description}
${economyInfo.isZeroSum ? '✅' : '⚠️'} **Zero-Sum:** ${economyInfo.isZeroSum ? 'Yes' : 'No'}

📊 **Example Payout (100 coin bet):**
- **House Cut:** ${GameEconomy.getHouseCut(100)} coins
- **Winner Gets:** ${GameEconomy.calculatePayout(100)} coins

⚠️ **Warning:** Changes take effect immediately for all games!`;

      await ctx.reply(confirmMessage, { parse_mode: 'MarkdownV2' });

      console.log(`🏦 House edge changed by admin ${userId} (@${username || firstName || 'Unknown'}) to ${(percent * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('Error in sethouseedge command:', error);
      await ctx.reply('❌ An error occurred while setting house edge.');
    }
  }

  /**
   * Alternative owner check for edge cases
   */
  private async isUserOwner(ctx: Context, userId: number): Promise<boolean> {
    try {
      // This is a fallback check - in some cases the API might not return correct status
      // For now, we'll just try the regular admin check again
      console.log(`🔍 Trying alternative owner check`);
      return await this.isUserAdmin(ctx, userId);
    } catch (error) {
      console.error('Error in alternative owner check:', error);
      return false;
    }
  }
}
