import React from 'react';
import RemixerFunctions from '../reusableFunctions';

import Tutorial from './Tutorial.jsx';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Add from '@material-ui/icons/Add';
import Edit from '@material-ui/icons/Edit';
import Remove from '@material-ui/icons/Delete';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import Undo from '@material-ui/icons/Undo';
import Redo from '@material-ui/icons/Redo';
import Refresh from '@material-ui/icons/Refresh';
import Warning from "@material-ui/icons/Warning";
import Info from "@material-ui/icons/Info";
import Publish from "@material-ui/icons/Publish";
import {withSnackbar} from 'notistack';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Slide from '@material-ui/core/Slide';
import Tooltip from "@material-ui/core/Tooltip";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Chip from "@material-ui/core/Chip";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import CircularProgress from "@material-ui/core/CircularProgress";
import ReactDiffViewer from './Diff.jsx';

class RemixerPanel extends React.Component {
	constructor() {
		super();
		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		
		this.state = {
			initialized: false,
			edit: {},
			LibraryTree: {},
			subdomain: subdomain,
			editDialog: false,
			resetDialog: false,
			chapters: 0,
			pages: 0
		};
		
	}
	
	async componentDidMount() {
		const LTLeft = $('#LTLeft');
		const LTRight = $('#LTRight');
		LTRight.fancytree({
			source: this.props.RemixTree,
			debugLevel: 0,
			autoScroll: true,
			extensions: ['dnd5'],
			generateIds: true, // Generate id attributes like <span id='fancytree-id-KEY'>
			dblclick: (event, data) => {
				if (data.targetType === 'title') {
					this.edit();
				}
			},
			activate: (event, data) => {
				if (event.currentTarget && this.props.currentlyActive !== data.node.key)
					this.props.updateRemixer({currentlyActive: data.node.key});
			},
			collapse: () => {
				this.autonumber();
				const rightTree = $('#LTRight').fancytree('getTree');
				rightTree.activateKey('', {noFocus: true});
				this.props.updateRemixer({currentlyActive: ''});
			},
			expand: () => this.autonumber(),
			lazyLoad: function (event, data) {
				const dfd = new $.Deferred();
				let node = data.node;
				data.result = dfd.promise();
				RemixerFunctions.getSubpages(node.data.url, node.data.subdomain).then((result) => dfd.resolve(result));
			},
			checkbox: true,
			dnd5: {
				// autoExpandMS: 400,
				// preventForeignNodes: true,
				// preventNonNodes: true,
				preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
				preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
				// scroll: true,
				// scrollSpeed: 7,
				// scrollSensitivity: 10,
				
				// --- Drag-support:
				
				dragStart: function (node, data) {
					/* This function MUST be defined to enable dragging for the tree.
					 *
					 * Return false to cancel dragging of node.
					 * data.dataTransfer.setData() and .setDragImage() is available
					 * here.
					 */
//					data.dataTransfer.setDragImage($("<div>hurz</div>").appendTo("body")[0], -10, -10);
					return true;
				},
				dragDrag: function (node, data) {
					// data.dataTransfer.dropEffect = "move";
				},
				dragEnd: function (node, data) {
				},
				
				// --- Drop-support:
				
				dragEnter: function (node, data) {
					// node.debug("dragEnter", data);
					// data.dataTransfer.dropEffect = "move";
					return true;
				},
				/*dragOver: function (node, data) {
				  data.dataTransfer.dropEffect = "move";
				},
				dragLeave: function (node, data) {
				},*/
				dragDrop: async (node, data) => {
					/* This function MUST be defined to enable dropping of items on
					 * the tree.
					 */
					const transfer = data.dataTransfer;
					
					if (data.otherNode) {
						// Drop another Fancytree node from same frame
						// (maybe from another tree however)
						var sameTree = (data.otherNode.tree === data.tree);
						if (node.getLevel() <= 1) {
							data.hitMode = 'over';
						}
						if (data.hitMode === 'over') {
							node.setExpanded(true);
						}
						let newNode = await doTransfer();
						
						if (this.props.mode === 'Remix' && node.key === 'ROOT'
							&& node.hasChildren() && newNode.data.articleType === 'topic-category') {
							this.save(node.toDict(true), true);
							this.setState({mergeDialog: newNode.key});
							return;
						}
					}
					else if (data.otherNodeData) {
						// Drop Fancytree node from different frame or window, so we only have
						// JSON representation available
						node.addChild(data.otherNodeData, data.hitMode);
					}
					else {
						// Drop a non-node
						node.addNode({
							title: transfer.getData('text'),
						}, data.hitMode);
					}
					await this.autonumber(true);
					
					async function doTransfer() {
						if (sameTree) {
							if (data.hitMode)
								data.otherNode.moveTo(node, data.hitMode);
						}
						else {
							let newNode = data.otherNode.copyTo(node, data.hitMode, function (n) {
								n.title = n.title.replace(/<a.*<\/a>/, '');
								n.key = null; // make sure, a new key is generated
								n.status = 'new'; // make sure, a new key is generated
							});
							let LTRight = $('#LTRight').fancytree('getTree');
							LTRight.enable(false);
							const RightAlert = $('#LTRightAlert');
							RightAlert.text('Importing content. Please wait...');
							RightAlert.slideDown();
							await newNode.visitAndLoad();
							RightAlert.slideUp();
							LTRight.enable(true);
							return newNode;
						}
					}
				},
			},
		});
		LTRight.on('contextmenu', (event) => {
			if (event.target && event.target.classList.contains("fancytree-title") && event.target.parentNode
				&& event.target.parentNode.parentNode && event.target.parentNode.parentNode.id.startsWith('ft_')) {
				event.preventDefault();
				let key = event.target.parentNode.parentNode.id.split('ft_')[1];
				$("#LTRight").fancytree("getTree").getNodeByKey(key).setActive();
				this.edit();
			}
		});
		let LeftAlert = $('#LTLeftAlert');
		LeftAlert.text(`Loading ${name}`);
		LeftAlert.slideDown();
		this.setState({LibraryTree: await RemixerFunctions.getSubpages('home', this.state.subdomain, {linkTitle: true})});
		LeftAlert.slideUp();
		LTLeft.fancytree({
			source: this.state.LibraryTree,
			debugLevel: 0,
			autoScroll: true,
			extensions: ['dnd5'],
			collapse: this.updateLeft,
			expand: this.updateLeft,
			dblclick: (event, data) => {
				window.open(data.node.data.url);
			},
			lazyLoad: function (event, data) {
				const dfd = new $.Deferred();
				let node = data.node;
				data.result = dfd.promise();
				RemixerFunctions.getSubpages(node.data.url, node.data.subdomain, {linkTitle: true}).then((result) => dfd.resolve(result), node.data.subdomain);
			},
			dnd5: {
				// autoExpandMS: 400,
				preventForeignNodes: true,
				// preventNonNodes: true,
				preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
				preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
				// scroll: true,
				// scrollSpeed: 7,
				// scrollSensitivity: 10,
				
				// --- Drag-support:
				
				dragStart: function (node, data) {
					/* This function MUST be defined to enable dragging for the tree.
					 *
					 * Return false to cancel dragging of node.
					 * data.dataTransfer.setData() and .setDragImage() is available
					 * here.
					 */
//					data.dataTransfer.setDragImage($("<div>hurz</div>").appendTo("body")[0], -10, -10);
					data.dataTransfer.dropEffect = 'copy';
					return true;
				},
				/*dragDrag: function (node, data) {
				  data.dataTransfer.dropEffect = "move";
				},
				dragEnd: function (node, data) {
				},*/
				
				// --- Drop-support:
				
				/*dragEnter: function (node, data) {
				  // node.debug("dragEnter", data);
				  data.dataTransfer.dropEffect = "move";
				  // data.dataTransfer.effectAllowed = "copy";
				  return true;
				},
				dragOver: function (node, data) {
				  data.dataTransfer.dropEffect = "move";
				  // data.dataTransfer.effectAllowed = "copy";
				},
				dragLeave: function (node, data) {
				},*/
			},
			icon: (event, data) => {
				if (data.node.getLevel() === 1)
					return `https://libretexts.org/img/LibreTexts/glyphs/${this.state.subdomain}.png`;
			},
			tooltip: (event, data) => `${(data.node.data.status || 'new').toUpperCase()} page`
		});
		
		
		$('body').off('drop');
		LTLeft.append('<div id=\'LTLeftAlert\'>You shouldn\'t see this</div>');
		LTRight.append('<div id=\'LTRightAlert\'>You shouldn\'t see this</div>');
		$('#LTRightAlert,#LTLeftAlert').hide();
		this.setState({initialized: true});
	}
	
