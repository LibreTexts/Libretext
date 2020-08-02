const fs = require('fs-extra');
const browserify = require('browserify');
const babelify = require('babelify');

main();

async function main() {
    console.log('Building...');
    let outstream = fs.createWriteStream('./bundle.js');
    outstream.on('close', async () => {
        console.log(new Date().toLocaleString());
    });
    browserify({debug: true})
        .add("./src/pages/index.jsx")
        .transform(babelify, {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["@babel/plugin-proposal-class-properties"]
        })
        .bundle().pipe(outstream);

}