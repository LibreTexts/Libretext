import React from 'react';
import PropTypes from "prop-types";
import {Button} from "@material-ui/core";
import CheckIcon from '@material-ui/icons/Check';

export default function Readability(props) {
    const [currentTheme, setTheme] = React.useState(localStorage.getItem("beeline"));
    
    const setBeelineTheme = (inTheme) => () => {
        if (!inTheme)
            return;
        setTheme(inTheme);
        localStorage.setItem('beeline', inTheme);
        if (inTheme === 'night_blues') {
            localStorage.setItem('darkMode', 'true');
        }
        else {
            localStorage.setItem('darkMode', 'false');
        }
        doBeeline(inTheme);
    }
    
    function BeelineButton(props) {
        return <Button id={`SB_${props.theme}`} variant="contained" onClick={setBeelineTheme(props.theme)}
                       style={{margin: 6}}>
            {props.title || props.theme}
            {currentTheme === props.theme ? <CheckIcon/> : null}
        </Button>
    }
    
    BeelineButton.propTypes = {theme: PropTypes.string}
    
    return <>
        <div style={{padding: 10}}>
            <a href="http://www.beelinereader.com/education/?utm_source=libretexts">
                <h3>
                    <img src="https://awesomefiles.libretexts.org/Students/Henry Agnew/BeeLine/beeline-logo.png"/>
                    BeeLine Reader </h3>
            </a>
            
            <p id="beelineExample"> BeeLine Reader uses subtle color gradients to help you read more quickly and
                                    efficiently. Choose a
                                    color scheme below, or <a style={{color: '#30b3f6', display: 'unset', margin: 0}}
                                                              href="http://www.beelinereader.com/education/?utm_source=libretexts">
                    click here to learn more. </a>
            </p>
            <div id="doBeeline">
                <BeelineButton theme="bright"/>
                <BeelineButton theme="blues"/>
                <BeelineButton theme="gray" title="grays"/>
                <BeelineButton theme="night_blues" title="Inverted + Dark Mode"/>
                <BeelineButton theme="off"/>
                {/*            <Button id="dark-light" variant="contained"
                    onClick={() => {
                        $('.elm-skin-container').toggleClass('darkMode');
                        localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true');
                    }}>Dark Mode</Button>*/}
            </div>
        </div>
    </>;
    
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
        </div>
    )
}

function doBeeline(theme) {
    if (!theme)
        return;
    
    const beelineELements = document.querySelectorAll(".mt-content-container p:not(.box-legend),.mt-content-container li, #beelineExample");
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
        if (theme === "off") {
            beeline.uncolor();
        }
        else {
            beeline.color();
        }
    }
    if (typeof ga === 'function') {
        ga('send', 'event', 'BeelineColor', localStorage.getItem("beeline"));
    }
    const contentContainer = $('body');
    if (theme === 'night_blues' || localStorage.getItem('darkMode') === 'true') {
        contentContainer.addClass('darkMode');
    }
    else {
        contentContainer.removeClass('darkMode');
    }
}

window.activateBeeLine = function activateBeeLine() { //initalization function. Called by Mathjax
    if (localStorage.getItem('darkMode') === undefined && window.matchMedia('(prefers-color-scheme: dark)').matches)
        localStorage.setItem('darkMode', "true");
    
    if (localStorage.getItem("beeline")) {
        if (localStorage.getItem("beeline") !== "off")
            doBeeline(localStorage.getItem("beeline"), localStorage.getItem("beeline"));
    }
    else {
        localStorage.setItem('beeline', 'off');
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
