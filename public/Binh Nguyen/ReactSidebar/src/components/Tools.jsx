import React, {useState} from 'react';

export default function Tools(props) {
    return (
        <div id="sb4" className="custom_sidebar">
            <div className="custom_field">
                <a href="https://adapt.libretexts.org/" target="_blank" className="mt-icon-pencil2">&nbsp;ADAPT Homework
                                                                                                          System</a>
            </div>
            <div className="custom_field">
                <a href="https://studio.libretexts.org/" className="mt-icon-article"> LibreStudio Server</a>
            </div>
            <div className="custom_field">
                <a href="https://jupyter.libretexts.org/hub/login" className="mt-icon-archive"> Jupyter Hub</a>
            </div>
            <div className="custom_field">
                <a href="/Under_Construction/Development_Details/OER_Remixer" className="mt-icon-tree"> OER Remixer</a>
            </div>
            <div className="custom_field">
                <a onclick="event.preventDefault(); buildcite()" target="_blank" className="mt-icon-quote">&nbsp;Get
                                                                                                                 Page
                                                                                                                 Citation</a>
            </div>
            <div className="custom_field">
                <a onclick="event.preventDefault(); attribution()" target="_blank" className="mt-icon-quote">&nbsp;Get
                                                                                                                   Page
                                                                                                                   Attribution</a>
            </div>
            <div className="custom_field">
                <a onclick="event.preventDefault(); saveBookmark()" href="#"
                   className="mt-icon-bookmarks">&nbsp;Bookmark Page</a>
                <div id="bm-list">
                </div>
            </div>
            <div className="custom_field">
                <a id="librelens-button" onclick="event.preventDefault(); LibreTexts.active.libreLens()" target="_blank"
                   className="mt-icon-eye-blocked">&nbsp;Toggle AutoAttribution</a>
                <div id="librelens-list">
                </div>
            </div>
            <div id="glossarizerOptions" className="custom_field"><p className="mt-icon-bubble2">&nbsp;Glossary</p>
                <form oninput="libretextGlossary.makeGlossary(glossarizerOptions.value)">
                    <p><input id="glossarizerOptionstextbook" name="glossarizerOptions" type="radio"
                              defaultValue="textbook"/><label className="glossaryLabel"
                                                              htmlFor="textbook">Textbook</label></p>
                    {/* <p><input id="glossarizerOptionsachem" name="glossarizerOptions" type="radio" value="achem"/><label class="glossaryLabel" for="achem">Analytical Library</label></p>
                <p><input id="glossarizerOptionsichem" name="glossarizerOptions" type="radio" value="ichem"/><label class="glossaryLabel" for="ichem">Inorganic Library</label></p>
                <p><input id="glossarizerOptionsochem" name="glossarizerOptions" type="radio" value="ochem"/><label class="glossaryLabel" for="ochem">Organic Library</label></p> */}
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
        </div>
    );
}
