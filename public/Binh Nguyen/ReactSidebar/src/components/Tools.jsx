import React from 'react';
import {IconLink} from "./Common.jsx";
import {FormControl, FormControlLabel, FormLabel, List, Radio, RadioGroup} from "@material-ui/core";

export default function Tools(props) {
    const [glossarySource, setGlossarySource] = React.useState(localStorage.getItem("glossarizerType"));
    const [notification, setNotifications] = React.useState($('form.options')?.serializeArray()?.[0].value || "0");
    
    return (<List>
            <IconLink title="ADAPT Homework System" icon="mt-icon-pencil2" href="https://adapt.libretexts.org/"/>
            <IconLink title="Jupyter Hub" icon="mt-icon-archive" href="https://jupyter.libretexts.org/hub/login"/>
            <IconLink title="OER Remixer" icon="mt-icon-tree"
                      href="/Under_Construction/Development_Details/OER_Remixer"/>
            <IconLink title="LibreCommons" icon="mt-icon-support-hands" href="https://commons.libretexts.org"/>
            <IconLink title="Page Citation" icon="mt-icon-quote" onClick={() => {
                buildcite();
                props.toggleDrawer(false)();
            }}/>
            <IconLink title="Page Attribution" icon="mt-icon-quote" onClick={() => {
                attribution();
                props.toggleDrawer(false)();
            }}/>
            <AutoAttribution/>
            <IconLink title="Bookmark Page" icon="mt-icon-bookmark" onClick={() => {
                event.preventDefault();
                saveBookmark();
            }}>
                <div id="bm-list">
                </div>
            </IconLink>
            <FormControl component="fieldset" style={{padding: 20}}>
                <FormLabel component="legend">Glossary Source</FormLabel>
                <RadioGroup value={glossarySource} onChange={(event) => {
                    libretextGlossary.makeGlossary(event.target.value);
                    setGlossarySource(event.target.value);
                }}>
                    <FormControlLabel value="textbook" control={<Radio/>} label="Textbook"/>
                    <FormControlLabel value="none" control={<Radio/>} label="None"/>
                </RadioGroup>
            </FormControl>
            <br/>
            <FormControl component="fieldset" style={{padding: 20}}>
                <FormLabel component="legend">Page Notifications</FormLabel>
                <RadioGroup value={notification} onChange={async (event) => {
                    await makeNotification(event.target.value);
                    setNotifications(event.target.value);
                    location.reload();
                }}>
                    <FormControlLabel value="1" control={<Radio/>} label="This page only"/>
                    <FormControlLabel value="2" control={<Radio/>} label="This page and all subpages"/>
                    <FormControlLabel value="0" control={<Radio/>} label="Notifications OFF"/>
                </RadioGroup>
            </FormControl>
        </List>
    );
    /*
                <div className="custom_field">
                    <a onclick="event.preventDefault(); $('hypothesis-sidebar').toggle()">&nbsp;Hypothesis</a>
                </div>
                <div className="custom_field">
                    <a onclick="event.preventDefault()">&nbsp;Note Bene</a>
                </div>
            </div>*/
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

async function makeNotification(args) {
    const subdomain = window.location.origin.split('/')[2].split('.')[0];
    let pageType = "all";
    if (args === "0") {
        pageType = "page";
    }
    let pageID = document.getElementById('IDHolder').innerText;
    await fetch(`https://${subdomain}.libretexts.org/@app/subscription/status.json?pageId=${pageID}&status=${args}&type=${pageType}`, {method: "POST"});
}
