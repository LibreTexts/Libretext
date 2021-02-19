const fs = require('fs-extra');
const browserify = require('browserify');
const babelify = require('babelify');

main();

async function main() {
    let input = process.argv[3] || 'index.js';
    let output = process.argv[2] || 'bundle.js';
    
    
    input = `./src/pages/${input}`;
    output = `./${output}`;
    if (process.argv.length > 2 && parseInt(process.argv[2])) {
        port = parseInt(process.argv[2]);
    }
    console.log('Building...');
    let outstream = fs.createWriteStream(output);
    outstream.on('close', async () => { //adds date to file if REPLACEWITHDATE in bundle
        let bundle = await fs.readFile(output, {encoding: 'utf8'});
        bundle = bundle.replace("REPLACEWITHDATE", new Date);
        await fs.writeFile(output, bundle);
        console.log(new Date().toLocaleString());
    });
    
    //begin bundling process
    browserify({debug: true})
        .add(input)
        .transform(babelify, {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["@babel/plugin-proposal-class-properties", "@babel/plugin-transform-runtime"]
        })
        .bundle().pipe(outstream);

}
