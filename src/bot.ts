import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { DatabaseManager } from './database/database';
import { handleKingCommand, handleKingCallback } from './games/king';
import { AdminCommandHandler } from './handlers/adminCommands';
import { PermissionUtils, ImageUtils } from './utils';
import * as http from 'http';

// Load environment variables
require('dotenv').config();

// Set default PORT for Render.com
const PORT = process.env.PORT || '10000';

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN environment variable is required!');
  console.error('Please create a .env file with:');
  console.error('BOT_TOKEN=your_telegram_bot_token_here');
  console.error('');
  console.error('For Render.com deployment:');
  console.error('1. Go to your service dashboard');
  console.error('2. Add environment variable BOT_TOKEN');
  console.error('3. Redeploy the service');
  process.exit(1);
}

// Check if token is a placeholder
if (process.env.BOT_TOKEN === 'your_telegram_bot_token_here' || !/^\d+:[A-Za-z0-9_-]+$/.test(process.env.BOT_TOKEN)) {
  console.error('❌ INVALID BOT TOKEN!');
  console.error('');
  console.error('📝 Your BOT_TOKEN in .env file is not set correctly.');
  console.error('📝 It should be something like: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789');
  console.error('');
  console.error('🔧 To fix this:');
  console.error('1. Go to Telegram and search for @BotFather');
  console.error('2. Use /newbot command to create a bot');
  console.error('3. Copy the token and replace "your_telegram_bot_token_here" in .env file');
  console.error('');
  process.exit(1);
}

// Initialize bot and database
const bot = new Telegraf(process.env.BOT_TOKEN);
const db = new DatabaseManager('./data.json');

// Initialize handlers
const adminCommandHandler = new AdminCommandHandler(db);

/**
 * Error handling middleware
 */
