import React, {useEffect, useState} from 'react';
import RemixerFunctions from "../reusableFunctions";
import Tooltip from "@material-ui/core/Tooltip";
import Button from "@material-ui/core/Button";
import ArrowBack from "@material-ui/icons/ArrowBack";
import Publish from "@material-ui/icons/Publish";
import Archive from "@material-ui/icons/Archive";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import List from "@material-ui/core/List";
import {withStyles} from '@material-ui/core/styles';
import MuiExpansionPanel from '@material-ui/core/Accordion';
import MuiExpansionPanelSummary from '@material-ui/core/AccordionSummary';
import MuiExpansionPanelDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Description from "@material-ui/icons/Description";
import {FixedSizeList} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Toolbar from "@material-ui/core/Toolbar";
import LinearProgress from "@material-ui/core/LinearProgress";
import {useSnackbar} from 'notistack';
import IconButton from "@material-ui/core/IconButton";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Dialog from "@material-ui/core/Dialog";


export default function PublishPanel(props) {
	let permission = RemixerFunctions.userPermissions(true);
	let [pageArray, setPageArray] = useState([]);
	let [sorted, setSorted] = useState({});
	const [panel, setPanel] = React.useState('summary');
	let [initialized, setInitialized] = React.useState();
	let [publishing, setPublishing] = React.useState();
	let [reviseDialog, setReviseDialog] = React.useState(false);
	const {enqueueSnackbar} = useSnackbar();
	
	useEffect(() => {
		let LTPreview = $('#LTPreviewForm');
		if (LTPreview && panel === 'tree') {
			if (!initialized) {
				LTPreview.fancytree({
					source: props.RemixTree,
					debugLevel: 0,
					autoScroll: true,
				});
				setInitialized(true);
			}
		}
	});
	
	function sortPages() {
		let tree = props.RemixTree;
		let arrayResult = addLinks(tree, '', 'topic-category');
		let objectResult = {moved: [], renamed: [], tagsModified: []};
		
		function addLinks(current, parentType) {
			current = {...current, ...current.data};
			current.parentType = parentType;
			let array = [current];
			if (current && current.children && current.children.length) {
				current.children.forEach((child) => {
					child.parentDeleted = current.data.status === 'deleted';
					array = array.concat(addLinks(child, current.articleType));
				});
			}
			return array;
		}
		
		arrayResult.forEach((page) => {
			let copyMode = page.copyMode || props.defaultCopyMode;
			page.status = page.status || (props.mode === 'Remix' ? 'new' : 'unchanged');
			if (!page.sourceURL)
				copyMode = 'blank'; //pages without a source are blank
			page.copyMode = copyMode;
			
			if (props.mode === 'Remix') {
				if (objectResult[copyMode])
					objectResult[copyMode].push(page);
				else
					objectResult[copyMode] = [page];
			}
			else if (props.mode === 'ReRemix') {
				if (page.status === 'modified') {
					if (page.data.parentID !== page.data.original.data.parentID) { //moved
						page.data.modifiedType = 'Moved';
						objectResult['moved'].push(page);
					}
					else if (page.data.padded !== page.data.original.data.padded
						|| page.title !== page.data.original.title) { //renamed
						page.data.modifiedType = 'Renamed';
						objectResult['renamed'].push(page);
					}
					else {
						page.data.modifiedType = 'Tags Modified';
						objectResult['tagsModified'].push(page);
					}
				}
				
				
				if (objectResult[page.status])
					objectResult[page.status].push(page);
				else
					objectResult[page.status] = [page];
			}
			let structureError = checkStructure(page.articleType, page.parentType);
			if (structureError) {
				if (objectResult.badStructure)
					objectResult.badStructure.push(page);
				else
					objectResult.badStructure = [page];
			}
		});
		console.log(arrayResult, objectResult);
		setPageArray(arrayResult);
		setSorted(objectResult);
	}
	
	useEffect(() => {
		if (!pageArray || !pageArray.length) {
			sortPages();
		}
	}, [props.RemixTree]);
	
	function generateSummary() {
		const listStyle = {
			flex: 1,
			display: 'flex',
			flexDirection: 'column',
			fontSize: 'larger',
			overflow: 'auto',
			width: '100%',
		};
		if (props.mode === 'Remix') {
			return <List style={listStyle}>
				{listItem(sorted.blank, 'unchanged', 'will be blank pages')}
				{listItem(sorted.transclude, 'new', 'will be copy-transcluded')}
				{listItem(sorted.fork, 'new', 'will be copy-forked')}
				{props.permission === 'Admin' ? listItem(sorted.full, 'modified', 'will be copy-full') : null}
				{listItem(sorted.badStructure, 'deleted', 'will have non-recommended structure!')}
			</List>;
		}
		else if (props.mode === 'ReRemix') {
			return <List style={listStyle}>
				{listItem(sorted.new, 'new', 'will be added')}
				{listItem(sorted.moved, 'modified', 'will be moved')}
				{listItem(sorted.renamed, 'modified', 'will be renamed')}
				{listItem(sorted.tagsModified, 'modified', 'will have tags modified')}
				{listItem(sorted.deleted, 'deleted', 'will be deleted')}
				{listItem(sorted.unchanged, 'unchanged', 'will be unchanged')}
			</List>;
		}
		else
			return <div style={{flex: 1}}>Invalid Mode</div>;
		
		function listItem(array = [], statusColor, text) {
			let length = array.length;
			statusColor = RemixerFunctions.statusColor(statusColor);
			return <ExpansionPanel style={{color: statusColor}}>
				<ExpansionPanelSummary
					expandIcon={<ExpandMoreIcon/>}>
					<Description style={{color: statusColor}}/>
					{length} pages {text}
				</ExpansionPanelSummary>
				<ExpansionPanelDetails>
					<ul style={{width: '100%', fontSize: '80%'}}>
						{array.map((elem, index) => <li key={index}>{elem.title}</li>)}
					</ul>
				</ExpansionPanelDetails>
			</ExpansionPanel>;
		}
	}
	
	const reloadReRemix = async () => {
		const current = props.RemixTree;
		current.children = await RemixerFunctions.getSubpages(props.RemixTree.data.url, props.RemixTree.data.subdomain, {
			includeMatter: true,
			full: true,
			defaultStatus: 'unchanged'
		});
		RemixerFunctions.ReRemixTree(current, current.data.path);
		props.updateRemixer({stage: 'Remixing', RemixTree: current, currentlyActive: ''});
		enqueueSnackbar(`${current.title} is ready for ReRemixing!`, {
			variant: 'success',
			anchorOrigin: {
				vertical: 'bottom',
				horizontal: 'right',
			},
		});
	};
	
	return <div id='LTForm' className='publishPanel'>
		<div id='LTFormContainer'>
			<Paper>
				<AppBar position="static" style={{backgroundColor: '#F44336'}}>
					<Tabs value={panel} onChange={(e, v) => setPanel(v)} centered
					      aria-label="wrapped label tabs example">
						<Tab value="summary" label="Publish Summary"/>
						<Tab
							value="tree"
							label="LibreText Preview"
						/>
					</Tabs>
				</AppBar>
				{panel === 'summary' ? generateSummary() : null}
				<div id='LTPreviewForm' className='treePanel'
				     style={{display: panel === 'tree' ? 'flex' : 'none'}}></div>
				<ButtonGroup
					variant="outlined"
					size="large"
					style={{marginTop: 10}}
					aria-label="large contained secondary button group">
					<Button
						onClick={() => publishing && props.mode === 'ReRemix' ? setReviseDialog(true) : props.updateRemixer({stage: 'Remixing'})}>
						<ArrowBack/>Revise
					</Button>
					<Button color='secondary' onClick={() => setPublishing(Math.random())}>
						Save to Server<Publish/>
					</Button>
				</ButtonGroup>
			</Paper>
			<PublishSubPanel {...props} working={pageArray} sorted={sorted} publishing={publishing}/>
			<Dialog open={reviseDialog} onClose={() => setReviseDialog(false)}
			        aria-labelledby="form-dialog-title">
				<DialogTitle id="form-dialog-title">Revise or Select Another Text?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Since you have published, your Remix map is likely out of date. It is highly recommended to
						reload the Text in order to incorporate your new changes. Alternatively, you can select
						a different Text to Remix.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => props.updateRemixer({stage: 'Remixing'})} color="primary">
						Cancel
					</Button>
					<Button onClick={reloadReRemix} color="primary">
						Revise current Text
					</Button>
					<Button onClick={() => {
						props.updateRemixer({stage: 'ReRemixing'});
					}} color="primary">
						Select another Text
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	</div>;
}

