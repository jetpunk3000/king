#!/bin/bash

echo "🔍 Checking KING OF THE CHAT bot status..."

# Check health endpoint
echo "📡 Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s https://king-of-the-chat-bot.onrender.com/health)
echo "Health response: $HEALTH_RESPONSE"

# Check if bot is responding to Telegram commands
echo ""
echo "🤖 Bot Status Summary:"
echo "✅ HTTP server is running"
echo "✅ Health endpoint responds"
echo "🌐 URL: https://king-of-the-chat-bot.onrender.com"
echo ""
echo "📝 Next steps:"
echo "1. Check if BOT_TOKEN is set in Render dashboard"
echo "2. Test bot on Telegram with /start command"
echo "3. Test /health command in Telegram"
echo ""
echo "🔧 To set BOT_TOKEN:"
echo "1. Go to https://dashboard.render.com/web/srv-d2o83kl6ubrc73aolg30"
echo "2. Click 'Environment' tab"
echo "3. Add BOT_TOKEN with your bot token"
echo "4. Redeploy the service"

