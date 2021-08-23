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
             <p> Click reference to copy citation ID.</p>
            <ul id="referenceDisplay"></ul>
            <p id="referenceModalOutput"></p>
            </div>
        </div>
    `

    document.body.append(referenceModal);
    document.getElementsByClassName("elm-social-share")[0].appendChild(referenceModalButton);

    const modal = document.getElementById("referenceModal")!;
    const btn = document.getElementById("referenceModalBtn")!;
    btn.onclick = function () {
        modal.style.display = "block";
    }
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    await updateManager();
}

async function updateManager() {
    let userRefJSON = await getRefJSON();
    if(userRefJSON) {
        document.getElementById('referenceDisplay')!.innerHTML = "";
        let userRefArray = sortReference(userRefJSON);
        let i = 0;
        let value: any;
        for (value of userRefArray) {
            let refDiv = document.createElement("div");
            refDiv.className = "newReference"
            refDiv.id = `newReference${i}`
            refDiv.innerHTML = `<li id="${value.id}">${value.reference}</li> <a id="${value.id}${i}"> &#x274C; </a>`
            document.getElementById('referenceDisplay')!.appendChild(refDiv);
            document.getElementById(`${value.id}`)!.addEventListener("click", copyReference);
            document.getElementById(`${value.id}${i}`)!.addEventListener("click",  deleteReference);
            i++
        }
    }
    else {return;}
}

async function getRefJSON(cp = false) {
    let coverPage: any = null;
    let userRefJSON;
    if (cp) {coverPage = await LibreTexts.getCoverpage();}
    try {
        userRefJSON = await LibreTexts.authenticatedFetch(coverPage, `files/=references.json`, null);
        if (userRefJSON.ok) {
            userRefJSON = await userRefJSON.json();
        } else {
            return false;
        }

    } catch (e) {
        return console.debug(e);
    }
    return userRefJSON;
}

async function putRefJSON(json: JSON, cp: boolean = false){
    let coverPage: any = null;
    if (cp) {coverPage = await LibreTexts.getCoverpage();}
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

async function copyReference(this: HTMLElement) {
    console.log(this.id);
    const el = document.createElement('textarea');
    el.value = `\\#${this.id}#\\`;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return document.getElementById("referenceModalOutput")!.innerText = `Citation ${this.id}, copied`
}

async function deleteReference(this: HTMLElement) {
    let refID = this.id;
    const refNUM = refID[refID.length - 1]
    refID = refID.slice(0, -1)
    let userRefJSON = await getRefJSON();
    if(userRefJSON && userRefJSON.hasOwnProperty(refID)) {
        delete userRefJSON[refID];
        await putRefJSON(userRefJSON);
    } else {
        return;
    }
    document.getElementById(`newReference${refNUM}`)!.remove();
    document.getElementById("referenceModalOutput")!.innerText = "Citation deleted"
}

function sortReference(refs: any) {
    let userRefArray = Object.values(refs);
    userRefArray = userRefArray.sort((a: any, b: any) => {
        if (a.citation == b.citation) {
            return 0;
        } else if (a.citation < b.citation) {
            return -1;
        } else {
            return 1;
        }
    });
    return userRefArray;
}

async function storeReference(data: any) {
    const Cite = CitRequire('citation-js');
    const Data = new Cite(data);
    const reference = Data.format('data');
    const bibliographyItem = Data.format('bibliography')
    const citation = Data.format('citation');
    const parseReference = JSON.parse(reference);
    const path = window.location.pathname.substring(1);
    const lib = await LibreTexts.extractSubdomain();
    const cover = await LibreTexts.getCoverpage();
    let id;
    if (parseReference[0].hasOwnProperty('author')) {
        if (parseReference[0].hasOwnProperty('issued')){
            id = lib + parseReference[0].author[0].family + parseReference[0].issued["date-parts"][0]
        } else {
            id = lib + parseReference[0].author[0].family + Data.prototype.getFullYear();
        }
        console.log(id)
    } else { id = lib + citation}

    let referenceGlobal = {
        "id": id,
        "citation": citation,
        "reference": bibliographyItem,
        "data": data
    }
    let userRefJSON = await getRefJSON();
    if (!userRefJSON) {
        userRefJSON = {};
        userRefJSON[referenceGlobal.id] = referenceGlobal;
        await putRefJSON(userRefJSON);
        await putRefJSON(userRefJSON, true);
        await updateManager();
        return document.getElementById("referenceModalOutput")!.innerText = "Citation added"
    } else {
        if (!userRefJSON.hasOwnProperty(referenceGlobal.id)) {
            userRefJSON[referenceGlobal.id] = referenceGlobal;
            if (cover !== path) {
                let bookJSON = await getRefJSON(true);
                if (bookJSON) {
                    if(!bookJSON.hasOwnProperty(referenceGlobal.id)){
                        bookJSON[referenceGlobal.id] = referenceGlobal
                        await putRefJSON(bookJSON, true)
                    } else {}
                } else {
                    bookJSON = {}
                    bookJSON[referenceGlobal.id] = referenceGlobal
                    await putRefJSON(bookJSON, true)
                }
            } else {}
            await putRefJSON(userRefJSON);
            await updateManager();
            return document.getElementById("referenceModalOutput")!.innerText = "Citation added"
        } else {
            return document.getElementById("referenceModalOutput")!.innerText = "Citation already exists"
        }
    }

}

async function processReference() {
    const reg = new RegExp(/(?:\\#)([\s\S]*?)(?:#\\)/gm);
    let userRefJSON = await getRefJSON();
    const pageContent = document.getElementById("pageText")!.innerHTML;

    function replaceReferenceID(ref: any, inputString: string) {
        const key = inputString.replace(new RegExp(/&nbsp;/gm), " ").replace(new RegExp(/<[\s\S]*?>/gm), "").trim()
        if (key in ref) {
            return ref[key].citation;
        }
        return "Citation not Found";
    }


    let procReference: string = pageContent.replace(reg, (match, offset, string) => {
        const trimmedMatch = match.substring(2, match.length - 2).trim();
        return replaceReferenceID(userRefJSON, trimmedMatch);
    });

    document.getElementById("pageText")!.innerHTML = procReference;
    // nested processBibliography() {}
    // pass in the ref[key] as an array? or through a for loop
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

    let userRefArray = sortReference(referenceJSON);
    const managerArea = document.createElement('div');
    const referenceHeader = document.createElement("h2");
    const referenceArea = document.createElement('ol');
    referenceArea.className += "pageBibliography";
    referenceHeader.innerText = "Works Cited (APA)";
    let value: any;
    for (value of userRefArray){
        const referenceList = document.createElement("li");
        referenceList.innerHTML = value.formattedReference;
        referenceArea.appendChild(referenceList);
    }

    managerArea.appendChild(referenceHeader);
    managerArea.appendChild(referenceArea);
    document.getElementById("pageText")!.appendChild(managerArea);
}
