# 👑 KING OF THE CHAT

A Telegram bot game where players bet to become king and defend their throne against challengers!

## 🎮 Game Mechanics

1. **Claim Throne**: `/king <amount>` - Bet any amount to become king
2. **Attack King**: Click "🔥 DUMP" - Costs same amount as king's bet, 50/50 odds
3. **Cashout**: Click "💰 CASHOUT" - King withdraws and ends reign
4. **Winner takes all**: Winner gets double the bet amount
5. **Streak Bonus**: Each successful defense gives +5% winrate (max 70/30 odds)
6. **Per-chat kings**: Each chat has its own independent king

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Telegram Bot Token from [@BotFather](https://t.me/botfather)

### Installation

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd king-of-the-chat
   npm install
   npm run build
   ```

2. **Setup your bot token (CHOOSE ONE):**

   **Option A - Interactive Setup:**
   ```bash
   npm run setup
   ```
   *Follow the prompts to enter your bot token*

   **Option B - Manual Setup:**
   ```bash
   # Edit .env file
   nano .env
   # Replace "your_telegram_bot_token_here" with your actual token
   ```

3. **Run the bot:**
   ```bash
   npm start
   ```

5. **For development:**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
/src
  /handlers          # Command and callback handlers
    - kingCommand.ts # /king command handler
    - callbackHandler.ts # Inline button handlers
  /database          # JSON storage system
    - database.ts    # Database manager
    - types.ts       # TypeScript interfaces
  /utils             # Utility functions
    - image.ts       # Image handling utilities
    - permissions.ts # Bot permission checking
    - messageManager.ts # Message cleanup & pinning
    - gameLogic.ts   # Game mechanics & calculations
  - bot.ts           # Main bot setup and launch
/assets
  /images
    - king.jpg       # Optional game image (will use text-only if missing)
/data.json           # Auto-generated database file
```

## ⚙️ Configuration

### Environment Variables
- `BOT_TOKEN` - Your Telegram bot token (required)

### Optional Image Support
- Place `king.jpg` in `./assets/images/` for photo messages
- If image is missing, bot will use text-only messages
- Recommended image size: 512x512px or similar square format

## 🔧 Bot Permissions

The bot requires these admin permissions:
- ✅ **Pin messages** - To pin game messages
- ✅ **Delete messages** - To clean up old game messages

### Setting Permissions:
1. Add bot to your group/channel
2. Make it an administrator
3. Enable "Pin messages" and "Delete messages" permissions
4. The bot will check permissions automatically

## 🎯 Usage

### Basic Commands:
- `/start` - Show welcome message
- `/help` - Show help and rules
- `/king <amount>` - Claim throne with bet

### Admin Commands (for testing):
- `/kingreset` - Reset current king (admins only)
- `/kingresetforce` - Force reset without admin check (emergency only)
- `/kingstats` - Show chat statistics

### Game Flow:
1. Use `/king 100` to become the first king
2. Others click "🔥 DUMP" to challenge you
3. Win 50/50 odds to take the throne
4. Build streaks for better odds
5. Cash out anytime as king

## 🐛 Recent Bug Fixes

### **Message Pinning Issue** ✅ FIXED
- **Problem:** Bot was deleting current message instead of pinning it
- **Root Cause:** Wrong order of operations (delete before pin)
- **Solution:** Reordered to send new message first, then clean up old one

### **Database Initialization** ✅ FIXED
- **Problem:** `lastMessageId` was undefined causing pinning failures
- **Solution:** Properly initialize database fields

### **Error Recovery** ✅ ADDED
- **Added:** Comprehensive error handling for all operations
- **Added:** Automatic bet refunds on failed game creation
- **Added:** User-friendly error messages
- **Added:** Detailed logging for debugging

## 🚨 Troubleshooting

### **"INVALID BOT TOKEN" Error**
```
❌ INVALID BOT TOKEN!
📝 Your BOT_TOKEN in .env file is not set correctly.
```

**Solution:**
1. Get your bot token from [@BotFather](https://t.me/botfather)
2. Run `npm run setup` or manually edit `.env` file
3. Replace `your_telegram_bot_token_here` with your actual token
4. Restart the bot with `npm start`

### **Admin Commands Not Working**
```
❌ Admin required: Only administrators can use this command.
```

**Solution:**
- Make sure you're an administrator in the chat
- Or use `/kingresetforce` (works without admin rights)
- Check bot logs for detailed error information

### **Game Stuck with "Ghost King"**
```
King exists in database but no visible message
```

**Solution:**
```bash
/kingresetforce  # Emergency reset (no admin required)
/kingstats      # Check current state
/king 100       # Start fresh game
```

### **Bot Not Responding**
- Check if bot is running: `ps aux | grep king-of-the-chat`
- Check bot logs for errors
- Verify bot token is correct
- Make sure bot has necessary permissions in chat

### **Database Issues**
- Delete `data.json` to reset all data
- Restart bot to recreate fresh database
- All user balances will be reset to 1000 coins

## 🔧 **Testing & Administration**

### **New Admin Commands Added** ✅
- **Problem:** No way to reset stuck game states during testing
- **Solution:** Added `/kingreset` and `/kingstats` commands for administrators

#### **When to use `/kingreset`:**
- King exists in database but message was deleted
- Game state is corrupted
- Need to start fresh for testing
- Emergency cleanup

#### **What `/kingreset` does:**
- Removes current king from database
- Cleans up pinned messages
- Resets message ID tracking
- Shows detailed statistics of what was reset
- Only works for chat administrators

## 🔧 Technical Improvements

- **Safer Message Management:** Send new message before deleting old one
- **Better Error Handling:** Continue operation even if pinning fails
- **Enhanced Logging:** Detailed console output for debugging
- **Permission Validation:** Clear error messages for missing bot rights
- **Database Resilience:** Handles corruption and save failures gracefully

## 🛠️ Development

### Available Scripts:
- `npm run build` - Compile TypeScript
- `npm run start` - Run production build
- `npm run dev` - Run with ts-node (development)
- `npm run clean` - Remove build files

### Database:
- Uses JSON file storage (`./data.json`)
- Infinite money system by default
- Per-chat isolated game states
- Automatic backup on each save

## 🐛 Troubleshooting

### Common Issues:

**"BOT NEEDS ADMIN RIGHTS"**
- Make sure bot is administrator
- Enable "Pin messages" and "Delete messages" permissions

**"Cannot find module" errors**
- Run `npm install` to install dependencies
- Check Node.js version (requires 18+)

**Bot not responding**
- Verify BOT_TOKEN is correct
- Check bot is not banned from chat
- Restart bot after permission changes

## 📊 Database Management

The bot stores all data in `./data.json`:
- User balances (start with 1000 coins)
- King states per chat
- Message IDs for cleanup
- Streak counters

### Reset Database:
```bash
rm data.json
npm start  # Will create fresh database
```

## 🎨 Customization

### Adding Images:
- Place `king.jpg` in `./assets/images/`
- Bot will automatically detect and use it
- Supports JPG, PNG formats

### Modifying Game Rules:
- Edit `src/utils/gameLogic.ts`
- Change win rates, streak bonuses, etc.
- Rebuild with `npm run build`

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

- Create an issue for bugs
- Check existing issues first
- Include bot logs and error messages

---

**Happy gaming! 👑**
