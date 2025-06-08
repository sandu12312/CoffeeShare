#!/bin/bash

echo "🚀 Installing CoffeeShare Performance Dependencies..."

# Core performance libraries
echo "📦 Installing FlashList for optimized lists..."
npm install @shopify/flash-list

echo "🔍 Installing performance monitoring tools..."
npm install --save-dev @welldone-software/why-did-you-render
npm install --save-dev react-devtools

echo "📊 Installing Flipper for debugging..."
npm install --save-dev react-native-flipper

echo "🎨 Installing animation libraries..."
npm install react-native-reanimated
npm install react-native-screens

echo "🧹 Installing babel plugin for removing console logs in production..."
npm install --save-dev babel-plugin-transform-remove-console

echo "✅ Performance dependencies installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure react-native-screens in app.json"
echo "2. Add why-did-you-render setup in your app"
echo "3. Configure babel.config.js for production console log removal"
echo "4. Replace FlatList components with FlashList"
echo ""
echo "🎯 Check the PERFORMANCE_OPTIMIZATION_GUIDE.md for detailed setup instructions" 