I need to refactor my existing Telegram bot to support multiple concurrent games while preserving all working KING game functionality.

## Current Working Code Analysis:
- KingCommandHandler class in kingCommand.ts (works perfectly)
- CallbackHandler class handles 'dump' and 'cashout' callbacks
- DatabaseManager class with getUserBalance, updateUserBalance, getKing, setKing methods
- Bot registration in bot.ts with bot.command('king') and bot.on('callback_query')

## Refactoring Requirements:

### Step 1: Add Game State Tracking to DatabaseManager
Enhance `src/database/database.ts` by adding these exact methods to the DatabaseManager class:

```
// Add these methods to existing DatabaseManager class
private activeGames = new Map<string, string>(); // "chatId:gameName" -> userId

canStartGame(chatId: number, gameName: string): boolean {
  return !this.activeGames.has(`${chatId}:${gameName}`);
}

markGameStarted(chatId: number, gameName: string, userId: number): void {
  this.activeGames.set(`${chatId}:${gameName}`, userId.toString());
}

endGame(chatId: number, gameName: string): void {
  this.activeGames.delete(`${chatId}:${gameName}`);
}
```

### Step 2: Create games/king.ts Module
Create `src/games/king.ts` that exports these functions and preserves ALL existing KING functionality:

```
import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { DatabaseManager } from '../database/database';
import { ImageUtils, PermissionUtils, MessageManager, GameLogic } from '../utils';
import { King } from '../database/types';

export async function handleKingCommand(ctx: Context, amount: number, db: DatabaseManager): Promise<void> {
  // Move ALL logic from KingCommandHandler.handle() here
  // Add duplicate game check: if (!db.canStartGame(chatId, 'king')) return error
  // Add db.markGameStarted(chatId, 'king', userId) after successful king creation
  // Preserve: bet validation, balance checks, king creation, message sending, inline keyboard
}

export async function handleKingCallback(ctx: Context, action: string, db: DatabaseManager): Promise<void> {
  // Move logic from CallbackHandler.handle() for 'dump' and 'cashout' cases
  // Add db.endGame(chatId, 'king') when king is removed (cashout or defeated)
  // Preserve: attack logic, cashout logic, streak bonuses, message updates
}
```

### Step 3: Update bot.ts Registration
Replace existing king command registration in `src/bot.ts`:

```
import { handleKingCommand, handleKingCallback } from './games/king';

// Replace existing bot.command('king') with:
bot.command('king', async (ctx) => {
  const commandText = (ctx.message as any)?.text || '';
  const args = commandText.split(' ').slice(1);
  const betAmount = args.length > 0 ? parseInt(args) : null;
  
  if (!betAmount) {
    await ctx.reply('❌ Please specify a valid bet amount\nExample: `/king 100`');
    return;
  }
  
  await handleKingCommand(ctx, betAmount, db);
});

// Update existing callback handler:
bot.on('callback_query', async (ctx) => {
  const callbackData = (ctx.callbackQuery as any)?.data;
  
  if (callbackData === 'dump' || callbackData === 'cashout') {
    await handleKingCallback(ctx, callbackData, db);
  }
  // Keep existing admin callbacks etc.
});
```

## Critical Requirements:
1. **Preserve ALL existing KING features**: streaks, images, message management, permissions
2. **Use exact same class instances**: MessageManager(db), same utility imports
3. **Keep identical UI/UX**: same buttons, same messages, same behavior
4. **Add duplicate prevention**: return "❗ KING is already ruling this chat! Finish the game first!" 
5. **Test thoroughly**: KING game must work exactly as before

## Expected Outcome:
- KING game works identically to current version
- Architecture ready for BOMB game addition
- Clean separation between games
- No breaking changes for users

Implement this refactoring step by step, preserving every detail of the working KING game.
```