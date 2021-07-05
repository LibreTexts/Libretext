import React, {useState} from 'react';

export default function Developers(props) {
        return (
            
            <div id="sb7" className="custom_sidebar">
                <div className="custom_field">
                    <a id="construction-guide" target="_blank" rel="internal"
                       className="mt-icon-site-tools ">&nbsp;Construction Guide</a>
                    <div id="construction-guide-put" className="custom_field" style={{backgroundColor: 'white'}}></div>
                    <a onclick="event.preventDefault(); cover(window.location.href)" href="#"
                       className="mt-icon-book">&nbsp;Get Text Cover</a>
                    <a href="/Under_Construction/Sandboxes/Henry/Get_Contents?${document.getElementById('IDHolder').innerText}"
                       className="mt-icon-edit-page" target="_blank">&nbsp;Get Page Contents</a>
                    <a onclick="event.preventDefault(); $('dd').show();" href="#" className="mt-icon-eye3">&nbsp;Reveal
                                                                                                                 Answers</a>
                    <a onclick="event.preventDefault(); LibreTexts.authenticatedFetch(null,'unorder',null,{method:'PUT'}); window.location.reload()"
                       className="mt-icon-shuffle" href="#">&nbsp;Reset Page Order</a>
                    <a onclick="event.preventDefault(); LibreTexts.getSubpages().then(data => {
		    alert(&quot;Copied pageIDs to the clipboard&quot;);
		    data = JSON.stringify(data).match(/(?<=&quot;id&quot;:&quot;)\\d+(?=&quot;)/g);
		    let [subdomain] = LibreTexts.parseURL();
		    data = data.map(e=>subdomain + &quot;-&quot; + e);
            navigator.clipboard.writeText(data.join(&quot;, &quot;))
		    console.log(data.join(&quot;, &quot;));
		})" className="mt-icon-flow-cascade" href="#">&nbsp;Get PageIDs</a>
                    <a title="https://groups.io/g/Libretexts-ConstructionForum"
                       href="https://groups.io/g/Libretexts-ConstructionForum" rel="external nofollow" target="_blank"
                       className="mt-icon-archive">&nbsp;Construction Forum</a>
                    <a href="https://blog.libretexts.org/2019/06/13/libretexts-offers-new-weekly-office-hours/"
                       rel="external nofollow" target="_blank" className="mt-icon-topic">&nbsp;Office Hours</a>
                    <a href="https://jupyter.libretexts.org/hub/login" className="mt-icon-archive"> Jupyter Hub</a>
                    <a href="https://studio.libretexts.org/" className="mt-icon-article"> LibreStudio Server</a>
                    <a href="https://webwork.libretexts.org/webwork2" className="mt-icon-article"> Webwork Server</a>
                    <a href="https://imathas.libretexts.org/imathas/" className="mt-icon-article"> IMathAS Server</a>
                    <a href="https://chem.libretexts.org/Under_Construction/Development_Details/Misc_Pages/Realtime_MathJax"
                       className="mt-icon-article"> RealTime Mathjax</a>
                    <a href="https://libremaps.libretexts.org/" className="mt-icon-archive"> LibreMaps</a>
                </div>
            </div>
        );
    }
