function buildcite() {

    let citeDiv = document.createElement("div");
    $(citeDiv).attr("id", "SB-PC-AD");
    $('body').append(citeDiv);

    $(citeDiv).html(`

<div onclick="hidecite()" id="citeModal">

       <div id="citeModalContent" style="cursor: pointer" >
            <div style= "min-height: 100px;" id="citeHTML">
                <p id="citeText"> </p>
            </div>

            <div>
                <select id="citeSelect">
                    <option value="" selected="true" disabled="true">Template Selection</option>
                    <option value="citation-apa">APA</option><option value="harletd1">Harletd</option>
                    <option value="chicago">Chicago</option>
                    <option value="vancouver">Vancouver</option>
                    <option value="mla">MLA</option>
                    <option value="acs">ACS</option>
                </select>
            </div>
            <div id="citeContent">
                 <a id="citeCopy" style="text-decoration: none; color: #666" >Copy Text</a>
                 <a id="citeCopyHTML" style="text-decoration: none; color: #666" >Copy HTML</a>
                 <a id="citeBIBTEX" style="text-decoration: none; color: #666" >Download Bibtex </a>
            </div>
       </div>
</div>
`);
    $('#citeSelect').val('citation-apa')
    getCite();
    $('#citeSelect').on('change', function () { getCite() });
    $('#citeBIBTEX').on('click', function () { let bibtex = getBibTeX(); download(`${bibtex}`, 'bibtex.bbl', 'text/plain') });
    const citeCopy = document.getElementById("citeCopy");
    citeCopy.addEventListener("click", function () {
        let text = document.getElementById("citeText").innerText;
        let elem = document.createElement("textarea");
        document.body.appendChild(elem);
        elem.value = text;
        elem.select();

        document.execCommand("copy");
        document.body.removeChild(elem);
    });

    const citeHTMLCopy = document.getElementById("citeCopyHTML");
    citeHTMLCopy.addEventListener("click", () => {
        let text = $("#citeHTML").html();
        let elem = document.createElement("textarea");
        document.body.appendChild(elem);
        elem.value = text;
        elem.select();

        document.execCommand("copy");
        document.body.removeChild(elem);
    });
}

function hidecite() {

    if (!$(event.target).closest('#citeModalContent').length && !$(event.target).is('#citeModalContent')) {
        $("#SB-PC-AD").remove();
    }


}

function download(data, filename, type) {
    let file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob)
        window.navigator.msSaveOrOpenBlob(file, filename);
    else {
        const tempa = document.createElement("a"),
            url = URL.createObjectURL(file);
        tempa.href = url;
        tempa.download = filename;
        document.body.appendChild(tempa);
        tempa.click();
        setTimeout(function () {
            document.body.removeChild(tempa);
            window.URL.revokeObjectURL(tempa);
        }, 0);
    }
}

function getBibTeX() {
    const CiteB = require('citation-js');
    let citeobject = new CiteB(pageParam);
    let output = citeobject.format('bibtex');
    return output
};

