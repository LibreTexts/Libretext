#!/usr/bin/env bash

echo "Bundling..."
if false
then
echo "Minifying..."
browserify ./Skele.js -d -t browserify-css -t [ babelify --presets [ env react ] ] | uglifyjs -c > SkeleBundle.js
else
browserify "./Skele.js" -o SkeleBundle.js -d -t browserify-css -t [ babelify --presets [ env react ] ]
fi
echo "Bundle Created"

exit