browserify "./src/pages/index.js" -o bundle.js -d -t [ babelify --presets [ @babel/env @babel/react ] ]
