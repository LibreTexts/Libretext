// @author: Aryan Suri
window.addEventListener("load", async () => {
    buildManager();
    await processReference();
});

function buildManager(){
    const referenceModalButton = document.createElement("button");
    const referenceModal = document.createElement("div");
    referenceModalButton.innerHTML = `Citation Manager`;
    referenceModalButton.id = "referenceModalBtn";
    referenceModal.innerHTML = `
        <div id="referenceModal">
            <div id="referenceModalContent">
            <h3> Citation Manager</h3>
            <div id="referenceInput">
                <input type="text" id="referenceInput-Text" value=""> 
                <button onclick="storeReference(document.getElementById('referenceInput-Text').value)">Cite</button>
            </div>
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
    // span.onclick = function() {
    //     modal.style.display = "none";
    // }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    updateManager(true)
}

function updateManager(refresh: boolean, ref: any = JSON.parse(<string>localStorage.getItem("book-references"))){
    if (refresh) {
        try {
            for (let key in ref) {
                let item: HTMLLIElement = document!.createElement("li");
                item.innerText = `Citation: ${ref[key].citation}         ${ref[key].id}`
                let i = ref[key].id
                // @ts-ignore
                item.onclick =()=>{  const el = document.createElement('textarea');
                    el.value = `\\#${ref[key].id}#\\`;
                    el.setAttribute('readonly', '');
                    el.style.position = 'absolute';
                    el.style.left = '-9999px';
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    alert("Citation ID copied")};
                document.getElementById('referenceDisplay')!.appendChild(item);
            }
        }
        catch (e) {
            return;
        }
    }
    else {
        let item: HTMLLIElement = document!.createElement("li");
        item.innerText = `Citation: ${ref.citation}         /#${ref.id}#/`
        item.onclick =()=>{const el = document.createElement('textarea');
            el.value = `/#${ref.id}#/`;
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alert("Citation ID copied")};
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

    updateManager(false, referenceLocal);
}
function copyReference(str: string){
    console.log("fnc called")
    console.log(str);
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return;
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