function PublishSubPanel(props) {
	const [counter, setCounter] = useState(0);
	const [results, setResults] = useState([]);
	const [seconds, setSeconds] = useState(-1);
	const [state, setState] = useState('');
	const [finished, setFinished] = useState('');
	let [show, setShow] = React.useState({success: true, failed: true});
	const [isActive, setIsActive] = useState(false);
	const {enqueueSnackbar} = useSnackbar();
	let total = props.working.length;
	if (props.sorted.unchanged)
		total -= props.sorted.unchanged.length;
	
	useEffect(() => {
		if (props.publishing && props.working) {
			console.log('Publishing!!!');
			publish().then();
		}
	}, [props.publishing]);
	
	useEffect(() => {
		let interval = null;
		if (isActive) {
			interval = setInterval(() => {
				setSeconds(seconds => seconds + 1);
			}, 1000);
		}
		else if (!isActive && seconds !== 0) {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [isActive, seconds]);
	
	return <Paper>
		{generateStatusBar()}
		<div id="results">
			<AutoSizer disableHeight={true}>
				{({height, width}) => (
					<FixedSizeList
						className="List"
						height={380}
						itemCount={results.length}
						itemSize={20}
						width={width}
					>
						{({index, style}) => {
							let page = results[index];
							if (page.isFailed && show.failed)
								return <Tooltip title={page.isFailed}>
									<div style={{...style, color: 'red'}}
									     key={results.length - index - 1}>{results.length - index - 1} FAILED&nbsp;
										<a target='_blank' href={page.url}>{page.title}</a></div>
								</Tooltip>;
							else if (!page.isFailed && show.success)
								return <div style={{...style, color: page.color}}
								            key={results.length - index - 1}>{results.length - index - 1} {page.text}&nbsp;
									<a target='_blank' href={page.url}>{page.title}</a></div>;
							else return null;
						}}
					</FixedSizeList>
				)}
			</AutoSizer>
		</div>
		<AppBar position="static" style={{backgroundColor: RemixerFunctions.userPermissions(true).color}}>
			<Toolbar style={{display: 'flex', flexDirection: 'column'}}>
				{finished ? <div style={{display: 'flex'}}>
					{/*<FormControlLabel
						style={{display: 'flex', alignItems: 'center', margin: '0 5px 0 0'}}
						control={
							<Switch
								inputProps={{'aria-label': 'primary checkbox'}}
								checked={show.success}
								onChange={() => setShow({...show, ...{success: !show.success}})}
							/>}
						label="Show Successful"/>
					<FormControlLabel
						style={{display: 'flex', alignItems: 'center', margin: '0 5px 0 0'}}
						control={
							<Switch
								inputProps={{'aria-label': 'primary checkbox'}}
								checked={show.failed}
								onChange={() => setShow({...show, ...{failed: !show.failed}})}
							/>}
						label="Show Failed"/>*/}
					
					<h6><a href={finished} target='_blank'>Your new Text is available here</a></h6>
					<Tooltip title='Download Progress Log'
					         onClick={saveLog}><IconButton><Archive/></IconButton></Tooltip><br/>
					{'Basic' === props.permission ? <h6>
						<a href={`mailto:info@libretexts.org?Subject=Move Remix to Campus Hub ${finished}`}>
							Contact info@libretexts.org to move this Remix to a Campus Hub</a>
					</h6> : null}
				</div> : null}
				<LinearProgress variant="determinate" style={{width: '100%'}}
				                value={Math.round(counter.pages / total * 1000) / 10}/>
			</Toolbar>
		</AppBar>
	</Paper>;
	
	function generateStatusBar() {
		switch (state) {
			case 'processing':
				return <div className="status" style={{backgroundColor: 'orange'}}>
					<div>
						Publish In Progress
						({`${Math.round(counter.pages / total * 1000) / 10}%`})<br/>
						{counter.pages} / {total}
					</div>
					<div className="spinner">
						<div className="bounce1"/>
						<div className="bounce2"/>
						<div className="bounce3"/>
					</div>
					<div>
						{`Time Elapsed: ${seconds} seconds`}<br/>
						{`Time Remaining: ${counter.eta}`}
					</div>
				</div>;
			case 'done':
				return <div className="status"
				            style={{
					            backgroundColor: 'green',
					            display: 'flex',
					            flexDirection: 'column',
					            wordBreak: 'break-all'
				            }}>Import Complete!
				</div>; //  View your results here <a target='_blank' href={finished}>{finished}</a>
			default:
				return <div className="status"
				            style={{backgroundColor: 'grey', display: 'flex', flexDirection: 'column'}}>Results
				</div>;
		}
	}
	
	function saveLog() {
		let result = new Blob([JSON.stringify({results: results, ...props}, null, 2)], {type: 'application/json;charset=utf-8'});
		const textToSaveAsURL = window.URL.createObjectURL(result);
		const fileNameToSaveAs = `${props.RemixTree.title}-${props.institution.match(/(?<=\/)[^/]*?$/)[0]}.librelog`;
		
		const downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download Log File";
		downloadLink.href = textToSaveAsURL;
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
		
		downloadLink.click();
		
		function destroyClickedElement(event) {
			document.body.removeChild(event.target);
		}
	}
	
	async function publish() {
		if (props.mode === 'Remix' && props.institution === '') {
			if (confirm('Would you like to send an email to info@libretexts.com to request your institution?'))
				window.location.href = 'mailto:info@libretexts.org?subject=Remixer%20Institution%20Request';
			return false;
		}
		if (!props.RemixTree.title || props.RemixTree.title === "New Untitled Remix") {
			enqueueSnackbar(`No Title provided!`, {
				variant: 'error',
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'right',
				},
			});
			return false;
		}
		let destRoot;
		if (props.mode === 'Remix') {
			destRoot = props.institution;
			if (destRoot.endsWith('Sandboxes')) {
				destRoot += `/${document.getElementById('usernameHolder').innerText}`;
			}
			destRoot = `${destRoot}/${props.RemixTree.title.replace(/ /g, '_')}`;
		}
		else
			destRoot = props.RemixTree.data.url;
		
		let response = await LibreTexts.authenticatedFetch(destRoot, 'info');
		if (response.ok && props.mode !== 'ReRemix') {
			enqueueSnackbar(`The page ${destRoot} already exists! You must either change the Title or change where you are saving this Remix.`, {
				variant: 'warning',
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'right',
				},
				autoHideDuration: 10000,
			});
			return false;
		}
		if (props.permission === 'Demonstration') {
			if (confirm('Thanks for trying out the OER Remixer in Demonstration mode!\n\nIf you are interested, contact us to get a free account so that you can publish your own LibreText! Would you like to send an email to info@libretexts.com to get started?'));
				window.location.href = 'mailto:info@libretexts.org?subject=Remixer%20Account%20Request';
			return false;
		}
		
		//All set to start publish
		setState('processing');
		setCounter({
			pages: 0,
			eta: 'Calculating',
		});
		setSeconds(0);
		setResults([]);
		await LibreTexts.sendAPI('createSandbox');
		setIsActive(true);
		console.log(props);
		let writeMode = 'edittime=now';
		let startedAt = new Date();
		
		//process cover
		/*if (props.mode === 'Remix') {
			LibreTexts.authenticatedFetch(destRoot, `files/${encodeURIComponent(encodeURIComponent(destRoot + '.libremap'))}?dream.out.format=json`, null, {
				method: 'PUT',
				body: JSON.stringify(props, null, 2),
			});
		}*/
		
		setFinished(destRoot);
		for (const page of props.working) {
			await processPage(page);
		}
		if (props.sorted.deleted)
			for (const page of props.sorted.deleted) {
				let response;
				if (!page.parentDeleted)
					response = await LibreTexts.authenticatedFetch(page.path, '?recursive=true', null, {
						method: 'DELETE'
					});
				await completedPage(page, 'Deleted', 'deleted', response);
			}
		
		
		for (const page of props.working) {
			let response;
			if (['topic-category', 'topic-guide'].includes(page.articleType))
				response = await LibreTexts.authenticatedFetch(page.path, 'unorder', null, {
					method: 'PUT'
				});
		}
		setState('done');
		setCounter({
			pages: total,
			eta: 'Done!',
		});
		setIsActive(false);
		
		async function completedPage(page, text, color, isFailed = false) {
			if (text !== 'Deleted')
				setCounter(
					(counter) => {
						let current = counter.pages + 1;
						const elapsed = (new Date() - startedAt) / 1000;
						const rate = current / elapsed;
						const estimated = total / rate;
						const eta = estimated - elapsed;
						
						return {
							pages: current,
							eta: secondsToStr(eta),
						}
					}
				);
			let message = '';
			if (isFailed && typeof isFailed !== 'string') {
				if (!isFailed.ok) {
					try {
						if (!isFailed.bodyUsed)
							message = await isFailed.json();
					} catch (e) {
						if (!isFailed.bodyUsed)
							message = await isFailed.text();
					}
					switch (isFailed.status) {
						case 403:
							isFailed = '403 Forbidden - User does not have permission to modify\n';
							break;
						case 500:
							isFailed = '500 Server Error\n';
							break;
						case 409:
							isFailed = '409 Conflict - Page already exists\n';
							break;
						default:
							isFailed = 'Error ' + isFailed.status + '\n';
							break;
					}
				}
				else
					isFailed = false;
			}
			if (text !== 'Skipped')
				setResults(results => {
					results.unshift({
						title: page.title,
						text: text,
						url: page.url,
						color: RemixerFunctions.statusColor(color),
						isFailed: isFailed,
						message: message,
					});
					return results
				});
		}
		
		async function processPage(page) {
			await getURL(page);
			
			switch (page.status) {
				case'new':
					let contents, response, source;
					
					if (page.copyMode === 'blank') { //process new blank pages
						contents = `<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:${page.articleType}</a>${page.key === 'ROOT' ? '<a href=\"#\">coverpage:yes</a>' : ''}</p>`;
						if (['topic-category', 'topic-guide'].includes(page.articleType))
							contents = '<p>{{template.ShowOrg()}}</p>' + contents;
						
						response = await LibreTexts.authenticatedFetch(page.path, `contents?${writeMode}&dream.out.format=json&title=${encodeURIComponent(page.title)}`, null, {
							method: 'POST',
							body: contents,
						});
						if (!response.ok) {
							await completedPage(page, `New blank ${RemixerFunctions.articleTypeToTitle(page.articleType)}`, 'new', response);
						}
						else {
							if (page.articleType === 'topic-guide') {
								await Promise.all([putProperty("mindtouch.idf#guideDisplay", "single", page.path),
									putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", page.path)]
								)
							}
							else if (page.articleType === 'topic-category')
								await putProperty('mindtouch.idf#subpageListing', 'simple', page.path);
							
							
							await putProperty('mindtouch.page#welcomeHidden', true, page.path);
							let image = await fetch('https://files.libretexts.org/DefaultImages/default.png');
							image = await image.blob();
							await LibreTexts.authenticatedFetch(page.path, 'files/=mindtouch.page%2523thumbnail', null, {
								method: 'PUT',
								body: image,
							});
							await completedPage(page, `New blank ${RemixerFunctions.articleTypeToTitle(page.articleType)}`, 'new');
						}
						return;
					} // end for new pages
					const [currentSubdomain] = LibreTexts.parseURL();
					source = await LibreTexts.getAPI(page.sourceURL || '');
					if (source.error) {
						await completedPage(page, `Source Error`, 'new', source.response);
						return;
					}
					let index = 1;
					for (let tag of source.tags) {
						if (tag.startsWith('source[')) {
							let subindex = tag.match(/(?<=^source\[)[0-9]+(?=]-)/);
							if (subindex)
								subindex = subindex[0];
							if (subindex > index)
								index = subindex + 1;
						}
					}
					source.tags.push(`source[${index}]-${source.subdomain}-${source.id}`);
					if (!source.tags.includes('article:topic') && page.copyMode === 'transclude')
						page.copyMode = 'fork';
					
					
					//change page contents
					switch (page.copyMode) {
						case 'transclude':
							source.tags.push('transcluded:yes');
							page.tags = page.tags.concat(source.tags);
							if (currentSubdomain !== source.subdomain) {
								contents = `<p class="mt-script-comment">Cross Library Transclusion</p>
				
				<pre class="script">
				template('CrossTransclude/Web',{'Library':'${source.subdomain}','PageID':${source.id}});</pre>
				
				<div class="comment">
				<div class="mt-comment-content">
				<p><a href="${source.url}">Cross-Library Link: ${source.url}</a><br/>source-${source.subdomain}-${source.id}</p>
				</div>
				</div>
				${renderTags(page.tags)}`;
							}
							else {
								let [tempSubdomain, tempPath] = LibreTexts.parseURL(source.url);
								contents = `<div class="mt-contentreuse-widget" data-page="${tempPath}" data-section="" data-show="false">
				<pre class="script">
				wiki.page("${tempPath}", NULL)</pre>
				</div>
				
				<div class="comment">
				<div class="mt-comment-content">
				<p><a href="${tempPath}">Content Reuse Link: ${tempPath}</a></p>
				</div>
				</div>
				${renderTags(page.tags)}`;
							}
							response = await LibreTexts.authenticatedFetch(page.path, `contents?${writeMode}&dream.out.format=json&title=${encodeURIComponent(page.title)}`, null, {
								method: 'POST',
								body: contents,
							});
							if (!response.ok) {
								await completedPage(page, 'Transcluded', 'new', response);
								return;
							}
							await completedPage(page, 'Transcluded', 'new');
							break;
						case 'fork':
						case 'full':
							if (source.subdomain === currentSubdomain && 'Admin' === props.permission)
								contents = await LibreTexts.authenticatedFetch(source.path, 'contents?mode=raw', source.subdomain);
							else
								contents = await fetch('https://api.libretexts.org/endpoint/contents', {
									method: 'PUT',
									body: JSON.stringify({
										path: source.path,
										api: 'contents?mode=raw',
										subdomain: source.subdomain,
									}),
								});
							contents = await contents.text();
							contents = contents.match(/<body>([\s\S]*?)<\/body>/)[1].replace('<body>', '').replace('</body>', '');
							contents = LibreTexts.decodeHTML(contents);
							page.tags = page.tags.concat(source.tags);
							contents += renderTags(page.tags);
							
							if (page.copyMode === 'fork') {
								contents = contents.replace(/\/@api\/deki/g, `https://${source.subdomain}.libretexts.org/@api/deki`);
								contents = contents.replace(/ fileid=".*?"/g, '');
							}
							else if (page.copyMode === 'full') {
								//Fancy file transfer VERY SLOW BUT EFFECTIVE
								let files = source.files;
								let promiseArray = [];
								for (let i = 0; i < files.length; i++) {
									let file = files[i];
									promiseArray.push(processFile(file, source, page.path, file['id']));
								}
								promiseArray = await Promise.all(promiseArray);
								for (let i = 0; i < promiseArray.length; i++) {
									if (promiseArray[i]) {
										contents = contents.replace(promiseArray[i].original, promiseArray[i].final);
										contents = contents.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
									}
								}
								
								// Handling of hotlinked images (not attached to the page)
								response = await LibreTexts.authenticatedFetch(page.path, 'files?dream.out.format=json');
								if (response.ok) {
									let files = await response.json();
									if (files['@count'] !== '0') {
										if (files.file) {
											if (!files.file.length) {
												files = [files.file];
											}
											else {
												files = files.file;
											}
										}
										files = files.map((file) => file['@id']);
										
										let promiseArray = [];
										let images = contents.match(/(<img.*?src="\/@api\/deki\/files\/)[\S\s]*?(")/g);
										if (images) {
											for (let i = 0; i < images.length; i++) {
												images[i] = images[i].match(/src="\/@api\/deki\/files\/([\S\s]*?)["/]/)[1];
												
												if (!files.includes(images[i])) {
													promiseArray.push(processFile(null, source, page.path, images[i]));
												}
											}
											
											promiseArray = await Promise.all(promiseArray);
											for (let i = 0; i < promiseArray.length; i++) {
												if (promiseArray[i]) {
													contents = contents.replace(promiseArray[i].original, promiseArray[i].final);
													contents = contents.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
												}
											}
										}
									}
								}
							}
							response = await LibreTexts.authenticatedFetch(page.path, `contents?${writeMode}&dream.out.format=json&title=${encodeURIComponent(page.title)}`, null, {
								method: 'POST',
								body: contents,
							});
							if (!response.ok) {
								if (page.copyMode === 'fork')
									await completedPage(page, 'Forked', 'new', response);
								else
									await completedPage(page, 'Full-Copied', 'modified', response);
								return;
							}
							if (page.copyMode === 'fork')
								await completedPage(page, 'Forked', 'new');
							else
								await completedPage(page, 'Full-Copied', 'modified');
					}
					
					//Handle properties
					if (page.articleType === 'topic-guide')
						source.properties = source.properties.concat([{
							name: "mindtouch.idf#guideDisplay",
							value: "single"
						}, {
							name: "mindtouch#idf.guideTabs",
							value: "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]"
						}]);
					else if (page.articleType === 'topic-category')
						source.properties.push({name: 'mindtouch.idf#subpageListing', value: 'simple'});
					source.properties.push({name: 'mindtouch.page#welcomeHidden', value: true});
					
					let tempProp = {}; //deduplicate
					source.properties.forEach(item => tempProp[item.name] = item.value);
					source.properties = Object.keys(tempProp).map(key => {
						return {name: key, value: tempProp[key]}
					});
					
					await Promise.all(source.properties.map(async prop => putProperty(prop.name, prop.value, page.path)));
					
					//Thumbnail
					let files = source.files || [], image;
					if (page.files.find(file => file.filename === 'mindtouch.page#thumbnail')) {
						//skip if already has thumbnail
					}
					if ((files.find(file => file.filename === 'mindtouch.page#thumbnail' || file.filename === 'mindtouch.page%23thumbnail')))
						image = await LibreTexts.authenticatedFetch(source.url, 'thumbnail', source.subdomain);
					else if (page.articleType === 'topic-category' || page.articleType === 'topic-guide')
						image = await fetch('https://files.libretexts.org/DefaultImages/default.png');
					if (image) {
						image = await image.blob();
						await LibreTexts.authenticatedFetch(page.path, 'files/=mindtouch.page%2523thumbnail', null, {
							method: 'PUT',
							body: image,
						})
					}
					break;
				case 'modified':
					let oldTags = [...page.data.original.data.tags, `article:${page.data.original.data.articleType}`].sort();
					let newTags = [...page.tags, `article:${page.articleType}`].sort();
					if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) { //modify tags
						console.log(oldTags, newTags);
						const result = `<tags>${newTags.map(elem => `<tag value="${elem}"/>`).join("")}</tags>`;
						response = await LibreTexts.authenticatedFetch(page.path, 'tags?dream.out.format=json', null, {
							method: "PUT",
							body: result,
							headers: {
								"Content-Type": "text/xml; charset=utf-8",
							}
						});
						//TODO maybe modify properties?
					}
					//page moved or renamed
					switch (page.data.modifiedType) {
						case 'Moved':
							response = await LibreTexts.authenticatedFetch(page.path, `move?title=${encodeURIComponent(page.title)}&to=${page.newPath}&allow=deleteredirects&dream.out.format=json`,
								null, {
									method: 'POST'
								});
							break;
						case 'Renamed':
							response = await LibreTexts.authenticatedFetch(page.path, `move?title=${encodeURIComponent(page.title)}&name=${encodeURIComponent(page.padded)}&allow=deleteredirects&dream.out.format=json`,
								null, {
									method: 'POST'
								});
							break;
						case 'Modified Tags':
							break;
						
					}
					await completedPage(page, page.data.modifiedType, 'modified', response);
					break;
				case 'deleted': //skip because this is handled later
					break;
				case 'unchanged':
					// await completedPage(page, 'Skipped', 'unchanged');
					break;
			}
			
			function renderTags(tags) {
				let tagsHTML = tags.map((tag) => `<a href="#">${tag}</a>`).join('');
				return `<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em>${tagsHTML}</p>`
			}
		}
		
		async function getURL(page) {
			let url;
			if (props.mode === 'ReRemix' && page.data && page.data.original
				&& page.data.original.data && page.data.original.data.url) {
				url = page.data.original.data.url;
				
				[, page.newPath] = LibreTexts.parseURL(`${destRoot}${page.relativePath}`);
				
			}
			else {
				url = `${destRoot}${page.relativePath}`;
			}
			
			page.url = url;
			[, page.path] = LibreTexts.parseURL(url);
		}
		
		async function processFile(file, source, path, id) {
			let image, filename;
			if (!file) {
				image = await LibreTexts.authenticatedFetch(`https://${source.subdomain}.libretexts.org/@api/deki/files/${id}?dream.out.format=json`);
				filename = await LibreTexts.authenticatedFetch(`https://${source.subdomain}.libretexts.org/@api/deki/files/${id}/info?dream.out.format=json`);
				if (!image.ok || !filename.ok)
					return false;
				filename = await filename.json();
				filename = filename['filename'];
				
			}
			else if (!(file.contents['@href'].includes('mindtouch.page#thumbnail') || file.contents['@href'].includes('mindtouch.page%23thumbnail'))) {
				//only files with extensions
				filename = file['filename'];
				image = await LibreTexts.authenticatedFetch(source.path, `files/${filename}`, source.subdomain);
				if (!image.ok)
					return false;
			}
			
			
			if (filename) {
				image = await image.blob();
				
				let response = await LibreTexts.authenticatedFetch(path, `files/${filename}?dream.out.format=json`, null, {
					method: 'PUT',
					body: image,
				});
				if (!response.ok)
					return false;
				
				response = await response.json();
				let original = file ? file.contents['@href'].replace(`https://${source.subdomain}.libretexts.org`, '') : `/@api/deki/files/${id}`;
				return {
					original: original,
					oldID: id,
					newID: response['@id'],
					final: `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}`,
				};
			}
			return false;
		}
		
		async function putProperty(name, value, path) {
			await LibreTexts.authenticatedFetch(path, 'properties', null, {
				method: 'POST',
				body: value,
				headers: {
					'Slug': name,
				},
			});
		}
	}
}

