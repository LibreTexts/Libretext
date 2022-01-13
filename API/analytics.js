const timestamp = require("console-timestamp");
const fs = require("fs-extra");
const crypto = require('crypto');
const secure = require('./secure.json');
const express = require('express');
const app = express();
const cors = require('cors');
// app.use(cors());
app.use(express.text());
const async = require('async');
const MongoClient = require('mongodb');

//middleware configuration and initialization
const basePath = '/ay';
// app.use(express.static('analyticsSecure'));
let port = 3004;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
    port = parseInt(process.argv[2]);
}
app.listen(port, () => {
    const now1 = new Date();
    console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`);
});

app.get(basePath + '/ping', (req, res) => {
    res.send('PONG');
});

/**
 * Receives analytics data and stores it in a JSON file
 */
app.post(basePath + '/receive', async (req, res) => {
    res.send('Done');
    // res.status(200).end();
    // console.log(req.body);
    if (!(req.headers.origin && req.headers.origin.endsWith("libretexts.org"))) {
        return res.status(400).end();
    }
    
    let body = req.body;
    try {
        let date = new Date();
        let event = JSON.parse(body);
        let courseName = event.actor.courseName;
        
        //basic data validation
        let user = event.actor.id.user || event.actor.id;
        if (!courseName || !user)
            return false;
        
        //use crypto to retrieve analytics identifier
        const cipher = crypto.createCipheriv('aes-256-cbc', secure.analyticsSecure, Buffer.from(secure.analyticsSecure, 'hex'));
        
        user = cipher.update(user, 'utf8', 'hex')
        user += cipher.final('hex');
        event.actor.id = user;
        body = JSON.stringify(event);
        
        const datePath = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        
        if (courseName) {
            if (!Array.isArray(courseName))
                courseName = [courseName];
            for (let i = 0; i < courseName.length; i++) {
                await fs.ensureDir(`./analyticsData/ay-${courseName[i]}/${datePath}`);
                await fs.appendFile(`./analyticsData/ay-${courseName[i]}/${datePath}/${user}.txt`, body + "\n");
                await fs.appendFile(`./analyticsData/ay-${courseName[i]}/${user}.txt`, body + "\n");
            }
        }

        const uri = `${secure.mongodbAnalytics.protocol}://${secure.mongodbAnalytics.user}:${secure.mongodbAnalytics.pass}@${secure.mongodbAnalytics.host}:${secure.mongodbAnalytics.port}/${secure.mongodbAnalytics.dbname}?retryWrites=true&w=majority`;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            await client.db(secure.mongodbAnalytics.dbname).command({ ping: 1 });
            console.log("Connected successfully to server");

            // write to collection
            // should maybe create a new collection per course?

            // db.collection('ltanalytics').insertOne(body, function (err, result) {
            //     if (err)
            //         res.send('Error');
            //     else
            //         res.send('Success');
            // });

        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    } catch (e) {
        console.error(e);
    }
})

/**
 * Sends a list of all the available course directories
 */
app.get(basePath + '/listCourses', async (req, res) => {
    let courses = await fs.readdir(`./analyticsData/`);
    courses = courses.filter(e => e.startsWith('ay'));
    res.send(courses);
})

/**
 * Processes all requests to get zips of analytics data
 */
app.post(basePath + '/secureAccess', express.urlencoded({extended: true}), async (req, res) => {
    // validate security token
    let auth = req.body.tokenField;
    if (!auth) {
        return res.sendStatus(401);
    }
    else if (auth !== secure.analyticsREST) {
        return res.sendStatus(403);
    }
    
    let courseName = req.body.courseName;
    if (courseName) {
        // courseName = `ay-${courseName}`;
        if (!await fs.exists(`./analyticsData/${courseName}`)) {
            return res.status(404).send({error: `Could not find course ${courseName}`});
        }
        await prepareZipData(courseName);
        await streamZip(courseName, res);
    }
});

/**
 * Processes all requests to get linker identifiers for analytics data
 */
app.post(basePath + '/getLinker', express.urlencoded({extended: true}), async (req, res) => {
    let auth = req.body.tokenField;
    if (!auth) {
        return res.sendStatus(401);
    }
    else if (auth !== secure.analyticsREST) {
        return res.sendStatus(403);
    }
    
    let courseName = req.body.courseName;
    if (courseName) {
        // courseName = `ay-${courseName}`;
        if (!await fs.exists(`./analyticsData/${courseName}`)) {
            return res.status(404).send({error: `Could not find course ${courseName}`});
        }
        await createLinker(courseName, res);
    }
});

/**
 * Converts the RAW JSON into CSV
 * @param courseName - name of course to process
 * @returns {Promise<void>}
 */
