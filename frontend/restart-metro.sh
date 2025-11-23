#!/bin/bash
echo "🛑 Stopping any running Metro bundlers..."
pkill -f "expo start" || true
pkill -f "metro" || true
sleep 2

echo "🧹 Clearing caches..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true

echo "✅ Done! Now run: npx expo start --clear"
