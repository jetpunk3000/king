import { Context } from 'telegraf';

/**
 * Bot permissions checking utilities
 */
export class PermissionUtils {
  /**
   * Required permissions for the bot
   */
  static readonly REQUIRED_PERMISSIONS = {
    can_pin_messages: 'Pin messages',
    can_delete_messages: 'Delete messages'
  };

  /**
   * Check if bot has required permissions in a chat
   */
  static async checkBotPermissions(ctx: Context): Promise<{
    hasPermissions: boolean;
    missingPermissions: string[];
    errorMessage: string;
  }> {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        return {
          hasPermissions: false,
          missingPermissions: ['Unable to get chat information'],
          errorMessage: '❌ Unable to access chat information'
        };
      }

      const botInfo = await ctx.getChatMember(ctx.botInfo.id);
      const missingPermissions: string[] = [];

      // Check each required permission
      for (const [permission, displayName] of Object.entries(this.REQUIRED_PERMISSIONS)) {
        if (!botInfo[permission as keyof typeof botInfo]) {
          missingPermissions.push(displayName);
        }
      }

      const hasPermissions = missingPermissions.length === 0;

      let errorMessage = '';
      if (!hasPermissions) {
        errorMessage = `❌ BOT NEEDS ADMIN RIGHTS

Please make @${ctx.botInfo.username} admin with these permissions:
${missingPermissions.map(perm => `✅ ${perm}`).join('\n')}

Then try /king again!`;
      }

      return {
        hasPermissions,
        missingPermissions,
        errorMessage
      };
    } catch (error) {
      console.error('Error checking bot permissions:', error);
      return {
        hasPermissions: false,
        missingPermissions: ['Unable to check permissions'],
        errorMessage: '❌ Unable to check bot permissions. Please ensure the bot is an administrator.'
      };
    }
  }

  /**
   * Send permission error message
   */
  static async sendPermissionError(ctx: Context, errorMessage: string): Promise<void> {
    try {
      await ctx.reply(errorMessage);
    } catch (error) {
      console.error('Error sending permission error message:', error);
    }
  }

  /**
   * Check if user is administrator
   */
  static async isUserAdmin(ctx: Context, userId: number): Promise<boolean> {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) return false;

      const member = await ctx.getChatMember(userId);
      return member.status === 'administrator' || member.status === 'creator';
    } catch (error) {
      console.error('Error checking user admin status:', error);
      return false;
    }
  }
}
