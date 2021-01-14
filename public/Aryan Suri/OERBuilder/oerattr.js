"use strict";
function oerbuilder() {
    const OER = document.createElement("div");
    let OUTPUT = ``;
    OER.id = "OERDIV";
    document.body.append(OER);
    $(OER).html(`
        <div onclick="hideoer()" id="OERMODAL">
            <div id="OERCONTENT">
                <h3> Attribution Builder</h3>
                <input placeholder="Title" id="oertitle">
                <input placeholder="Title URL" id="oertitleurl">
                <input placeholder="Author" id="oerauthor">
                <input placeholder="Author URL" id="oerauthorurl">
                <input placeholder="Organization" id="oerorg">
                <input placeholder="Organization URL" id="oerorgurl">
                <select id="oerlicense" data-old-value="not-set">
                                <option value="not-set">(not set)</option>
                                <option value="Public Domain">Public Domain</option>
                                <option value="CC BY">CC BY</option>
                                <option value="CC BY-SA">CC BY-SA</option>
                                <option value="CC BY-NC-SA">CC BY-NC-SA</option>
                                <option value="CC BY-ND">CC BY-ND</option>
                                <option value="CC BY-NC-ND">CC BY-NC-ND</option>
                                <option value="GNU GPL">GNU GPL</option>
                                <option value="All Rights Reserved">All Rights Reserved</option>
                                <option value="CC BY-NC">CC BY-NC</option>
                                <option value="GNU FDL">GNU FDL</option>
                </select>
                <div id="OEROUTPUT"><a id="OERTITLE"></a><a id="OERAUTHOR"></a><a id="OERORG"></a><a id="OERLICENSE"></a></div>
            </div>
        </div>
 `);
    $("#oertitle").on("change", () => {
        let TITLE = document.querySelector("#oertitle").value;
        document.getElementById("OERTITLE").innerText = `"${TITLE}" `;
    });
    $("#oertitleurl").on("change", () => {
        let TITLEURL = document.querySelector("#oertitleurl").value;
        if (!TITLEURL.match(/^[a-zA-Z]+:\/\//)) {
            TITLEURL = 'http://' + TITLEURL;
        }
        let a = document.getElementById("OERTITLE");
        a.href = `${TITLEURL}`;
    });
    $("#oerauthor").on("change", () => {
        let AUTHOR = document.querySelector("#oerauthor").value;
        document.getElementById("OERAUTHOR").innerText = `by ${AUTHOR} `;
    });
    $("#oerauthorurl").on("change", () => {
        let AUTHORURL = document.querySelector("#oerauthorurl").value;
        let aa = document.getElementById("OERAUTHOR");
        aa.href = `${AUTHORURL}`;
    });
    $("#oerorg").on("change", () => {
        let ORG = document.querySelector("#oerorg").value;
        document.getElementById("OERORG").innerText = `, ${ORG} `;
    });
    $("#oerorgurl").on("change", () => {
        let ORGURL = document.querySelector("#oerorgurl").value;
        let aaa = document.getElementById("OERORG");
        aaa.href = `${ORGURL}`;
    });
    $("#oerlicense").on("change", () => {
        let LICENSE = document.querySelector("#oerlicense").value;
        document.getElementById("OERLICENSE").innerText = `is licensed under ${LICENSE}. `;
    });
}
function hideoer() {
    if (!$(event.target).closest('#OERCONTENT').length && !$(event.target).is('#OERCONTENT')) {
        $("#OERDIV").remove();
    }
}
