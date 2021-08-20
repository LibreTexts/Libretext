"use strict";
// @author: Aryan Suri
// @TODO: 1. add a putRefJSON func
// @TODO: 2. add a upgradeRef func
// @TODO: 3. #LEO bibliography
window.addEventListener("load", async () => {
    await buildManager();
    await processReference();
    await processBibliography();
});
async function buildManager() {
    const referenceModalButton = document.createElement("button");
    const referenceModal = document.createElement("div");
    referenceModalButton.innerHTML = `Reference Manager`;
    referenceModalButton.id = "referenceModalBtn";
    referenceModal.innerHTML = `
        <div id="referenceModal">
            <div id="referenceModalContent">
            <h3> Reference Manager</h3>
            <p> Import references using RIS, bibtex, json, DOI, or wikidataID formats.</p>
            <div id="referenceInput">
                <input type="text" id="referenceInput-Text" value=""> 
                <button onclick="storeReference(document.getElementById('referenceInput-Text').value)">Add</button>
            </div>
             <p> dev note0: plus sign (upcoming) to add to book-json, red cross (works) is to remove citation.</p>
            <ul id="referenceDisplay"></ul>
            </div>
        </div>
    `;
    document.body.append(referenceModal);
    document.getElementsByClassName("elm-social-share")[0].appendChild(referenceModalButton);
    const modal = document.getElementById("referenceModal");
    const btn = document.getElementById("referenceModalBtn");
    //const span = document.getElementById("referenceModalClose")!;
    btn.onclick = function () {
        modal.style.display = "block";
    };
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
    await updateManager();
}
async function updateManager() {
    let userRefJSON = await getRefJSON();
    if (userRefJSON) {
        let userRefArray = Object.values(userRefJSON);
        document.getElementById('referenceDisplay').innerHTML = '';
        userRefArray = userRefArray.sort((a, b) => {
            if (a.citation == b.citation) {
                return 0;
            }
            else if (a.citation < b.citation) {
                return -1;
            }
            else {
                return 1;
            }
        });
        let i = 0;
        let value;
        for (value of userRefArray) {
            let refDiv = document.createElement("div");
            refDiv.className = "newReference";
            refDiv.id = `newReference${i}`;
            refDiv.innerHTML = `<li>${value.citation}</li>
                                <li id="copy${i}">${value.id}</li> 
                                <a id="${value.id}${i}${i}"> &#x2795; </a> 
                                <a id="${value.id}${i}"> &#x274C; </a>`;
            document.getElementById('referenceDisplay').appendChild(refDiv);
            document.getElementById(`copy${i}`).addEventListener("click", copyReference);
            document.getElementById(`${value.id}${i}${i}`).addEventListener("click", upgradeReference);
            document.getElementById(`${value.id}${i}`).addEventListener("click", deleteReference);
            i++;
        }
    }
    else {
        return;
    }
}
async function getRefJSON(cp = false) {
    let coverPage = null;
    let userRefJSON;
    if (cp) {
        coverPage = await LibreTexts.getCoverpage();
    }
    try {
        userRefJSON = await LibreTexts.authenticatedFetch(coverPage, `files/=references.json`, null);
        if (userRefJSON.ok) {
            userRefJSON = await userRefJSON.json();
        }
        else {
            //console.error(userRefJSOn.status, await userRefJSON.text());
            return false;
        }
    }
    catch (e) {
        return console.debug(e);
    }
    return userRefJSON;
}
async function putRefJSON(json, cp = false) {
    let coverPage = null;
    if (cp) {
        coverPage = await LibreTexts.getCoverpage();
    }
    try {
        await LibreTexts.authenticatedFetch(coverPage, `files/=references.json`, null, {
            method: "PUT",
            body: (JSON.stringify(json))
        });
    }
    catch (e) {
        return console.debug(e);
    }
    return;
}
function copyReference() {
    const el = document.createElement('textarea');
    el.value = `\\#${this.innerText}#\\`;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    tippy(`#${this.id}`, {
        content: 'My tooltip!',
    });
}
async function deleteReference() {
    let refID = this.id;
    const refNUM = refID[refID.length - 1];
    refID = refID.slice(0, -1);
    let userRefJSON = await getRefJSON();
    if (userRefJSON) {
        if (userRefJSON.hasOwnProperty(refID)) {
            delete userRefJSON[refID];
            await putRefJSON(userRefJSON);
        }
        else {
            return console.log(`Key (${refID}) not found`);
        }
    }
    else {
        return;
    }
    document.getElementById(`newReference${refNUM}`).remove();
}
function upgradeReference() {
    return console.log('upgrade reference');
    let refID = this.id;
    const refNUM = refID[refID.length - 1];
    refID = refID.slice(0, -2);
    let pageJSON = await getRefJSON();
    let bookJSON = await getRefJSON(true);
    if (LibreTexts.getCoverpage() !== window.location.pathname) {
        if (bookJSON) {
            console.log('book json exists');
            let ref = pageJSON[refID];
        }
        let ref = pageJSON[refID];
        //console.log(ref);
        // bookJSON[]
    }
    else {
        // cover page is page and so ref already exists
        return console.log('this url is cover page');
    }
    // await putRefJSON(j, true);
    // document.getElementById(`newReference${refNUM}`)!.remove();
}
async function storeReference(data) {
    const Cite = CitRequire('citation-js');
    const Data = new Cite(data);
    const reference = Data.format('data');
    const citation = Data.format('citation');
    const parseReference = JSON.parse(reference);
    let Log = {};
    let referenceGlobal = {
        "id": parseReference[0].id,
        "citation": citation,
        "data": data
    };
    let userRefJSON = await getRefJSON();
    if (!userRefJSON) {
        userRefJSON = {};
    }
    userRefJSON[parseReference[0].id] = referenceGlobal;
    await putRefJSON(userRefJSON);
    await updateManager();
}
async function processReference() {
    const reg = new RegExp(/(?:\\#)([\s\S]*?)(?:#\\)/gm);
    let userRefJSON = await getRefJSON();
    const pageContent = document.getElementById("pageText").innerHTML;
    function replaceReferenceID(ref, inputString) {
        const key = inputString.replace(new RegExp(/&nbsp;/gm), " ").replace(new RegExp(/<[\s\S]*?>/gm), "").trim();
        if (key in ref) {
            return ref[key].citation;
        }
        return "Citation not Found";
    }
    let procReference = pageContent.replace(reg, (match, offset, string) => {
        const trimmedMatch = match.substring(2, match.length - 2).trim();
        return replaceReferenceID(userRefJSON, trimmedMatch);
    });
    document.getElementById("pageText").innerHTML = procReference;
}
async function processBibliography() {
    const Cite = CitRequire('citation-js');
    let referenceJSON = await getRefJSON();
    for (let key in referenceJSON) {
        const Data = new Cite(referenceJSON[key].data);
        referenceJSON[key].formattedReference = Data.format('bibliography', {
            format: 'html',
            template: 'apa',
            lang: 'en-US'
        });
    }
    let keys = Object.keys(referenceJSON);
    keys.sort((a, b) => {
        return referenceJSON[a].formattedReference < referenceJSON[b].formattedReference ? -1 : 1;
    });
    const managerArea = document.createElement('div');
    const referenceHeader = document.createElement("h2");
    const referenceArea = document.createElement('ol');
    referenceArea.className += "pageBibliography";
    referenceHeader.innerText = "Works Cited (APA)";
    for (let key of keys) {
        const referenceList = document.createElement("li");
        referenceList.innerHTML = referenceJSON[key].formattedReference;
        referenceArea.appendChild(referenceList);
    }
    managerArea.appendChild(referenceHeader);
    managerArea.appendChild(referenceArea);
    document.getElementById("pageText").appendChild(managerArea);
}
