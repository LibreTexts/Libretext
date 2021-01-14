function oerbuilder() {
    const OER = document.createElement("div");
    let OUTPUT = ``;
    OER.id = "OERDIV";
    document.body.append(OER);

    $(OER).html(
        `
        <div onclick="hideoer()" id="OERMODAL">
            <div id="OERCONTENT">
                <h3> Attribution Builder</h3>
                <input placeholder="Title" id="oertitle">
                <input placeholder="Title URL" id="oertitleurl">
                <input placeholder="Author" id="oerauthor">
                <input placeholder="Author URL" id="oerauthorurl">
                <select id="oerlicense"><option value="CC-BY">CC-BY</option> <option value="CC-BY-NA">CC-BY-NA</option></select>

                <div id="OEROUTPUT"><a id="OERTITLE"></a><a id="OERAUTHOR"></a><a id="OERORG"></a><a id="OERLICENSE"></a></div>
            </div>
        </div>
 `
    )
    $("#oertitle").on("change", ()=>{
        let TITLE  = document.querySelector("#oertitle").value;
        document.getElementById("OERTITLE")!.innerText = `"${TITLE}"`;
    });

    $("#oertitleurl").on("change", ()=>{
        let TITLEURL  = document.querySelector("#oertitleurl").value;
        let a = document.getElementById("OERTITLE")!;
        a.href = `${TITLEURL}`;
    });

    $("#oerauthor").on("change", ()=>{
        let AUTHOR  = document.querySelector("#oerauthor").value;
        document.getElementById("OERAUTHOR")!.innerText = `by ${AUTHOR}, `;
    });

    $("#oerauthorurl").on("change", ()=>{
        let AUTHORURL  = document.querySelector("#oerauthorurl").value;
        let aa = document.getElementById("OERAUTHOR")!;
        aa.href = `${AUTHORURL}`;
    });

    $("#oerlicense").on("change", ()=>{
        let LICENSE  = document.querySelector("#oerlicense").value;
        document.getElementById("OERLICENSE")!.innerText = `is licensed under ${LICENSE} `;
    });




function hideoer() {
    if (!$(event!.target!).closest('#OERCONTENT').length && !$(event!.target!).is('#OERCONTENT')) {
        $("#OERDIV").remove();
    }
}
