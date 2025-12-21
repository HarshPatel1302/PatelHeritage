#!/bin/bash

# Script to start Next.js server on port 5000
# Waits for port 5000 to be free (after AirPlay is disabled)

echo "Checking if port 5000 is available..."

while lsof -ti:5000 > /dev/null 2>&1; do
  echo "Port 5000 is still in use by AirPlay. Please disable AirPlay Receiver in System Settings."
  echo "Waiting 5 seconds before checking again..."
  sleep 5
done

echo "✓ Port 5000 is now free!"
echo "Starting Next.js development server on port 5000..."
cd "$(dirname "$0")"
npm run dev

