#!/bin/bash
echo "Clearing Metro and Watchman caches..."
watchman watch-del-all 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
echo "Done! Now restart with: npx expo start --clear"
