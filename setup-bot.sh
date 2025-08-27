#!/bin/bash

echo "🤖 KING OF THE CHAT - Bot Setup"
echo "==============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Creating one..."
    cat > .env << 'EOF'
# Telegram Bot Token
# Get this from @BotFather on Telegram
BOT_TOKEN=your_telegram_bot_token_here
EOF
fi

echo "📝 Current .env file:"
echo "-------------------"
cat .env
echo ""
echo "-------------------"

# Ask for bot token
echo "🔑 Please enter your bot token from @BotFather:"
echo "(It should look like: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789)"
echo ""
read -p "BOT_TOKEN: " user_token

# Validate token format (basic check)
if [[ $user_token =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
    # Update .env file
    sed -i.bak "s/BOT_TOKEN=.*/BOT_TOKEN=$user_token/" .env
    rm .env.bak 2>/dev/null || true

    echo ""
    echo "✅ Bot token updated successfully!"
    echo ""
    echo "🚀 You can now run the bot with:"
    echo "   npm start"
    echo ""
    echo "🎮 Test commands:"
    echo "   /king 100     - Start a game"
    echo "   /kingstats    - View statistics"
    echo "   /kingreset    - Reset king (admins only)"
    echo "   /kingresetforce - Force reset (emergency)"
    echo ""
    echo "📚 Need help? Check README.md or ADMIN_COMMANDS.md"

else
    echo ""
    echo "❌ Invalid token format!"
    echo "Token should start with numbers, contain ':' and only contain letters, numbers, '-' and '_'."
    echo ""
    echo "Example: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789"
    echo ""
    echo "Please try again or check your token from @BotFather"
    exit 1
fi
