#!/usr/bin/env bash


echo "Bundling..."
if false
then
echo "Minifying..."
browserify ./src/pages/index.js -d -t [ babelify --presets [ env react ] ] | uglifyjs -c > bundle.js
else
browserify "./src/pages/index.js" -o bundle.js -d -t [ babelify --presets [ env react ] ]
fi
echo "Bundle Created"

exit