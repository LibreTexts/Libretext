(function () {
    
    function fn() {
        let nav = document.getElementsByClassName("elm-article-pagination");
        if (nav.length) {
            nav = document.getElementsByClassName("elm-article-pagination")[0].cloneNode(true);
            let media = document.getElementsByClassName("elm-social-share")[0];
            media.parentElement.insertBefore(nav, media);
        }
        remixerOption();
        sandboxOption();
        if (!window.location.hostname.startsWith('query')) {
            propagatorOption();
            downloadOption();
            copyContentOption(); //Forker
        }
    }
    
    function propagatorOption() {
        const isAdmin = document.getElementById("adminHolder").innerText === "true";
        const isLibrarySpecific = window.location.href.includes('LibrarySpecific');
        const libraryHeader = window.location.href.endsWith('Template:Custom/Views/Header');
        if (isAdmin && !isLibrarySpecific && !libraryHeader) {
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
        if (confirm(`Propagate ${window.location.href} to the other libraries?`)) {
            let url = window.location.href;
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
    
    function remixerOption() {
        let targetName = "mt-new-page";
        let copy = document.getElementsByClassName(targetName);
        if (!copy.length) {
            targetName = 'mt-site-tools';
            copy = document.getElementsByClassName(targetName);
        }
        if (!copy.length) {
            targetName = 'mt-user-menu-user';
            copy = document.getElementsByClassName(targetName);
        }
        if (copy.length) {
            let original = document.getElementsByClassName(targetName)[0];
            copy = original.cloneNode(true);
            copy.classList.remove("mt-new-page");
            copy.classList.remove("mt-site-tools");
            copy.classList.remove("mt-user-menu-user");
            let copyTarget = copy.getElementsByTagName("a")[0];
            copyTarget.href = window.location.origin + "/Under_Construction/Development_Details/OER_Remixer";
            copyTarget.addEventListener('click', () => {
                localStorage.setItem('RemixerLastText', JSON.stringify({
                    title: document.getElementById('titleHolder').innerText,
                    url: window.location.href
                }));
            })
            copyTarget.innerText = "Remixer";
            if (Array.from(copyTarget.classList).includes('mt-icon-quick-sign-in'))
                copyTarget.id = "RemixerIcon";
            
            copyTarget.classList.add("mt-icon-tree");
            copyTarget.classList.remove("mt-icon-new-page");
            copyTarget.classList.remove("mt-icon-site-tools");
            copyTarget.classList.remove("mt-icon-site-tools");
            copyTarget.classList.remove("mt-icon-quick-sign-in");
            copyTarget.classList.remove("mt-toggle-right");
            copyTarget.setAttribute("target", "_blank");
            copyTarget.title = "Remix a new LibreText";
            let target;
            switch (targetName) {
                case 'mt-site-tools':
                    target = original;
                    break;
                case 'mt-new-page':
                    target = original.nextSibling;
                    break;
                case 'mt-user-menu-user':
                    target = original.previousSibling.previousSibling;
                    break;
            }
            original.parentNode.insertBefore(copy, target)
        }
        if (window.location.href.endsWith('OER_Remixer')) {
            const groups = document.getElementById("groupHolder").innerText;
            const isAdmin = document.getElementById("adminHolder").innerText === 'true';
            if (!isAdmin) {
                $('.mt-edit-page, .mt-new-page, .mt-page-options').remove();
            }
        }
    }
    
    function downloadOption() {
        let targetName = "mt-new-page";
        let copy = document.getElementsByClassName(targetName);
        if (!copy.length) {
            targetName = 'mt-site-tools';
            copy = document.getElementsByClassName(targetName);
        }
        if (!copy.length) {
            targetName = 'mt-user-menu-user';
            copy = document.getElementsByClassName(targetName);
        }
        if (copy.length) {
            let original = document.getElementsByClassName(targetName)[0];
            copy = original.cloneNode(true);
            copy.classList.remove("mt-new-page");
            copy.classList.remove("mt-site-tools");
            copy.classList.remove("mt-user-menu-user");
            let copyTarget = copy.getElementsByTagName("a")[0];
            copyTarget.href = window.location.origin + "/Courses/Remixer_University/Download_Center";
            copyTarget.innerText = "Downloads";
            if (Array.from(copyTarget.classList).includes('mt-icon-quick-sign-in'))
                copyTarget.id = "DownloadIcon";
            
            copyTarget.classList.add("mt-icon-download");
            copyTarget.classList.remove("mt-icon-new-page");
            copyTarget.classList.remove("mt-icon-site-tools");
            copyTarget.classList.remove("mt-icon-site-tools");
            copyTarget.classList.remove("mt-icon-quick-sign-in");
            copyTarget.classList.remove("mt-toggle-right");
            copyTarget.setAttribute("target", "_blank");
            copyTarget.title = "Go to the Download Center";
            let target;
            switch (targetName) {
                case 'mt-site-tools':
                    target = original;
                    break;
                case 'mt-new-page':
                    target = original.nextSibling;
                    break;
                case 'mt-user-menu-user':
                    target = original.previousSibling.previousSibling;
                    break;
            }
            original.parentNode.insertBefore(copy, target)
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
            copyTarget.href = '#';
            copyTarget.onclick = goToSandbox;
            copyTarget.innerText = "Your Sandbox";
            copyTarget.classList.add("mt-icon-select-all");
            copyTarget.classList.remove("mt-icon-my-contributions");
            copyTarget.title = "Go to your personal Sandbox";
            original.parentNode.insertBefore(copy, original);
        }
        
        async function goToSandbox() {
            let username = document.getElementById('usernameHolder').innerText;
            let isAdmin = document.getElementById('adminHolder').innerText;
            const groups = document.getElementById("groupHolder").innerText.toLowerCase();
            username = username.replace('@','_at_');
            const sandboxLocation = (isAdmin === 'true' || groups.includes('developer')) ? `/${username}` : '';
            
            await LibreTexts.sendAPI('createSandbox');
            document.location.replace(`/Sandboxes${sandboxLocation}`);
        }
    }
    
    
    document.addEventListener('DOMContentLoaded', fn);
    
    //hide headers if within an iframe
    if (window !== window.top || window.location.href.includes("contentOnly") || window.location.href.includes("onlyContent")) {
        document.body.classList.add("contentOnly");
    }
    if (window.location.href.includes("adaptView")
        || (document.referrer && document.referrer.match(/^https:\/\/([A-Za-z]*?\.)?adapt\.libretexts\.org/))) {
        document.body.classList.add("contentOnly");
        document.body.classList.add("adaptView");
    }
})();
