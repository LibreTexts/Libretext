import React, {useState} from 'react';

export default function Resources(props) {
    return (
        
        <div id="sb2" className="custom_sidebar">
            <div className="custom_field">
                <div className="custom_field">
                    <iframe className="pubchem-widget" id="pubchemWidget"
                            style={{width: '100%', height: '400px', overflow: 'auto'}}
                            alt="The Periodic Table of the Elements showing all elements with their chemical symbols, atomic weight, and atomic number.">
                    </iframe>
                </div>
                <a id="ref_table" target="_blank">Reference Tables</a>
                <div id="ref-table-put" className="custom_field" style={{display: 'none', backgroundColor: 'white'}}>
                </div>
                <a id="phy_table" target="_blank">Physical Constants</a>
                <div style={{display: 'none'}} id="phy_table_put" className="custom_field">
                    <iframe style={{width: '100%'}} id="physicalConstantsWidget" loading="lazy"/>
                </div>
                <a id="DesmosWidget" target="_blank">Scientific Calculator</a>
                <div id="desmosW" style={{display: 'none'}}>
                    <iframe id="desmosWidget" style={{width: '95%', height: '400px', overflow: 'auto'}}/>
                </div>
                <a id="conversion_table">Conversion Calculator</a>
                <div style={{display: 'none'}} id="conversion_table_put" className="converter-wrapper">
                    <form name="property_form">
              <span>
                <select className="select-property" name="the_menu" size={1}
                        onchange="CONVERSION_CALCULATOR.UpdateUnitMenu(this, document.form_A.unit_menu); CONVERSION_CALCULATOR.UpdateUnitMenu(this, document.form_B.unit_menu)">
                </select>
              </span>
                    </form>
                    <div className="converter-side-a">
                        <form name="form_A" onsubmit="return false">
                            <input type="text" className="numbersonly" name="unit_input" maxLength={20} defaultValue={0}
                                   onkeyup="CONVERSION_CALCULATOR.CalculateUnit(document.form_A, document.form_B)"/>
                            <span>
                  <select name="unit_menu"
                          onchange="CONVERSION_CALCULATOR.CalculateUnit(document.form_B, document.form_A)">
                  </select>
                </span>
                        </form>
                    </div>
                    {/* /converter-side-a */}
                    <div className="converter-equals">
                        <p>=</p>
                    </div>
                    {/* /converter-side-a */}
                    <div className="converter-side-b">
                        <form name="form_B" onsubmit="return false">
                            <input type="text" className="numbersonly" name="unit_input" maxLength={20} defaultValue={0}
                                   onkeyup="CONVERSION_CALCULATOR.CalculateUnit(document.form_B, document.form_A)"/>
                            <span>
                  <select name="unit_menu"
                          onchange="CONVERSION_CALCULATOR.CalculateUnit(document.form_A, document.form_B)">
                  </select>
                </span>
                        </form>
                    </div>
                    {/* /converter-side-b */}
                </div>
                {/* /converter-wrapper */}
            </div>
        </div>
    );
}
