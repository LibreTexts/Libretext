import React from 'react';
import PropTypes from "prop-types";
import {Button, Divider, Grid, Slider, Switch} from "@material-ui/core";
import CheckIcon from '@material-ui/icons/Check';
import NightsStay from "@material-ui/icons/NightsStay";
import TextFieldsIcon from '@material-ui/icons/TextFields';
import FormatIndentIncreaseIcon from '@material-ui/icons/FormatIndentIncrease';

export default function Readability(props) {
    const [currentTheme, setTheme] = React.useState(localStorage.getItem("beeline"));
    const [textSize, setTextSize] = React.useState(localStorage.getItem("LT_fontSize") || 1.0);
    const [marginSize, setMarginSize] = React.useState(localStorage.getItem("LT_pageWidth") || 5);
    
    const setBeelineTheme = (inTheme) => () => {
        if (!inTheme)
            return;
        setTheme(inTheme);
        localStorage.setItem('beeline', inTheme);
        if (inTheme === 'night_blues') {
            props.setDarkMode(true)
        }
        else {
            props.setDarkMode(false)
        }
        doBeeline(inTheme);
    }
    
    function BeelineButton(props) {
        return <Button id={`SB_${props.theme}`} variant="contained" onClick={setBeelineTheme(props.theme)}
                       style={{margin: 6, border: "2px solid white"}}>
            {props.title || props.theme}
            {currentTheme === props.theme ? <CheckIcon/> : null}
        </Button>
    }
    
    BeelineButton.propTypes = {theme: PropTypes.string}
    
    function rtdefault() {
        setTextSize(1.0);
        setMarginSize(5);
        localStorage.removeItem('LT_fontSize');
        localStorage.removeItem('LT_pageWidth');
        localStorage.removeItem('darkMode');
        setBeelineTheme('off')()
        location.reload();
    }
    
    return <>
        <div style={{padding: 10}}>
            <Grid container spacing={2}>
                <Grid item xs={3} id="text-size-slider">
                    Text Size
                </Grid>
                <Grid item xs>
                    <Slider aria-labelledby="text-size-slider"
                            marks
                            onChange={(e, value) => {
                                setTextSize(value);
                                localStorage.setItem('LT_fontSize', value);
                                $('section.mt-content-container p, section.mt-content-container li').css("font-size", value + "rem");
                            }}
                            value={textSize}
                            min={0.4}
                            max={1.8}
                            step={0.1}
                    />
                </Grid>
                <Grid item>
                    <TextFieldsIcon/>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={3} id="margin-size-slider">
                    Margin Size
                </Grid>
                <Grid item xs>
                    <Slider aria-labelledby="margin-size-slider"
                            marks
                            onChange={(e, value) => {
                                setMarginSize(value);
                                localStorage.setItem('LT_pageWidth', value);
                                $('section.mt-content-container').css("margin-left", value + "vw");
                                $('section.mt-content-container').css("margin-right", value + "vw");
                            }}
                            value={marginSize}
                            min={0}
                            max={30}
                            step={5}
                    />
                </Grid>
                <Grid item>
                    <FormatIndentIncreaseIcon/>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={3} id="margin-size-slider">
                    Dark Mode
                </Grid>
                <Grid item xs>
                    <Switch checked={props.darkMode} onClick={(event) => {
                        if (localStorage.getItem('beeline') !== "off") {
                            if (localStorage.getItem('beeline') === 'night_blues') {
                                setBeelineTheme('bright')();
                            }
                            else {
                                setBeelineTheme('night_blues')();
                            }
                        }
                        else { //just trigger dark mode
                            props.setDarkMode();
                        }
                    }}/>
                </Grid>
                <Grid item>
                    <NightsStay/>
                </Grid>
            </Grid>
            <Button variant="contained" onClick={rtdefault}>Reset to Default Settings</Button>
            <Divider/>
            <a href="http://www.beelinereader.com/education/?utm_source=libretexts">
                <img style={{margin: "0 5vw"}} title="Beeline Logo"
                     src="https://test.libretexts.org/hagnew/development/public/Binh%20Nguyen/ReactSidebar/src/assets/beeline_logo_combo_master-cropped.svg"/>
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
            </div>
        </div>
    </>;
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
}

window.activateBeeLine = function activateBeeLine() { //initalization function. Called by Mathjax
    // if (localStorage.getItem('darkMode') === null && window.matchMedia('(prefers-color-scheme: dark)').matches)
    //     localStorage.setItem('darkMode', "true");
    
    if (localStorage.getItem("beeline")) {
        if (localStorage.getItem("beeline") !== "off")
            doBeeline(localStorage.getItem("beeline"), localStorage.getItem("beeline"));
    }
    else {
        localStorage.setItem('beeline', 'off');
    }
}
