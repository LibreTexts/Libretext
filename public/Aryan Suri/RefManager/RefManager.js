"use strict";
window.addEventListener("load", async () => {
    buildManager();
});
// Table of Contents:
// buildManager, updateManager, storeReference, deleteReference, processReference --> replaceReferenceID
function buildManager() {
    const managerArea = document.createElement('div');
    const pageID = $("#pageIDHolder").text();
    const referenceArea = document.createElement('ul');
    managerArea.innerHTML = `<input type="text" id="referenceInput-Text" value=""> <button onclick="storeReference(document.getElementById('referenceInput-Text').value, ${pageID})">Cite</button>`;
    referenceArea.id = 'referenceDisplay';
    managerArea.id = 'referenceInput';
    document.getElementById("pageText").append(managerArea);
    document.getElementById("pageText").append(referenceArea);
    updateManager(true);
}
function updateManager(refresh, ref = JSON.parse(localStorage.getItem("book-references"))) {
    if (refresh) {
        try {
            for (let elem of ref) {
                let item = document.createElement("li");
                // @ts-ignore
                item.onclick = deleteReference;
                item.innerText = "ID# " + elem.id + "\n" + "Citation:  " + elem.citation;
                document.getElementById('referenceDisplay').appendChild(item);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    else {
        let item = document.createElement("li");
        // @ts-ignore
        item.onclick = deleteReference;
        item.innerText = "ID# " + ref.id + "\n" + "Citation:  " + ref.citation;
        document.getElementById('referenceDisplay').appendChild(item);
    }
}
async function storeReference(data, ID) {
    const Cite = CitRequire('citation-js');
    const Data = new Cite(data);
    const reference = Data.format('data');
    const citation = Data.format('citation');
    const parseReference = JSON.parse(reference);
    const coverPage = await LibreTexts.getCoverpage();
    let Log = [];
    let referenceGlobal = {
        "id": parseReference[0].id,
        "citation": citation,
        "data": data
    };
    let referenceLocal = {
        "id": parseReference[0].id,
        "citation": citation
    };
    if (localStorage.getItem("book-references") !== null) {
        let Logged = localStorage.getItem("book-references");
        Logged = JSON.parse(Logged);
        Logged.push(referenceLocal);
        localStorage.setItem("book-references", JSON.stringify(Logged));
    }
    else {
        Log.push(referenceLocal);
        localStorage.setItem("book-references", JSON.stringify(Log));
    }
    let userRefJSON;
    try {
        userRefJSON = await LibreTexts.authenticatedFetch(coverPage, `files/=references.json`, null);
        userRefJSON = await userRefJSON.json();
    }
    catch (e) {
        console.log(e);
        userRefJSON = [];
    }
    userRefJSON.push(referenceGlobal);
    await LibreTexts.authenticatedFetch(coverPage, `files/=references.json`, null, {
        method: "PUT",
        body: (JSON.stringify(userRefJSON))
    });
    updateManager(false, referenceLocal);
}
function deleteReference() {
    const text = this.innerText;
    const refPattern = new RegExp(".*ID#\\s*([^\\n\\r]*)");
    const ID = text.match(refPattern);
    const render = localStorage.getItem("book-references");
    if (render != null) {
        let obj = JSON.parse(render);
        let index = obj.findIndex((element) => element.id === ID[1]);
        let obj1 = obj.slice();
        obj1.splice(index, 1);
        localStorage.setItem("book-references", JSON.stringify(obj1));
    }
    this.remove();
}
async function processReference() {
    const coverPage = await LibreTexts.getCoverpage();
    const reg = /(?:\\#)([\s\S]*?)(?:#\\)/gm;
    let referenceJSON;
    try {
        referenceJSON = await LibreTexts.authenticatedFetch(coverPage, `files/=references.json`, null);
        referenceJSON = await referenceJSON.json();
        console.log("try achieved, references pulled");
    }
    catch (e) {
        console.log(e);
        return;
    }
    const pageContent = document.getElementById("pageText").innerHTML;
    function replaceReferenceID(inputString) {
        return "<b>" + inputString + " processed" + "</b>";
    }
    let thh = pageContent.replace(reg, (match, offset, string) => {
        const trimmedMatch = match.substring(2, match.length - 2).trim();
        return replaceReferenceID(trimmedMatch);
    });
    console.log(thh);
    document.getElementById("pageText").innerHTML = thh;
}
