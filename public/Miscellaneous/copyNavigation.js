(function () {
    
    function fn() {
        let nav = document.getElementsByClassName("elm-article-pagination");
        if (nav.length) {
            nav = document.getElementsByClassName("elm-article-pagination")[0].cloneNode(true);
            let media = document.getElementsByClassName("elm-social-share")[0];
            media.parentElement.insertBefore(nav, media);
        }
        sandboxOption();
        if (!window.location.hostname.startsWith('query')) {
            propagatorOption();
            copyContentOption(); //Forker
        }
    }
    
    function propagatorOption() {
        const isAdmin = document.getElementById("adminHolder").innerText === "true";
        const libraryHeader = window.location.href.endsWith('Template:Custom/Views/Header');
        if (isAdmin && !libraryHeader) {
            let copy = document.getElementsByClassName("mt-user-menu-copy-page");
            if (copy.length) {
                let original = document.getElementsByClassName("mt-user-menu-copy-page")[0];
                copy = original.cloneNode(true);
                let copyTarget = copy.getElementsByTagName("a")[0];
                // copyTarget.href = window.location.origin + "/Under_Construction/Users/Henry/Propagator?" + encodeURIComponent(window.location.href);
                copyTarget.innerText = "Propagate";
                copyTarget.removeAttribute('href');
                copyTarget.classList.add("mt-icon-cycle");
                copyTarget.classList.remove("mt-icon-copy-page");
                // copyTarget.setAttribute("target", "_blank");
                copyTarget.onclick = askPropagator;
                copyTarget.style.cursor = 'pointer';
                copyTarget.title = "Propagate this page to other libraries";
                original.parentNode.insertBefore(copy, original.nextSibling);
            }
        }
    }
    
    async function askPropagator() {
        const [subdomain, path] = LibreTexts.parseURL();
        let url = `https://${subdomain}.libretexts.org/${path}`;
        if (confirm(`Propagate ${url} to the other libraries?`)) {
            const subdomain = url.split("/")[2].split(".")[0];
            //Disabled for careered
            let otherArray = ["bio", "biz", "chem", "eng", "espanol", "geo", "human", "math", "med", "phys", "socialsci", "stats", "workforce"];
            if (otherArray.includes(subdomain)) {
                let index = otherArray.indexOf(subdomain);
                if (index > -1) {
                    otherArray.splice(index, 1);
                    let response = await fetch(`https://api.libretexts.org/propagator/receive`, {
                        method: "PUT",
                        body: JSON.stringify({
                            username: document.getElementById("usernameHolder").innerText,
                            url: url,
                        })
                    });
                    response = await response.json();
                    alert('Propagation successful');
                }
            }
        }
    }
    
    async function copyContent(e) {
        e.preventDefault();
        if (confirm("Fork this page?\nThis will transform all content-reuse pages into editable content.\n You can use the revision history to undo this action.")) {
            let [, path] = LibreTexts.parseURL();
            let response = await LibreTexts.sendAPI('fork');
            response = await response.text();
            if (response.includes('Successfully forked')) {
                
                alert(response + '.\n The page will now reload.');
                location.reload();
            }
            else
                alert(response);
        }
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function copyContentOption() {
        let tags = document.getElementById("pageTagsHolder");
        const isAdmin = document.getElementById("adminHolder").innerText === 'true';
        const isPro = document.getElementById("proHolder").innerText === 'true';
        // const groups = document.getElementById("groupHolder").innerText.toLowerCase();
        
        let $target = $("span.title.mt-title-edit");
        let [, path] = LibreTexts.parseURL();
        if (tags && isPro) {
            let time = 0;
            while (!$target.length) {
                if (time > 30) //timeout
                    return null;
                await sleep(500);
                time += 0.5;
                $target = $("span.title.mt-title-edit");
            }
            
            tags = tags.innerText;
            tags = tags.replace(/\\/g, "");
            tags = JSON.parse(tags);
            
            //Options menu
            let copy = document.getElementsByClassName("mt-user-menu-copy-page");
            if (copy.length) {
                let original = document.getElementsByClassName("mt-user-menu-copy-page")[0];
                copy = original.cloneNode(true);
                let copyTarget = copy.getElementsByTagName("a")[0];
                copyTarget.onclick = copyContent;
                copyTarget.innerText = "Forker";
                copyTarget.classList.add("mt-icon-flow-branch");
                copyTarget.classList.remove("mt-icon-copy-page");
                copyTarget.title = "Fork this transcluded page";
                original.parentNode.insertBefore(copy, original.nextSibling)
            }
            if (tags.includes("transcluded:yes")) {
                //Next to title
                let icon = document.createElement("a");
                icon.classList.add("mt-icon-flow-branch");
                icon.classList.add("printHide");
                icon.onclick = copyContent;
                $target.after(icon);
                
            }
        }
    }
    
    function sandboxOption() {
        let original = document.getElementsByClassName("mt-user-menu-my-contributions");
        if (original.length) {
            original = original[0];
            let copy = original.cloneNode(true);
            let copyTarget = copy.getElementsByTagName("a")[0];
            copyTarget.href = `https://${LibreTexts.extractSubdomain()}.libretexts.org/Sandboxes`;
            copyTarget.innerText = "Your Sandbox";
            copyTarget.classList.add("mt-icon-select-all");
            copyTarget.classList.remove("mt-icon-my-contributions");
            copyTarget.title = "Go to your personal Sandbox";
            original.parentNode.insertBefore(copy, original);
        }
    }
    
    
    document.addEventListener('DOMContentLoaded', fn);
    
    //hide headers if within an iframe
    if (window !== window.top || window.location.href.includes("contentOnly") || window.location.href.includes("onlyContent")) {
        document.body.classList.add("contentOnly");
    }
    if (window.location.href.includes("adaptView")
        || (document.referrer && document.referrer.match(/^https:\/\/[-.\w]*?adapt\.libretexts\.org/))) {
        document.body.classList.add("contentOnly");
        document.body.classList.add("adaptView");
    }
})();
