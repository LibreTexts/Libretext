function oerbuilder() {
    const OER = document.createElement("div");
    OER.id = "OERDIV";
    document.body.append(OER);

    $(OER).html(
        `
        <div onclick="hideoer()" id="OERMODAL">
            <div id="OERCONTENT">
                <input placeholder="Title" id="oertitle">
                <input placeholder="Title URL" id="oertitleurl">
                <input placeholder="Author" id="oerauthor">
                <input placeholder="Author URL" id="oerauthorurl">
                <button onclick="oer()" id="oersubmit">create attribution</button>
                <div id="OEROUTPUT"></div>
            </div>
        </div>
 `
    )

    $("#oersubmit").on("click", ()=> {
        console.log("works");
    });

}


function hideoer() {
    if (!$(event!.target!).closest('#OERCONTENT').length && !$(event!.target!).is('#OERCONTENT')) {
        $("#OERDIV").remove();
    }
}
