import React, {useState} from 'react';

export default function Readability(props) {
    return (<div id="sb3" className="custom_sidebar">
            <div className="custom_field">
                <a onClick="rtdefault()" className="btn btn-large">Default Settings</a>
            </div>
            <p className="h_ar">Font Size:</p>
            <div className="custom_field">
                <input className="slider_ar" type="range" min=".4" max="1.8" defaultValue step=".1" id="size"/>
            </div>
            <p className="h_ar">Page Width:</p>
            <div className="custom_field">
                <input className="slider_ar" type="range" min={0} max={450} defaultValue={0} step={10}
                       id="slider-page-width"/>
            </div>
            <p className="h_ar">Text Align:</p>
            <div className="custom_field">
                <a id="toggler-text" href="#0" className="toggler off">Left</a>
            </div>
            <p className="h_ar">Sidebar Layout:</p>
            <div style={{marginLeft: '10px'}} id="sbLayout" className="custom_field">
                <button id="tabsTrue" onClick="savePanel(true)">Side View</button>
                <button id="tabsFalse" onClick="savePanel(false)">Compressed View</button>
                {/*<button id="tabsSplit" onclick="splitPanel()">Toggle Split View </button>*/}
            </div>
            <div className="custom_field">
                <h3>
                    <img src="https://awesomefiles.libretexts.org/Students/Henry Agnew/BeeLine/beeline-logo.png"/>
                    BeeLine Reader </h3>
                <p> BeeLine Reader uses subtle color gradients to help you read more quickly and efficiently. Choose a
                    color scheme below, or click here to <a style={{color: '#30b3f6', display: 'unset', margin: 0}}
                                                            href="http://www.beelinereader.com/education/?utm_source=libretexts"> learn
                                                                                                                                  more. </a>
                </p>
            </div>
            <div className="BLtoggle" id="doBeeLine">
                <a id="SB_Inverted" className="btn btn-large active" data-color="night_blues">Inverted</a>
                <a id="SB_Bright" className="btn btn-large active" data-color="bright">Bright</a>
                <a id="SB_Blues" className="btn btn-large active" data-color="blues">Blues</a>
                <a id="SB_Grays" className="btn btn-large active" data-color="gray">Grays</a>
                <a id="dark-light" className="btn btn-large"
                   onClick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark
                                                                                                                                                             Mode</a>
                <a id="SB_Off" className="btn btn-large active" data-color="off">Off</a>
            </div>
        </div>
    
    
    )
}

function activateBeeLine() {
    const beelineELements = document.querySelectorAll(".mt-content-container p:not(.boxtitle)");
    let doBeeline = function (theme, action) {
        for (let i = 0; i < beelineELements.length; i++) {
            let beeline = beelineELements[i].beeline;
            if (beeline) {
                beeline.setOptions({theme: theme});
            }
            else {
                beeline = new BeeLineReader(beelineELements[i], {
                    theme: theme,
                    skipBackgroundColor: true,
                    handleResize: true,
                    skipTags: ['svg', 'h1', 'h3', 'h3', 'h4', 'h3', 'style', 'script', 'blockquote']
                });
                beelineELements[i].beeline = beeline;
            }
            localStorage.setItem("beeline", theme);
            if (theme === "off") {
                beeline.uncolor();
                if (typeof ga === 'function') {
                    ga('send', 'event', 'Beeline', 'disabled');
                }
            }
            else {
                beeline.color();
                if (typeof ga === 'function') {
                    ga('send', 'event', 'Beeline', action, theme);
                }
            }
            const contentContainer = $('.elm-skin-container');
            if (theme === 'night_blues' || localStorage.getItem('darkMode') === 'true') {
                contentContainer.addClass('darkMode');
            }
            else {
                contentContainer.removeClass('darkMode');
            }
        }
    };
    setBeelineToggles();
    
    function setBeelineToggles() {
        const toggles = $('.BLtoggle');
        if (toggles[0]) {
            const btns = toggles.find('button, a');
            
            if (localStorage.getItem("beeline")) {
                doBeeline(localStorage.getItem("beeline"), localStorage.getItem("beeline"));
                if (typeof ga === 'function') {
                    ga('send', 'event', 'BeelineInitialized', localStorage.getItem("beeline"));
                }
            }
            
            
            btns.on("click", function (e) {
                if (!e.target.href)
                    e.preventDefault();
                const theme = $(this).attr("data-color");
                if (!theme)
                    return;
                localStorage.setItem('beeline', theme);
                if (theme === 'night_blues') {
                    localStorage.setItem('darkMode', 'true');
                }
                else {
                    localStorage.setItem('darkMode', 'false');
                }
                btns.removeClass('active');
                btns.filter('a[data-color="' + theme + '"]').addClass('active');
                btns.filter('button[data-color="' + theme + '"]').addClass('active');
                doBeeline(theme, theme);
            });
        }
    }
}

function savePanel(_input) {
    sessionStorage.setItem("sidepanel", _input);
    location.reload();
}

function splitPanel() {
    $("section.mt-content-container").toggleClass("padLeft");
}

function rtdefault() {
    $('section.mt-content-container p').css("font-size", 1.1 + "rem");
    $('section.mt-content-container').css("margin-left", 0 + "px");
    $('section.mt-content-container').css("margin-right", 0 + "px");
    $('section.mt-content-container p').css("text-align", "justify");
    $("#size").val("1.1");
    $("#slider-page-width").val("0");
    $("#toggler-text").attr("class", "toggler");
    sessionStorage.setItem('page_width', '0');
    sessionStorage.setItem('text_align', "Justify");
    sessionStorage.setItem('font_size', '1.1');
}
;

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
