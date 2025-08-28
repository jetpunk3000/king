#!/bin/bash

echo "🚀 Deploying KING OF THE CHAT bot to Render.com..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Git working directory is not clean. Please commit all changes first."
    git status
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Failed to push to GitHub!"
    exit 1
fi

echo "✅ Code pushed to GitHub!"

echo ""
echo "🎯 Next steps for Render deployment:"
echo "1. Go to https://dashboard.render.com/"
echo "2. Click 'New +' and select 'Blueprint'"
echo "3. Connect your GitHub repository: https://github.com/jetpunk3000/king"
echo "4. Render will automatically detect the render.yaml file"
echo "5. Set the BOT_TOKEN environment variable:"
echo "   - Go to your service dashboard"
echo "   - Click 'Environment' tab"
echo "   - Add BOT_TOKEN with your Telegram bot token"
echo "6. Click 'Create New Blueprint Instance'"
echo ""
echo "🔧 Your bot token should look like: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789"
echo "📝 Get it from @BotFather on Telegram if you don't have one"
echo ""
echo "✅ Deployment script completed!"
