import React from 'react';
import {IconLink} from "./Common.jsx";
import {List} from "@material-ui/core";

export default function Tools(props) {
    return (<List>
            <IconLink title="ADAPT Homework System" icon="mt-icon-pencil2" href="https://adapt.libretexts.org/"/>
            
            <IconLink title="LibreStudio Server" icon="mt-icon-article" href="https://studio.libretexts.org/"/>
            <IconLink title="Jupyter Hub" icon="mt-icon-archive" href="https://jupyter.libretexts.org/hub/login"/>
            <IconLink title="OER Remixer" icon="mt-icon-tree"
                      href="/Under_Construction/Development_Details/OER_Remixer"/>
            <IconLink title="Page Citation" icon="mt-icon-quote" onClick={() => {
                buildcite();
                props.toggleDrawer(false)();
            }}/>
            <IconLink title="Page Attribution" icon="mt-icon-quote" onClick={() => {
                attribution();
                props.toggleDrawer(false)();
            }}/>
            {/*            <IconLink title="Bookmark Page" icon="mt-icon-bookmark" onClick={() => {
                // event.preventDefault();
                saveBookmark();
            }}>
                <div id="bm-list">
                </div>
            </IconLink>*/}
            <AutoAttribution/>
        </List>
        /*            <div id="glossarizerOptions" className="custom_field"><p className="mt-icon-bubble2">&nbsp;Glossary</p>
                        <form oninput="libretextGlossary.makeGlossary(glossarizerOptions.value)">
                            <p><input id="glossarizerOptionstextbook" name="glossarizerOptions" type="radio"
                                      defaultValue="textbook"/><label className="glossaryLabel"
                                                                      htmlFor="textbook">Textbook</label></p>
                            {/!* <p><input id="glossarizerOptionsachem" name="glossarizerOptions" type="radio" value="achem"/><label class="glossaryLabel" for="achem">Analytical Library</label></p>
                        <p><input id="glossarizerOptionsichem" name="glossarizerOptions" type="radio" value="ichem"/><label class="glossaryLabel" for="ichem">Inorganic Library</label></p>
                        <p><input id="glossarizerOptionsochem" name="glossarizerOptions" type="radio" value="ochem"/><label class="glossaryLabel" for="ochem">Organic Library</label></p> *!/}
                            <p><input id="glossarizerOptionsnone" name="glossarizerOptions" type="radio"
                                      defaultValue="none"/><label className="glossaryLabel" htmlFor="none">None</label></p>
                        </form>
                    </div>
                    <div className="custom_field">
                        <a onclick="event.preventDefault(); $('hypothesis-sidebar').toggle()">&nbsp;Hypothesis</a>
                    </div>
                    <div className="custom_field">
                        <a onclick="event.preventDefault()">&nbsp;Note Bene</a>
                    </div>
                </div>*/
    );
}

function AutoAttribution(props) {
    const [active, setActive] = React.useState(false);
    return (<>
        <IconLink title="Toggle AutoAttribution" icon={active ? "mt-icon-eye" : "mt-icon-eye-blocked"}
                  id="librelens-button" onClick={() => {
            LibreTexts.active.libreLens();
            setActive(!active);
        }}>
            <div id="librelens-list">
            </div>
        </IconLink>
    </>)
}



function saveBookmark() {
    const TITLE = document.getElementById("titleHolder").innerText;
    const URL = window.location.href;
    const CHECK = sessionStorage.getItem("Bookmark");
    if (CHECK == null) {
        sessionStorage.setItem("Title", TITLE);
        sessionStorage.setItem("Bookmark", URL);
        createBookmarks();
    }
}

function createBookmarks() {
    var _a;
    const LI = document.createElement("li");
    const URL = sessionStorage.getItem("Bookmark");
    const TITLE = sessionStorage.getItem("Title");
    LI.id = "sbBookmark";
    LI.innerHTML = `<div > <p><a style="display: unset;" href="${URL}"> ${TITLE}</a><a id="removeBookmark" style="display: unset;" onclick="removeBookmarks()">| Remove</a> </p></div>`;
    if (URL) {
        (_a = document.querySelector("#bm-list")) === null || _a === void 0 ? void 0 : _a.appendChild(LI);
    }
}

function removeBookmarks() {
    var _a;
    (_a = document.querySelector("#bm-list")) === null || _a === void 0 ? void 0 : _a.removeChild(document.querySelector("#sbBookmark"));
    sessionStorage.removeItem("Title");
    sessionStorage.removeItem("Bookmark");
}
