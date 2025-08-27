# 🚀 KING OF THE CHAT - GitHub & Railway Setup

## ✅ Your bot is ready! Here's what you need to do:

### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `king-of-the-chat-bot` (or any name you like)
3. Make it **Public** (easier for Railway deployment)
4. **DO NOT** initialize with README (we already have one)
5. Click "Create repository"

### 2. Push Code to GitHub
After creating the repo, run these commands:

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/king-of-the-chat-bot.git

# Push your code
git push -u origin main
```

### 3. Deploy on Railway
1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click "Deploy from GitHub"
4. Select your `king-of-the-chat-bot` repository
5. Railway will automatically detect it's a Node.js app
6. Add your BOT_TOKEN environment variable:
   - Go to Variables tab
   - Add: `BOT_TOKEN` = `your_actual_bot_token_from_botfather`
7. Click "Deploy"

### 4. Bot Permissions Setup
Make sure your bot has these permissions in your Telegram chat:
- ✅ Pin messages
- ✅ Delete messages
- ✅ Send messages

### 🎮 Ready to play!
Once deployed, users can:
- `/king <amount>` - Start a game
- 👊 DUMP - Attack the king
- 💰 CASHOUT - King withdraws (king only)

### 📊 Monitoring
- Railway provides logs and metrics
- Bot saves game data in JSON file
- All errors are logged for debugging

---
**Your bot is production-ready! 🎉**
