const express = require('express');
const app = express();
const cors = require('cors');
// app.use(express.json());
app.use(cors())

const timestamp = require('console-timestamp');
// const fs = require('fs-extra');
const fetch = require('node-fetch');

let port = 3000;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
    port = parseInt(process.argv[2]);
}
const now1 = new Date();
app.listen(port, () => console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`));
const prefix = '/';
app.post(`${prefix}`, bounce);
app.get(`${prefix}`, (req, res) => res.send('Hello World!'));

async function bounce(req, res){

}
