#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
  echo "Installing packages for the first time..."
  npm install
fi
npm run dev
