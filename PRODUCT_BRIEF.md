# Multi-Game Telegram Bot Platform - Production Brief

## Mission
Create a modular Telegram bot platform for rapid prototyping of gambling games, enabling quick iteration and easy migration of individual games to production environments.

## Current Situation
- **Working KING game** with all features (images, streaks, admin commands, balance system)
- **Need to add BOMB game** without breaking anything
- **Target**: 5-10 users, 1-2 chats (prototype quality)
- **Goal**: Add new games in 30 minutes

## Core Requirements
- **Multiple concurrent games** in single chat (KING, BOMB, future games)
- **Shared user balance** across all games
- **Independent game modules** that don't break existing functionality
- **Rapid prototyping** - new game in 30 minutes
- **Easy extraction** - games can be moved to production bots independently
- **Stable core** - adding games doesn't affect existing ones

## Architecture Rules
- **One game type per chat** - can't have two KING games running
- **Multiple game types OK** - KING + BOMB can run simultaneously 
- **Shared balance** across all games
- **Manual game cleanup only** - no auto-timers for prototype
- **Don't break existing KING features**

## Final File Structure
```
src/
├── bot.ts                     # Updated routing
├── handlers/                  # Keep existing
│   ├── callbackHandler.ts     # Keep existing callback logic
│   └── adminCommands.ts       # Keep existing admin features
├── utils/                     # Keep all existing utilities
│   ├── gameLogic.ts           # Game rules and calculations
│   ├── messageManager.ts      # Message handling
│   ├── permissions.ts         # Permission checks
│   └── image.ts              # Image generation
├── database/                  # Enhanced existing
│   ├── database.ts           # Add simple game tracking
│   └── types.ts              # Keep existing types
├── games/                    # NEW - simple game modules
│   ├── king.ts               # Refactored KING game
│   └── bomb.ts               # New BOMB game
└── tests/                    # NEW - basic testing
```

## Game Rules

### KING OF THE CHAT (Existing - Preserve All Features)
```
RULES:
1. /king 100 (any amount) - claim throne
2. DUMP button - attack king (50/50 odds)
3. Winner doubles money  
4. CASHOUT button anytime
5. STREAK BONUS: +5% winrate per defense (max 70/30)

PRESERVE: All images, message management, streak system, admin features
```

### BOMB DISARM (To Implement)
```
RULES:
1. /bomb 100 (any amount) - plant bomb
2. Cut red/blue/green wire - costs 50 (50% of original bet), 33% success
3. If wrong: final cut costs 170 (170% of original bet), 50% success
4. Winner takes entire pot

EXAMPLE FLOW:
- User bets 100 → pot = 100, balance = 900
- First cut costs 50 → pot = 150, balance = 850
- If lose: second cut costs 170 → pot = 320, balance = 680
- If win second cut: user gets 320 → balance = 1000
```

## Migration Steps (Exact Implementation)

### Step 1: Add Game State Tracking to DatabaseManager
Enhance existing `src/database/database.ts` by adding these methods:

```typescript
// Add to existing DatabaseManager class
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

### Step 2: Create games/king.ts
Migrate existing KING logic into modular functions:

```typescript
import { Context } from 'telegraf';
import { DatabaseManager } from '../database/database';
import { ImageUtils, PermissionUtils, MessageManager, GameLogic } from '../utils';

export async function handleKingCommand(ctx: Context, amount: number, db: DatabaseManager): Promise<void> {
  // Move ALL logic from KingCommandHandler.handle() here
  // Add: if (!db.canStartGame(chatId, 'king')) return duplicate error
  // Add: db.markGameStarted(chatId, 'king', userId) after creation
  // Preserve: ALL existing KING functionality
}

export async function handleKingCallback(ctx: Context, action: string, db: DatabaseManager): Promise<void> {
  // Move logic from CallbackHandler for 'dump' and 'cashout'
  // Add: db.endGame(chatId, 'king') when king removed
  // Preserve: ALL existing callback logic
}
```

### Step 3: Update bot.ts Registration
```typescript
import { handleKingCommand, handleKingCallback } from './games/king';

