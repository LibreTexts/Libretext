window.addEventListener('DOMContentLoaded', async () => {
    let login = document.getElementById('emailHolder').innerText;
    let payload = Cookies.get();
    if (window.location.href.endsWith('#'))
        history.replaceState("", document.title, window.location.pathname + window.location.search);
    const $target = $('.mt-user-quick-login');
    
    if (login) {
        // $content.before(`<p>libreTextsLogin: ${login}</p>`);
        return;
    }
    else if (payload && payload.overlayJWT) {
        payload = payload.overlayJWT;
        
        let pubKey = await fetch('https://api.libretexts.org/cas-bridge/public');
        pubKey = await pubKey.text();
        try {
            login = KJUR.jws.JWS.verify(payload, pubKey, ["PS256"]);
            if (login) {
                payload = KJUR.jws.JWS.parse(payload).payloadObj;
                login = payload.email || payload.user;
            }
        } catch (e) {
            console.error(e);
        }
        console.log(login, payload);
        
        if (login) {
            // $("#title").append('<button id="cas-test" onclick="logoutCAS()">Logout</button>');
            $target.replaceWith(`<li><a class="icon-SSO sso-user" title="Single Sign-On Logout" onclick="logoutCAS(event)">${payload.name}</a></li>`)
            $('.elm-header-user-nav').css('background-color', '#0f67a6');
            $('.elm-header-user-nav .mt-user-menu > li > a').css('color', 'white');
            // $content.before(`<p>Thank you ${login} for authenticating with LibreTexts SSO!</p>`);
            return;
        }
    }
    
    if ($target) {
        $target.before(`<li><a class="icon-SSO" title="Single Sign-On" onclick="loginCAS(event)"/></li>`)
    }
});

function loginCAS(event) {
    event.preventDefault();
    Cookies.set('api_redirect', window.location.href, {domain: 'libretexts.org'});
    window.location = 'https://api.libretexts.org/cas-bridge';
}

function logoutCAS(event) {
    event.preventDefault();
    Cookies.remove('overlayJWT', {domain: 'libretexts.org'});
    window.location = 'https://sso.libretexts.org/cas/logout';
    
    //location.reload();
}
