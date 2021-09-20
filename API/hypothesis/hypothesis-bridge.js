const {SignJWT} = require('jose/jwt/sign');
const {parseJwk} = require('jose/jwk/parse');
const fetch = require('node-fetch');
const {createSecretKey} = require('crypto');

const config = require("./hypothesis.json");


(async function () {
    let email = "hello@libretexts.org"
    const jwk = await parseJwk({
        "kty":"oct",
        "alg":"H256",
        "type" :"secret",
        "k": Buffer.from(config["jwt-client"].secret).toString('base64')
    });
    // const secretKey = createSecretKey();
    // const jwk = await parseJwk(secretKey);
    
    let response = await fetch(`${config.service}/api/users`, {
        method: "POST",
        body: JSON.stringify({
            authority: config.authority,
            username: email.replace('@', "AT"),
            email,
            display_name: "hello world!"
        }),
        headers: {
            "Authorization": 'Basic ' + Buffer.from(config.client.id + ":" + config.client.secret).toString('base64'),
        }
    })
    console.log(await response.text())
    
    
    const jwt = await new SignJWT({})
        .setProtectedHeader({alg: 'HS256', typ: "JWT"})
        // .setIssuedAt()
        .setNotBefore("0s")
        .setSubject(`acct:${email.replace('@', "AT")}@${config.authority}`)
        .setIssuer(config["jwt-client"].id)
        .setAudience('hypothes.is')
        .setExpirationTime('10m')
        .sign(jwk)
    
    console.log(jwt)
    
    
})()