bot.use(async (ctx: Context, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Unhandled error:', error);
    try {
      await ctx.reply('❌ An unexpected error occurred. Please try again.');
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
});

/**
 * Health check endpoint for Render.com
 */
bot.command('health', async (ctx) => {
  const stats = db.getStats();
  const uptime = process.uptime();
  const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

  const healthMessage = `🤖 *Bot Status: ONLINE*

⏱️ *Uptime:* ${uptimeFormatted}
📊 *Chats:* ${stats.totalChats}
👥 *Users:* ${stats.totalUsers}
💾 *Memory:* ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
🔗 *Platform:* Render.com`;

  await ctx.reply(healthMessage, { parse_mode: 'Markdown' });
});

/**
 * Start command - show welcome message
 */
bot.start(async (ctx) => {
  const welcomeMessage = `👑 \\*KING OF THE CHAT\\*

Welcome to the ultimate throne battle\\!

Use \`/king <amount>\` to claim the throne and start your reign\\!

\\*Example:\\* \`/king 100\`

Good luck\\! 🍀`;

  await ctx.reply(welcomeMessage, { parse_mode: 'MarkdownV2' });
});

/**
 * Help command
 */
bot.help(async (ctx) => {
  const helpMessage = `👑 \\*KING OF THE CHAT\\* \\- Help

\\*Game Commands:\\*
\`/start\` \\- Show welcome message
\`/help\` \\- Show this help
\`/king <amount>\` \\- Claim throne with bet amount

\\*Admin Commands \\(for testing\\):\\*
\`/kingreset\` \\- Reset current king \\(admins only\\)
/kingresetforce \\- Force reset without admin check \\(emergency\\)
/kingstats \\- Show chat statistics
/kingeconomy \\- View economy settings \\(admins only\\)
/sethouseedge <percent> \\- Set house edge \\(admins only\\)

\\*Game Rules:\\*
1\\. BET \`/king 100\` \\(any amount\\) to claim throne
2\\. DUMP to attack the King \\- winner takes loser's stake
3\\. Fair zero\\-sum gaming \\(no money creation\\)
4\\. CASHOUT anytime
5\\. STREAK BONUS: \\+5% winrate per defense up to 70/30

\\*Permissions Required:\\*
✅ Pin messages
✅ Delete messages

Make sure the bot is an admin with these permissions\\!`;

  await ctx.reply(helpMessage, { parse_mode: 'MarkdownV2' });
});

/**
 * King command handler
 */
bot.command('king', async (ctx) => {
  const commandText = (ctx.message as any)?.text || '';
  const args = commandText.split(' ').slice(1);
  const betAmount = args.length > 0 ? parseInt(args[0]) : null;

  if (!betAmount) {
    await ctx.reply('❌ Please specify a valid bet amount\nExample: `/king 100`');
    return;
  }

  await handleKingCommand(ctx, betAmount, db);
});

/**
 * Admin commands (for testing/debugging)
 */
bot.command('kingreset', async (ctx) => {
  console.log(`🚀 King reset command triggered by user ${ctx.from?.id} (@${ctx.from?.username || ctx.from?.first_name || 'Unknown'})`);
  await adminCommandHandler.handleKingReset(ctx);
});

bot.command('kingstats', async (ctx) => {
  console.log(`🚀 King stats command triggered by user ${ctx.from?.id} (@${ctx.from?.username || ctx.from?.first_name || 'Unknown'})`);
  await adminCommandHandler.handleKingStats(ctx);
});

bot.command('kingresetforce', async (ctx) => {
  console.log(`🚨 FORCE King reset command triggered by user ${ctx.from?.id} (@${ctx.from?.username || ctx.from?.first_name || 'Unknown'})`);
  await adminCommandHandler.handleKingResetForce(ctx);
});

bot.command('kingeconomy', async (ctx) => {
  console.log(`💰 Economy info command triggered by user ${ctx.from?.id} (@${ctx.from?.username || ctx.from?.first_name || 'Unknown'})`);
  await adminCommandHandler.handleKingEconomy(ctx);
});

bot.command('sethouseedge', async (ctx) => {
  console.log(`⚙️ Set house edge command triggered by user ${ctx.from?.id} (@${ctx.from?.username || ctx.from?.first_name || 'Unknown'})`);
  await adminCommandHandler.handleSetHouseEdge(ctx);
});

/**
 * Handle callback queries (inline buttons)
 */
bot.on('callback_query', async (ctx) => {
  const callbackData = (ctx.callbackQuery as any)?.data;

  // Route KING callbacks to the new modular handler
  if (callbackData === 'dump' || callbackData === 'cashout') {
    await handleKingCallback(ctx, callbackData, db);
  } else {
    // No other callbacks exist in the system
    console.log(`Unknown callback: ${callbackData}`);
    await ctx.answerCbQuery('❌ Unknown action');
  }
});

/**
 * Handle text messages (for debugging or future features)
 */
bot.on(message('text'), async (ctx) => {
  // Could add more features here in the future
  // For now, just ignore regular text messages
});

/**
 * Handle new chat members (welcome message)
 */
bot.on('new_chat_members', async (ctx) => {
  const newMembers = ctx.message.new_chat_members;
  const botUsername = ctx.botInfo.username;

  for (const member of newMembers) {
    if (member.username === botUsername) {
      // Bot was added to chat
      const welcomeMessage = `👑 \\*KING OF THE CHAT\\*

I've been added to this chat\\!

To get started:
1\\. Make me an admin with these permissions:
   ✅ Pin messages
   ✅ Delete messages
2\\. Use \`/king <amount>\` to start the game\\!

Example: \`/king 100\``;

      await ctx.reply(welcomeMessage, { parse_mode: 'MarkdownV2' });
    }
  }
});

/**
 * Graceful shutdown
 */
process.once('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  bot.stop('SIGTERM');
});

/**
 * Start HTTP server for Render health checks
 */
function startHttpServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'king-of-the-chat-bot',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`🌐 HTTP server listening on port ${PORT}`);
  });

  return server;
}

/**
 * Start the bot
 */
async function startBot(): Promise<void> {
  try {
    console.log('🚀 Starting KING OF THE CHAT bot...');

    // Start HTTP server for Render health checks
    const httpServer = startHttpServer();

    // Ensure image directory exists
    ImageUtils.ensureImageDirectory();

    // Check if image exists
    if (ImageUtils.imageExists()) {
      console.log('✅ King image found at ./assets/images/king.jpg');
    } else {
      console.log('⚠️  King image not found at ./assets/images/king.jpg - will use text-only messages');
    }

    // Launch bot
    await bot.launch();
    console.log('✅ Bot is running! Press Ctrl+C to stop.');
    console.log('🎮 KING OF THE CHAT is ready to accept commands!');
    console.log('📝 Use /king <amount> to start a game in any chat');

    // Show database stats
    const stats = db.getStats();
    console.log(`📊 Database stats: ${stats.totalChats} chats, ${stats.totalUsers} users`);

    // Show bot info
    try {
      const botInfo = await bot.telegram.getMe();
      console.log(`🤖 Bot: @${botInfo.username} (${botInfo.first_name})`);
      console.log(`🆔 Bot ID: ${botInfo.id}`);
    } catch (error) {
      console.warn('⚠️  Could not get bot info:', error);
    }

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
startBot().catch((error) => {
  console.error('❌ Fatal error starting bot:', error);
  process.exit(1);
});
