const timestamp = require("console-timestamp");
const fs = require("fs-extra");
const crypto = require('crypto');
const secure = require('./secure.json');
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.text());

//middleware configuration and initialization
const basePath = '/ay';
const algorithm = 'aes-256-ctr';
app.use(express.static('analyticsSecure'));
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
        
        let user = event.actor.id;
        const cipher = crypto.createCipheriv('aes-256-cbc', secure.analyticsSecure, Buffer.from(secure.analyticsSecure, 'hex'));
        
        user = cipher.update(user, 'utf8', 'hex')
        user += cipher.final('hex');
        event.actor.id = user;
        body = JSON.stringify(event);
        
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', secure.analyticsSecure, Buffer.from(secure.analyticsSecure, 'hex'));
        
        let user2 = decipher.update(Buffer.from(user, 'hex'))
        user2 += decipher.final('utf8');
        
        console.log(user, user2);
        const datePath = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        
        if (!courseName) {
            await fs.ensureDir(`./analyticsData/General/${datePath}`);
            await fs.appendFile(`./analyticsData/General/${datePath}/${user}.txt`, body + "\n");
        }
        else {
            if (!Array.isArray(courseName))
                courseName = [courseName];
            for (let i = 0; i < courseName.length; i++) {
                await fs.ensureDir(`./analyticsData/${courseName[i]}/${datePath}`);
                await fs.appendFile(`./analyticsData/${courseName[i]}/${datePath}/${user}.txt`, body + "\n");
            }
        }
    } catch (e) {
        console.error(e);
    }
})

//TODO: Make this work
app.put(basePath + '/secureAccess/:library([a-z]+)-:bookId(\\d+)', async (req, res) => {
    res.send('Here\'s some data');
    
    let body = [];
    request.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        let key = Buffer.concat(body).toString();
        let courseName = secure.keys[key];
        if (courseName)
            await secureAccess(courseName);
        else
            responseError('Incorrect key', 403)
    });
});

async function secureAccess(courseName) {
    await fs.ensureDir(`./analyticsData/ZIP/${courseName}`);
    await fs.emptyDir(`./analyticsData/ZIP/${courseName}/RAW`);
    await fs.emptyDir(`./analyticsData/ZIP/${courseName}/JSON`);
    await fs.emptyDir(`./analyticsData/ZIP/${courseName}/CSV`);
    await fs.copy(`./analyticsData/${courseName}`, `./analyticsData/ZIP/${courseName}/RAW`);
    
    //Webwork Processing
    /*if (courseName === 'Chem2BH') {
        const connection = mysql.createConnection(secure.mysql);
        connection.connect();
        connection.query = util.promisify(connection.query);
        let SQLresult = await connection.query('SELECT * FROM `Chem2BH_past_answer` ');
        let result = [];
        let resultCSV = 'course_id, user_id, set_id, problem_id, answer_id, scores, comment_string, timestamp, source_file';
        const keys = ['course_id', 'user_id', 'set_id', 'problem_id', 'answer_id', 'scores', 'comment_string', 'timestamp', 'source_file'];
        for (let i = 0; i < SQLresult.length; i++) {
            result.push({
                course_id: SQLresult[i].course_id,
                user_id: SQLresult[i].user_id,
                set_id: SQLresult[i].set_id,
                problem_id: SQLresult[i].problem_id,
                answer_id: SQLresult[i].answer_id,
                answer_string: SQLresult[i].answer_string,
                scores: SQLresult[i].scores,
                comment_string: SQLresult[i].comment_string,
                timestamp: SQLresult[i].timestamp,
                source_file: SQLresult[i].source_file,
            });
            
            
            let values = keys.map((x) => SQLresult[i][x]);
            resultCSV += '\n' + values.join(',');
        }
        await fs.writeFile(`./analyticsData/ZIP/${courseName}/JSON/webwork.json`, JSON.stringify(result, null, "\t"));
        await fs.writeFile(`./analyticsData/ZIP/${courseName}/CSV/webwork.csv`, resultCSV);
        connection.end();
    }*/
    
    console.log(`Beginning ${courseName}`);
    //Reprocessing raw data
    let months = await fs.readdir(`./analyticsData/ZIP/${courseName}/RAW`, {withFileTypes: true});
    
    const stats = await fs.stat(`./analyticsSecure/secureAccess-${courseName}.zip`);
    if (Date.now() - stats.mtime < 10 * 60000) { //10 minute cache
        console.log('Found in cache');
    }
    else {
        console.time('Reprocessing');
        for (let i = 0; i < months.length; i++) {
            let month = months[i];
            if (month.isDirectory()) {
                await fs.ensureDir(`./analyticsData/ZIP/${courseName}/JSON/${month.name}/`);
                await fs.ensureDir(`./analyticsData/ZIP/${courseName}/CSV/${month.name}/`);
                //process each month
                let students = await fs.readdir(`./analyticsData/ZIP/${courseName}/RAW/${month.name}`, {withFileTypes: true});
                for (let j = 0; j < students.length; j++) {
                    let student = students[j];
                    if (student.isFile()) {
                        student = student.name;
                        const fileRoot = student.replace('.txt', '');
                        let lines = await fs.readFile(`./analyticsData/ZIP/${courseName}/RAW/${month.name}/${student}`);
                        lines = lines.toString().replace(/\n$/, "").split('\n');
                        lines = lines.map((line) => {
                            try {
                                let result = JSON.parse(line);
                                return result;
                            } catch (e) {
                                console.error(`Invalid: ${line}`);
                                return undefined;
                            }
                        });
                        let result = lines;
                        let resultCSV = 'courseName, library, id, platform, verb, pageURL, pageID, timestamp, pageSession, timeMe, [type or percent]';
                        
                        //CSV Handling
                        for (let k = 0; k < result.length; k++) {
                            let line = lines[k];
                            if (!line) {
                                continue;
                            }
                            resultCSV += `\n${line.actor.courseName}##${line.actor.library}##${line.actor.id}##${line.actor.platform ? line.actor.platform.description : 'undefined'}##${line.verb}##${line.object.page}##${line.object.id}##"${line.object.timestamp}"##${line.object.pageSession}##${line.object.timeMe}`;
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
                        
                        await Promise.all([fs.writeFile(`./analyticsData/ZIP/${courseName}/JSON/${month.name}/${fileRoot}.json`, JSON.stringify(result, null, "\t")),
                            fs.writeFile(`./analyticsData/ZIP/${courseName}/CSV/${month.name}/${fileRoot}.csv`, resultCSV)]);
                    }
                }
            }
        }
        console.timeEnd('Reprocessing');
        console.time('Compressing');
        await fs.ensureDir('./analyticsSecure');
        zipLocal.sync.zip(`./analyticsData/ZIP/${courseName}`).compress().save(`./analyticsSecure/secureAccess-${courseName}.zip`);
        console.timeEnd('Compressing');
    }
    
    console.log(`Secure Access ${courseName} ${ip}`);
    
    request.url = `secureAccess-${courseName}.zip`;
    staticFileServer(request, response, finalhandler(request, response));
}