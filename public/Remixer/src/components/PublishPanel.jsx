import React, {useEffect, useState} from 'react';
import RemixerFunctions from "../reusableFunctions";
import Tooltip from "@material-ui/core/Tooltip";
import Button from "@material-ui/core/Button";
import ArrowBack from "@material-ui/icons/ArrowBack";
import Publish from "@material-ui/icons/Publish";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Description from "@material-ui/icons/Description";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import {FixedSizeList} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {Switch} from "@material-ui/core";
import Toolbar from "@material-ui/core/Toolbar";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Warning from "@material-ui/icons/Warning";
import LinearProgress from "@material-ui/core/LinearProgress";


export default function PublishPanel(props) {
	let permission = RemixerFunctions.userPermissions(true);
	let [pageArray, setPageArray] = useState([]);
	let [sorted, setSorted] = useState({});
	const [panel, setPanel] = React.useState('summary');
	let [initialized, setInitialized] = React.useState();
	let [publishing, setPublishing] = React.useState();
	let [override, setOverride] = React.useState(false);
	
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
		let arrayResult = addLinks(tree, '', 'topic - category');
		let objectResult = {};
		
		function addLinks(current, parentPath, parentType) {
			current = {...current, ...current.data};
			current.parentType = parentType;
			current.path = current.key === "ROOT" ? '' : `${parentPath}/${current.padded || current.title}`;
			let array = current.key === "ROOT" ? [] : [current];
			if (current && current.children && current.children.length) {
				current.children.forEach((child) => {
					array = array.concat(addLinks(child, current.path, current.articleType));
				});
			}
			return array;
		}
		
		arrayResult.forEach((page) => {
			if (props.type === 'Remix') {
				let copyMode = page.copyMode || props.defaultCopyMode;
				page.status = page.status || 'new';
				if (!page.sourceURL)
					copyMode = 'blank'; //pages without a source are blank
				page.copyMode = copyMode;
				
				if (objectResult[copyMode])
					objectResult[copyMode].push(page);
				else
					objectResult[copyMode] = [page];
			}
			else if (props.type === 'ReRemix') {
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
			justifyContent: 'space-evenly',
			fontSize: 'larger'
		};
		if (props.type === 'Remix') {
			return <List style={listStyle}>
				{listItem(sorted.blank, 'unchanged', 'be blank pages')}
				{listItem(sorted.transclude, 'new', 'be transcluded')}
				{listItem(sorted.fork, 'new', 'be forked')}
				{listItem(sorted.full, 'modified', 'be full-copied')}
				{listItem(sorted.badStructure, 'deleted', 'have non-recommended structure!')}
			</List>;
		}
		else if (props.type === 'ReRemix') {
			return <List style={listStyle}>
				{listItem(sorted.new, 'new', 'be added')}
				{listItem(sorted.modified, 'modified', 'be modified')}
				{listItem(sorted.deleted, 'deleted', 'be deleted')}
				{listItem(sorted.unchanged, 'unchanged', 'be unchanged')}
			</List>;
		}
		else
			return <div style={{flex: 1}}>Invalid Mode</div>;
		
		function listItem(array, statusColor, text) {
			let length = 0;
			statusColor = RemixerFunctions.statusColor(statusColor);
			if (array && array.length)
				length = array.length;
			return <ListItem style={{color: statusColor}}><ListItemIcon>
				<Description style={{color: statusColor}}/>
			</ListItemIcon>
				{length} pages will {text}
			</ListItem>;
		}
	}
	
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
				{props.type === 'Remix' ?
					<Tooltip
						title='Existing pages will not be overwritten unless this option is enabled. Leave off for maximum safety.'>
						<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%'}}>
							<FormControlLabel
								style={{display: 'flex', alignItems: 'center', margin: '0 5px 0 0'}}
								control={
									<Switch
										inputProps={{'aria-label': 'primary checkbox'}}
										checked={override}
										onChange={() => setOverride(!override)}
									/>}
								label="Overwrite existing pages"/>
							<Warning style={{color: 'red'}}/>
						</div>
					</Tooltip> : null}
				<div id='LTPreviewForm' className='treePanel'
				     style={{display: panel === 'tree' ? 'flex' : 'none'}}></div>
				<ButtonGroup
					variant="outlined"
					size="large"
					style={{marginTop: 10}}
					aria-label="large contained secondary button group">
					<Button onClick={() => props.updateRemixer({stage: 'Remixing'})}>
						<ArrowBack/>Revise
					</Button>
					<Button color='primary' onClick={() => setPublishing(Math.random())}>
						Publish<Publish/>
					</Button>
				</ButtonGroup>
			</Paper>
			<PublishSubPanel {...props} working={pageArray} publishing={publishing} override={override}/>
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
				<div style={{display: 'flex', justifyContent: 'space-evenly'}}>
					<FormControlLabel
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
						label="Show Failed"/>
				</div>
				{finished ?
					<h6><a href={finished} target='_blank'>Your new LibreText will be available here</a></h6> : null}
				<LinearProgress variant="determinate"
				                value={Math.round(counter.pages / props.working.length * 1000) / 10}/>
			</Toolbar>
		</AppBar>
	</Paper>;
	
	function generateStatusBar() {
		switch (state) {
			case 'processing':
				return <div className="status" style={{backgroundColor: 'orange'}}>
					<div>
						Publish In Progress
						({counter.percentage})<br/>
						{counter.pages} / {props.working.length}
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
				            }}>Import Complete! View your results here <a target='_blank' href={finished}>{finished}</a>
				</div>;
			default:
				return <div className="status"
				            style={{backgroundColor: 'grey', display: 'flex', flexDirection: 'column'}}>Results
				</div>;
		}
	}
	
	async function publish() {
		if (props.institution === '') {
			if (confirm('Would you like to send an email to info@libretexts.com to request your institution?'))
				window.location.href = 'mailto:info@libretexts.org?subject=Remixer%20Institution%20Request';
			return false;
		}
		if (!props.name) {
			alert('No LibreText name provided!');
			return false;
		}
		let destRoot = props.institution;
		if (destRoot.includes('Remixer_University')) {
			destRoot += `/Username:_${document.getElementById('usernameHolder').innerText}`;
			await LibreTexts.authenticatedFetch(destRoot, 'contents?edittime=now', null, {
				method: 'POST',
				body: '<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a></p>',
			});
		}
		destRoot = `${destRoot}/${props.name.replace(/ /g, '_')}`;
		let response = await LibreTexts.authenticatedFetch(destRoot, 'info');
		if (response.ok && !props.override) {
			alert(`The page ${destRoot} already exists! Either change the LibreText name or bypass this safety check by enabling "Overwrite Existing Pages".`);
			return false;
		}
		
		//All set to start publish
		setState('processing');
		setCounter({
			percentage: 0,
			pages: 0,
			eta: 'Calculating',
		});
		setSeconds(0);
		setIsActive(true);
		setResults([]);
		console.log(props);
		let writeMode = props.override ? 'edittime=now' : 'abort=exists';
		
		if (props.mode === 'Anonymous') {
			if (confirm('Thanks for trying out the OER Remixer in Demonstration mode!\n\nIf you are interested, contact us to get a free account so that you can publish your own LibreText! Would you like to send an email to info@libretexts.com to get started?'))
				window.location.href = 'mailto:info@libretexts.org?subject=Remixer%20Account%20Request';
			return false;
		}
		let startedAt = new Date();
		
		//process cover
		await LibreTexts.authenticatedFetch(destRoot, `contents?${writeMode}`, null, {
			method: 'POST',
			body: '<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-category</a><a href=\"#\">coverpage:yes</a></p>',
		});
		await putProperty('mindtouch.idf#subpageListing', 'simple', destRoot);
		LibreTexts.authenticatedFetch(destRoot, `files/${encodeURIComponent(encodeURIComponent(destRoot + '.libremap'))}?dream.out.format=json`, null, {
			method: 'PUT',
			body: JSON.stringify(props, null, 2),
		});
		setFinished(destRoot);
		for (const page of props.working) {
			await processPage(page);
		}
		setState('done');
		setIsActive(false);
		
		function completedPage(page, text, color, isFailed = false) {
			setCounter(
				(counter) => {
					const total = props.working.length;
					let current = counter.pages + 1;
					const elapsed = (new Date() - startedAt) / 1000;
					const rate = current / elapsed;
					const estimated = total / rate;
					const eta = estimated - elapsed;
					
					return {
						percentage: `${Math.round(current / total * 1000) / 10}%`,
						pages: current,
						eta: secondsToStr(eta),
					}
				}
			);
			setResults(results => {
				if (isFailed)
					switch (isFailed.status) {
						case 403:
							isFailed = '403 Forbidden - User does not have permission to modify' + page.path + '\n';
							break;
						case 500:
							isFailed = '500 Server Error ' + page.path + '\n';
							break;
						case 409:
							isFailed = '409 Conflict - Page already exists ' + page.path + '\n';
							break;
						default:
							isFailed = 'Error ' + isFailed.status + ' ' + page.path + '\n';
							break;
					}
				
				results.unshift({
					title: page.title,
					text: text,
					url: page.url,
					color: RemixerFunctions.statusColor(color),
					isFailed: isFailed,
				});
				return results
			});
		}
		
		async function processPage(page) {
			let url = destRoot + (page.path);
			page.url = url;
			[, page.path] = LibreTexts.parseURL(url);
			
			if (page.status === 'new' || page.status === 'modified') {
				let contents, response, source;
				//TODO: Title and Move for ReRemix
				
				if (page.copyMode === 'blank') {
					contents = `<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:${page.articleType}</a></p>`;
					if (['topic-category', 'topic-guide'].includes(page.articleType))
						contents = '<p>{{template.ShowOrg()}}</p>' + contents;
					
					response = await LibreTexts.authenticatedFetch(page.path, `contents?${writeMode}&dream.out.format=json&title=${encodeURIComponent(page.title)}`, null, {
						method: 'POST',
						body: contents,
					});
					if (!response.ok) {
						completedPage(page, `New blank ${RemixerFunctions.articleTypeToTitle(page.articleType)}`, 'new', response);
					}
					else {
						if (page.articleType === 'topic-guide') {
							await Promise.all([putProperty("mindtouch.idf#guideDisplay", "single", page.path),
								putProperty('mindtouch.page#welcomeHidden', true, page.path),
								putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", page.path)]
							)
						}
						else if (page.articleType === 'topic-category')
							await putProperty('mindtouch.idf#subpageListing', 'simple', page.path);
						
						
						await putProperty('mindtouch.page#welcomeHidden', true, page.path);
						let image = await LibreTexts.authenticatedFetch('https://chem.libretexts.org/@api/deki/files/239314/default.png?origin=mt-web');
						image = await image.blob();
						await LibreTexts.authenticatedFetch(page.path, 'files/=mindtouch.page%2523thumbnail', null, {
							method: 'PUT',
							body: image,
						});
						completedPage(page, `New blank ${RemixerFunctions.articleTypeToTitle(page.articleType)}`, 'new');
					}
					return;
				} // end for new pages
				const [currentSubdomain] = LibreTexts.parseURL();
				source = await LibreTexts.getAPI(page.sourceURL || '');
				if (source.error) {
					completedPage(page, `Source Error`, 'new', source.response);
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
				
				switch (page.copyMode) {
					case 'transclude':
						source.tags.push('transcluded:yes');
						page.tags = page.tags.concat(source.tags);
						if (currentSubdomain !== source.subdomain) {
							contents = `<p className="mt-script-comment">Cross Library Transclusion</p>

<pre className="script">
template('CrossTransclude/Web',{'Library':'${source.subdomain}','PageID':${source.id}});</pre>

<div className="comment">
<div className="mt-comment-content">
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
							completedPage(page, 'Transcluded', 'new', response);
							return;
						}
						completedPage(page, 'Transcluded', 'new');
						break;
					case 'fork':
					case 'full':
						if (source.subdomain === currentSubdomain && ['Admin', 'Prop'].includes(props.mode))
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
							response = await LibreTexts.authenticatedFetch(source.path, 'files?dream.out.format=json', source.subdomain);
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
								}
								let promiseArray = [];
								for (let i = 0; i < files.length; i++) {
									let file = files[i];
									if (file['@res-is-deleted'] === 'false')
										promiseArray.push(processFile(file, source, page.path, file['@id']));
								}
								promiseArray = await Promise.all(promiseArray);
								for (let i = 0; i < promiseArray.length; i++) {
									if (promiseArray[i]) {
										contents = contents.replace(promiseArray[i].original, promiseArray[i].final);
										contents = contents.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
									}
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
												promiseArray.push(processFile(null, source, path, images[i]));
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
								completedPage(page, 'Forked', 'new', response);
							else
								completedPage(page, 'Full-Copied', 'modified', response);
							return;
						}
						if (page.copyMode === 'fork')
							completedPage(page, 'Forked', 'new');
						else
							completedPage(page, 'Full-Copied', 'modified');
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
				source.properties = [...new Set(source.properties)]; //deduplicate
				await Promise.all(source.properties.map(async prop => putProperty(prop.name, prop.value)));
				
				//Thumbnail
				let files = source.files || [], image;
				if (files.includes('mindtouch.page#thumbnail') || files.includes('mindtouch.page%23thumbnail'))
					image = await LibreTexts.authenticatedFetch(source.url, 'thumbnail', source.subdomain);
				else if (page.articleType === 'topic-category' || page.articleType === 'topic-guide')
					image = await LibreTexts.authenticatedFetch('https://chem.libretexts.org/@api/deki/files/239314/default.png?origin=mt-web');
				if (image) {
					image = await image.blob();
					await LibreTexts.authenticatedFetch(page.path, 'files/=mindtouch.page%2523thumbnail', null, {
						method: 'PUT',
						body: image,
					})
				}
			}
			else if (page.status === 'deleted') {
				await LibreTexts.authenticatedFetch(path, '', null, {
					method: 'DELETE',
					body: image,
				});
				completedPage(page, 'Deleted', 'deleted');
			}
			else if (page.status === 'unchanged') {
				completedPage(page, 'Skipped', 'unchanged');
			}
			
			function renderTags(tags) {
				let tagsHTML = tags.map((tag) => `<a href="#">${tag}</a>`).join('');
				return `<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em>${tagsHTML}</p>`
			}
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
				
				let response = await LibreTexts.authenticatedFetch(`/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}?dream.out.format=json`, null, null, {
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