window.addEventListener("load", () => {
    buildManager()
});

function buildManager(){
    const managerArea: HTMLDivElement = document.createElement('div');
    const pageID = $("#pageIDHolder").text();
    const managerData =  `<input type="text" id="referenceInput-Text" value=""> <button onclick="storeReference(document.getElementById('referenceInput-Text').value, ${pageID})">Cite</button>`
    const referenceArea = document.createElement('ul');

    referenceArea.id='referenceDisplay';
    managerArea.id = 'referenceInput';
    managerArea.innerHTML = managerData;
    document.getElementById("pageText")!.append(managerArea);
    document.getElementById("pageText")!.append(referenceArea);
    updateManager()
}

async function storeReference(data: any, ID:string){
    const Cite = CitRequire('citation-js');
    const Data = new Cite(data);
    const reference = Data.format('data');
    const citation = Data.format('citation');
    const parseReference = JSON.parse(reference);

    let Log = [];
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
        let Logged: any = localStorage.getItem("book-references");
        Logged = JSON.parse(Logged);
        Logged.push(referenceLocal);
        localStorage.setItem("book-references", JSON.stringify(Logged));
    } else {
        Log.push(referenceLocal);
        localStorage.setItem("book-references", JSON.stringify(Log));
    }
    let userRefJSON: any;
    try {
        userRefJSON = await LibreTexts.authenticatedFetch(null,`files/=${ID}references.json`,null);
        userRefJSON = await userRefJSON.json();
    } catch(e) {
        console.log(e);
        userRefJSON = [];
    }
    userRefJSON.push(referenceGlobal);
    await LibreTexts.authenticatedFetch(null,`files/=${ID}references.json`,null, {
        method:"PUT",
        body:(JSON.stringify(userRefJSON))
    });
    updateManager();
}

function updateManager(){
    let render: string | null = localStorage.getItem("book-references");
    if (render != null) {
        render = JSON.parse(render);
        //@ts-ignore
        render.forEach((element)=> {
            let item = document.createElement("li");
            item.innerText = "ID# " + element.id + "                  Citation:  " + element.citation;
            document.getElementById('referenceDisplay')!.appendChild(item);
        });
    } else {return null;}
}
