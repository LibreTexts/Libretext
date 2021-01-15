const fs = require('fs-extra');
const browserify = require('browserify');
const babelify = require('babelify');

main();

async function main() {
    console.log('Building...');
    let outstream = fs.createWriteStream('./bundle.js');
    outstream.on('close', async () => {
        let bundle = await fs.readFile('./bundle.js', {encoding: 'utf8'});
        bundle = bundle.replace("REPLACEWITHDATE", new Date);
        await fs.writeFile('./bundle.js', bundle);
        console.log(new Date().toLocaleString());
    });
    browserify({debug: true})
        .add("./src/pages/index.js")
        .transform(babelify, {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["@babel/plugin-proposal-class-properties"]
        })
        .bundle().pipe(outstream);

}
