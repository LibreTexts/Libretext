import React from 'react';

import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
	root: {
		width: '100%',
	},
	heading: {
		fontSize: theme.typography.pxToRem(15),
		flexBasis: '33.33%',
		flexShrink: 0,
	},
	secondaryHeading: {
		fontSize: theme.typography.pxToRem(15),
		color: theme.palette.text.secondary,
	},
}));


export default function Tutorial() {
	const [panel, setPanel] = React.useState(0);
	
	function getSelect() {
		let steps = ['About this tutorial', 'Getting Started', 'Creating your Remix'];
		return steps.map((step, index) => <option value={index} key={index}>{index}: {step}</option>);
	}
	
	function getPanel() {
		switch (panel) {
			case 0:
				return <span>This tutorial will walk you though making a customized text using the LibreTexts
				                       remixing tool. Before creating a remix you will need to know what you want to
				                       create.
				                       The remixing tool can be used for simple tasks like creating a book that consists
				                       of
				                       select chapters of an existing resource or it can be used to create complex
				                       remixes
				                       consisting of multiple resources potentially across libraries. You can also
				                       create empty
				                       pages if you want to create your own content in parts of your customized book.
				                       This
				                       tutorial assumes that you know how you want to construct your remix, otherwise
				                       you can
				                       check out the page&nbsp;<a title="5.1: Building Remixing Maps"
				                                                  href="https://chem.libretexts.org/Courses/Remixer_University/Construction_Guide/6%3A_Remixing_Existing_Content/5.1%3A_Building_Remixing_Maps"
				                                                  rel="internal">Building Remixing Maps</a>.</span>;
			case 1:
				return <>
					<h2>Getting started</h2>
					
					<ol>
						<li>Enter the name you want for your book (typically your name and the name of the class) in the
						    first box ("LibreText name") and select your institution in the drop down menu. Only users
						    with editing privileges will have an institution in the drop-down menu and without edition
						    privileges you won't be able to save your remix (contact us directly at&nbsp;<a
								href="mailto:info@libretexts.org" rel="external nofollow" target="_blank"
								title="mailto:info@libretexts.org">info@libretexts.org</a>&nbsp;if an account is
						    desired). If you see the drop-down list but your institution isn't listed select "Remixer
						    University", it can be moved later.&nbsp;</li>
					</ol>
					
					<p className="mt-align-center"><img
						src="https://chem.libretexts.org/@api/deki/files/244945/Re%252Coxer1.png?revision=1&amp;size=bestfit&amp;width=890&amp;height=271"/>
					</p>
					
					<ol start="2">
						<li>The Remixer has two panels: The library panel and the Remix&nbsp;panel
						    (three if the tutorial panel is open). The library panel on
						    the left side contains the existing content on the LibreTexts site, the Remixer Panel on the
						    right side is where you will create your new Remix. At the top of the Library Panel you will
						    find the library selector, you can select material from any of our 13 libraries. In the
						    Remixer panel notice that the symbol&nbsp;<img alt="Symbol of three books on shelf"
						                                                   src="https://chem.libretexts.org/@api/deki/files/244951/book.png?revision=1"/>&nbsp;indicates
						    the top (book) level, the symbol&nbsp;
							<img alt="Symbol single book"
							     src="https://chem.libretexts.org/@api/deki/files/244952/chapter.png?revision=1"/>&nbsp;indicates
						    a chapter, and&nbsp;
							<img alt="Symbol single sheet of paper"
							     src="https://chem.libretexts.org/@api/deki/files/244953/section.png?revision=1"/>&nbsp;indicates
						    a section (or subsection).&nbsp;
						</li>
					</ol>
					
					<p className="mt-align-center"><img
						src="https://chem.libretexts.org/@api/deki/files/244954/remixer2.png?revision=1&amp;size=bestfit&amp;width=1080&amp;height=243"/>
					</p>
					
					<ol start="3">
						<li>Above the Remixer&nbsp;Panel you see the editor bar. Here you can
						    add a new (empty) page, change the title of a page or chapter,
						    delete a page or a chapter, undo your latest change or redo it,
						    merge folder up, delete the complete remix and start over, or
						    publish your remix.
						</li>
					</ol>
					
					<p className="mt-align-center"><img
						src="https://chem.libretexts.org/@api/deki/files/244955/remixer3.png?revision=1"/>
					</p>
				
				</>;
			case 2:
				return <>
					<h2>Creating your Remix</h2>
					
					<ol>
						<li>To insert a chapter or section from an existing book simply find
						    it in the Library panel and drag it to where you want it in your
						    remix. You can also drag over a whole book. If you do so make sure
						    to insert the book above the existing book symbol or your new book
						    will be inserted as chapter one (if that happens simply select the
						    "book chapter" and press "merge folder up"). You can edit your
						    remix by inserting or deleting pages and dragging sections and
						    chapters around as you wish.
						</li>
						<li>To change the name of a section or chapter first select it in the
						    remixing panel and then press "page properties" or simply double
						    click it.&nbsp;&nbsp;</li>
						<li>Your remixing&nbsp;map will be automatically stored on the
						    computer you are working on but you can also save it to a file by
						    selecting "Save Map". This allows you to share your remixing map
						    across computers or with other people.&nbsp;</li>
						<li>When you are ready to publish your remix press the green "publish"
						    button. You will first see an overview screen of your remix. If
						    you are happy with it press "publish" at the bottom of the left
						    publish summary. You can follow the publishing process as your
						    remix is being created in the right panel. When it is all done
						    click the link at the bottom of the right
						    panel.&nbsp;&nbsp;&nbsp;</li>
					</ol>
				</>;
		}
	}
	
	return <>
		<select className='LTFormSubdomain' value={panel} onChange={(e) => setPanel(Number(e.target.value))}>
			{getSelect()}
		</select>
		<div id='LTTutorial' style={{padding: 20, width:'auto', overflow:'auto', color:'black'}}>
			{getPanel()}
		</div>
	</>
}