import { createRemoteJWKSet, jwtVerify } from 'jose';
import { default as cookieJar } from 'js-cookie';

/**
 * @param token - token to verify using JWKS
 */
async function verifyJWT(token) {
  try {
    const isStaging = window.location.hostname === 'dev.libretexts.org';
    const jwks = await createRemoteJWKSet(new URL(`https://${isStaging ? 'staging.' : ''}one.libretexts.org/api/v1/auth/cas-bridge/jwks`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://${isStaging ? 'staging.' : ''}one.libretexts.org`,
      audience: 'libretexts.org',
    });
    return payload;
  } catch (e) {
    console.error(e);
    return null;
  }
}

window.LibreTextsCASBridgeVerifyJWT = verifyJWT;

window.LibreTextsLoginCAS = (event, gateway = false) => {
  event?.preventDefault();
  cookieJar.set('cas_bridge_source', window.location.host, { domain: 'libretexts.org', sameSite: 'lax' });
  cookieJar.set('cas_bridge_redirect', window.location.href, { domain: 'libretexts.org', sameSite: 'lax' });
  const isStaging = window.location.hostname === 'dev.libretexts.org';
  window.location.href = `https://${isStaging ? 'staging.' : ''}one.libretexts.org/api/v1/auth/cas-bridge${gateway ? '?gateway=true' : ''}`;
};

window.LibreTextsLogoutCAS = (event) => {
  event.preventDefault();
  cookieJar.remove(`cas_bridge_token_${window.location.host}`, { domain: 'libretexts.org' });
  cookieJar.remove('cas_bridge_redirect', { domain: 'libretexts.org' });
  cookieJar.remove('cas_bridge_source', { domain: 'libretexts.org' });
  cookieJar.remove(`cas_bridge_gateway_check_${window.location.host}`, { domain: 'libretexts.org' });
  const isStaging = window.location.hostname === 'dev.libretexts.org';
  window.location.href = `https://${isStaging ? 'castest2' : 'auth'}.libretexts.org/cas/logout`;
};

(async () => {
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
    return;
  }
  // </check if known to be able to authenticate to CXone>

  /*
  // <attempt gateway (silent) authentication>
  const currentPath = window.location.pathname;
  const gatewayCheckKey = `cas_bridge_gateway_check_${window.location.host}`;
  if (sessionStorage.getItem(gatewayCheckKey) !== '1' && !currentPath.toLowerCase().includes('special:')) {
    sessionStorage.setItem(gatewayCheckKey, '1');
    window.LibreTextsLoginCAS(null, true);
    return;
  }
  // </attempt gateway (silent) authentication>
   */

  // <authenticated to CAS Bridge>
  const casBridgeToken = cookieJar.get(`cas_bridge_token_${window.location.host}`);
  if (casBridgeToken) {
    const payload = await verifyJWT(casBridgeToken);
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
    $target.before('<li style="cursor:pointer;"><a tabindex="0" class="mt-icon-quick-sign-in" title="Single Sign-On" onclick="window.LibreTextsLoginCAS(event)">Sign in</a></li>');
  }
})();
