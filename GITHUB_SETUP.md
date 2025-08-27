# 🚀 KING OF THE CHAT - GitHub & Render Setup

## ✅ Your bot is ready! Here's what you need to do:

### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `king-of-the-chat-bot` (or any name you like)
3. Make it **Public** (easier for deployment)
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

### 3. Deploy on Render.com

#### **Рекомендуемый способ (с Docker):**
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click **"New Web Service"**
4. Connect your GitHub account
5. Select your `king-of-the-chat-bot` repository
6. Configure the service:
   - **Name**: king-of-the-chat-bot (or any name)
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile` (будет автоматически обнаружено)
7. Add environment variable:
   - **Key**: `BOT_TOKEN`
   - **Value**: `your_actual_bot_token_from_botfather`
8. Click **"Create Web Service"**

#### **Альтернативный способ (без Docker):**
1. Выберите **Environment**: Node
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. Добавьте переменную `BOT_TOKEN`

### 4. Important: Use Polling (Not Webhooks)
Render.com is better with polling for Telegram bots. The bot is already configured for polling, so no additional setup needed!

### 5. Local Testing (Recommended)

Before deploying, test locally:

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/king-of-the-chat-bot.git
cd king-of-the-chat-bot

# Install dependencies
npm install

# Test build process
./test-local.sh

# Create .env file with your bot token
cp .env.example .env
# Edit .env and add your BOT_TOKEN

# Run locally
npm start
```

### 6. Troubleshooting Render.com Deployment

#### **"Cannot find module '/opt/render/project/src/dist/bot.js'"**
1. **Check Build Logs**: Go to your Render service → Logs tab
2. **Use Docker**: Switch to Docker environment for better reliability
3. **Manual Redeploy**: Try "Clear build cache and deploy"
4. **Verify Files**: Make sure all files are committed to Git

#### **Build Errors**
1. **Node Version**: Ensure Node.js 18+ in your Render service
2. **Dependencies**: Check that all dependencies install correctly
3. **TypeScript**: Verify that `tsc` compiles without errors

#### **Runtime Errors**
1. **BOT_TOKEN**: Verify the token is correctly set in environment variables
2. **Logs**: Check Render logs for detailed error messages
3. **Health Check**: Use `/health` command in Telegram to check bot status

### 7. Bot Permissions Setup
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
