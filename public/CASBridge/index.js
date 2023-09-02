import { createRemoteJWKSet, jwtVerify } from 'jose';
import { default as cookieJar } from 'js-cookie';

async function verifyJWT(overlayJWT) {
    try {
        const jwks = await createRemoteJWKSet(new URL('https://one.libretexts.org/api/v1/auth/cas-bridge/jwks'));
        const { payload } = await jwtVerify(overlayJWT, jwks, {
            issuer: 'https://one.libretexts.org',
            audience: 'libretexts.org',
        });
        return payload;
    } catch (e) {
        console.error(e);
        return null;
    }
}

window.LibreTextsCASBridgeVerifyJWT = verifyJWT;

window.LibreTextsLoginCAS = (event) => {
    event.preventDefault();
    cookieJar.set('cas_bridge_source', window.location.host, { domain: 'libretexts.org', sameSite:'lax' });
    cookieJar.set('cas_bridge_redirect', window.location.href, { domain: 'libretexts.org', sameSite:'lax' });
    window.location.href = 'https://one.libretexts.org/api/v1/auth/cas-bridge';
};

window.LibreTextsLogoutCAS = (event) => {
    event.preventDefault();
    cookieJar.remove('overlayJWT', { domain: 'libretexts.org' });
    cookieJar.remove('cas_bridge_redirect', { domain: 'libretexts.org' });
    cookieJar.remove('cas_bridge_source', { domain: 'libretexts.org' });
    window.location.href = 'https://sso.libretexts.org/cas/logout';
};

window.addEventListener('DOMContentLoaded', async () => {
    if (window.location.href.endsWith('#')) {
        history.replaceState('', document.title, window.location.pathname + window.location.search);
    }

    // <authenticated to CXone>
    let login = document.getElementById('emailHolder').innerText;
    const $target = $('.mt-user-quick-login');
    if (login) {
        return;
    }
    // </authenticated to CXone>

    // <check if known to be able to authenticate to CXone>
    const loginLink = document.getElementById('ssoHolder').innerText;
    const authorizedLibCookie = cookieJar.get(`cas_bridge_authorized_${window.location.host}`);
    if (authorizedLibCookie && authorizedLibCookie === 'true' && loginLink) {
        window.location.href = loginLink;
    }
    // </check if known to be able to authenticate to CXone>

    // <authenticated to CAS Bridge>
    const overlayJWT = cookieJar.get('overlayJWT');
    if (overlayJWT) {
        const payload = await verifyJWT(overlayJWT);
        if (payload && payload.sub) {
            login = payload;
        }
    }
    if (login) {
        $target.replaceWith(`<li><a tabindex="0" class="sso-user mt-icon-user3" title="Logout ${login.first_name} ${login.last_name}" onclick="window.LibreTextsLogoutCAS(event)" style="cursor: pointer; margin: 0">${login.first_name} ${login.last_name}</a></li>`);
        $('.elm-header-user-nav').addClass('authenticated-sso');

        const $nativeSignIn = $('.mt-icon-quick-sign-in');
        $nativeSignIn.hide();
        return;
    }
    // </authenticated to CAS Bridge>
    
    if ($target) {
        $target.before(`<li style="cursor:pointer;"><a tabindex="0" class="mt-icon-quick-sign-in" title="Single Sign-On" onclick="window.LibreTextsLoginCAS(event)">Sign in</a></li>`)
    }
});
