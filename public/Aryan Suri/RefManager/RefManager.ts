window.addEventListener("load", async () => {
    buildManager()
});

// Table of Contents:
// buildManager, updateManager, storeReference, deleteReference, processReference --> replaceReferenceID


function buildManager(){
    const managerArea: HTMLDivElement = document.createElement('div');
    const referenceArea = document.createElement('ul');

    managerArea.innerHTML =  `<input type="text" id="referenceInput-Text" value=""> <button onclick="storeReference(document.getElementById('referenceInput-Text').value)">Cite</button>`
    referenceArea.id='referenceDisplay';
    managerArea.id = 'referenceInput';
    document.getElementById("pageText")!.append(managerArea);
    document.getElementById("pageText")!.append(referenceArea);
    updateManager(true)
}

function updateManager(refresh: boolean, ref: any = JSON.parse(<string>localStorage.getItem("book-references"))){
    if (refresh) {
        try {
            for (let key in ref) {
                if (ref.hasOwnProperty(key)){
                    let item: HTMLLIElement = document!.createElement("li");
                    // @ts-ignore
                    item.onclick = deleteReference;
                    item.innerText = "ID# " + ref[key].id + "\n"+ "Citation:  " + ref[key].citation;
                    document.getElementById('referenceDisplay')!.appendChild(item);
                }
            }
        }
        catch (e) {
            return;
        }
    }
    else {
        let item = document.createElement("li");
        // @ts-ignore
        item.onclick = deleteReference;
        item.innerText = "ID# " + ref.id + "\n"+ "Citation:  " + ref.citation;
        document.getElementById('referenceDisplay')!.appendChild(item);
    }
}

async function storeReference(data: any){
    const Cite = CitRequire('citation-js');
    const Data = new Cite(data);
    const reference = Data.format('data');
    const citation = Data.format('citation');
    const parseReference = JSON.parse(reference);
    const coverPage = await LibreTexts.getCoverpage();
    let Log: any = {};

    let referenceGlobal = {
        "id": parseReference[0].id,
        "citation": citation,
        "data": data
    }
    let referenceLocal = {
        "id": parseReference[0].id,
        "citation": citation
    }

    if (localStorage.getItem("book-references") !== null) {
        let Logged: any = JSON.parse(<string>localStorage.getItem("book-references"));
        Logged[parseReference[0].id] = referenceLocal;
        localStorage.setItem("book-references", JSON.stringify(Logged));
    } else {
        Log[parseReference[0].id] = referenceLocal;
        localStorage.setItem("book-references", JSON.stringify(Log));
    }

    let userRefJSON: any;
    try {
        userRefJSON = await LibreTexts.authenticatedFetch(coverPage,`files/=references.json`,null);
        userRefJSON = await userRefJSON.json();
    } catch(e) {
        userRefJSON = {};
    }
    userRefJSON[parseReference[0].id] = referenceGlobal;
    await LibreTexts.authenticatedFetch(coverPage,`files/=references.json`,null, {
        method:"PUT",
        body:(JSON.stringify(userRefJSON))
    });

    updateManager(false, referenceLocal);
}

function deleteReference(this: HTMLElement) {
    const reg = new RegExp(".*ID#\\s*([^\\n\\r]*)");
    const ID = this.innerText.match(reg)![1]
    const references = JSON.parse(<string>localStorage.getItem("book-references"));
    delete references[ID];

    localStorage.setItem("book-references", JSON.stringify(references))
    this.remove()
}

async function processReference(){
    const coverPage = await LibreTexts.getCoverpage();
    const reg = /(?:\\#)([\s\S]*?)(?:#\\)/gm;
    let referenceJSON;

    try {
        referenceJSON = await LibreTexts.authenticatedFetch(coverPage,`files/=references.json`,null);
        referenceJSON = await referenceJSON.json();
    } catch(e) {
        return;
    }
    const pageContent = document.getElementById("pageText")!.innerHTML;

    function replaceReferenceID (inputString: string) {
        return "<b>" + inputString + " processed" + "</b>";
    }

    let thh: string = pageContent.replace(reg, (match, offset, string) => {
        const trimmedMatch = match.substring(2, match.length - 2).trim();
        return replaceReferenceID(trimmedMatch);
    });
    document.getElementById("pageText")!.innerHTML = thh;
}
