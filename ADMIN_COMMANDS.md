# 🔧 KING OF THE CHAT - Admin Commands

## 📋 Available Admin Commands

### `/kingreset`
**Purpose:** Reset the current king and clean up game state
**Required Permission:** Chat Administrator
**Usage:** `/kingreset`

#### What it does:
1. ✅ **Checks admin permissions** - Only administrators can use this command
2. ✅ **Shows current king info** - Displays previous king's details before reset
3. ✅ **Removes king from database** - Clears current king state
4. ✅ **Cleans up messages** - Unpins and deletes old game messages
5. ✅ **Resets message tracking** - Clears lastMessageId for the chat
6. ✅ **Shows confirmation** - Detailed report of what was reset

#### Example Output:
```
🔄 KING RESET COMPLETED

✅ Previous King: @username
✅ Bet Amount: 100 coins
✅ Streak: 3 🔥
✅ Chat Users: 5

The throne is now empty! Use /king <amount> to claim it.
```

#### When to use:
- **Database corruption** - King exists but no message visible
- **Testing scenarios** - Need to start fresh
- **Emergency cleanup** - Game state is stuck
- **Message lost** - Pinned message was deleted manually

### `/kingresetforce`
**Purpose:** Force reset king without admin permission check
**Required Permission:** None (use with caution!)
**Usage:** `/kingresetforce`

#### What it does:
1. 🚨 **NO PERMISSION CHECK** - Anyone can use this command
2. ✅ **Shows current king info** - Displays previous king's details before reset
3. ✅ **Removes king from database** - Clears current king state
4. ✅ **Cleans up messages** - Unpins and deletes old game messages
5. ✅ **Shows confirmation** - Detailed report of what was reset

#### Example Output:
```
🔄 KING FORCE RESET COMPLETED

✅ Previous King: @username
✅ Bet Amount: 100 coins
✅ Streak: 3 🔥
✅ Chat Users: 5

The throne is now empty! Use /king <amount> to claim it.
```

#### When to use:
- **Emergency situations** - When `/kingreset` doesn't work
- **Permission issues** - Bot can't check admin status
- **Testing** - Quick reset without admin setup
- **Debugging** - When you need to bypass permission checks

#### ⚠️ **WARNING:** This command skips admin verification!

### `/kingstats`
**Purpose:** Show detailed statistics for the current chat
**Required Permission:** Anyone can use (no admin required)
**Usage:** `/kingstats`

#### What it shows:
1. 📊 **Total users** in the chat
2. 👑 **Current king** information (if any)
3. 💰 **Top 5 users** by balance
4. 🔥 **King's streak** and other details

#### Example Output:
```
📊 KING OF THE CHAT - STATISTICS

👥 Total Users: 5

👑 Current King: @king_username
💰 Bet Amount: 100 coins
🔥 Streak: 3
⏰ Reign Started: 12/25/2023, 3:45:23 PM

💰 Top Balances:
1. @user1: 1500 coins
2. @user2: 1200 coins
3. @user3: 1000 coins
4. @king_username: 950 coins
5. @user4: 800 coins
```

## 🛡️ Security Features

### Admin Verification
- Commands check `ctx.getChatMember(userId)` status
- Only `administrator` or `creator` can use `/kingreset`
- Clear error messages for non-admin users

### Safe Operations
- All operations wrapped in try-catch blocks
- Database operations are atomic where possible
- Graceful handling of missing messages/data

## 🔍 Debugging Information

### Console Logging
All admin operations are logged with details:
```
🔄 King reset in chat -1001234567890 by @admin_username
Previous king: @king_username (100 coins, 3 streak)
✅ Cleaned up old game message 123456789
```

### Error Handling
- Network errors are caught and logged
- User gets friendly error messages
- Bot continues operating even if some operations fail

## 🚀 Usage Examples

### Scenario 1: Stuck Game State
```
User: /kingreset
Bot: 🔄 KING RESET COMPLETED
     ✅ Previous King: @old_king
     ✅ Bet Amount: 50 coins
     ✅ Streak: 2 🔥

     The throne is now empty! Use /king <amount> to claim it.
```

### Scenario 2: Check Statistics
```
User: /kingstats
Bot: 📊 KING OF THE CHAT - STATISTICS
     👥 Total Users: 8
     👑 Current King: @current_king
     💰 Top Balances: ...
```

### Scenario 3: Non-Admin User
```
User: /kingreset
Bot: ❌ Admin required: Only administrators can use this command.
```

## 📝 Best Practices

### When to use `/kingreset`:
1. **During Testing** - Reset between test scenarios
2. **After Crashes** - Clean up corrupted state
3. **Emergency Situations** - When game is completely stuck
4. **Fresh Start** - Want to start with clean slate

### Regular Maintenance:
- Use `/kingstats` to monitor chat activity
- Check bot logs for any issues
- Monitor pinned message status
- Keep database backups (data.json)

## ⚠️ Important Notes

- **Admin Only:** `/kingreset` requires administrator permissions
- **Data Loss:** Reset will permanently remove current king
- **Message Cleanup:** May delete visible game messages
- **No Undo:** Reset operation cannot be undone
- **Safe for Users:** Only removes game state, user balances are preserved

## 🎮 Integration with Game Flow

### Normal Game Flow:
1. `/king 100` → Creates king + pinned message
2. `🔥 DUMP` → Updates message + king
3. `💰 CASHOUT` → Removes king + shows no-king message

### With Admin Commands:
4. `/kingreset` → Emergency cleanup + statistics
5. `/kingstats` → View current state + balances

The admin commands work seamlessly with the normal game flow and provide essential tools for testing and maintenance.