	async componentDidUpdate() {
		if (this.state.initialized && !this.initialAutonumber) {
			this.initialAutonumber = true;
			console.log('Initial autonumber');
			this.autonumber(true);
		}
	}
	
	render() {
		let target = document.createElement('div');
		target.id = 'LTRemixer';
		
		let currentlyActive;
		if (this.state.initialized) {
			const leftTree = $('#LTLeft').fancytree('getTree');
			const rightTree = $('#LTRight').fancytree('getTree');
			leftTree.reload(this.state.LibraryTree);
			
			currentlyActive = rightTree.getActiveNode();
			currentlyActive = currentlyActive ? currentlyActive.key : this.props.currentlyActive;
			rightTree.reload([this.props.RemixTree]);
			if (currentlyActive) {
				rightTree.activateKey(currentlyActive, {noFocus: true});
			}
			currentlyActive = rightTree.getNodeByKey(this.props.currentlyActive);
		}
		
		let deleted = currentlyActive && currentlyActive.data.status === 'deleted';
		let permission = RemixerFunctions.userPermissions(true);
		return <div id='LTForm' className='RemixerPanel'>
			<div className="LTFormHeader" style={{backgroundColor: permission.color, justifyContent: "space-between"}}>
				<Tooltip title={`Start Over`}>
					<Button variant="contained"
					        onClick={() => {
						        this.props.mode === 'Remix'
							        ? this.setState({resetDialog: true})
							        : this.setState({reRemixDialog: true});
					        }}><Refresh/>Start Over</Button>
				</Tooltip>
				
				<div className='LTTitle'>
					<Tooltip title={permission.description}>
						<div style={{display: 'flex', alignItems: 'center', marginLeft: 10}}>
							{this.props.permission} Mode
							<Info style={{marginLeft: 10}}/>
						</div>
					</Tooltip>
				</div>
				
				
				{!deleted ? <>
					<Tooltip title={`New Page`}>
						<Button variant="contained" onClick={this.new}><Add/></Button>
					</Tooltip>
					<Tooltip title={`Page Properties`}>
						<Button variant="contained" onClick={this.edit}><Edit/></Button>
					</Tooltip>
					<Tooltip title={`Delete Page`}>
						<Button variant="contained" onClick={this.delete}><Remove/></Button>
					</Tooltip>
				</> : <>
					<Button variant="contained" onClick={this.delete}>
						Restore Page
						<RestoreFromTrashIcon/></Button>
				</>}
				
				<Tooltip title={`Undo ${this.props.undoArray.length}`}>
					<div style={{display: 'flex'}}><Button variant="contained" onClick={this.props.undo}
					                                       disabled={!this.props.undoArray.length}><Undo/></Button>
					</div>
				</Tooltip>
				<Tooltip title={`Redo ${this.props.redoArray.length}`}>
					<div style={{display: 'flex'}}><Button variant="contained" onClick={this.props.redo}
					                                       disabled={!this.props.redoArray.length}><Redo/></Button>
					</div>
				</Tooltip>
				
				
				{/*<Tooltip title="Merges the contents of the selected folder with its parent's contents."
				         disabled={deleted}>
					<Button variant="contained" onClick={this.mergeUp}><span>Merge Folder Up</span><MergeType/></Button>
				</Tooltip>*/}
				<Button variant="contained" color="secondary"
				        onClick={() => {
					        this.autonumber();
					        this.props.updateRemixer({name: this.props.RemixTree.title, stage: 'Publishing'})
				        }}>Save to Server
					<Publish/></Button>
			</div>
			<div id='LTFormContainer' data-beeline-skip>
				<Slide in={this.props.options.tutorial} direction={'right'} mountOnEnter unmountOnExit>
					<div>Tutorial Panel
						<Tutorial/>
					</div>
				</Slide>
				<div>Library Panel<select className='LTFormSubdomain'
				                          onChange={this.setSubdomain}
				                          value={this.state.subdomain}>{this.getSelectOptions()}</select>
					<div id='LTLeft' className='treePanel'></div>
				</div>
				<div>Remix Panel
					<div id='LTRight' className='treePanel'></div>
				</div>
			</div>
			<Dialog open={this.state.resetDialog} onClose={this.handleReset} aria-labelledby="form-dialog-title">
				<DialogTitle id="form-dialog-title">Want to Start Over?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						This action will clear your work in the Remix Panel and your undo history. Consider saving your
						current workspace to a file with the "Save File" button. If you would like to start out with a
						template, select the number of chapters and number of pages per chapter you would like.
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						label="Number of Chapters"
						type="number"
						value={this.state.chapters}
						onChange={this.handleChange('chapters')}
						fullWidth
					/>
					<TextField
						margin="dense"
						label="Number of Pages per Chapter"
						type="number"
						value={this.state.pages}
						onChange={this.handleChange('pages')}
						fullWidth
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={this.handleReset} color="primary">
						Cancel
					</Button>
					<Button onClick={() => this.handleReset(this.state.chapters, this.state.pages)} color="primary">
						Start Over
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={this.state.editDialog} onClose={this.handleEdit} aria-labelledby="form-dialog-title"
			        id="editDialog">
				<DialogTitle id="form-dialog-title">Properties
				                                    for {this.state.edit.title || 'this Page'} {this.PageStatus()}
				</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="Page Title"
						value={this.state.edit.title || ''}
						onChange={(event) => this.changeEdit('title', event.target.value)}
						fullWidth
					/>
					{/*only for new*/}
					{this.state.edit.status === 'new' ? <>
							<TextField
								margin="dense"
								label="Source URL (optional)"
								value={this.state.edit.sourceURL || ''}
								onChange={(event) => this.changeEdit('sourceURL', event.target.value)}
								fullWidth
							/>
							{this.state.edit.sourceURL ?
								<a href={this.state.edit.sourceURL} target='_blank' className='mt-icon-link'
								   style={{
									   display: 'block',
									   overflow: 'hidden',
									   textOverflow: 'ellipsis',
									   whiteSpace: 'nowrap'
								   }}> Visit {this.state.edit.sourceURL || ''}</a> : null}</>
						: <>
							<Tooltip
								title={this.props.options.enableAutonumber && this.state.edit.padded ? 'Disable the autonumberer to change the auto url title' : ''}>
								<TextField
									autoFocus
									margin="dense"
									disabled={this.state.edit.padded && this.props.options.enableAutonumber}
									label="URL name"
									value={this.state.edit.padded || ''}
									onChange={(event) => this.changeEdit('padded', event.target.value)}
									fullWidth
								/>
							</Tooltip>
							<a href={this.state.edit.sourceURL} target='_blank' className='mt-icon-link'
							   style={{
								   display: 'block',
								   overflow: 'hidden',
								   textOverflow: 'ellipsis',
								   whiteSpace: 'nowrap'
							   }}> Visit {this.state.edit.sourceURL || ''}</a>
						</>}
					<div style={{display: 'flex', flex: 1}}>
						<Tooltip
							title={this.props.options.enableAutonumber ? 'Disable the autonumberer to select a non-recommended article type' : ''}>
							<TextField
								style={{flex: 1}}
								select
								label="Article type"
								disabled={this.props.options.enableAutonumber}
								value={this.state.edit.articleType || ''}
								onChange={(event) => {
									this.changeEdit('articleType', event.target.value);
									if (this.checkStructure(event.target.value)) {
										let message = `The article type ${RemixerFunctions.articleTypeToTitle(event.target.value)} is not recommended under ${RemixerFunctions.articleTypeToTitle(this.state.edit.parentType)}.\nWe recommend swapping to a different article type.`;
										alert(message);
										this.props.enqueueSnackbar(message, {
											variant: 'warning',
											anchorOrigin: {
												vertical: 'bottom',
												horizontal: 'right',
											},
										});
									}
								}}
								helperText={`Unit(s) >> Chapter >> Topic(s)`}
								margin="normal"
								error={this.checkStructure(this.state.edit.articleType)}
								variant="filled">
								{this.ArticleType("topic-category")}
								{this.ArticleType("topic-guide")}
								{this.ArticleType("topic")}
							</TextField>
						</Tooltip>
						{this.state.edit.status === 'new' ? <TextField //only for new
							select
							style={{flex: 1}}
							id='copyMode'
							label="Override Copy Mode"
							value={this.state.edit.copyMode}
							onChange={(event) => {
								this.changeEdit('copyMode', event.target.value);
							}}
							helperText="This will override the Default Copy Mode"
							margin="normal"
							variant="filled"
						>
							<MenuItem value=''>
								<Tooltip
									title="This page will be copied according to the Default Copy Mode">
									<ListItemText>Default</ListItemText>
								</Tooltip>
							</MenuItem>
							<MenuItem value='transclude'>
								<Tooltip
									title="In copy-transclude mode, pages will be automatically updated from the source">
									<ListItemText>Copy-Transclude</ListItemText>
								</Tooltip>
							</MenuItem>
							<MenuItem value='fork'>
								<Tooltip
									title="In copy-fork mode, pages will be duplicated from the source. This allows for customization but means that the page won't automatically update from the source">
									<ListItemText>Copy-Fork</ListItemText>
								</Tooltip>
							</MenuItem>
							{this.props.permission === 'Admin' ?
								<MenuItem value='full'>
									<Tooltip
										title="[Only for Admins] Copy-full mode duplicates a page along with all of the images and attachments on it. Best for cross-library migrations.">
										<ListItemText>Copy-Full</ListItemText>
									</Tooltip>
								</MenuItem>
								: null}
						</TextField> : null}
					</div>
					<div style={{
						padding: '16px 10px 8px 10px',
						display: 'flex',
						flexDirection: 'column',
						flex: 1,
					}}>
						<Paper style={{
							display: 'flex',
							flex: 1,
							justifyContent: 'space-evenly',
							alignItems: 'center',
							padding: 10,
							borderRadius: 4,
							flexWrap: 'wrap',
						}}>
							{(this.state.edit.tags || []).map((item, index) =>
								<Tooltip title={item} key={item}>
									<Chip label={item}
									      style={{margin: 10}}
									      onClick={() => {
										      let edit = prompt('New name for this tag', item);
										      if (edit) {
											      let index = this.state.edit.tags.indexOf(item);
											      this.state.edit.tags[index] = edit;
											      this.changeEdit('tags', this.state.edit.tags);
										      }
									      }}
									      onDelete={() => {
										      this.changeEdit('tags', this.state.edit.tags.filter(elem => elem !== item))
									      }}/>
								</Tooltip>
							)}
							<Chip key={Math.random()} label="Add Tag"
							      icon={<Add/>}
							      style={{margin: 10}}
							      variant="outlined"
							      color="primary"
							      clickable
							      onClick={() => {
								      let tag = prompt('Name for the new tag');
								      if (tag) {
									      this.state.edit.tags.push(tag);
									      this.changeEdit('tags', this.state.edit.tags);
								      }
							      }}/>
						</Paper>
						{this.renderChanged()}
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={this.handleEdit} color="primary">
						Cancel
					</Button>
					<Button onClick={() => this.handleEdit(this.state.edit)} color="primary">
						Save edits
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={!this.state.initialized} aria-labelledby="form-dialog-title">
				<DialogTitle id="form-dialog-title">Loading Remixer
				</DialogTitle>
				<DialogContent style={{display: 'flex', justifyContent: 'center', padding: 50}}>
					<CircularProgress size={100}/>
				</DialogContent>
			</Dialog>
			<Dialog open={!!this.state.importDialog} aria-labelledby="form-dialog-title"
			        id="importDialog">
				<DialogTitle id="form-dialog-title">Finishing content import
				</DialogTitle>
				<DialogContent style={{display: 'flex', justifyContent: 'center', padding: 50}}>
					<CircularProgress size={100}/>
				</DialogContent>
			</Dialog>
			<Dialog open={!!this.state.mergeDialog} onClose={() => this.setState({mergeDialog: false})}
			        aria-labelledby="form-dialog-title">
				<DialogTitle id="form-dialog-title">Merge with Coverpage?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Since you are bringing over a Book/Unit, you can choose to use it as the LibreText coverpage.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={async () => {
						let key = this.state.mergeDialog;
						this.setState({mergeDialog: false, importDialog: true});
						await this.mergeUp(key);
						this.setState({importDialog: false});
					}} color="primary">
						Merge with Coverpage
					</Button>
					<Button onClick={async () => {
						this.setState({mergeDialog: false, importDialog: true});
						await this.autonumber();
						this.setState({importDialog: false});
					}} color="primary">
						Add normally
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={!!this.state.importDialog} aria-labelledby="form-dialog-title"
			        id="editDialog">
				<DialogTitle id="form-dialog-title">Finishing content import
				</DialogTitle>
				<DialogContent style={{display: 'flex', justifyContent: 'center', padding: 50}}>
					<CircularProgress size={100}/>
				</DialogContent>
			</Dialog>
			<Dialog open={!!this.state.reRemixDialog} onClose={() => this.setState({reRemixDialog: false})}
			        aria-labelledby="form-dialog-title">
				<DialogTitle id="form-dialog-title">Start ReRemix over?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						This action will clear your work in the Remix Panel and your undo history. Consider saving your
						current workspace to a file with the "Save File" button. You can either reload the Text you
						are currently working on or select another Text.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => this.setState({reRemixDialog: false})} color="primary">
						Cancel
					</Button>
					<Button onClick={this.reloadReRemix} color="primary">
						Reload current Text
					</Button>
					<Button onClick={() => {
						this.props.updateRemixer({stage: 'ReRemixing'})
					}} color="primary">
						Select another Text
					</Button>
				</DialogActions>
			</Dialog>
		</div>;
	}
	
	checkStructure(type) {
		let parentType = this.state.edit.parentType;
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
	
	updateLeft = () => {
		let root = $('#LTLeft').fancytree('getTree').getRootNode();
		root = root.toDict(true);
		this.setState({LibraryTree: root.children})
	};
	
	handleChange = name => event => {
		let input = event.target.value;
		if (input && input >= 0 && input <= 100) {
			input = Math.round(input);
			this.setState({[name]: input});
		}
	};
	
	save = (tree, updateUndo) => {
		// tree.expanded = true;
		this.props.updateRemixer({RemixTree: tree}, updateUndo);
	};
	
	new = async () => {
		let node = $('#LTRight').fancytree('getActiveNode');
		if (node) {
			node.addChildren({
				title: 'New Page',
				padded: '',
				id: -1,
				lazy: false,
				expanded: true,
				status: 'new',
			});
			await node.setExpanded();
			await this.autonumber();
		}
	};
	
	edit = async () => {
		let node = $('#LTRight').fancytree('getActiveNode');
		if (!node)
			return;
		let newEdit = {
			...node.data,
			title: node.title,
			parentType: node.getParent().data.articleType,
		};
		newEdit.copyMode = newEdit.copyMode || '';
		if (!newEdit.original)
			newEdit.original = JSON.parse(JSON.stringify(newEdit));
		newEdit.node = node;
		console.log(node, newEdit);
		this.setState({edit: newEdit, editDialog: true});
	};
	
	changeEdit = (option, value) => {
		let newOptions = {...this.state.edit};
		newOptions[option] = value;
		
		this.setState({edit: newOptions});
	};
	
	delete = async () => {
		const deleteNode = (node) => {
			if (node && node.parent) {
				if (node.key !== 'ROOT') {
					//preserve activenode
					let otherNode = node.getNextSibling() || node.getParent();
					
					switch (node.data.status) {
						case 'deleted': //restore page
							let ancestorDeleted = false;
							let temp = node;
							while (temp.parent) {
								if (temp.parent.data.status === 'deleted')
									ancestorDeleted = temp.parent.title;
								temp = temp.parent;
							}
							
							if (ancestorDeleted)
								this.props.enqueueSnackbar(`Ancestor of this page (${ancestorDeleted}) is still marked for deletion.\nRestore that page instead.`, {
									variant: 'error',
									anchorOrigin: {
										vertical: 'bottom',
										horizontal: 'right',
									},
								});
							else
								node.data.status = node.data.originalStatus;
							
							break;
						case 'new': //completely remove a new page
							node.removeChildren();
							node.remove();
							
							if (otherNode)
								otherNode.setActive();
							break;
						default:
							node.data.originalStatus = node.data.status;
							node.data.status = 'deleted';
					}
				}
				if (node.children && node.children.length) {
					let tempChildren = [...node.children];
					for (let i = 0; i < tempChildren.length; i++) {
						const child = tempChildren[i];
						deleteNode(child);
					}
				}
				
				return true;
			}
		};
		
		let node = $('#LTRight').fancytree('getActiveNode');
		if (deleteNode(node, this))
			await this.autonumber(true);
	};
	
	mergeUp = async (key) => {
		const rightTree = $('#LTRight').fancytree('getTree');
		let root = rightTree.getNodeByKey('ROOT');
		
		if (root && root.hasChildren()) {
			let child = rightTree.getNodeByKey(key);
			if (!child)
				return;
			
			const dict = root.toDict(true);
			let replace = child.toDict(true);
			replace.children = dict.children.filter(item => item.key !== key);
			replace.children = replace.children.concat(child.toDict(true).children);
			replace.key = 'ROOT';
			if (!replace.data.tags.includes('coverpage:yes'))
				replace.data.tags.push('coverpage:yes');
			
			root.fromDict(replace);
			root.setExpanded(true);
			
			this.props.enqueueSnackbar(`${child.title} set as the new root`, {
				variant: 'success',
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'right',
				},
				autoHideDuration: 10000,
			});
			await this.autonumber();
			/*			else {
							await node.setExpanded(true);
							if (node.hasChildren()) {
								while (node.hasChildren()) {
									node.getFirstChild().moveTo(node.parent, 'child');
								}
								node.remove();
								this.autonumber(true);
							}
						}*/
		}
	};
	
	handleReset = async (chapters, pages) => {
		if (!(chapters === undefined || pages === undefined)) {
			this.props.updateRemixer({currentlyActive: ''});
			let result = RemixerFunctions.generateDefault(chapters, pages);
			this.autonumber(true, result);
		}
		this.setState({resetDialog: false});
	};
	
	handleEdit = async (newEdit) => {
		if (!newEdit || !newEdit.original) {
			this.setState({editDialog: false});
			return;
		}
		
		let node = $('#LTRight').fancytree('getTree').getNodeByKey(newEdit.node.key);
		delete newEdit.node;
		node.fromDict(newEdit);
		await this.autonumber(true);
		this.setState({editDialog: false});
	};
	
	autonumber = async (updateUndo, customRoot) => {
		let root;
		if (!customRoot) {
			root = $('#LTRight').fancytree('getTree').getNodeByKey('ROOT');
			if (!root) {
				return false;
			}
		}
		let changes = 0;
		let chapterIndex = 0;
		
		let processNode = (node, sharedIndex, level, parent = {data: {}}) => {
			node.title = node.title.replace(/&amp;|&/g, 'and').trim();
			let chapter = parent.chapter || 1;
			node.depth = level;
			
			//handling Front/Back matter organization
			if (node.title === 'Front Matter' || node.title === 'Back Matter') {
				let index = node.title === 'Front Matter' ? '00' : 'zz';
				if (!node.data.padded)
					node.data.padded = `${('' + index).padStart(2, '0')}: ${node.title}`;
				node.matterIndex = 0;
			}
			else if (parent.title === 'Front Matter' || parent.title === 'Back Matter') {
				let index = ++parent.matterIndex;
				node.data.padded = `${('' + index).padStart(2, '0')}: ${node.title}`;
			}
			else if (level
				&& this.props.options.enableAutonumber
				&& this.props.options.autonumber.guideDepth
				&& node.data.status !== 'deleted') { //autonumberer enabled
				if (node.title.match(/[0-9]+\.[0-9]*?[A-Za-z]+?:/)
					&& !this.props.options.autonumber.overwriteSuffix
					&& level > this.props.options.autonumber.guideDepth) {
					//skip for lettered subpages unless overwriteSuffix is enabled
					
					let index = node.title.match(/(?<=[0-9]+\.)([0-9]*?)([A-Za-z]+?)(?=:)/);
					index = index[1] ? index[2] : '.' + index[2];
					
					let prefix = this.props.options.autonumber.pagePrefix + ' ' || '';
					node.title = node.title.replace(/^[^:]*: /, '');
					node.title = node.title.replace(':', '-');
					node.data.padded = `${chapter}${index}: ${node.title}`;
					node.title = `${prefix}${chapter}${index}: ${node.title}`;
					node.data.articleType = 'topic';
				}
				else {
					if (level < this.props.options.autonumber.guideDepth) { //Unit
						node.data.articleType = 'topic-category';
					}
					else if (level === this.props.options.autonumber.guideDepth) { //Guide
						if (Number(this.props.options.autonumber.offset) > chapterIndex) { //apply offset
							chapterIndex = Number(this.props.options.autonumber.offset);
						}
						
						if (node.title.includes(': '))
							node.title = node.title.replace(/^[A-Za-z ]*?[0-9]+[.0-9A-Za-z]*?: /, '');
						node.title = node.title.replace(':', '-');
						node.data.articleType = 'topic-guide';
						node.data.padded = `${('' + chapterIndex).padStart(2, '0')}: ${node.title}`;
						
						let prefix = this.props.options.autonumber.chapterPrefix + ' ' || '';
						node.title = `${prefix}${chapterIndex}: ${node.title}`;
						node.chapter = chapterIndex;
						chapterIndex++
					}
					else if (level > this.props.options.autonumber.guideDepth) { //Topic
						let index = sharedIndex[0]++;
						if (Number(this.props.options.autonumber.topicStart) > index) { //apply offset
							sharedIndex[0] = Number(this.props.options.autonumber.topicStart);
							index = sharedIndex[0]++;
						}
						
						if (node.title.includes(': '))
							node.title = node.title.replace(/^[A-Za-z ]*?[0-9]+[.0-9A-Za-z]*?: /, '');
						node.title = node.title.replace(':', '-');
						node.data.articleType = 'topic';
						node.data.padded = `${chapter}.${('' + index).padStart(2, '0')}: ${node.title}`;
						
						let prefix = this.props.options.autonumber.pagePrefix + ' ' || '';
						node.title = `${prefix}${chapter}.${index}: ${node.title}`;
						node.chapter = `${chapter}.${index}`;
					}
				}
			}
			node.title = node.title.trim();
			if (node.data.padded) {
				node.data.padded = LibreTexts.cleanPath(node.data.padded);
				if (node.data.padded.includes(':')) {
					node.data.padded = encodeURIComponent(node.data.padded);
					node.data.padded = node.data.padded.replace(/%20/g, ' ');
				}
			}
			
			
			//checking if padded correctly
			if (node.data.padded && (node.data.status === 'new' || node.data.original.data.padded)) {
				//already padded correctly
				//and if page is an existing page it has its original padding stored
			}
			else if (node.data.status === 'new') { //new pages
				node.data.padded = node.data.padded || node.title;
			}
			else if (node.data.original.data.sourceURL) {//initial padding
				try {
					if (!node.data.original.data.padded) {
						let match = node.data.original.data.sourceURL.match(/(?<=\/)[^/]*?$/);
						node.data.original.data.padded = match ? match[0] : false;
					}
					if (!node.data.padded)
						node.data.padded = node.data.original.data.padded || node.title;
				} catch (e) {
					console.error(e);
					node.data.padded = node.title;
				}
			}
			else {
				node.data.original.data.padded = node.data.original.data.padded || node.title;
				node.data.padded = node.data.padded || node.title;
			}
			
			node.data.parentID = parent.data.id || node.data.parentID;
			node.data.padded = node.data.padded.replace(/ /g, '_');
			if (node.data.original && node.data.original.data && node.data.original.data.padded)
				node.data.original.data.padded = node.data.original.data.padded.replace(/ /g, '_');
			node.data.relativePath = node.key === "ROOT" ? '' : (`${parent.data.relativePath}/${(node.data.padded).replace(/\//g, '\/')}`);
			
			//check status on whether pages are modified
			if (node.data.status === 'unchanged' || node.data.status === 'modified') {
				const originalData = JSON.parse(JSON.stringify(node.data.original.data));
				const data = node.data;
				delete originalData.original; //skip these fields
				delete originalData.status;
				delete originalData.response;
				delete originalData.relativePath;
				delete originalData.changed;
				let changed = [];
				for (let key in originalData) {
					if (originalData.hasOwnProperty(key)) {
						if (JSON.stringify(data[key]) !== JSON.stringify(originalData[key])) {
							// console.log(key, data[key], originalData[key]);
							changed.push({key: key, original: originalData[key], change: data[key]});
						}
					}
				}
				if (node.title !== node.data.original.title)
					changed.push({key: 'title', original: node.data.original.title, change: node.title});
				
				node.data.changed = changed;
				if (!changed.length)
					node.data.status = 'unchanged';
				else if (node.data.status !== 'modified') {
					node.data.status = 'modified';
					changes++;
				}
			}
			
			//ensure structure matches tags
			node.extraClasses = [`status-${node.data.status}`];
			if (node.data.articleType)
				node.extraClasses.push(`article-${node.data.articleType}`);
			
			node.extraClasses = node.extraClasses.join(' ');
			node.lazy = false;
			if (node.children) { //recurse down to children
				let sharedIndex = [0];
				for (let i = 0; i < node.children.length; i++) {
					node.children[i] = processNode(node.children[i], sharedIndex, level + 1, node);
				}
			}
			return node;
		};
		
		if (root && !root.children)
			root.children = [];
		else if (!customRoot) { //recurse down
			for (let i = 0; i < root.children.length; i++) {
				if (root.children[i].lazy) {
					await root.children[i].visitAndLoad();
				}
			}
		}
		let d = customRoot || root.toDict(true);
		// let depth = this.getDepth(d);
		let sharedIndex = [0];
		processNode(d, sharedIndex, 0);
		
		if (changes)
			this.props.enqueueSnackbar(`The Remixer suggested changes to ${changes} pages.`, {
				variant: 'warning',
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'right',
				},
			});
		
		this.save(d, updateUndo);
	};
	
	debug() {
		let root = $('#LTRight').fancytree('getTree').getNodeByKey('ROOT');
		return root.toDict(true);
	}
	
	setSubdomain = async (e) => {
		let subdomain = e.target.value;
		let LTLeft = $('#LTLeft').fancytree('getTree');
		let LeftAlert = $('#LTLeftAlert');
		
		LTLeft.enable(false);
		LeftAlert.text(`Loading ${subdomain}`);
		LeftAlert.slideDown();
		let content = await RemixerFunctions.getSubpages('home', subdomain, {linkTitle: true});
		
		LeftAlert.slideUp();
		LTLeft.enable(true);
		this.setState({subdomain: subdomain, LibraryTree: content});
	};
	
	getDepth(tree) {
		let depth = 0;
		while (tree && tree.children) {
			depth++;
			tree = tree.children[0];
		}
		return depth;
	}
	
	getSelectOptions() {
		let current = window.location.origin.split('/')[2].split('.')[0];
		let libraries = LibreTexts.libraries;
		let result = [];
		Object.keys(libraries).map(function (key, index) {
			result.push(<option value={libraries[key]} key={key}>{key}</option>);
		});
		return result;
	}
	
	reloadReRemix = async () => {
		this.setState({reRemixDialog: false, initialized: false});
		this.initialAutonumber = false;
		
		const current = this.props.RemixTree;
		current.children = await RemixerFunctions.getSubpages(this.props.RemixTree.data.url, this.props.RemixTree.data.subdomain, {
			includeMatter: true,
			full: true,
			defaultStatus: 'unchanged'
		});
		RemixerFunctions.ReRemixTree(current, current.data.path);
		
		this.props.updateRemixer({stage: 'Remixing', RemixTree: current, currentlyActive: ''});
		this.props.enqueueSnackbar(`${current.title} is ready for ReRemixing!`, {
			variant: 'success',
			anchorOrigin: {
				vertical: 'bottom',
				horizontal: 'right',
			},
		});
		this.setState({initialized: true});
	};
	
	ArticleType = (type) => {
		let badStructure = this.checkStructure(type);
		return <MenuItem
			value={type}>
			<Tooltip
				title={badStructure ? 'Warning: This article type currently violates the recommended content structure' : ''}>
				<div style={{display: 'flex', alignItems: 'center', flex: 1}}>
					<ListItemText primary={RemixerFunctions.articleTypeToTitle(type)}
					              style={badStructure ? {color: 'orange'} : {}}/>
					{badStructure ? <ListItemIcon style={badStructure ? {color: 'orange'} : {}}>
						<Warning/>
					</ListItemIcon> : null}
				</div>
			</Tooltip>
		</MenuItem>;
	};
	
	PageStatus = () => {
		const status = this.state.edit.status;
		const color = RemixerFunctions.statusColor(status);
		switch (status) {
			case 'unchanged':
				return <span style={{color: color}}>[Unchanged]</span>;
			case 'new':
				return <span style={{color: color}}>[New]</span>;
			case 'modified':
				return <span style={{color: color}}>[Modified]</span>;
			case 'deleted':
				return <span style={{color: color}}>[Deleted]</span>;
			default:
				return null;
		}
	};
	
	renderChanged = () => {
		if (this.state.edit.status === 'modified' && this.state.edit.changed.length) {
			let oldCode = '', newCode = '';
			this.state.edit.changed.forEach((elem) => {
				oldCode += `${elem.key}: ${elem.original}\n`;
				newCode += `${elem.key}: ${elem.change}\n`;
			});
			
			return <>
				<h4>Items Modified: (Updates on Save Edit)</h4>
				<ReactDiffViewer
					inputA={oldCode}
					inputB={newCode}
					type="chars"
				/></>
		}
		else return null;
	}
}

export default withSnackbar(RemixerPanel); //Allows snackbars