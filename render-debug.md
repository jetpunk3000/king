# 🔧 Render Deployment Debug Guide

## 🚨 Common Deployment Issues & Solutions

### 1. Build Failures

**Problem**: Build fails during Docker image creation
**Solution**: 
- Check if all dependencies are in package.json
- Ensure TypeScript compilation works locally
- Verify Dockerfile syntax

**Debug Steps**:
```bash
# Test locally first
npm run build
docker build -t king-bot .
```

### 2. Health Check Failures

**Problem**: Service keeps restarting due to health check failures
**Solution**:
- Bot now has HTTP server on `/health` endpoint
- Health check uses curl to verify endpoint
- Check if PORT environment variable is set

### 3. Environment Variables

**Problem**: Bot token not set or invalid
**Solution**:
- Set BOT_TOKEN in Render environment variables
- Token format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789`
- Get token from @BotFather

### 4. Port Issues

**Problem**: Service can't bind to port
**Solution**:
- Render sets PORT environment variable automatically
- Bot listens on process.env.PORT
- Health check uses same port

## 📋 Deployment Checklist

- [ ] ✅ TypeScript compiles without errors
- [ ] ✅ All dependencies in package.json
- [ ] ✅ Dockerfile syntax correct
- [ ] ✅ render.yaml configuration valid
- [ ] ✅ BOT_TOKEN environment variable set
- [ ] ✅ HTTP server responds on /health
- [ ] ✅ Bot launches successfully

## 🔍 Debug Commands

### Local Testing
```bash
# Build project
npm run build

# Test HTTP server
curl http://localhost:10000/health

# Test bot locally (requires .env file)
npm start
```

### Render Logs
Check Render dashboard → Logs tab for:
- Build logs
- Runtime logs
- Health check results

## 🛠️ Manual Deployment Steps

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Create New Service**: Web Service
3. **Connect Repository**: jetpunk3000/king
4. **Configure**:
   - Name: king-of-the-chat-bot
   - Environment: Docker
   - Branch: main
5. **Environment Variables**:
   - BOT_TOKEN: your_bot_token_here
   - NODE_ENV: production
   - PORT: 10000
6. **Deploy**

## 📊 Expected Logs

**Successful deployment should show**:
```
🚀 Starting KING OF THE CHAT bot...
🌐 HTTP server listening on port 10000
✅ King image found at ./assets/images/king.jpg
✅ Bot is running! Press Ctrl+C to stop.
🎮 KING OF THE CHAT is ready to accept commands!
🤖 Bot: @your_bot_username (Bot Name)
```

## 🆘 If Still Failing

1. Check Render logs for specific error messages
2. Verify all files are committed to GitHub
3. Test Docker build locally
4. Ensure bot token is valid and not blocked
5. Check if service has enough resources (free plan limits)

## 📞 Support

- Render Documentation: https://render.com/docs
- Render Status: https://status.render.com/
- Bot Token Help: @BotFather on Telegram
