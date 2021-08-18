// @author: Aryan Suri
window.addEventListener("load", async () => {
    buildManager();
    await processReference();
});

function buildManager(){
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
             <p> dev note: plus sign will be to add to book-json, red cross to remove citation.</p>
            <ul id="referenceDisplay"></ul>
            </div>
        </div>
    `

    document.body.append(referenceModal);
    document.getElementsByClassName("elm-social-share")[0].appendChild(referenceModalButton);

    const modal = document.getElementById("referenceModal")!;
    const btn = document.getElementById("referenceModalBtn")!;
    //const span = document.getElementById("referenceModalClose")!;
    btn.onclick = function() {
        modal.style.display = "block";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    updateManager(true, false)
}

async function updateManager(refresh: boolean, ref: any){
    if (refresh) {
        let userRefJSON = await LibreTexts.authenticatedFetch(null,`files/=references.json`,null);
        userRefJSON = await userRefJSON.json();
        try {
            for (let key in userRefJSON) {
                let newReference = document.createElement("div");
                newReference.className = "newReference"
                newReference.innerHTML = `<li onclick=copyReference(this.innerText)>${userRefJSON[key].citation} ${userRefJSON[key].id}</li><a> &#x2795; </a><a> &#x274C; </a>`
                document.getElementById('referenceDisplay')!.appendChild(newReference);
            }
        }
        catch (e) {
            return;
        }
    }
    else {
        let newReference = document.createElement("div");
        newReference.className = "newReference"
        newReference.innerHTML = `<li onclick=copyReference()>${ref.citation} ${ref.id}</li><a> &#x274C; </a>`
        document.getElementById('referenceDisplay')!.appendChild(newReference);
    }

    function copyReference(str){

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

    let userRefJSON: any;
    try {
        userRefJSON = await LibreTexts.authenticatedFetch(null,`files/=references.json`,null);
        userRefJSON = await userRefJSON.json();
    } catch(e) {
        userRefJSON = {};
    }
    userRefJSON[parseReference[0].id] = referenceGlobal;
    await LibreTexts.authenticatedFetch(null,`files/=references.json`,null, {
        method:"PUT",
        body:(JSON.stringify(userRefJSON))
    });

    await updateManager(false, referenceLocal);
}

// function deleteReference(this: HTMLElement) {
//     const reg = new RegExp(".*ID#\\s*([^\\n\\r]*)");
//     const ID = this.innerText.match(reg)![1]
//     const references = JSON.parse(<string>localStorage.getItem("book-references"));
//     delete references[ID];
//
//     localStorage.setItem("book-references", JSON.stringify(references))
//     this.remove()
// }

async function processReference(){
    const coverPage = await LibreTexts.getCoverpage();
    const reg = new RegExp(/(?:\\#)([\s\S]*?)(?:#\\)/gm);
    let referenceJSON: any;
    try {
        referenceJSON = await LibreTexts.authenticatedFetch(null,`files/=references.json`,null);
        referenceJSON = await referenceJSON.json();
    } catch(e) {
        console.log(e)
    }
    const pageContent = document.getElementById("pageText")!.innerHTML;
    function replaceReferenceID (ref: any, inputString: string) {
        const key = inputString.replace(new RegExp(/&nbsp;/gm), " ").replace(new RegExp(/<[\s\S]*?>/gm),"").trim()
        if (key in ref) {
            return ref[key].citation;
        }
        return "Citation not Found";
    }
    let procReference: string = pageContent.replace(reg, (match, offset, string) => {
        const trimmedMatch = match.substring(2, match.length - 2).trim();
        return replaceReferenceID(referenceJSON, trimmedMatch);
    });

    document.getElementById("pageText")!.innerHTML = procReference;
}

async function processBibliography() {
    const Cite = CitRequire('citation-js');
    // data is going to be from the references.json file
    let referenceJSON;
    try {
        referenceJSON = await LibreTexts.authenticatedFetch(null,`files/=references.json`,null);
        referenceJSON = await referenceJSON.json();
    } catch(e) {
        console.log(e)
    }
    console.log(referenceJSON)
    // do a for key in ref (iterate thru json)
    // for each key, take ref[key].data
    // use that for data
    const Data = new Cite(data);
    const reference = Data.format('data');
    const managerArea: HTMLDivElement = document.createElement('div');
    const referenceArea = document.createElement('ul');
}