async function prepareZipData(courseName) {
    await fs.emptyDir(`./analyticsData/ZIP/${courseName}/RAW`);
    await fs.emptyDir(`./analyticsData/ZIP/${courseName}/CSV`);
    console.time('copy'); //copy to working directory
    await fs.copy(`./analyticsData/${courseName}`, `./analyticsData/ZIP/${courseName}/RAW`);
    console.timeEnd('copy');
    
    console.log(`Beginning ${courseName}`);

    let months = await fs.readdir(`./analyticsData/ZIP/${courseName}/RAW`, {withFileTypes: true});
    months = months.filter(m => m.isDirectory());
    
    console.time('Reprocessing');    //Reprocessing raw data into CSV
    for (let month of months) {
        console.log(month.name);
        let students = await fs.readdir(`./analyticsData/ZIP/${courseName}/RAW/${month.name}`, {withFileTypes: true});
        await async.eachLimit(students, 25, async (student) => {
            if (student.isFile()) {
                student = student.name;
                const fileRoot = student.replace('.txt', '');
                let lines = await fs.readFile(`./analyticsData/ZIP/${courseName}/RAW/${month.name}/${student}`);
                lines = lines.toString().replace(/\n$/, "").split('\n');
                lines = lines.map((line) => { //convert RAW JSON lines into an array of JSON objects
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        console.error(`Invalid: ${line}`, e);
                        return undefined;
                    }
                });
                
                //JSON into CSV conversion
                let result = lines;
                let resultCSV = 'courseName## id## platform## verb## pageURL## pageID## timestamp## pageSession## timeMe## beeline_status## [type or percent]';
                
                //CSV Handling
                for (let k = 0; k < result.length; k++) {
                    let line = lines[k];
                    if (!line) {
                        continue;
                    }
                    resultCSV += `\n${line.actor.courseName}##${line.actor.id}##${line.actor.platform || 'undefined'}##${line.verb}##${line.object.url}##${line.object.id}##"${line.object.timestamp}"##${line.object.pageSession}##${line.object.timeMe}}##${line.object.beeline}`;
                    switch (line.verb) {
                        case 'left':
                            resultCSV += `##${line.type}`;
                            break;
                        case 'read':
                            resultCSV += `##${line.result.percent}`;
                            break;
                        case 'answerReveal':
                            resultCSV += `##${line.result.answer}`;
                            break;
                    }
                    
                }
                resultCSV = resultCSV.replace(/,/g, '%2C');
                resultCSV = resultCSV.replace(/##/g, ',');
                
                await fs.appendFile(`./analyticsData/ZIP/${courseName}/CSV/${fileRoot}.csv`, resultCSV);
            }
        })
    }
    console.timeEnd('Reprocessing');
}

/**
 * Sends ZIP stream as response to res
 * @param {string} courseName - name of course to process
 * @param {Response} res - Response to send the ZIP datastream to
 */
async function streamZip(courseName, res) {
    const archiver = require('archiver');
    const archive = archiver('zip');
    
    console.time('Compressing');
    
    archive.on('error', function (err) {
        res.status(500).send({error: err.message});
    });
    
    //on stream closed we can end the request
    archive.on('end', function () {
        console.log('Archive wrote %d bytes', archive.pointer());
    });
    
    //set the archive name
    res.attachment(`secureAccess-${courseName}.zip`);
    
    //this is the streaming magic
    archive.pipe(res);
    
    let months = await fs.readdir(`./analyticsData/ZIP/${courseName}`, {withFileTypes: true});
    months = months.filter(m => m.isDirectory());
    
    for (const dir of months) {
        console.log(dir.name);
        await archive.directory(`./analyticsData/ZIP/${courseName}/${dir.name}`, dir.name);
    }
    
    await archive.finalize();
    
    console.timeEnd('Compressing');
    await fs.ensureDir('./analyticsSecure');
    
    await fs.emptyDir(`./analyticsData/ZIP/${courseName}`);
    console.log(`Secure Access ${courseName}`);
}

/**
 * Creates an associated between the analytics identifier and the respective user's email
 * @param {string} courseName - name of course to process
 * @param {Response} res
 */
async function createLinker(courseName, res) {
    let students = await fs.readdir(`./analyticsData/${courseName}`, {withFileTypes: true});
    let output = 'Identifier, Email\n';
    for (const studentsKey of students) {
        if (studentsKey.isFile()) {
            const user = studentsKey.name.replace('.txt', '');
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', secure.analyticsSecure, Buffer.from(secure.analyticsSecure, 'hex'));
            let user2 = decipher.update(Buffer.from(user, 'hex'))
            user2 += decipher.final('utf8');
            
            // console.log(user2);
            output += `${user}, ${user2}\n`;
        }
    }
    // console.log(output);
    res.attachment(`secureAccess-linker-${courseName}.csv`);
    res.set('Content-Type', 'text/csv');
    res.send(output)
}
