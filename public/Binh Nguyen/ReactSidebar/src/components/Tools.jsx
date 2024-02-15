import React from 'react';
import {IconLink} from "./Common.jsx";
import {Button, FormControl, FormControlLabel, FormLabel, List, Radio, RadioGroup} from "@material-ui/core";

export default function Tools(props) {
    const [glossarySource, setGlossarySource] = React.useState(localStorage.getItem("glossarizerType"));
    //const [notification, setNotifications] = React.useState($('form.options')?.serializeArray()?.[0].value || "0");
    const [annotation, setAnnotation] = React.useState(localStorage.getItem("annotationType"));
    
    return (<List>
            <IconLink title="OER Remixer" icon="mt-icon-tree" onClick={openRemixer}/>
            <IconLink title="Page Citation" icon="mt-icon-quote" onClick={() => {
                buildcite();
                props.toggleDrawer(false)();
            }}/>
            <IconLink title="Page Attribution" icon="mt-icon-quote" onClick={() => {
                attribution();
                props.toggleDrawer(false)();
            }}/>
            <IconLink title="Get Page Source" icon="mt-icon-embed2"
                      href={`/Under_Construction/Sandboxes/Henry/Get_Contents?${document.getElementById('IDHolder')?.innerText}`}/>
            <AutoAttribution/>
            <IconLink title="Bookmark Page" icon="mt-icon-bookmark" onClick={() => {
                saveBookmark();
            }}>
		<div id="bm-list">
		</div>
	    </IconLink>
	    <br/>
            <FormControl component="fieldset" style={{padding: 20}}>
                <FormLabel component="legend">Glossary Source</FormLabel>
                <RadioGroup value={glossarySource} onChange={(event) => {
                    libretextGlossary.makeGlossary(event.target.value);
                    setGlossarySource(event.target.value)
                }}>
                    <FormControlLabel value="textbook" control={<Radio/>} label="Textbook"/>
                    <FormControlLabel value="none" control={<Radio/>} label="None"/>
                </RadioGroup>
            </FormControl>
	    <br/>
	{/*   <FormControl component="fieldset" style={{padding: 20}}>
		<FormLabel component="legend">Page Notifications</FormLabel>
		    <RadioGroup value={notification} onChange={(event) => {
			makeNotification(event.target.value);
			setNotifications(event.target.value)
		    }}>
			<FormControlLabel value="1" control={<Radio/>} label="This page only"/>
			<FormControlLabel value="2" control={<Radio/>} label="This page and all subpages"/>
			<FormControlLabel value="0" control={<Radio/>} label="Notifications OFF"/>
		    </RadioGroup>
	    </FormControl>
	    <br/>

		 
    	    <FormControl component="fieldset" style={{padding: 20}}>
		<FormLabel component="legend">Page Annotation</FormLabel>
		    <RadioGroup value={annotation} onChange={(event) => {
		    //localStorage.setItem("annotationType", "none");
		    //document.getElementByID("annotationOptions" + "-" + localStorage.getItem("annotationType")).checked = true;

			makeAnnotation(event.target.value);
			setAnnotation(event.target.value)
		    }}>
			<FormControlLabel value="hypothesis" control={<Radio/>} label="Hypothesis"/>
			<FormControlLabel value="note bene" control={<Radio/>} label="Note Bene"/>
			<FormControlLabel value="none" control={<Radio/>} label="None"/>
		    </RadioGroup>
	    </FormControl>
*/}

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

async function openRemixer() {
    localStorage.setItem('RemixerLastText', JSON.stringify({
        title: document.getElementById('titleHolder').innerText,
        url: window.location.href
    }));
    const coverpage = await LibreTexts.getCoverpage();
    if (coverpage) {
        const searchParams = new URLSearchParams({
            remixURL: `${window.location.protocol}//${window.location.host}/${coverpage}`,
            autoLoad: true,
        });
        window.location.assign(`/Under_Construction/Development_Details/OER_Remixer?${searchParams.toString()}`);
        return;
    }
    window.location.assign("/Under_Construction/Development_Details/OER_Remixer");
}


async function viewLicensingReport() {
    let coverpage = await LibreTexts.getCoverpage(window.location.href);
    let foundCLR = false;
    if (typeof(coverpage) !== undefined) {
        let subpages = await LibreTexts.getSubpages(`${window.location.protocol}//${window.location.hostname}/${coverpage}`);
        if (subpages.children && Array.isArray(subpages.children)) {
            let frontMatter = subpages.children.find(item => typeof(item.title) === 'string' && item.title.includes('Front Matter'));
            if (frontMatter !== undefined && frontMatter.children && Array.isArray(frontMatter.children)) {
                let clr = frontMatter.children.find(item => typeof(item.title) === 'string' && item.title.includes('Licensing'));
                if (clr !== undefined && clr.url !== undefined) {
                    foundCLR = true;
                    window.open(clr.url, '_blank', 'noopener noreferrer');
                }
            }
        }
    }
    if (!foundCLR) alert("Sorry, a Licensing Report isn't available for this content.");
}

async function downloadLicensingReport() {
    let coverpage = await LibreTexts.getCoverpage(window.location.href);
    let foundCLR = false;
    if (typeof(coverpage) !== undefined) {
        let [subdomain, path] = LibreTexts.parseURL(`${window.location.protocol}//${window.location.hostname}/${coverpage}`);
        let filesList = await LibreTexts.authenticatedFetch(path, 'files?dream.out.format=json', subdomain, {
            method: 'GET'
        });
        if (filesList.ok) {
            let filesJSON = await filesList.json();
            if (filesJSON.file && Array.isArray(filesJSON.file)) {
                let clr = filesJSON.file.find(item => typeof(item.filename) === 'string' && item.filename === 'content-licensing-report.pdf');
                if (clr !== undefined && clr.contents && clr.contents['@href']) {
                    foundCLR = true;
                    window.open(clr.contents['@href'], '_blank', 'noopener noreferrer');
                }
            }
        }
    }
    if (!foundCLR) alert("Sorry, a Licensing Report isn't available for this content."); 
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

function makeNotification(statusValue) {
    const subdomain = window.location.origin.split('/')[2].split('.')[0];
    let pageType = "all";
    if (args == "0") {
	pageType = "page";
    }
    let pageID = document.getElementById('IDHolder').innerText;
    fetch(`https://${subdomain}.libretexts.org/@app/subscription/status.json?pageId=${pageID}&status=${statusValue}&type=${pageType}`, {method: "POST"});
}

function makeAnnotation(inputSourceOption) {
    let sourceOption = inputSourceOption || localStorage.getItem("annotationType");
    switch ((sourceOption || "").trim().toLowerCase()) {
	case "none":
	    $("hypothesis-sidebar").hide()
	    return;
	case "notebene":
	    localStorage.setItem("annotationType", "notebene");
	    $("hypothesis-sidebar").hide()
	default:
	    localStorage.setItem("annotationType", "hypothesis");
	    $("hypothesis-sidebar").show()
    }
}
