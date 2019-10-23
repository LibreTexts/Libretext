import React from 'react';
import RemixerFunctions from '../reusableFunctions';

import Tutorial from './Tutorial.jsx';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Add from '@material-ui/icons/Add';
import Edit from '@material-ui/icons/Edit';
import Remove from '@material-ui/icons/Delete';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import MergeType from '@material-ui/icons/MergeType';
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
						await doTransfer();
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
							data.otherNode.moveTo(node, data.hitMode);
						}
						else {
							let newNode = data.otherNode.copyTo(node, data.hitMode, function (n) {
								n.title = n.title.replace(/<a.* ><\/a>/, '');
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
		this.setState({LibraryTree: await RemixerFunctions.getSubpages('home', this.state.subdomain, false, true)});
		LeftAlert.slideUp();
		LTLeft.fancytree({
			source: this.state.LibraryTree,
			debugLevel: 0,
			autoScroll: true,
			extensions: ['dnd5'],
			collapse: this.updateLeft,
			expand: this.updateLeft,
			lazyLoad: function (event, data) {
				const dfd = new $.Deferred();
				let node = data.node;
				data.result = dfd.promise();
				RemixerFunctions.getSubpages(node.data.url, node.data.subdomain, false, true).then((result) => dfd.resolve(result), node.data.subdomain);
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
		
		
		LTLeft.append('<div id=\'LTLeftAlert\'>You shouldn\'t see this</div>');
		LTRight.append('<div id=\'LTRightAlert\'>You shouldn\'t see this</div>');
		$('#LTRightAlert,#LTLeftAlert').hide();
		this.setState({initialized: true});
	}
	
	async componentDidUpdate(){
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
		return <div id='LTForm'>
			<div className="LTFormHeader" style={{backgroundColor: permission.color}}>
				<div className='LTTitle'><Tooltip title={permission.description}>
					<div style={{display: 'flex', alignItems: 'center'}}>{this.props.mode} Mode
						<Info style={{marginLeft: 10}}/></div>
				</Tooltip></div>
				
				
				{!deleted ? <>
					<Button variant="contained" onClick={this.new}><span>New Page</span>
						<Add/></Button>
					<Button variant="contained" onClick={this.edit}><span>Page Properties</span>
						<Edit/></Button>
					<Button variant="contained" onClick={this.delete}><span>Delete Page</span>
						<Remove/></Button>
				</> : <>
					<Button variant="contained" onClick={this.delete} className={'expandedLabel'}>
						<span>Restore Page</span>
						<RestoreFromTrashIcon/></Button>
				</>}
				
				
				<Button variant="contained" onClick={this.props.undo}
				        disabled={!this.props.undoArray.length}><span>Undo {this.props.undoArray.length}</span>
					<Undo/></Button>
				<Button variant="contained" onClick={this.props.redo}
				        disabled={!this.props.redoArray.length}><span>Redo {this.props.redoArray.length}</span>
					<Redo/></Button>
				
				
				<Tooltip title="Merges the contents of the selected folder with its parent's contents."
				         disabled={deleted}>
					<Button variant="contained" onClick={this.mergeUp}><span>Merge Folder Up</span><MergeType/></Button>
				</Tooltip>
				<Button variant="contained"
				        onClick={() => {
					        this.props.type === 'Remixer'
						        ? this.setState({resetDialog: true})
						        : this.props.updateRemixer({stage: 'ReRemixing'})
				        }}>
					<span>Start Over</span>
					<Refresh/></Button>
				<Button variant="contained" color="secondary"
				        onClick={() => {
					        this.autonumber();
					        this.props.updateRemixer({stage: 'Publishing'})
				        }}><span>Publish</span>
					<Publish/></Button>
			</div>
			<div id='LTFormContainer'>
				<Slide in={this.props.options.tutorial} direction={'right'} mountOnEnter unmountOnExit>
					<div><h3>Tutorial Panel</h3>
						What do you need help with {document.getElementById('displaynameHolder').innerText}?
						<Tutorial/>
					</div>
				</Slide>
				<div>Library Panel<select id='LTFormSubdomain'
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
					<TextField
						margin="dense"
						label="Source URL (optional)"
						value={this.state.edit.sourceURL || ''}
						onChange={(event) => this.changeEdit('sourceURL', event.target.value)}
						fullWidth
					/>
					<div style={{display: 'flex'}}>
						<Tooltip
							title={this.props.options.enableAutonumber ? 'Disable the autonumberer to select a non-recommended article type' : ''}>
							<TextField
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
						<TextField
							select
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
									title="In transclude mode, pages will be automatically updated from the source">
									<ListItemText>Transclude</ListItemText>
								</Tooltip>
							</MenuItem>
							<MenuItem value='fork'>
								<Tooltip
									title="In fork mode, pages will be duplicated from the source. This allows for customization but means that the page won't automatically update from the source">
									<ListItemText>Fork</ListItemText>
								</Tooltip>
							</MenuItem>
							{this.props.mode === 'Admin' ?
								<MenuItem value='full'>
									<Tooltip
										title="[Only for Admins] This mode duplicates a page along with all of the images and attachments on it. Best for cross-library migrations.">
										<ListItemText>Full-Copy</ListItemText>
									</Tooltip>
								</MenuItem>
								: null}
						</TextField>
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
								<Tooltip title={item}>
									<Chip key={item} label={item}
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
			<Dialog open={!this.state.initialized} aria-labelledby="form-dialog-title"
			        id="editDialog">
				<DialogTitle id="form-dialog-title">Loading Remixer
				</DialogTitle>
				<DialogContent style={{display: 'flex', justifyContent: 'center', padding: 50}}>
					<CircularProgress size={100}/>
				</DialogContent>
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
			copyMode: '',
		};
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
			if (node) {
				if (node.key !== 'ROOT') {
					//preserve activenode
					let otherNode = node.getNextSibling() || node.getParent();
					
					switch (node.data.status) {
						case 'deleted':
							node.data.status = node.data.originalStatus;
							break;
						case 'new':
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
	
	mergeUp = async () => {
		let node = $('#LTRight').fancytree('getActiveNode');
		if (node) {
			if (node.key === 'ROOT' && node.hasChildren()) {
				if (node.children.length === 1) {
					const child = node.getFirstChild();
					this.props.enqueueSnackbar(`${node.title} ${child.title}`, {
						variant: 'success',
						anchorOrigin: {
							vertical: 'bottom',
							horizontal: 'right',
						},
					});
					//TODO Copy logic
				}
				else {
					this.props.enqueueSnackbar('You must have only one child to merge up the root page.', {
						variant: 'warning',
						anchorOrigin: {
							vertical: 'bottom',
							horizontal: 'right',
						},
					})
				}
			}
			else {
				await node.setExpanded(true);
				if (node.hasChildren()) {
					while (node.hasChildren()) {
						node.getFirstChild().moveTo(node.parent, 'child');
					}
					node.remove();
					this.autonumber(true);
				}
			}
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
			if (!root || !root.children) {
				return false;
			}
		}
		
		let processNode = (node, sharedIndex, level) => {
			node.title = node.title.replace('&amp;', 'and');
			
			
			if (level && this.props.options.enableAutonumber && this.props.options.autonumber.guideDepth && node.data.status !== 'deleted') {
				
				//TODO: suffix
				if (node.title.includes(': '))
					node.title = node.title.replace(/^[^:]*: /, '');
				
				
				let index = sharedIndex[0]++;
				if (level < this.props.options.autonumber.guideDepth) { //Unit
					node.data.articleType = 'topic-category';
					node.data['padded'] = false;
				}
				else if (level === this.props.options.autonumber.guideDepth) { //Guide
					if (Number(this.props.options.autonumber.offset) > sharedIndex[0]) { //apply offset
						sharedIndex[0] = Number(this.props.options.autonumber.offset);
						index = sharedIndex[0]++;
					}
					node.data.articleType = 'topic-guide';
					node.data['padded'] = `${('' + index).padStart(2, '0')}: ${node.title}`;
					
					let prefix = this.props.options.autonumber.chapterPrefix + ' ' || '';
					node.title = `${prefix}${index}: ${node.title}`;
					chapter = index;
				}
				else if (level > this.props.options.autonumber.guideDepth) { //Topic
					node.data.articleType = 'topic';
					node.data['padded'] = `${chapter}.${('' + index).padStart(2, '0')}: ${node.title}`;
					
					let prefix = this.props.options.autonumber.pagePrefix + ' ' || '';
					node.title = `${prefix}${chapter}.${index}: ${node.title}`;
				}
				node.title = node.title.trim();
			}
			
			//check status
			if (node.data.status === 'unchanged' || node.data.status === 'modified') {
				const original = node.data.original;
				const data = JSON.parse(JSON.stringify(node.data));
				delete data.original; //skip these fields
				delete data.status;
				delete data.padded;
				delete data.response;
				let unchanged = true;
				for (let key in original) {
					if (original.hasOwnProperty(key)) {
						if (JSON.stringify(data[key]) !== JSON.stringify(original.data[key])) {
							console.log(key, data[key], original.data[key]);
							unchanged = false;
						}
					}
				}
				
				if (node.title === original.title && unchanged)
					node.data.status = 'unchanged';
				else
					node.data.status = 'modified';
			}
			
			//ensure structure matches tags
			node.extraClasses = [`status-${node.data.status}`];
			if (node.data.articleType)
				node.extraClasses.push(`article-${node.data.articleType}`);
			
			node.extraClasses = node.extraClasses.join(' ');
			node.lazy = false;
			if (node.children) { //recurse down to children
				let sharedIndex = [1];
				for (let i = 0; i < node.children.length; i++) {
					node.children[i] = processNode(node.children[i], sharedIndex, level + 1);
				}
			}
			return node;
		};
		
		if (!customRoot) {
			for (let i = 0; i < root.children.length; i++) {
				if (root.children[i].lazy) {
					await root.children[i].visitAndLoad();
				}
			}
		}
		let d = customRoot || root.toDict(true);
		let depth = this.getDepth(d);
		let chapter = 1;
		let sharedIndex = [1];
		processNode(d, sharedIndex, 0);
		
		this.save(d, updateUndo);
	};
	
	debug() {
		let root = $('#LTRight').fancytree('getTree').getNodeByKey('ROOT');
		return root.toDict(true);
	}
	
	setSubdomain = async () => {
		let select = document.getElementById('LTFormSubdomain');
		let subdomain = select.value;
		let name = $(`#LTFormSubdomain option[value="${subdomain}"]`).text();
		let LTLeft = $('#LTLeft').fancytree('getTree');
		let LeftAlert = $('#LTLeftAlert');
		
		LTLeft.enable(false);
		LeftAlert.text(`Loading ${name}`);
		LeftAlert.slideDown();
		let content = await RemixerFunctions.getSubpages('home', subdomain, false, true);
		
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
	
	static async getSubpages(path, subdomain, full, linkTitle) {
		path = path.replace(`https://${subdomain}.libretexts.org/`, '');
		let response = await LibreTexts.authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
		response = await response.json();
		return await subpageCallback(response);
		
		async function subpageCallback(info) {
			let subpageArray = info['page.subpage'];
			if (subpageArray) {
				subpageArray = subpageArray.length ? info['page.subpage'] : [info['page.subpage']];
			}
			const result = [];
			const promiseArray = [];
			
			async function subpage(subpage, index) {
				let url = subpage['uri.ui'];
				let path = subpage.path['#text'];
				url = url.replace('?title=', '');
				path = path.replace('?title=', '');
				const hasChildren = subpage['@subpages'] === 'true';
				let children = hasChildren ? undefined : [];
				if (hasChildren && full) { //recurse down
					children = await LibreTexts.authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
					children = await children.json();
					children = await subpageCallback(children);
				}
				if (!url.endsWith('/link') && subpage.title !== 'Front Matter' && subpage.title !== 'Back Matter') {
					let miniResult = {
						title: linkTitle ? `${subpage.title}<a href="${url}" target="_blank"> ></a>` : subpage.title,
						url: url,
						sourceURL: url,
						children: children,
						lazy: !full,
					};
					miniResult = await LibreTexts.getAPI(miniResult);
					
					let type = miniResult.tags.find(elem => elem.startsWith('article:'));
					if (type) {
						miniResult.articleType = type.split('article:')[1];
						miniResult.extraClasses = `article-${miniResult.articleType}`;
					}
					miniResult.tags = miniResult.tags.filter(elem => !elem.startsWith('article:'));
					result[index] = miniResult;
				}
			}
			
			if (subpageArray && subpageArray.length) {
				for (let i = 0; i < subpageArray.length; i++) {
					promiseArray[i] = subpage(subpageArray[i], i);
				}
				
				await Promise.all(promiseArray);
				return result.filter(elem => elem);
			}
			else {
				return [];
			}
		}
	}
	
	
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
}

export default withSnackbar(RemixerPanel); //Allows snackbars