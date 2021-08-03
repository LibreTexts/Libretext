window.addEventListener("load", function () {
    buildManager();
});
function buildManager() {
    var managerArea = document.createElement('div');
    var managerData = "<input type=\"text\" id=\"referenceInput-Text\" value=\"\"> <button onclick=\"inputReference(document.getElementById('referenceInput-Text').value)\">Cite</button>";
    var referenceArea = document.createElement('div');
    referenceArea.id = 'referenceDisplay-Div';
    managerArea.id = 'referenceInput-Div';
    managerArea.innerHTML = managerData;
    document.getElementById("pageText").append(managerArea);
    document.getElementById("pageText").append(referenceArea);
}
;
function inputReference(data) {
    console.log('here');
    var Cite = CitRequire('citation-js');
    var referenceObject = new Cite(data);
    var formattedReference = referenceObject.format('bibliography', {
        format: 'html',
        template: 'apa',
        lang: 'en-US'
    });
    var ul = document.createElement("ul");
    ul.innerHTML = formattedReference;
    document.getElementById('referenceDisplay-Div').appendChild(ul);
}
