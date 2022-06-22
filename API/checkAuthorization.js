/**
 * @file Provides a middleware to check authorization passed from CXone Expert in the browser.
 * @author LibreTexts <info@libretexts.org>
 */
const express = require('express');
const LibreTexts = require('./reuse.js');
const authenBrowser = require('./authenBrowser.json');
const secure = require('./secure.json');

/**
 * Verifies passed Authorization with Mindtouch backend
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 */
async function checkAuthorization(req, res, next) {
    if (req.get('Authorization') && req.path.includes('/elevate')) {
      const requestKey = req.get('Authorization').replace('Bearer ', '');
      const elevateKeyBearers = Object.keys(secure.elevate_access);
      const validKey = elevateKeyBearers.find((key) => secure.elevate_access[key] === requestKey);
      if (validKey) {
        return next();
      }
    }

    if (!req.get('origin')?.endsWith('libretexts.org')) {
        res.status(401);
        next(`Unauthorized ${req.get('x-forwarded-for')}`)
    }
    
    
    const body = req.body;
    
    //Legacy conversion code
    body.username = body?.globalSettings?.userSystemName || body.username;
    body.id = body?.globalSettings?.userId || body.id;
    
    const user = await LibreTexts.getUser(body.username, body.subdomain, body.username); //use backend channel and token to verify user identity
    if(!user){
        res.status(404);
        next(`${body.username} not found`);
    }
    
    req.body.user = user;
    // console.log(user);
    if (body.seatedCheck > 10 ** 15 || user.seated !== 'true' || body.token !== authenBrowser[body.subdomain] || parseInt(body.id) !== parseInt(user.id) || body.seatedCheck < 10 ** 10) {
        res.status(403);
        next(`${body.username} Unauthorized ${body.seatedCheck > 10 ** 15} ${user.seated !== 'true'} ${body.token !== authenBrowser[body.subdomain]} ${parseInt(body.id) !== parseInt(user.id)} ${body.seatedCheck < 10 ** 10}`);
    }
    next();
}

module.exports = checkAuthorization;
