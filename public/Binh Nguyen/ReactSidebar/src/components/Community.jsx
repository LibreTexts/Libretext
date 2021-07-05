import React, {useState} from 'react';

export default function Community(props) {
    return (
        
        <div id="sb6" className="custom_sidebar">
            <div className="custom_field">
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <ol style={{listStyle: 'none'}}>
                        <li><a data-color="#00b224" href="https://forums.libretexts.org/g/CommunityBiology/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/bio.png"/>Biology
                                                                                                                                                                    Forums</a>
                        </li>
                        <li><a data-color="#207537" href="https://forums.libretexts.org/g/CommunityBusiness/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/biz.png"/>Business
                                                                                                                                                                    Forums</a>
                        </li>
                        <li><a data-color="#00bfff" href="https://forums.libretexts.org/g/CommunityChemistry/topics"
                               rel="external nofollow"><img className="icon" alt=""
                                                            src="https://libretexts.org/img/LibreTexts/glyphs_blue/chem.png"/>Chemistry
                                                                                                                              Forums</a>
                        </li>
                        <li><a data-color="#ff6a00" href="https://forums.libretexts.org/g/CommunityEngineering/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/eng.png"/>Engineering
                                                                                                                                                                    Forums</a>
                        </li>
                        <li><a data-color="#d77b00" href="https://forums.libretexts.org/g/CommunityEspanol/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/espanol.png"/>Español
                                                                                                                                                                        Forums</a>
                        </li>
                        <li><a data-color="#e5a800" href="https://forums.libretexts.org/g/CommunityGeosciences/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/geo.png"/>Geosciences
                                                                                                                                                                    Forums</a>
                        </li>
                        <li><a data-color="#00bc94" href="https://forums.libretexts.org/g/CommunityHumanities/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/human.png"/>Humanities
                                                                                                                                                                      Forums</a>
                        </li>
                        <li><a data-color="#3737bf" href="https://forums.libretexts.org/g/CommunityMathematics/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/math.png"/>Mathematics
                                                                                                                                                                     Forums</a>
                        </li>
                        <li><a data-color="#e52817" href="https://forums.libretexts.org/g/CommunityMedicine/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/med.png"/>Medicine
                                                                                                                                                                    Forums</a>
                        </li>
                        <li><a data-color="#841fcc" href="https://workforce.libretexts.org/" rel="external nofollow"
                               target="_blank" className="link-https"><img className="icon" alt=""
                                                                           src="https://libretexts.org/img/LibreTexts/glyphs_blue/phys.png"/>Physics
                                                                                                                                             Forums</a>
                        </li>
                        <li><a data-color="#f20c92"
                               href="https://forums.libretexts.org/g/CommunitySocialSciences/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/socialsci.png"/>Social
                                                                                                                                                                          Sciences
                                                                                                                                                                          Forums</a>
                        </li>
                        <li><a data-color="#05baff" href="https://forums.libretexts.org/g/CommunityStatistics/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/stats.png"/>Statistics
                                                                                                                                                                      Forums</a>
                        </li>
                        <li><a data-color="#bf4000" href="ttps://forums.libretexts.org/g/CommunityWorkforce/topics"
                               rel="external nofollow" target="_blank" className="link-https"><img className="icon"
                                                                                                   alt=""
                                                                                                   src="https://libretexts.org/img/LibreTexts/glyphs_blue/workforce.png"/>Workforce
                                                                                                                                                                          Forums</a>
                        </li>
                    </ol>
                </div>
            </div>
            <div className="custom_field">
                <a href="https://www.youtube.com/channel/UCP7H_PcHpiINWs8qpg0JaNg" rel="external nofollow"
                   target="_blank" className="mt-icon-youtube">&nbsp;YouTube Channel</a>
            </div>
            <div className="custom_field">
                <a href="https://blog.libretexts.org/" rel="external nofollow" target="_blank"
                   className="link-https">Blog</a>
            </div>
            <div className="custom_field">
                <a href="https://chat.libretexts.org/" rel="external nofollow" target="_blank"
                   className="mt-icon-chat2">&nbsp;Community Help Chat</a>
            </div>
            <div className="custom_field">
                <a href="https://twitter.com/LibreTexts?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor"
                   rel="external nofollow" target="_blank" className="mt-icon-twitter">&nbsp;Twitter</a>
            </div>
            <div className="custom_field">
                <a href="https://www.facebook.com/LibreTexts/" rel="external nofollow" target="_blank"
                   className="mt-icon-facebook">&nbsp;Facebook</a>
            </div>
        </div>
    );
}
