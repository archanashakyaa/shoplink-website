#!/bin/bash

# Build script for Render deployment

echo "🚀 Starting ShopLink deployment build..."

# Backend setup
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python -c "from database import init_db; init_db()"

echo "✅ Backend build complete!"

# Frontend setup (if deploying together)
# cd ../frontend
# echo "📦 Installing frontend dependencies..."
# npm install
# echo "🔨 Building frontend..."
# npm run build
# echo "✅ Frontend build complete!"

echo "🎉 Deployment build finished successfully!"
