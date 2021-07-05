import React, {useState} from 'react';

export default function Libraries(props) {
    return (
        <div id="sb5" className="custom_sidebar">
            <div className="custom_field">
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <ol style={{listStyle: 'none'}}>
                        <li><a data-color="#00b224" href="https://bio.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/bio.png"/>Biology</a>
                        </li>
                        <li><a data-color="#207537" href="https://biz.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/biz.png"/>Business</a>
                        </li>
                        <li><a data-color="#00bfff" className="internal" href="https://chem.libretexts.org/"
                               rel="internal"><img className="icon" alt=""
                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/chem.png"/>Chemistry</a>
                        </li>
                        <li><a data-color="#ff6a00" href="https://eng.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/eng.png"/>Engineering</a>
                        </li>
                        <li><a data-color="#d77b00" href="https://espanol.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/espanol.png"/>Español</a>
                        </li>
                        <li><a data-color="#e5a800" href="https://geo.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/geo.png"/>Geosciences</a>
                        </li>
                        <li><a data-color="#00bc94" href="https://human.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/human.png"/>Humanities</a>
                        </li>
                        <li><a data-color="#3737bf" href="https://math.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/math.png"/>Mathematics</a>
                        </li>
                        <li><a data-color="#e52817" href="https://med.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/med.png"/>Medicine</a>
                        </li>
                        <li><a data-color="#841fcc" href="https://phys.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/phys.png"/>Physics</a>
                        </li>
                        <li><a data-color="#f20c92" href="https://socialsci.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/socialsci.png"/>Social
                                                                                                                                                  Sciences</a>
                        </li>
                        <li><a data-color="#05baff" href="https://stats.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/stats.png"/>Statistics</a>
                        </li>
                        <li><a data-color="#bf4000" href="https://workforce.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/workforce.png"/>Workforce</a>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
