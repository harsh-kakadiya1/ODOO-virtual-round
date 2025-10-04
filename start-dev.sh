#!/bin/bash

echo "Starting Expense Management System..."
echo

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "Creating .env file..."
    cp "server/env.example" "server/.env"
    echo "Please update server/.env with your MongoDB URI and JWT secret"
    echo
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

echo "Starting development servers..."
npm run dev