function getCite(verbose = false) {
    let today = new Date();
    let accdate = [today.getFullYear(), today.getMonth() + 1, today.getDate()];
    let title = $("#titleHolder").text();
    let url = $("meta[property='og:url']").prop('content');
    let author = namesplitter($("li.mt-author-information a:first").text());
    let publisher = $("li.mt-author-companyname a:first").text()

    pageParam = {
        "type": "webpage",
        "title": title,
        "acsessed": {
            "date-parts": [[accdate[0], accdate[1], accdate[2]]]
        },
        "URL": url,
        "author": author,
        "publisher": publisher
    }

    // Extend Available Templates //
    let mlaname = 'mla';
    let mlatemplate = '<?xml version="1.0" encoding="utf-8"?> <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="never" page-range-format="minimal-two"> <info> <title>Modern Language Association 8th edition</title> <title-short>MLA</title-short> <id>http://www.zotero.org/styles/modern-language-association</id> <link href="http://www.zotero.org/styles/modern-language-association" rel="self"/> <link href="http://style.mla.org" rel="documentation"/> <author> <name>Sebastian Karcher</name> </author> <category citation-format="author"/> <category field="generic-base"/> <summary>This style adheres to the MLA 8th edition handbook. Follows the structure of references as outlined in the MLA Manual closely</summary> <updated>2018-12-13T20:05:10+00:00</updated> <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights> </info> <locale xml:lang="en"> <date form="text"> <date-part name="day" suffix=" "/> <date-part name="month" suffix=" " form="short"/> <date-part name="year"/> </date> <terms> <term name="month-01" form="short">Jan.</term> <term name="month-02" form="short">Feb.</term> <term name="month-03" form="short">Mar.</term> <term name="month-04" form="short">Apr.</term> <term name="month-05" form="short">May</term> <term name="month-06" form="short">June</term> <term name="month-07" form="short">July</term> <term name="month-08" form="short">Aug.</term> <term name="month-09" form="short">Sept.</term> <term name="month-10" form="short">Oct.</term> <term name="month-11" form="short">Nov.</term> <term name="month-12" form="short">Dec.</term> <term name="translator" form="short">trans.</term> </terms> </locale> <macro name="author"> <names letiable="author"> <name name-as-sort-order="first" and="text" delimiter-precedes-last="always" delimiter-precedes-et-al="always" initialize="false" initialize-with=". "/> <label form="long" prefix=", "/> <substitute> <names letiable="editor"/> <names letiable="translator"/> <text macro="title"/> </substitute> </names> </macro> <macro name="author-short"> <group delimiter=", "> <names letiable="author"> <name form="short" initialize-with=". " and="text"/> <substitute> <names letiable="editor"/> <names letiable="translator"/> <text macro="title-short"/> </substitute> </names> <choose> <if disambiguate="true"> <text macro="title-short"/> </if> </choose> </group> </macro> <macro name="title"> <choose> <if letiable="container-title" match="any"> <text letiable="title" quotes="true" text-case="title"/> </if> <else> <text letiable="title" font-style="italic" text-case="title"/> </else> </choose> </macro> <macro name="title-short"> <choose> <if letiable="container-title" match="any"> <text letiable="title" form="short" quotes="true" text-case="title"/> </if> <else> <text letiable="title" form="short" font-style="italic" text-case="title"/> </else> </choose> </macro> <macro name="container-title"> <text letiable="container-title" font-style="italic" text-case="title"/> </macro> <macro name="other-contributors"> <group delimiter=", "> <choose> <if letiable="container-title" match="any"> <names letiable="illustrator interviewer editor translator" delimiter=", "> <label form="verb" suffix=" "/> <name and="text"/> </names> </if> <else> <names letiable="illustrator interviewer editor translator" delimiter=", "> <label form="verb" suffix=" " text-case="capitalize-first"/> <name and="text"/> </names> </else> </choose> <names letiable="director"> <label form="verb" suffix=" " text-case="capitalize-first"/> <name and="text"/> </names> </group> </macro> <macro name="version"> <group delimiter=", "> <choose> <if is-numeric="edition"> <group delimiter=" "> <number letiable="edition" form="ordinal"/> <text term="edition" form="short"/> </group> </if> <else> <text letiable="edition" text-case="capitalize-first"/> </else> </choose> <text letiable="version"/> </group> </macro> <macro name="number"> <group delimiter=", "> <group> <choose> <if letiable="edition container-title" match="any"> <group delimiter=" "> <text term="volume" form="short"/> <text letiable="volume"/> </group> </if> <else-if letiable="author editor" match="all"> <group delimiter=" "> <text term="volume" form="short"/> <text letiable="volume"/> </group> </else-if> <else> <group delimiter=" "> <text term="volume" form="short" text-case="capitalize-first"/> <text letiable="volume"/> </group> </else> </choose> </group> <group delimiter=" "> <text term="issue" form="short"/> <text letiable="issue"/> </group> <choose> <if type="report"> <text letiable="genre"/> </if> </choose> <text letiable="number"/> </group> </macro> <macro name="publisher"> <text letiable="publisher"/> </macro> <macro name="publication-date"> <choose> <if type="book chapter paper-conference motion_picture" match="any"> <date letiable="issued" form="numeric" date-parts="year"/> </if> <else-if type="article-journal article-magazine" match="any"> <date letiable="issued" form="text" date-parts="year-month"/> </else-if> <else-if type="speech" match="none"> <date letiable="issued" form="text"/> </else-if> </choose> </macro> <macro name="location"> <group delimiter=", "> <group delimiter=" "> <label letiable="page" form="short"/> <text letiable="page"/> </group> <choose> <if letiable="source" match="none"> <text macro="URI"/> </if> </choose> </group> </macro> <macro name="container2-title"> <group delimiter=", "> <choose> <if type="speech"> <text letiable="event"/> <date letiable="event-date" form="text"/> <text letiable="event-place"/> </if> </choose> <text letiable="archive"/> <text letiable="archive-place"/> <text letiable="archive_location"/> </group> </macro> <macro name="container2-location"> <choose> <if letiable="source"> <choose> <if letiable="DOI URL" match="any"> <group delimiter=", "> <text letiable="source" font-style="italic"/> <text macro="URI"/> </group> </if> </choose> </if> </choose> </macro> <macro name="URI"> <choose> <if letiable="DOI"> <text letiable="DOI" prefix="doi:"/> </if> <else> <text letiable="URL"/> </else> </choose> </macro> <macro name="accessed"> <choose> <if letiable="issued" match="none"> <group delimiter=" "> <text term="accessed" text-case="capitalize-first"/> <date letiable="accessed" form="text"/> </group> </if> </choose> </macro> <citation et-al-min="3" et-al-use-first="1" disambiguate-add-names="true" disambiguate-add-givenname="true"> <layout prefix="(" suffix=")" delimiter="; "> <choose> <if locator="page line" match="any"> <group delimiter=" "> <text macro="author-short"/> <text letiable="locator"/> </group> </if> <else> <group delimiter=", "> <text macro="author-short"/> <group> <label letiable="locator" form="short"/> <text letiable="locator"/> </group> </group> </else> </choose> </layout> </citation> <bibliography hanging-indent="true" et-al-min="3" et-al-use-first="1" line-spacing="2" entry-spacing="0" subsequent-author-substitute="---"> <sort> <key macro="author"/> <key letiable="title"/> </sort> <layout suffix="."> <group delimiter=". "> <text macro="author"/> <text macro="title"/> <date letiable="original-date" form="numeric" date-parts="year"/> <group delimiter=", "> <text macro="container-title"/> <text macro="other-contributors"/> <text macro="version"/> <text macro="number"/> <text macro="publisher"/> <text macro="publication-date"/> <text macro="location"/> </group> <group delimiter=", "> <text macro="container2-title"/> <text macro="container2-location"/> </group> <text macro="accessed"/> </group> </layout> </bibliography> </style>';
    let acsname = 'acs';
    let acstemplate = '<?xml version="1.0" encoding="utf-8"?> <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="sort-only" page-range-format="expanded" default-locale="en-US"> <info> <title>American Chemical Society</title> <title-short>ACS</title-short> <id>http://www.zotero.org/styles/american-chemical-society</id> <link href="http://www.zotero.org/styles/american-chemical-society" rel="self"/> <link href="http://pubs.acs.org/doi/pdf/10.1021/bk-2006-STYG.ch014" rel="documentation"/> <author> <name>Julian Onions</name> <email>julian.onions@gmail.com</email> </author> <contributor> <name>Ivan Bushmarinov</name> <email>ib@ineos.ac.ru</email> </contributor> <contributor> <name>Sebastian Karcher</name> </contributor> <category citation-format="numeric"/> <category field="chemistry"/> <summary>The American Chemical Society style</summary> <updated>2018-12-30T12:00:00+00:00</updated> <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights> </info> <locale xml:lang="en"> <terms> <term name="editortranslator" form="short"> <single>ed. and translator</single> <multiple>eds. and translators</multiple> </term> <term name="translator" form="short"> <single>translator</single> <multiple>translators</multiple> </term> <term name="collection-editor" form="short"> <single>series ed.</single> <multiple>series eds.</multiple> </term> </terms> </locale> <macro name="editor"> <group delimiter="; "> <names letiable="editor translator" delimiter="; "> <name sort-separator=", " initialize-with=". " name-as-sort-order="all" delimiter=", " delimiter-precedes-last="always"/> <label form="short" prefix=", " text-case="title"/> </names> <names letiable="collection-editor"> <name sort-separator=", " initialize-with=". " name-as-sort-order="all" delimiter=", " delimiter-precedes-last="always"/> <label form="short" prefix=", " text-case="title"/> </names> </group> </macro> <macro name="author"> <names letiable="author" suffix="."> <name sort-separator=", " initialize-with=". " name-as-sort-order="all" delimiter="; " delimiter-precedes-last="always"/> <label form="short" prefix=", " text-case="capitalize-first"/> </names> </macro> <macro name="publisher"> <choose> <if type="thesis" match="any"> <group delimiter=", "> <text letiable="publisher"/> <text letiable="publisher-place"/> </group> </if> <else> <group delimiter=": "> <text letiable="publisher"/> <text letiable="publisher-place"/> </group> </else> </choose> </macro> <macro name="title"> <choose> <if type="bill book graphic legal_case legislation motion_picture report song" match="any"> <text letiable="title" text-case="title" font-style="italic"/> </if> <else> <text letiable="title" text-case="title"/> </else> </choose> </macro> <macro name="volume"> <group delimiter=" "> <text term="volume" form="short" text-case="capitalize-first"/> <text letiable="volume"/> </group> </macro> <macro name="series"> <text letiable="collection-title"/> </macro> <macro name="pages"> <label letiable="page" form="short" suffix=" " strip-periods="true"/> <text letiable="page"/> </macro> <macro name="book-container"> <group delimiter=". "> <text macro="title"/> <choose> <if type="entry-dictionary entry-encyclopedia" match="none"> <group delimiter=" "> <text term="in" text-case="capitalize-first"/> <text letiable="container-title" font-style="italic"/> </group> </if> <else> <text letiable="container-title" font-style="italic"/> </else> </choose> </group> </macro> <macro name="issued"> <date letiable="issued" delimiter=" "> <date-part name="year"/> </date> </macro> <macro name="full-issued"> <date letiable="issued" delimiter=" "> <date-part name="month" form="long" suffix=" "/> <date-part name="day" suffix=", "/> <date-part name="year"/> </date> </macro> <macro name="edition"> <choose> <if is-numeric="edition"> <group delimiter=" "> <number letiable="edition" form="ordinal"/> <text term="edition" form="short"/> </group> </if> <else> <text letiable="edition" suffix="."/> </else> </choose> </macro> <citation collapse="citation-number"> <sort> <key letiable="citation-number"/> </sort> <layout delimiter="," vertical-align="sup"> <text letiable="citation-number"/> </layout> </citation> <bibliography second-field-align="flush" entry-spacing="0" et-al-min="11" et-al-use-first="10"> <layout suffix="."> <text letiable="citation-number" prefix="(" suffix=") "/> <text macro="author" suffix=" "/> <choose> <if type="article-journal review" match="any"> <group delimiter=" "> <text macro="title" suffix="."/> <text letiable="container-title" font-style="italic" form="short"/> <group delimiter=", "> <text macro="issued" font-weight="bold"/> <choose> <if letiable="volume"> <group delimiter=" "> <text letiable="volume" font-style="italic"/> <text letiable="issue" prefix="(" suffix=")"/> </group> </if> <else> <group delimiter=" "> <text term="issue" form="short" text-case="capitalize-first"/> <text letiable="issue"/> </group> </else> </choose> <text letiable="page"/> </group> </group> </if> <else-if type="article-magazine article-newspaper article" match="any"> <group delimiter=" "> <text macro="title" suffix="."/> <text letiable="container-title" font-style="italic" suffix="."/> <text macro="edition"/> <text macro="publisher"/> <group delimiter=", "> <text macro="full-issued"/> <text macro="pages"/> </group> </group> </else-if> <else-if type="thesis"> <group delimiter=", "> <group delimiter=". "> <text macro="title"/> <text letiable="genre"/> </group> <text macro="publisher"/> <text macro="issued"/> <text macro="volume"/> <text macro="pages"/> </group> </else-if> <else-if type="bill book graphic legal_case legislation motion_picture report song" match="any"> <group delimiter="; "> <group delimiter=", "> <text macro="title"/> <text macro="edition"/> </group> <text macro="editor" prefix=" "/> <text macro="series"/> <choose> <if type="report"> <group delimiter=" "> <text letiable="genre"/> <text letiable="number"/> </group> </if> </choose> <group delimiter=", "> <text macro="publisher"/> <text macro="issued"/> </group> <group delimiter=", "> <text macro="volume"/> <text macro="pages"/> </group> </group> </else-if> <else-if type="patent"> <group delimiter=", "> <group delimiter=". "> <text macro="title"/> <text letiable="number"/> </group> <date letiable="issued" form="text"/> </group> </else-if> <else-if type="chapter paper-conference entry-dictionary entry-encyclopedia" match="any"> <group delimiter="; "> <text macro="book-container"/> <text macro="editor"/> <text macro="series"/> <group delimiter=", "> <text macro="publisher"/> <text macro="issued"/> </group> <group delimiter=", "> <text macro="volume"/> <text macro="pages"/> </group> </group> </else-if> <else-if type="webpage"> <group delimiter=" "> <text letiable="title"/> <text letiable="URL"/> <date letiable="accessed" prefix="(accessed " suffix=")" delimiter=" "> <date-part name="month" form="short" strip-periods="true"/> <date-part name="day" suffix=", "/> <date-part name="year"/> </date> </group> </else-if> <else> <group delimiter=", "> <group delimiter=". "> <text macro="title"/> <text letiable="container-title" font-style="italic"/> </group> <group delimiter=", "> <text macro="issued"/> <text letiable="volume" font-style="italic"/> <text letiable="page"/> </group> </group> </else> </choose> <text letiable="DOI" prefix=". https://doi.org/"/> </layout> </bibliography> </style>';
    let chicagoname = 'chicago';
    let chicagotemplate = '<?xml version="1.0" encoding="utf-8"?> <style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="display-and-sort" page-range-format="chicago"> <info> <title>Chicago Manual of Style 17th edition (author-date)</title> <id>http://www.zotero.org/styles/chicago-author-date</id> <link href="http://www.zotero.org/styles/chicago-author-date" rel="self"/> <link href="http://www.chicagomanualofstyle.org/tools_citationguide.html" rel="documentation"/> <author> <name>Julian Onions</name> <email>julian.onions@gmail.com</email> </author> <contributor> <name>Sebastian Karcher</name> </contributor> <contributor> <name>Richard Karnesky</name> <email>karnesky+zotero@gmail.com</email> <uri>http://arc.nucapt.northwestern.edu/Richard_Karnesky</uri> </contributor> <contributor> <name>Andrew Dunning</name> <email>andrew.dunning@utoronto.ca</email> <uri>https://orcid.org/0000-0003-0464-5036</uri> </contributor> <contributor> <name>Matthew Roth</name> <email>matthew.g.roth@yale.edu</email> <uri> https://orcid.org/0000-0001-7902-6331</uri> </contributor> <category citation-format="author-date"/> <category field="generic-base"/> <summary>The author-date letiant of the Chicago style</summary> <updated>2018-01-24T12:00:00+00:00</updated> <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights> </info> <locale xml:lang="en"> <terms> <term name="editor" form="verb-short">ed.</term> <term name="container-author" form="verb">by</term> <term name="translator" form="verb-short">trans.</term> <term name="editortranslator" form="verb">edited and translated by</term> <term name="translator" form="short">trans.</term> </terms> </locale> <macro name="secondary-contributors"> <choose> <if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="none"> <group delimiter=". "> <names letiable="editor translator" delimiter=". "> <label form="verb" text-case="capitalize-first" suffix=" "/> <name and="text" delimiter=", "/> </names> <names letiable="director" delimiter=". "> <label form="verb" text-case="capitalize-first" suffix=" "/> <name and="text" delimiter=", "/> </names> </group> </if> </choose> </macro> <macro name="container-contributors"> <choose> <if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any"> <group prefix=", " delimiter=", "> <names letiable="container-author" delimiter=", "> <label form="verb" suffix=" "/> <name and="text" delimiter=", "/> </names> <names letiable="editor translator" delimiter=", "> <label form="verb" suffix=" "/> <name and="text" delimiter=", "/> </names> </group> </if> </choose> </macro> <macro name="editor"> <names letiable="editor"> <name name-as-sort-order="first" and="text" sort-separator=", " delimiter=", " delimiter-precedes-last="always"/> <label form="short" prefix=", "/> </names> </macro> <macro name="translator"> <names letiable="translator"> <name name-as-sort-order="first" and="text" sort-separator=", " delimiter=", " delimiter-precedes-last="always"/> <label form="short" prefix=", "/> </names> </macro> <macro name="recipient"> <choose> <if type="personal_communication"> <choose> <if letiable="genre"> <text letiable="genre" text-case="capitalize-first"/> </if> <else> <text term="letter" text-case="capitalize-first"/> </else> </choose> </if> </choose> <names letiable="recipient" delimiter=", "> <label form="verb" prefix=" " text-case="lowercase" suffix=" "/> <name and="text" delimiter=", "/> </names> </macro> <macro name="substitute-title"> <choose> <if type="article-magazine article-newspaper review review-book" match="any"> <text macro="container-title"/> </if> </choose> </macro> <macro name="contributors"> <group delimiter=". "> <names letiable="author"> <name and="text" name-as-sort-order="first" sort-separator=", " delimiter=", " delimiter-precedes-last="always"/> <label form="short" prefix=", "/> <substitute> <names letiable="editor"/> <names letiable="translator"/> <names letiable="director"/> <text macro="substitute-title"/> <text macro="title"/> </substitute> </names> <text macro="recipient"/> </group> </macro> <macro name="contributors-short"> <names letiable="author"> <name form="short" and="text" delimiter=", " initialize-with=". "/> <substitute> <names letiable="editor"/> <names letiable="translator"/> <names letiable="director"/> <text macro="substitute-title"/> <text macro="title"/> </substitute> </names> </macro> <macro name="interviewer"> <names letiable="interviewer" delimiter=", "> <label form="verb" prefix=" " text-case="capitalize-first" suffix=" "/> <name and="text" delimiter=", "/> </names> </macro> <macro name="archive"> <group delimiter=". "> <text letiable="archive_location" text-case="capitalize-first"/> <text letiable="archive"/> <text letiable="archive-place"/> </group> </macro> <macro name="access"> <group delimiter=". "> <choose> <if type="graphic report" match="any"> <text macro="archive"/> </if> <else-if type="article-journal bill book chapter legal_case legislation motion_picture paper-conference" match="none"> <text macro="archive"/> </else-if> </choose> <choose> <if type="webpage post-weblog" match="any"> <date letiable="issued" form="text"/> </if> </choose> <choose> <if letiable="issued" match="none"> <group delimiter=" "> <text term="accessed" text-case="capitalize-first"/> <date letiable="accessed" form="text"/> </group> </if> </choose> <choose> <if type="legal_case" match="none"> <choose> <if letiable="DOI"> <text letiable="DOI" prefix="https://doi.org/"/> </if> <else> <text letiable="URL"/> </else> </choose> </if> </choose> </group> </macro> <macro name="title"> <choose> <if letiable="title" match="none"> <choose> <if type="personal_communication" match="none"> <text letiable="genre" text-case="capitalize-first"/> </if> </choose> </if> <else-if type="bill book graphic legislation motion_picture song" match="any"> <text letiable="title" text-case="title" font-style="italic"/> <group prefix=" (" suffix=")" delimiter=" "> <text term="version"/> <text letiable="version"/> </group> </else-if> <else-if letiable="reviewed-author"> <choose> <if letiable="reviewed-title"> <group delimiter=". "> <text letiable="title" text-case="title" quotes="true"/> <group delimiter=", "> <text letiable="reviewed-title" text-case="title" font-style="italic" prefix="Review of "/> <names letiable="reviewed-author"> <label form="verb-short" text-case="lowercase" suffix=" "/> <name and="text" delimiter=", "/> </names> </group> </group> </if> <else> <group delimiter=", "> <text letiable="title" text-case="title" font-style="italic" prefix="Review of "/> <names letiable="reviewed-author"> <label form="verb-short" text-case="lowercase" suffix=" "/> <name and="text" delimiter=", "/> </names> </group> </else> </choose> </else-if> <else-if type="legal_case interview patent" match="any"> <text letiable="title"/> </else-if> <else> <text letiable="title" text-case="title" quotes="true"/> </else> </choose> </macro> <macro name="edition"> <choose> <if type="bill book graphic legal_case legislation motion_picture report song" match="any"> <choose> <if is-numeric="edition"> <group delimiter=" " prefix=". "> <number letiable="edition" form="ordinal"/> <text term="edition" form="short" strip-periods="true"/> </group> </if> <else> <text letiable="edition" text-case="capitalize-first" prefix=". "/> </else> </choose> </if> <else-if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any"> <choose> <if is-numeric="edition"> <group delimiter=" " prefix=", "> <number letiable="edition" form="ordinal"/> <text term="edition" form="short"/> </group> </if> <else> <text letiable="edition" prefix=", "/> </else> </choose> </else-if> </choose> </macro> <macro name="locators"> <choose> <if type="article-journal"> <choose> <if letiable="volume"> <text letiable="volume" prefix=" "/> <group prefix=" (" suffix=")"> <choose> <if letiable="issue"> <text letiable="issue"/> </if> <else> <date letiable="issued"> <date-part name="month"/> </date> </else> </choose> </group> </if> <else-if letiable="issue"> <group delimiter=" " prefix=", "> <text term="issue" form="short"/> <text letiable="issue"/> <date letiable="issued" prefix="(" suffix=")"> <date-part name="month"/> </date> </group> </else-if> <else> <date letiable="issued" prefix=", "> <date-part name="month"/> </date> </else> </choose> </if> <else-if type="legal_case"> <text letiable="volume" prefix=", "/> <text letiable="container-title" prefix=" "/> <text letiable="page" prefix=" "/> </else-if> <else-if type="bill book graphic legal_case legislation motion_picture report song" match="any"> <group prefix=". " delimiter=". "> <group> <text term="volume" form="short" text-case="capitalize-first" suffix=" "/> <number letiable="volume" form="numeric"/> </group> <group> <number letiable="number-of-volumes" form="numeric"/> <text term="volume" form="short" prefix=" " plural="true"/> </group> </group> </else-if> <else-if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any"> <choose> <if letiable="page" match="none"> <group prefix=". "> <text term="volume" form="short" text-case="capitalize-first" suffix=" "/> <number letiable="volume" form="numeric"/> </group> </if> </choose> </else-if> </choose> </macro> <macro name="locators-chapter"> <choose> <if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any"> <choose> <if letiable="page"> <group prefix=", "> <text letiable="volume" suffix=":"/> <text letiable="page"/> </group> </if> </choose> </if> </choose> </macro> <macro name="locators-article"> <choose> <if type="article-newspaper"> <group prefix=", " delimiter=", "> <group delimiter=" "> <text letiable="edition"/> <text term="edition"/> </group> <group> <text term="section" form="short" suffix=" "/> <text letiable="section"/> </group> </group> </if> <else-if type="article-journal"> <choose> <if letiable="volume issue" match="any"> <text letiable="page" prefix=": "/> </if> <else> <text letiable="page" prefix=", "/> </else> </choose> </else-if> </choose> </macro> <macro name="point-locators"> <choose> <if letiable="locator"> <choose> <if locator="page" match="none"> <choose> <if type="bill book graphic legal_case legislation motion_picture report song" match="any"> <choose> <if letiable="volume"> <group> <text term="volume" form="short" suffix=" "/> <number letiable="volume" form="numeric"/> <label letiable="locator" form="short" prefix=", " suffix=" "/> </group> </if> <else> <label letiable="locator" form="short" suffix=" "/> </else> </choose> </if> <else> <label letiable="locator" form="short" suffix=" "/> </else> </choose> </if> <else-if type="bill book graphic legal_case legislation motion_picture report song" match="any"> <number letiable="volume" form="numeric" suffix=":"/> </else-if> </choose> <text letiable="locator"/> </if> </choose> </macro> <macro name="container-prefix"> <text term="in" text-case="capitalize-first"/> </macro> <macro name="container-title"> <choose> <if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any"> <text macro="container-prefix" suffix=" "/> </if> </choose> <choose> <if type="webpage"> <text letiable="container-title" text-case="title"/> </if> <else-if type="legal_case" match="none"> <group delimiter=" "> <text letiable="container-title" text-case="title" font-style="italic"/> <choose> <if type="post-weblog"> <text value="(blog)"/> </if> </choose> </group> </else-if> </choose> </macro> <macro name="publisher"> <group delimiter=": "> <text letiable="publisher-place"/> <text letiable="publisher"/> </group> </macro> <macro name="date"> <choose> <if letiable="issued"> <group delimiter=" "> <date letiable="original-date" form="text" date-parts="year" prefix="(" suffix=")"/> <date letiable="issued"> <date-part name="year"/> </date> </group> </if> <else-if letiable="status"> <text letiable="status" text-case="capitalize-first"/> </else-if> <else> <text term="no date" form="short"/> </else> </choose> </macro> <macro name="date-in-text"> <choose> <if letiable="issued"> <group delimiter=" "> <date letiable="original-date" form="text" date-parts="year" prefix="[" suffix="]"/> <date letiable="issued"> <date-part name="year"/> </date> </group> </if> <else-if letiable="status"> <text letiable="status"/> </else-if> <else> <text term="no date" form="short"/> </else> </choose> </macro> <macro name="day-month"> <date letiable="issued"> <date-part name="month"/> <date-part name="day" prefix=" "/> </date> </macro> <macro name="collection-title"> <choose> <if match="none" type="article-journal"> <choose> <if match="none" is-numeric="collection-number"> <group delimiter=", "> <text letiable="collection-title" text-case="title"/> <text letiable="collection-number"/> </group> </if> <else> <group delimiter=" "> <text letiable="collection-title" text-case="title"/> <text letiable="collection-number"/> </group> </else> </choose> </if> </choose> </macro> <macro name="collection-title-journal"> <choose> <if type="article-journal"> <group delimiter=" "> <text letiable="collection-title"/> <text letiable="collection-number"/> </group> </if> </choose> </macro> <macro name="event"> <group> <text term="presented at" suffix=" "/> <text letiable="event"/> </group> </macro> <macro name="description"> <choose> <if type="interview"> <group delimiter=". "> <text macro="interviewer"/> <text letiable="medium" text-case="capitalize-first"/> </group> </if> <else-if type="patent"> <group delimiter=" " prefix=". "> <text letiable="authority"/> <text letiable="number"/> </group> </else-if> <else> <text letiable="medium" text-case="capitalize-first" prefix=". "/> </else> </choose> <choose> <if letiable="title" match="none"/> <else-if type="thesis personal_communication speech" match="any"/> <else> <group delimiter=" " prefix=". "> <text letiable="genre" text-case="capitalize-first"/> <choose> <if type="report"> <text letiable="number"/> </if> </choose> </group> </else> </choose> </macro> <macro name="issue"> <choose> <if type="legal_case"> <text letiable="authority" prefix=". "/> </if> <else-if type="speech"> <group prefix=". " delimiter=", "> <group delimiter=" "> <text letiable="genre" text-case="capitalize-first"/> <text macro="event"/> </group> <text letiable="event-place"/> <text macro="day-month"/> </group> </else-if> <else-if type="article-newspaper article-magazine personal_communication" match="any"> <date letiable="issued" form="text" prefix=", "/> </else-if> <else-if type="patent"> <group delimiter=", " prefix=", "> <group delimiter=" "> <text value="filed"/> <date letiable="submitted" form="text"/> </group> <group delimiter=" "> <choose> <if letiable="issued submitted" match="all"> <text term="and"/> </if> </choose> <text value="issued"/> <date letiable="issued" form="text"/> </group> </group> </else-if> <else-if type="article-journal" match="any"/> <else> <group prefix=". " delimiter=", "> <choose> <if type="thesis"> <text letiable="genre" text-case="capitalize-first"/> </if> </choose> <text macro="publisher"/> </group> </else> </choose> </macro> <citation et-al-min="4" et-al-use-first="1" disambiguate-add-year-suffix="true" disambiguate-add-names="true" disambiguate-add-givenname="true" givenname-disambiguation-rule="primary-name" collapse="year" after-collapse-delimiter="; "> <layout prefix="(" suffix=")" delimiter="; "> <group delimiter=", "> <choose> <if letiable="issued accessed" match="any"> <group delimiter=" "> <text macro="contributors-short"/> <text macro="date-in-text"/> </group> </if> <else> <group delimiter=", "> <text macro="contributors-short"/> <text macro="date-in-text"/> </group> </else> </choose> <text macro="point-locators"/> </group> </layout> </citation> <bibliography hanging-indent="true" et-al-min="11" et-al-use-first="7" subsequent-author-substitute="&#8212;&#8212;&#8212;" entry-spacing="0"> <sort> <key macro="contributors"/> <key letiable="issued"/> <key letiable="title"/> </sort> <layout suffix="."> <group delimiter=". "> <text macro="contributors"/> <text macro="date"/> <text macro="title"/> </group> <text macro="description"/> <text macro="secondary-contributors" prefix=". "/> <text macro="container-title" prefix=". "/> <text macro="container-contributors"/> <text macro="edition"/> <text macro="locators-chapter"/> <text macro="collection-title-journal" prefix=", " suffix=", "/> <text macro="locators"/> <text macro="collection-title" prefix=". "/> <text macro="issue"/> <text macro="locators-article"/> <text macro="access" prefix=". "/> </layout> </bibliography> </style>';

    // Generate citation in desired format. //
    const Cite = require('citation-js');
    Cite.plugins.config.get('csl').templates.add(mlaname, mlatemplate);
    Cite.plugins.config.get('csl').templates.add(acsname, acstemplate);
    Cite.plugins.config.get('csl').templates.add(chicagoname, chicagotemplate);
    citetemp = $('#citeSelect').children("option:Selected").val();


    let citeobj = new Cite(pageParam);
    let output = citeobj.format('bibliography', {
        format: 'text',
        template: citetemp,
        lang: 'en-US'
    });
    $('#citeText').text(output);

    function namesplitter(name, verbose = false) {
        let rawnames = name;
        let splind = [0];
        let spls = [' and ', '& ', ', '];
        let rawauthnames = new Array;
        let authors = new Array;
        for (i = 0; i < spls.length; i++) {
            let finder = spls[i];
            var n = 0;
            while (n < rawnames.length) {
                let sfield = rawnames.slice(n)
                if ((sfield.search(finder) != -1)) {
                    let x = n + sfield.indexOf(finder) + 1;
                    let y = x + finder.length - 1;
                    splind.push(x, y);
                    n = y;
                } else {
                    n = rawnames.length;
                }
            }
        }
        splind.sort();
        splind.push(n);
        for (i = 0; i < (splind.length); i += 2) { // Slices string into individual names
            let bslice = splind[i]
            if (i + 2 == splind.length) {
                var eslice = splind[i + 1];
            } else {
                var eslice = splind[i + 1] - 1;
            }
            rawauthnames.push(rawnames.slice(bslice, eslice));
        }
        for (i = 0; i < rawauthnames.length; i++) { // Parses names into family and given names
            let rawname = rawauthnames[i];
            let namedict = {};
            if (rawname.search('\\.') != -1) {
                let fname = rawname.slice(0, rawname.lastIndexOf('.') + 1);
                let lname = rawname.slice(rawname.lastIndexOf('.') + 2, rawname.length);
                namedict = {
                    given: fname,
                    family: lname
                }
            } else {
                let fname = '';
                let lname = '';
                let arname = rawname.split(' ');
                let lnameind = arname.length - 1;
                for (j = 0; j < arname.length; j++) {
                    if ((/^[a-z]/g).test(arname[j]) && lnameind == arname.length - 1) {
                        lnameind = j;
                    }
                    if (j < lnameind) {
                        fname += arname[j] + ' ';
                    } else {
                        lname += arname[j] + ' ';
                    }
                }
                fname = fname.slice(0, fname.length - 1);
                lname = lname.slice(0, lname.length - 1);
                namedict = {
                    'given': fname,
                    'family': lname
                }
            }
            authors.push(namedict)
        }

        if (verbose) {
            console.log(rawnames);
            console.log("Split Indices Found: " + splind);
            console.log("Raw Author Names Found: " + rawauthnames);
            console.log("Authors Found: ");
            for (let i in authors) {
                console.log(i);
                console.log("Given: " + authors[i]['given']);
                console.log("Family: " + authors[i]['family']);
            }
        }
        return authors
    }
};