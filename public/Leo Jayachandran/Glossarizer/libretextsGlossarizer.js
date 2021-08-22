LibreTextsGlossarizer = class {
    constructor() {
        this.pluginName = 'glossarizer';
        this.defaults = {
            replaceTag: 'div',
            /* Matching words will be wrapped with abbr tags by default */
            lookupTagName: 'p, ul, a, div',
            /* Lookup in either paragraphs or lists. Do not replace in headings */
            callback: null,
            /* Callback once all tags are replaced: Call or tooltip or anything you like */
            replaceOnce: false,
            /* Replace only once in a TextNode */
            replaceClass: 'glossarizer_replaced',
            caseSensitive: false,
            exactMatch: true
        };
        if (typeof(localStorage.glossarizerType) == "undefined" || !localStorage.getItem("glossarizerType")) {
            localStorage.setItem("glossarizerType", "textbook");
        }

    }
    isArticleTopicPage() {
        return document.getElementById('pageTagsHolder').innerText.includes(`"article:topic"`);
    }
    removeGlossary() {
        let pluginName = this.pluginName;
        let defaults = this.defaults;
        $('.mt-content-container').removeData('plugin_' + pluginName);

        /* Remove wrapping tag */
        $('.' + defaults.replaceClass).each(function () {
            let $this = $(this),
                text = $this.text()

            $this.replaceWith(text);
        });
        localStorage.setItem("glossarizerType", "none");
    }
    getTermCols(rowText) { // tableRows[r]
        let cols = {};
        let colStart = [
            [/(\<td[^\>]*?data-th="Word\(s\)"[^\>]*?\>)((.|\s)*?)(?=\<\/td>)/, "word"],
            [/(\<td[^\>]*?data-th="Definition"[^\>]*?\>)((.|\s)*?)(?=\<\/td>)/, "definition"],
            [/(\<td[^\>]*?data-th="Image"[^\>]*?\>)((.|\s)*?)(?=\<\/td>)/, "image"],
            [/(\<td[^\>]*?data-th="Caption"[^\>]*?\>)((.|\s)*?)(?=\<\/td>)/, "caption"],
            [/(\<td[^\>]*?data-th="Link"[^\>]*?\>)((.|\s)*?)(?=\<\/td>)/, "link"],
            [/(\<td[^\>]*?data-th="Source"[^\>]*?\>)((.|\s)*?)(?=\<\/td>)/, "source"],
            [/(\<td[^\>]*?data-th="Source License"[^\>]*?\>)((.|\s)*?)(?=\<\/td>)/, "license"],
            [/(\<td[^\>]*?data-th="Author URL"[^\>]*?\>)((.|\s)*?)(?=\<\/td>)/, "sourceURL"],
        ];
        for (let t = 0; t < colStart.length; t++) {
            let tag = colStart[t][0];
            //Test if tag exists
            if (tag.test(rowText)) {
                //Add contents if applicable
                cols[colStart[t][1]] = tag.exec(rowText)[2].trim();
            }
        }
        return cols;
    }
    async makeGlossary(inputSourceOption) {
        if (!this.isArticleTopicPage()) { //If article isn't a topic page, don't do anything
            return;
        }
        let sourceOption = inputSourceOption || localStorage.getItem("glossarizerType");
        let pluginName = this.pluginName;
        let defaults = this.defaults;
        let getTermCols = this.getTermCols;
        this.removeGlossary();
        let retrievedGlossary = [];
        switch ((sourceOption || "").trim().toLowerCase()) {
            case "none":
                return;
            case "iupac gold book":
                localStorage.setItem("glossarizerType", "iupac gold book");
                let goldbook = await $.getJSON("https://cdn.libretexts.net/github/LibreTextsMain/Leo%20Jayachandran/Glossarizer/goldbook_vocab.json");
                for (let i = 1; i <= 7035; i++) {
                    if (goldbook.entries[i].definition === null || goldbook.entries[i].term === null || goldbook.entries[i].definition.length == 0) { // If definition is empty skip term
                        continue;
                    }
                    let breakingTerms = ["Br&#xF8;nsted relation", "<i>", "<em>", "→"];
                    for (let u = 0; u < breakingTerms.length; u++) {
                        if (goldbook.entries[i].term.includes(breakingTerms[u])) {
                            continue;
                        }
                    }
                    let cleanedDef = "";

                    if (typeof goldbook.entries[i].definition === "object") {
                        for (let u = 0; u < goldbook.entries[i].definition.length; u++) {
                            if (goldbook.entries[i].definition[u].length)
                                cleanedDef += `<p>${i}. ${goldbook.entries[i].definition}</p>`;
                        }
                        if (cleanedDef.length == 0) {
                            continue;
                        }
                    } else {
                        cleanedDef = goldbook.entries[i].definition.trim();
                    }
                    retrievedGlossary.push({
                        "term": goldbook.entries[i].term,
                        "description": cleanedDef
                    });

                }
                break;
            case "ichem":
                localStorage.setItem("glossarizerType", "ichem");
                let ichemPage = 278612;
                retrievedGlossary = await getGlossaryJSON(ichemPage);
                break;
            case "achem":
                localStorage.setItem("glossarizerType", "achem");
                let achemPage = 278614;
                retrievedGlossary = await getGlossaryJSON(achemPage);
                break;
            case "ochem":
                localStorage.setItem("glossarizerType", "ochem");
                let ochemPage = 278613;
                retrievedGlossary = await getGlossaryJSON(ochemPage);
                break;
            case "textbook": //The textbook should be the default option
            default:
                localStorage.setItem("glossarizerType", "textbook");
                const coverPage = await LibreTexts.getCoverpage();
                const subdomain = window.location.origin.split('/')[2].split('.')[0];
                let glossaryPage = await LibreTexts.getAPI(`https://${subdomain}.libretexts.org/${coverPage}/zz%3A_Back_Matter/20%3A_Glossary`);
                retrievedGlossary = await getGlossaryJSON(glossaryPage.id);
        }
        async function getGlossaryJSON(sourceID) {
            let data = await LibreTexts.authenticatedFetch(sourceID, 'contents?dream.out.format=json').then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    console.debug("Textbook glossary not found!");
                    return {
                        body: ""
                    };
                }
            });
            let bodycontent = (typeof (data.body) == "string") ? data.body : data.body[0];
            if (!(bodycontent.includes('Word' + "(s)"))) {
                bodycontent = "";
                return [];
            }
            
            //Trim up to the start of the table body
            bodycontent = bodycontent.substring(bodycontent.search(/<tbody[^>]*?>[^<]*<tr[^>]*?>[^<]*<td[^>]*?data-th="Word\(s\)"/));

            //Find the contents table body of the glossary table
            let tbodyregex = /<tbody[^>]*?>(.|\s)*?(?=<\/tbody>)/;
            let tBody = tbodyregex.exec(bodycontent)[0];
            tBody = tBody.substring(tBody.search(/<tbody[^>]*?>/)).replace(/&nbsp;/g, " ").trim();
            
            //Generate the rows of the table
            let tableRows = [];
            //Search through tBody
            for (let i = 0; i < tBody.length;/*Incremented at the end of the loop*/) {
                //Change starting point to look for new row
                let trimmedBody = tBody.substring(i);
                
                let rowRegex = /<tr[^>]*?>((.|\s)*?)<\/tr>/;
                //Get the whole row including the <tr> tags
                let wholeRow = rowRegex.exec(trimmedBody);
                if (wholeRow == null) break;

                //Row contents without <tr> tags
                let rowContent = wholeRow[1].trim();
                tableRows.push(rowContent);

                //Increment search index to skip past this row
                i += wholeRow[0].length;
            }

            //Generate the Glossary
            let retrievedGlossary = [];
            for (let r = 0; r < tableRows.length; r++) {
                let newTerm = {
                    "term": "",
                    "description": ""
                };
                //Get data from the columns in the row
                let cols = getTermCols(tableRows[r]);
                newTerm["term"] = cols["word"].toLowerCase().replace(/<p>/g, " ").replace(/<\/p>/g, " ").trim();

                //Make Description
                if (cols["link"]?.length) {
                    let aTagStart = 'href="';
                    let aTagEnd = '">';
                    let href = cols["link"].substring(cols["link"].search(aTagStart) + aTagStart.length, cols["link"].search(aTagEnd));
                    cols["definition"] = `<a href = "${href}" target="_blank">${cols["definition"]}</a>`;
                }
                if (cols["image"]?.length) {
                    cols["definition"] += `<div class='imageContainer'>${cols["image"]}</div>`;
                }
                if (cols["caption"]?.length) {
                    cols["definition"] += `<p class = 'caption'>${cols["caption"]}</p>`;
                }
                let termSource = "";
                if (cols["license"]?.length) {
                    termSource += cols["license"].replace(/<p>/g, " ").replace(/<\/p>/g, " ").trim();
                }
                if (cols["source"]?.length) {
                    termSource += (termSource.length ? "; " : "") + cols["source"].replace(/<p>/g, " ").replace(/<\/p>/g, " ").trim();
                }
                if (cols["sourceURL"]?.length) { //Need to make source URL work (Check for whether a tag is present, or else use text as url)
                    cols["definition"] = cols["definition"].trim() + cols["sourceURL"].replace(/<p>/g, " ").replace(/<\/p>/g, " ").trim();
                }
                if (termSource.length) {
                    cols["definition"] = cols["definition"].trim() + `<p class = "glossarySource">[${termSource}]</p>`;
                }
                newTerm["description"] = cols["definition"];

                //Add new term
               if (newTerm["term"].split(",")) { //If more than 1 word is used for the term then split them up in the glossary element
                let terms  = newTerm["term"].split(",");
                for (let t = 0; t < terms.length; t++) {
                    if (terms[t].trim() === "" || terms[t].includes("!")) {
                        continue;
                    }
                    retrievedGlossary.push({"term": terms[t].trim(), "description": newTerm["description"]});
                }
                } else {
                    retrievedGlossary.push(newTerm);
                }
            }
            return retrievedGlossary;
        }

        if (retrievedGlossary.length <= 1) { // Deal with incompatible Glossary
            console.debug("incompatible glossary");
            return;
        }
        retrievedGlossary.sort((a,b) => {return b.term.length - a.term.length}) //sort from longest term to shortest term

        /**
         * Plugin Name: Glossarizer
         * Author : Vinay @Pebbleroad
         * Date: 02/04/2013
         * Description: Takes glossary terms from a JSON object -> Searches for terms in your html -> Wraps a abbr tag around the matched word
         * 1. Fixed IE8 bug where whitespace get removed - Had to change `abbr` tag to a block element `div`
         */
        /**
         * Constructor
         */

        function Glossarizer(el, options) {
            let base = this;
            base.el = el;

            /* Element */
            base.$el = $(el);

            /* Extend options */

            base.options = $.extend({}, defaults, options);

            /* Terms */

            base.terms = [];

            /* Excludes array */

            base.excludes = [];

            /* Replaced words array */

            base.replaced = [];

            /* Regex Tags */

            base.regexOption = (base.options.caseSensitive ? '' : 'i') + (base.options.replaceOnce ? '' : 'g');

            /* Fetch glossary JSON */
            //Trim the content to remove the example table
            //Shallow Copy
            base.glossary = [...retrievedGlossary];

            if (!base.glossary.length || base.glossary.length == 0) return;
            /**
             * Get all terms
             */

            for (let i = 0; i < base.glossary.length; i++) {
                let terms = base.glossary[i].term.split(',')

                for (let j = 0; j < terms.length; j++) {
                    /* Trim */

                    let trimmed = terms[j].replace(/^\s+|\s+$/g, ''),
                        isExclusion = trimmed.indexOf('!')

                    if (isExclusion == -1 || isExclusion != 0) {
                        /* Glossary terms array */

                        base.terms.push(trimmed)
                    } else {
                        /* Excluded terms array */

                        base.excludes.push(trimmed.substr(1))
                    }
                }
            }

            /**
             * Wrap terms
             */

            base.wrapTerms();

        }

        /**
         * Prototypes
         */
        Glossarizer.prototype = {
            getDescription: function (term) {
                let regex = new RegExp('(\,|\s*)' + this.clean(term) + '\\s*|\\,$', 'i')

                /**
                 * Matches
                 * 1. Starts with \s* (zero or more spaces)
                 * 2. Ends with zero or more spaces
                 * 3. Ends with comma
                 */

                for (let i = 0; i < this.glossary.length; i++) {
                    if (this.options.exactMatch) {
                        if (this.glossary[i].term == term.toLowerCase()) {
                            return this.glossary[i].description.replace(/\"/gi, '&quot;')
                        }
                    } else {
                        if (this.glossary[i].term.match(regex)) {
                            return this.glossary[i].description.replace(/\"/gi, '&quot;')
                        }
                    }
                }
            },
            clean: function (text) {
                let reEscape = new RegExp('(\\' + ['/', '.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')', 'g')

                return text.replace(reEscape, '\\$1')
            },

            /**
             * Wraps the matched terms by calling traverser
             */
            wrapTerms: function () {
                this.cleanedTerms = this.clean(this.terms.join('|'))
                this.excludedTerms = this.clean(this.excludes.join('|'))

                let nodes = this.el.querySelectorAll(this.options.lookupTagName)

                for (let i = 0; i < nodes.length; i++) {
                    this.traverser(nodes[i])
                }

                /**
                 * Callback
                 */

                if (this.options.callback) this.options.callback.call(this.$el)
            },

            /**
             * Traverses through nodes to find the matching terms in TEXTNODES
             */

            traverser: function (node) {
                let next,
                    base = this

                if (node.nodeType === 1) {
                    /*
                    Element Node
                    */

                    if (node = node.firstChild) {
                        do {
                            // Recursively call traverseChildNodes
                            // on each child node
                            next = node.nextSibling

                            /**
                             * Check if the node is not glossarized
                             */

                            if (node.className != this.options.replaceClass) {
                                this.traverser(node)
                            }
                        } while (node = next)
                    }
                } else if (node.nodeType === 3) {
                    /*
                    Text Node
                    */

                    let temp = document.createElement('div'),
                        data = node.data

                    let re = new RegExp('(?:^|\\b)(' + this.cleanedTerms + ')(?!\\w)', base.regexOption),
                        reEx = new RegExp('(?:^|\\b)(' + this.excludedTerms + ')(?!\\w)', base.regexOption)

                    if (re.test(data)) {
                        let excl = reEx.exec(data)

                        data = data.replace(re, function (match, item, offset, string) {
                            if (base.options.replaceOnce && inArrayIn(match, base.replaced) >= 0) {
                                return match
                            }

                            base.replaced.push(match)

                            let ir = new RegExp('(?:^|\\b)' + base.clean(match) + '(?!\\w)'),
                                result = ir.exec(data)

                            if (result) {
                                if (excl && base.excludes.length) {
                                    let id = offset,
                                        exid = excl.index,
                                        exl = excl.index + excl[0].length

                                    if (exid <= id && id <= exl) {
                                        return match
                                    } else {
                                        return '<' + base.options.replaceTag + ' class="' + base.options.replaceClass + '" title="' + base.getDescription(match) + '">' + match + '</' + base.options.replaceTag + '>'
                                    }
                                } else {
                                    return '<' + base.options.replaceTag + ' class="' + base.options.replaceClass + '" title="' + base.getDescription(match) + '">' + match + '</' + base.options.replaceTag + '>'
                                }
                            }
                        })

                        /**
                         * Only replace when a match is found
                         * Resorting to jQuery html() because of IE8 whitespace issue.
                         * IE 8 removes leading whitespace from Text Nodes. Hence innerhtml doesnt work.
                         *
                         */

                        $(temp).html(data)

                        while (temp.firstChild) {
                            node.parentNode.insertBefore(temp.firstChild, node)
                        }

                        node.parentNode.removeChild(node)
                    }
                }
            },

        }

        /**
         * Plugin
         * @param  {[type]} options
         */
        $.fn[pluginName] = function (options) {
            return this.each(function () {
                let $this = $(this),
                    glossarizer = $this.data('plugin_' + pluginName)

                /*
                Check if its a method
                */

                if (typeof options == 'string' && glossarizer && methods.hasOwnProperty(options)) {
                    glossarizer[options].apply(glossarizer)
                } else {
                    /* Destroy if exists */

                    if (glossarizer) glossarizer['destroy'].apply(glossarizer)

                    /* Initialize */

                    $.data(this, 'plugin_' + pluginName, new Glossarizer(this, options))
                }
            })
        };

        /**
         * In Array
         */

        function inArrayIn(elem, arr, i) {
            if (typeof elem !== 'string') {
                return $.inArray.apply(this, arguments)
            }

            if (arr) {
                let len = arr.length
                i = i ? (i < 0 ? Math.max(0, len + i) : i) : 0
                elem = elem.toLowerCase()
                for (; i < len; i++) {
                    if (i in arr && arr[i].toLowerCase() == elem) {
                        return i
                    }
                }
            }
            return -1
        }

        //Initialise Glossariser
        $(function () {
            $('.mt-content-container').glossarizer({
                callback: function () {
                    tippy("." + defaults.replaceClass, {
                        content(reference) {
                          const title = reference.getAttribute('title');
                          reference.removeAttribute('title');
                          return title;
                        },
                        theme: (localStorage.getItem("darkMode")== "true") ? 'dark' : 'light',
                        allowHTML: true,
                        interactive : true,
                        delay: [500, null],
                        popperOptions: {
                            modifiers: [
                                {
                                  name: 'preventOverflow',
                                  options: {
                                    padding: {left:30}, // Prevent clipping sidebar
                                  },
                                },
                              ],
                          },
                     });
                }
            });


        });

    }

    buildBackMatter() {
        //Hide the example table
        let $example = $("table:contains('Example and Directions')").hide()
        //Build the backend
        let $glossaryTable = $("table:contains('Word" + "(s)')")
        let tBody = $glossaryTable.html().replace(/&nbsp;/g, " ").replace(/<p>/g, " ").replace(/<\/p>/g, " ").trim();
        tBody = tBody.substring(tBody.search("<tbody"), tBody.search("</tbody>")).trim();
        let tableRows = [];
        for (let i = 0; i < tBody.length;) {
            let trimmedBody = tBody.substring(i);
            let rowStart = '<tr>';
            let rowEnd = '</tr>';
            let rowContent = trimmedBody.substring(trimmedBody.search(rowStart) + rowStart.length, trimmedBody.search(rowEnd)).trim();
            tableRows.push(rowContent);
            i += trimmedBody.search(rowEnd) + rowEnd.length;
        }
        //Generate the Glossary
        let glossaryList = [];
        for (let r = 0; r < tableRows.length; r++) {
            let newTerm = {
                "term": "",
                "description": ""
            };
            //Get cells in the 3 columns
            let cols = this.getTermCols(tableRows[r]);
            if (cols["definition"].trim().length === 0 || cols["word"].trim().length === 0) continue; // Handle empty terms and definitions
            let termSource = "";
            if (cols["license"]?.length) {
                termSource += cols["license"].replace(/<p>/g, " ").replace(/<\/p>/g, " ").trim();
            }
            if (cols["source"]?.length) {
                termSource += (termSource.length ? "; " : "") + cols["source"].replace(/<p>/g, " ").replace(/<\/p>/g, " ").trim();
            }
            
            if (termSource?.length) {
                cols["definition"] = cols["definition"].trim() + ` [${termSource}]`;
            }
            if (cols["link"]?.length) {
                let aTagStart = 'href="';
                let aTagEnd = '">';
                let href = cols["link"].substring(cols["link"].search(aTagStart) + aTagStart.length, cols["link"].search(aTagEnd));
                newTerm["description"] = `<a href = "${href}" target="_blank" class = "glossaryDefinition">${cols["definition"].trim()}</a>`;
            } else {
                newTerm["description"] = `<span class = "glossaryDefinition">${cols["definition"].trim()}</span>`;
            }
            let currentTerm = cols["word"].split(",")[0].trim();
            newTerm["term"] = `<span class = "glossaryTerm">${currentTerm}</span>`;
            glossaryList.push(newTerm);
        }
        // Sort Glossary Terms
        glossaryList.sort((a, b) => {
            return (a["term"].replace(/<.*?>/g, "").toLowerCase() < b["term"].replace(/<.*?>/g, "").toLowerCase()) ? -1 : 1;
        });
        let glossaryText = "";
        glossaryList.map((currentValue) => {
            glossaryText += '<p class="glossaryElement">' + currentValue["term"] + " | " + currentValue["description"] + "</p>";
        });
        // Render terms
        $glossaryTable.after(`<div id = "visibleGlossary">${glossaryText}</div>`);
        // Hide Glossary table
        $glossaryTable.hide()


    }
}


//Self Initialize
libretextGlossary = new LibreTextsGlossarizer(); // Needs to be accessible to the sidebar buttons
window.addEventListener('load', () => {
    if (navigator.webdriver || window.matchMedia('print').matches){
        return; //exit if not client-facing
    }
    else if (libretextGlossary && !LibreTexts.active.glossarizer) {
        LibreTexts.active.glossarizer = true;
        libretextGlossary.makeGlossary();
    }
});