// Replace existing bot.command('king') with:
bot.command('king', async (ctx) => {
  const args = ctx.message.text.split(' ');
  const amount = parseInt(args[1]);
  await handleKingCommand(ctx, amount, db);
});

// Update callback handler to route king actions:
bot.on('callback_query', async (ctx) => {
  const action = ctx.callbackQuery.data;
  
  if (action === 'dump' || action === 'cashout') {
    await handleKingCallback(ctx, action, db);
  }
  // Keep existing admin callbacks
});
```

## Preserve Existing Infrastructure

### ✅ REUSE These Working Utilities:
- **gameLogic.ts** - probability calculations, win/loss logic
- **messageManager.ts** - message sending/editing patterns
- **permissions.ts** - admin security and validation
- **image.ts** - visual generation system
- **All existing database operations** - don't rewrite working code

### ❌ DON'T Rewrite Working Code:
- Keep existing MessageManager class and patterns
- Keep existing GameLogic calculation methods  
- Keep existing PermissionUtils validation
- Keep existing ImageUtils functionality

## Error Messages
- **Duplicate game**: "❗ [GAME] is already ruling this chat! Finish the game first!"
- **Insufficient funds**: "💸 Not enough balance. You have [BALANCE], need [AMOUNT]"
- **Invalid amount**: "❌ Bet must be between 1 and 10,000"

## Critical Testing Requirements

### ⚠️ MANDATORY TESTING BEFORE EACH DEPLOY:
```
□ KING works exactly as before (no regressions)
□ /king when KING active shows duplicate error  
□ BOMB works independently with correct math
□ Can run KING + BOMB simultaneously in same chat
□ Balance calculations are perfect:
  - Bet 100 → balance decreases by 100
  - First cut 50 → balance decreases by 50, pot = 150
  - Final cut 170 → balance decreases by 170, pot = 320
  - Winner gets full pot → balance correct
□ Duplicate BOMB shows error
□ All admin commands still work
□ Images and message management preserved
```

### Balance Math Validation
```typescript
// Essential unit tests
describe('Game Balance Math', () => {
  test('BOMB pot calculation: 100 + 50 + 170 = 320', () => {
    expect(100 + 50 + 170).toBe(320);
  });
  
  test('First cut cost: 50% of bet', () => {
    expect(Math.floor(100 * 0.5)).toBe(50);
  });
  
  test('Final cut cost: 170% of bet', () => {
    expect(Math.floor(100 * 1.7)).toBe(170);
  });
});
```

## Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Telegraf.js for Telegram Bot API
- **Database**: JSON file storage (perfect for prototype)
- **Deployment**: Render.com with Docker
- **URL**: https://king-of-the-chat-bot.onrender.com

## Success Criteria
- ✅ KING game works exactly as before (zero regressions)
- ✅ BOMB game works perfectly (tested thoroughly)
- ✅ Can run KING + BOMB simultaneously in same chat
- ✅ Shared balance system works correctly
- ✅ Easy to add future games (30 minute target)
- ✅ Code is clean and maintainable
- ✅ No user-facing bugs

## Development Approach
1. **Preserve what works** - don't touch working KING features
2. **Simple additions** - add game tracking to existing database
3. **Modular games** - one file per game in games/ folder
4. **Test thoroughly** - unit tests for math, manual tests for UX
5. **No over-engineering** - prototype quality but reliable
6. **Reuse utilities** - leverage existing working infrastructure

## Key Implementation Notes
- **No auto-cleanup timers** - manual game ending only for prototype
- **Simple game state** - just track "chatId:gameName" active status
- **Preserve all utilities** - use existing image, message, permission systems
- **Clear error messages** - users should understand what went wrong
- **Reliable balance math** - test all calculations thoroughly
- **Same UI quality** - maintain existing visual standards

## Future Migration Ready
- **Modular games** - easy to extract to separate bots
- **Clean interfaces** - ready for production SDK integration
- **Shared utilities** - reusable across multiple games
- **Test coverage** - confident refactoring for production

This is a working prototype that real users will test. It needs to be reliable and bug-free, even if it's not production-scale architecture yet.