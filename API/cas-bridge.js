const http = require('http');
const httpCasClient = require('http-cas-client');
const jose = require('jose');
const {readFileSync} = require('fs');
const cookie = require('cookie');
const timestamp = require('console-timestamp');


let port = 3009;
if (process.argv.length >= 3 && parseInt(process.argv[2])) {
	port = parseInt(process.argv[2]);
}
const now1 = new Date();
console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`);

const {
	JWE,   // JSON Web Encryption (JWE)
	JWK,   // JSON Web Key (JWK)
	JWKS,  // JSON Web Key Set (JWKS)
	JWS,   // JSON Web Signature (JWS)
	JWT,   // JSON Web Token (JWT)
	errors // errors utilized by jose
} = jose

const serviceName = 'https://api.libretexts.org/cas-bridge';
// Default prefix is '/'.
const handler = httpCasClient({
	casServerUrlPrefix: 'https://sso.libretexts.org/cas',
	serverName: serviceName
});

const key = JWK.asKey(readFileSync('./JWT/cas-bridge'));


// console.log(JWT.sign({Hello: "World!"}, key, {issuer: serviceName}));

http.createServer(async (req, res) => {
	if (req.url.includes('public')) {
		res.writeHead( 200, {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public,  max-age=604800, immutable, must-revalidate, no-transform'
		});
		return res.end(readFileSync('./JWT/cas-bridge.pub'));
	}
	
	if (!await handler(req, res)) {
		return res.end();
	}
	
	const {principal, ticket} = req;
	if (!principal)
		return res.end();
	const cookies = cookie.parse(req.headers.cookie);
	const redirect = cookies?.api_redirect || undefined;
	// console.log(JSON.stringify(principal, null, 2));
	const payload = {
		user: principal.user,
		name: principal?.attributes.name || `${principal?.attributes.firstName} ${principal?.attributes.family_name || principal?.attributes.lastName}`,
		email: principal?.attributes?.email,
		redirect: redirect
	}
	
	const token = JWT.sign(payload, key, {issuer: serviceName})
	res.writeHead(redirect? 302: 200, {
		'Set-Cookie': [`overlayJWT=${token}; Domain=libretexts.org; secure`, `api_redirect=; Domain=libretexts.org; expires=expires: ${new Date(0)};`],
		'Content-Type': 'text/plain',
		'Location': redirect,
	});
	res.end(JSON.stringify(principal, null, 2));
}).listen(port);