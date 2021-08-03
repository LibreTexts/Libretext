window.addEventListener("load", () => {
    buildManager();
});

function buildManager(){
    let managerArea = document.createElement('div');
    let managerData =  `<input type="text" id="referenceInput-Text" value=""> <button onclick="inputReference(document.getElementById('referenceInput-Text').value)">Cite</button>`
    let referenceArea = document.createElement('div');

    referenceArea.id='referenceDisplay-Div';
    managerArea.id = 'referenceInput-Div';
    managerArea.innerHTML = managerData;

    document.getElementById("pageText").append(managerArea);
    document.getElementById("pageText").append(referenceArea);

};

function inputReference(data) {
    console.log('here');
    const Cite = CitRequire('citation-js');
    const referenceObject = new Cite(data);
    const formattedReference = referenceObject.format('bibliography', {
        format: 'html',
        template: 'apa',
        lang: 'en-US'
    })
    const ul = document.createElement("ul");
    ul.innerHTML = formattedReference;
    document.getElementById('referenceDisplay-Div').appendChild(ul);
}
