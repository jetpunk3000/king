# 🚀 Deploy KING OF THE CHAT Bot to Render.com

## ✅ Pre-deployment Checklist

- [x] ✅ All files are committed to GitHub
- [x] ✅ TypeScript compilation works (`npm run build`)
- [x] ✅ HTTP server added for health checks
- [x] ✅ render.yaml configured correctly
- [x] ✅ Dockerfile is ready
- [x] ✅ Bot token is available

## 🎯 Step-by-Step Deployment

### 1. Prepare Your Bot Token

Make sure you have your Telegram bot token. It should look like:
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

If you don't have one:
1. Go to Telegram and search for @BotFather
2. Send `/newbot`
3. Follow the instructions to create a bot
4. Copy the token

### 2. Deploy to Render.com

#### Option A: Using Blueprint (Recommended)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Sign in with your account

2. **Create New Blueprint**
   - Click "New +" button
   - Select "Blueprint"

3. **Connect Repository**
   - Connect your GitHub account if not already connected
   - Select repository: `jetpunk3000/king`
   - Render will automatically detect the `render.yaml` file

4. **Configure Environment Variables**
   - In the Blueprint configuration, you'll see the BOT_TOKEN field
   - Set it to your actual bot token
   - **IMPORTANT**: Make sure to use your real bot token, not a placeholder

5. **Deploy**
   - Click "Create New Blueprint Instance"
   - Render will start building and deploying your bot

#### Option B: Manual Service Creation

1. **Create Web Service**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect to GitHub repository: `jetpunk3000/king`
   - Select the main branch

3. **Configure Service**
   - **Name**: `king-of-the-chat-bot`
   - **Environment**: `Docker`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (root)
   - **Build Command**: Leave empty (handled by Dockerfile)
   - **Start Command**: Leave empty (handled by Dockerfile)

4. **Set Environment Variables**
   - Click "Environment" tab
   - Add variable:
     - **Key**: `BOT_TOKEN`
     - **Value**: Your actual bot token
   - Add variable:
     - **Key**: `NODE_ENV`
     - **Value**: `production`

5. **Deploy**
   - Click "Create Web Service"

## 🔧 Post-Deployment Setup

### 1. Verify Deployment

After deployment, check:
- Service status shows "Live"
- Logs show "Bot is running!"
- Health check endpoint works: `https://your-service.onrender.com/health`

### 2. Test Your Bot

1. Find your bot on Telegram (using the username you created)
2. Send `/start` to test basic functionality
3. Send `/health` to check bot status
4. Test the game with `/king 100` in a group chat

### 3. Monitor Logs

- Go to your service dashboard on Render
- Click "Logs" tab to monitor bot activity
- Check for any errors or issues

## 🚨 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if BOT_TOKEN is set correctly
   - Verify bot is not blocked by users
   - Check Render logs for errors

2. **Build fails**
   - Ensure all dependencies are in package.json
   - Check TypeScript compilation locally first
   - Verify Dockerfile is correct

3. **Health check fails**
   - Bot should respond to `/health` command
   - HTTP server should be running on the specified port
   - Check if PORT environment variable is set

4. **Service keeps restarting**
   - Check logs for crash reasons
   - Verify all required files are present
   - Ensure bot token is valid

### Debug Commands

- `/health` - Check bot status
- `/start` - Test basic functionality
- Check Render logs for detailed error messages

## 📊 Monitoring

### Health Check Endpoint
```
https://your-service.onrender.com/health
```

Returns JSON with:
```json
{
  "status": "ok",
  "service": "king-of-the-chat-bot",
  "uptime": 123.45,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Bot Commands
- `/start` - Welcome message
- `/health` - Bot status and statistics
- `/king <amount>` - Start a game

## 🔄 Updates

To update your bot:
1. Make changes to your code
2. Commit and push to GitHub
3. Render will automatically redeploy (if auto-deploy is enabled)
4. Or manually trigger redeploy from Render dashboard

## 💰 Costs

- **Free Plan**: 750 hours/month (enough for 24/7 operation)
- **Starter Plan**: $7/month for more resources
- **Standard Plan**: $25/month for production workloads

## 🆘 Support

If you encounter issues:
1. Check Render documentation: https://render.com/docs
2. Review bot logs in Render dashboard
3. Test bot functionality with `/health` command
4. Verify all environment variables are set correctly

---

**🎉 Congratulations!** Your KING OF THE CHAT bot should now be running on Render.com!
