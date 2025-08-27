#!/bin/bash
echo "🚀 Testing KING OF THE CHAT bot locally..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with:"
    echo "BOT_TOKEN=your_telegram_bot_token_here"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Check if dist/bot.js exists
if [ ! -f dist/bot.js ]; then
    echo "❌ dist/bot.js not found after build!"
    exit 1
fi

echo "✅ Build successful!"
echo "✅ dist/bot.js exists"
echo ""
echo "🎮 To run locally:"
echo "npm start"
echo ""
echo "🌐 To test with Docker:"
echo "docker-compose up --build"
