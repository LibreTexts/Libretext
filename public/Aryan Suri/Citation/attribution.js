"use strict";
function attribution() {
    const cc = getCC();
    const sidebar = document.getElementById("sidebarDiv");
    sidebar.style.display = "none";
    buildAttribution();
    function getParam() {
        let title = $("#titleHolder").text();
        let author = $("li.mt-author-information a:first").text();
        if (title.match(/^[A-Za-z ]*?[0-9]+[.0-9A-Za-z]*?: /)) {
            title = title.replace(/^[^:]*:/, '');
        }
        let titlestr = `"${title}"`;
        let pageID = $("#pageIDHolder").text();
        let currentLibrary = window.location.host.split('.')[1] ? window.location.host.split('.')[0] : 'chem';
        let url = `https://${currentLibrary}.libretexts.org/@go/page/${pageID}`;
        let isauthor = Boolean(author);
        let iscc = Boolean(cc);
        try {
            if (!cc && !author)
                throw "license or author";
            if (!cc)
                throw "license";
            if (!author)
                throw "author";
        }
        catch (err) {
            console.log("No " + err);
        }
        let param = {
            "title": titlestr,
            "author": author,
            "isauthor": isauthor,
            "url": url,
            "cc": iscc
        };
        return param;
    }
    function buildAttribution() {
        const param = getParam();
        const attrdiv = document.createElement("div");
        const sidebar = document.getElementById("sidebarDiv");
        (sidebar === null || sidebar === void 0 ? void 0 : sidebar.style.display) === "none";
        $(attrdiv).attr("id", "SB-PA-AD");
        document.body.append(attrdiv);
        $(attrdiv).html(`

            <div onclick="hideattr()" id="attrModal">

                <div id="attrModalContent" style="cursor: pointer" >
                    <span class="closeModal">×</span>
                    <h5 id="modalTitle">Get Page Attribution</h5>
                    
                    <div id="attrHTML">
                    </div>


                    <div id="attr-links">
                        <a id="attr-copy">Copy Text</a>
                        <a id="attr-html">Copy HTML</a>
                        <a id="attr-author"> Affiliation's Page</a>
                        <a id="attr-program"> Program's Page</a>
                    </div>
                </div>

            </div>`);
        if (param.cc) {
            if (param.isauthor) {
                $("#attrHTML").html(`<p id="attr-text"><a href="${param.url}">${param.title}</a> by <a id="attr-author-link" href="">${param.author}</a>, <a href="https://libretexts.org/">LibreTexts</a> is licensed under <a href="${cc.link}"> ${cc.title} </a>.</p><br/>`);
            }
            else {
                $("#attrHTML").html(`<p id="attr-text"> <a href="${param.url}">${param.title}</a> by <a href="https://libretexts.org/">LibreTexts</a> is licensed under <a href="${cc.link}"> ${cc.title}</a>.</p><br/>`);
            }
        }
        else {
            if (param.isauthor) {
                $("#attrHTML").html(`<p id="attr-text"><a href="${param.url}">${param.title}</a> by <a id="attr-author-link" href="">${param.author}</a>, <a href="https://libretexts.org/">LibreTexts</a> has no license indicated.  </p><br/>`);
            }
            else {
                $("#attrHTML").html(`<p id="attr-text"><a href="${param.url}">${param.title}</a> by <a href="https://libretexts.org/">LibreTexts</a> has no license indicated.</p><br/>`);
            }
        }
        const attrCopy = document.getElementById("attr-copy");
        attrCopy.addEventListener("click", () => {
            let text = document.getElementById("attr-text").innerText;
            let elem = document.createElement("textarea");
            document.body.appendChild(elem);
            elem.value = text;
            elem.select();
            document.execCommand("copy");
            document.body.removeChild(elem);
        });
        //AUTHOR LINKS
        const attrAuthor = $("li.mt-author-information a:first").attr('href');
        $("#attr-author").attr("href", attrAuthor);
        $("#attr-author-link").attr("href", attrAuthor);
        const attrProgram = $("li.mt-author-companyname a:first").attr('href');
        $("#attr-program").attr("href", attrProgram);
        //COPY THE HTML
        const attrHTMLCopy = document.getElementById("attr-html");
        attrHTMLCopy.addEventListener("click", () => {
            let text = $("#attr-text").html();
            let elem = document.createElement("textarea");
            document.body.appendChild(elem);
            elem.value = text;
            elem.select();
            document.execCommand("copy");
            document.body.removeChild(elem);
        });
    }
}
function hideattr() {
    if (!$(event.target).closest('#attrModalContent').length && !$(event.target).is('#attrModalContent')) {
        $("#SB-PA-AD").remove();
        const sidebar = document.getElementById("sidebarDiv");
        sidebar.style.display = "block";
    }
}