function checkStructure(type, parentType) { //returns true when there is an error
	if (!type || !parentType)
		return false;
	switch (type) {
		case 'topic-category':
			return !(parentType === 'topic-category');
		case 'topic-guide':
			return !(parentType === 'topic-category');
		case 'topic':
			return !(parentType !== 'topic-category');
		default:
			return false;
	}
}


function secondsToStr(seconds) {
	return millisecondsToStr(seconds * 1000);
	
	// http://stackoverflow.com/a/8212878
	function millisecondsToStr(milliseconds) {
		// TIP: to find current time in milliseconds, use:
		// var  current_time_milliseconds = new Date().getTime();
		
		function numberEnding(number) {
			return (number > 1) ? 's' : '';
		}
		
		let temp = Math.floor(milliseconds / 1000);
		const years = Math.floor(temp / 31536000);
		if (years) {
			return years + ' year' + numberEnding(years);
		}
		const days = Math.floor((temp %= 31536000) / 86400);
		if (days) {
			return days + ' day' + numberEnding(days);
		}
		const hours = Math.floor((temp %= 86400) / 3600);
		if (hours) {
			return hours + ' hour' + numberEnding(hours);
		}
		const minutes = Math.floor((temp %= 3600) / 60);
		if (minutes) {
			return minutes + ' minute' + numberEnding(minutes);
		}
		const seconds = temp % 60;
		if (seconds) {
			return seconds + ' second' + numberEnding(seconds);
		}
		return 'less than a second'; //'just now' //or other string you like;
	}
}

function formatNumber(it) {
	return it.toPrecision(4);
}

const ExpansionPanel = withStyles({
	root: {
		border: '1px solid rgba(0, 0, 0, .125)',
		boxShadow: 'none',
		'&:not(:last-child)': {
			borderBottom: 0,
		},
		'&:before': {
			display: 'none',
		},
		'&$expanded': {
			margin: '0',
		},
	},
	expanded: {},
})(MuiExpansionPanel);

const ExpansionPanelSummary = withStyles({
	root: {
		borderBottom: '1px solid rgba(0, 0, 0, .125)',
		marginBottom: -1,
		minHeight: 56,
		'&$expanded': {
			minHeight: 56,
		},
	},
	content: {
		'&$expanded': {
			margin: '12px 0',
		},
	},
	expanded: {},
})(MuiExpansionPanelSummary);

const ExpansionPanelDetails = withStyles(theme => ({
	root: {
		padding: theme.spacing(2),
	},
}))(MuiExpansionPanelDetails);