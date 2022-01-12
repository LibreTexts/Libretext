if (!window["analytics.js"]) {
    window["analytics.js"] = true;
    (function () {
        const ua = navigator.userAgent.toLowerCase();
        let isUserAutomated = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
        const isSafari = ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
        const sessionID = '_' + Math.random().toString(36).substr(2, 9);
        const $content = $(".mt-content-container");
        const root = "api.libretexts.org";
        let coverpage;
        let login = '';
        // const root = "home.miniland1333.com"
        
        
        if (navigator.webdriver || isUserAutomated || window.matchMedia('print').matches) {
            $content.show();
            return; //exit if not client-facing
        }
        
        window.addEventListener('load', async function () {
            login = await getLogin();
            const pageTitle = $("#deki-page-title, #title").last();
            if (login && login.user) {
                if (!login.educational) {
                    pageTitle.prepend(`<a class="icon-SSO" title="Single Sign-On" onclick="logoutCAS(event)" style="color:red"/>`);
                    $content.before(`<div style="font-size: x-large">Access Denied: ${login.user} is not part of an institution. Please log in with your institutional <a class="icon-SSO" title="Single Sign-On Logout" onclick="logoutCAS(event)"/> or your LibreLogin.</div>`);
                    return;
                }
                // $content.before(`<p>Thank you ${login} for authenticating with the LibreTexts SSO!</p>`);
                $content.show()
                pageTitle.prepend(`<a class="icon-SSO" title="Logged in with SSO as ${login.user}" style="color:green"></a>`);
            }
            else { //invalid session, user must log in
                pageTitle.prepend(`<a class="icon-SSO" title="Single Sign-On" onclick="loginCAS(event)" style="color:red"/>`);
                $content.before(`<div style="font-size: x-large">Content is hidden. Please log in with your institutional <a class="icon-SSO" title="Single Sign-On" onclick="loginCAS(event)"/> or your LibreLogin.</div>`);
                return;
            }
            
            if (sessionStorage.getItem('ay')) {
                console.log("LAL");
                track()
            }
            else {
                fetch(`https://${root}/ay/ping`).then(async (response) => {
                    if (response.ok) {
                        console.log("LA"); //check if endpoint is ready to receive
                        sessionStorage.setItem('ay', 'true');
                        track();
                    }
                    else {
                        console.error(response.status)
                    }
                });
            }
        });
        
        async function getLogin() {
            let payload = Cookies.get();
            let login = document.getElementById('emailHolder').innerText; //Mindtouch Login
            if (login) {
                // const $content = $(".mt-content-container");
                // $content.before(`<p>libreTextsLogin AY: ${login}</p>`);
                return {user: login, educational: true};
            }
            
            if (payload && payload.overlayJWT) { //cas-overlayJWT login
                payload = payload.overlayJWT;
                
                let pubKey = await fetch('https://api.libretexts.org/cas-bridge/public');
                pubKey = await pubKey.text();
                try {
                    login = KJUR.jws.JWS.verify(payload, pubKey, ["PS256"]);
                    if (login) {
                        payload = KJUR.jws.JWS.parse(payload).payloadObj;
                        console.log(payload.user, payload);
                        return payload;
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            
            if (!login) { //nb handling
                
                let cookies = document.cookie.split('; ');
                let nbUser = cookies.find(function (element) {
                    return element.startsWith('userinfo=') && element.includes('email');
                });
                
                if (nbUser) {
                    nbUser = decodeURIComponent(decodeURIComponent(nbUser.replace('userinfo=', '')));
                    nbUser = JSON.parse(nbUser);
                    return {user: nbUser.email, educational: true};
                }
            }
            
        }
        
        async function track() {
            report('accessed');
            
            let pageTitle = document.getElementById("title");
            pageTitle = pageTitle ? pageTitle.innerText : document.title;
            TimeMe.initialize({
                currentPageName: pageTitle, // current page
                idleTimeoutInSeconds: 600 // seconds
            });
            
            //Page switch handling
            let hidden, visibilityChange, isActive = true;
            if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
                hidden = "hidden";
                visibilityChange = "visibilitychange";
            }
            else if (typeof document.msHidden !== "undefined") {
                hidden = "msHidden";
                visibilityChange = "msvisibilitychange";
            }
            else if (typeof document.webkitHidden !== "undefined") {
                hidden = "webkitHidden";
                visibilityChange = "webkitvisibilitychange";
            }
            document.addEventListener(visibilityChange, function () {
                if (document[hidden] && isActive) { //leaving
                    isActive = false;
                    report('switched away');
                }
                else if (!document[hidden] && !isActive) { //returning
                    isActive = true;
                    report('switched to');
                }
            });
            
            //LTI iframe event handling
            window.addEventListener('message', function (message) {
                try {
                    message = JSON.parse(message.data);
                    console.log(message);
                    if (message && message.subject === 'caliper.event') {
                        let {type, action, element_id} = message;
                        report(action, {id: type, element_id: element_id});
                    }
                } catch (e) {
                
                }
            });
            
            //Time on page handling
            window.addEventListener('pagehide', async function () {
                report('left', 'page', {
                    type: 'pagehide'
                });
                if (isSafari) { //workaround due to pagehide asynchronous http request bug in safari
                    $.ajax({
                        type: "POST",
                        async: false,
                        url: `https://${root}/ay/receive`,
                        data: await getBody('left', 'page', {
                            type: 'ajax'
                        }),
                        timeout: 5000
                    });
                }
            });
            //Backup event for time on page
            window.addEventListener('beforeunload', function () {
                report('left', 'page', {
                    type: 'beforeunload'
                });
            });
            
            //Scroll depth handling
            jQuery.scrollDepth({
                userTiming: false,
                pixelDepth: false,
                noCache: true,
                eventHandler: function (data) {
                    report('read', null, {result: {'percent': data.eventLabel}})
                }
            });
            
            //Answer Reveal
            $('dl > dt').click(function () {
                report('answerReveal', null, {result: {'answer': this.innerText}})
            });
            
            //Recommended Link
            $('a.mt-related-listing-link').click(function () {
                report('recommendedTo', null, {result: {'recommendation': this.href}})
            })
        }
        
        async function report(verb, object, extra) {
            const body = await getBody(verb, object, extra);
            console.log(body);
            navigator.sendBeacon(`https://${root}/ay/receive`, body);
            // console.log(verb, object, extra);
        }
        
        async function getCoverpage() {
            const [subdomain] = LibreTexts.parseURL();
            if (!coverpage) {
                coverpage = await LibreTexts.getCoverpage();
                if (!coverpage) {
                    const isPro = document.getElementById('proHolder').innerText === 'true';
                    if (isPro)
                        alert("Analytic Tracking requires a Coverpage tag to be set in the page settings");
                    else
                        alert('No coverpage found! Please inform your instructor');
                    return null;
                }
                
                coverpage = await LibreTexts.getAPI(`https://${subdomain}.libretexts.org/${coverpage}`);
            }
            return `${subdomain}-${coverpage.id}`;
        }
        
        async function getBody(verb, object, extra) {
            let result = {
                actor: await getActor(),
                verb: verb,
                object: getObject(object)
            };
            result = Object.assign(result, extra);
            return JSON.stringify(result);
            
            async function getActor() {
                return {
                    courseName: await getCoverpage(),
                    id: login,
                    platform: platform.description,
                };
            }
            
            function getVerb(verb) {
                switch (verb) {
                    case  'read':
                        return {
                            "name": {
                                "en-US": "read"
                            },
                            "description": {
                                "en-US": "Indicates that the actor read the object. This is typically only applicable for objects representing printed or written content, such as a book, a message or a comment. The \"read\" verb is a more specific form of the \"consume\", \"experience\" and \"play\" verbs."
                            }
                        };
                    case 'accessed':
                        return {
                            "name": {
                                "en-US": "accessed"
                            },
                            "description": {
                                "en-US": "Indicates that the actor has accessed the object. For instance, a person accessing a room, or accessing a file."
                            }
                        };
                    case 'left':
                        return {
                            "name": {
                                "en-US": "left"
                            },
                            "description": {
                                "en-US": "Indicates that the actor has left the object. For instance, a Person leaving a Group or checking-out of a Place."
                            }
                        };
                    default:
                        return verb;
                }
            }
            
            function getObject(object = 'page') {
                const [subdomain] = LibreTexts.parseURL();
                let timestamp = new Date();
                let result = {
                    subdomain: subdomain,
                    id: document.getElementById('pageIDHolder').innerText,
                    url: window.location.href,
                    timestamp: timestamp.toUTCString(),
                    pageSession: sessionID,
                    timeMe: TimeMe.getTimeOnCurrentPageInSeconds()
                };
                
                /*				switch (object) {
                                    case 'page':
                                        result.definition = {
                                            "name": {
                                                "en-US": "page"
                                            },
                                            "description": {
                                                "en-US": "Represents an area, typically a web page, that is representative of, and generally managed by a particular entity. Such areas are usually dedicated to displaying descriptive information about the entity and showcasing recent content such as articles, photographs and videos. Most social networking applications, for example, provide individual users with their own dedicated \"profile\" pages. Several allow similar types of pages to be created for commercial entities, organizations or events. While the specific details of how pages are implemented, their characteristics and use may vary, the one unifying property is that they are typically \"owned\" by a single entity that is represented by the content provided by the page itself."
                                            }
                                        };
                                        break;

                                    default:
                                        result.definition = object;
                                }*/
                
                return result;
            }
        }
    })()
}
