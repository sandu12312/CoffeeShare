#!/bin/bash

echo "🚀 Setting up CoffeeShare Stripe Server..."

# Create server directory if it doesn't exist
mkdir -p server

# Navigate to server directory
cd server

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment variables
echo "🔧 Setting up environment..."
cp ../.env.local .env 2>/dev/null || echo "STRIPE_SECRET_KEY=sk_test_51RRbLlCEaghvDbju0O0PaKxDTCApVoKMxL3u2Qb9N4gvBA0XHSVAEPXQ5jXsyM90FlQ1YEPeVp4W3xfEy7BXfyJ800Apy536j1" > .env

echo "✅ Setup complete!"
echo ""
echo "🎯 To start the server:"
echo "   cd server"
echo "   npm start"
echo ""
echo "🔍 Server will run on: http://localhost:3001"
echo "📊 Health check: http://localhost:3001/health"
echo ""
echo "💡 After starting the server, payments will appear in your Stripe dashboard!" 