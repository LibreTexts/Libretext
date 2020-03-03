import React from 'react';
import RemixerFunctions from '../reusableFunctions';
import Button from '@material-ui/core/Button';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import Info from "@material-ui/icons/Info";
import {withSnackbar} from 'notistack';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Tooltip from "@material-ui/core/Tooltip";
import CircularProgress from "@material-ui/core/CircularProgress";

class ReRemixerPanel extends React.Component {
	updateLeft = (active) => {
		let root = $('#LTLeft').fancytree('getTree').getRootNode();
		root = root.toDict(true);
		this.setState({LibraryTree: root.children});
		if (active)
			this.props.updateRemixer({currentlyActive: active});
	};
	
	constructor() {
		super();
		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		
		this.state = {
			initialized: false,
			transferring: false,
			LibraryTree: {},
			subdomain: subdomain,
		};
		
	}
	
	async componentDidMount() {
		const LTLeft = $('#LTLeft');
		let LeftAlert = $('#LTLeftAlert');
		LeftAlert.text(`Loading ${name}`);
		LeftAlert.slideDown();
		let path;
		switch (this.props.permission) {
			case "Faculty":
			case "Basic":
				path = `Sandboxes/${document.getElementById('usernameHolder').innerText}`;
				break;
			default:
				path = 'home';
				break;
		}
		
		
		let content = await RemixerFunctions.getSubpages(path, this.state.subdomain, {
			linkTitle: true,
			includeMatter: true
		});
		
		//prevent Pro users from modifying Bookshelves
		if (this.props.permission !== 'Admin') {
			content = content.filter((page) => !page.path.startsWith('Bookshelves'));
		}
		
		// customized Snackbar
		const action = key => (
			<>
				<Button onClick={() => {
					this.props.closeSnackbar(key)
				}}>
					Dismiss
				</Button>
			</>
		);
		
		if (!content.length && path !== 'home')
			this.props.enqueueSnackbar('It looks like your Sandbox is empty! Try making a Remix using New Remix first.', {
				variant: 'error',
				autoHideDuration: 60000,
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'right',
				},
				action
			});
		
		this.setState({LibraryTree: content});
		LeftAlert.slideUp();
		LTLeft.fancytree({
			source: this.state.LibraryTree,
			debugLevel: 0,
			autoScroll: true,
			extensions: ['dnd5'],
			activate: (event, data) => {
				if (event.currentTarget && this.props.currentlyActive !== data.node.key)
					this.props.updateRemixer({currentlyActive: data.node.key});
			},
			collapse: () => {
				this.updateLeft('');
			},
			expand: () => {
				this.updateLeft('');
			},
			dblclick: (event, data) => {
				window.open(data.node.data.url);
			},
			lazyLoad: function (event, data) {
				const dfd = new $.Deferred();
				let node = data.node;
				data.result = dfd.promise();
				RemixerFunctions.getSubpages(node.data.url, node.data.subdomain, {
					linkTitle: true,
					includeMatter: true
				}).then((result) => dfd.resolve(result), node.data.subdomain);
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
		$('#LTLeftAlert').hide();
		this.updateLeft();
		this.setState({initialized: true});
	}
	
	render() {
		let target = document.createElement('div');
		target.id = 'LTRemixer';
		
		let currentlyActive;
		if (this.state.initialized) {
			const leftTree = $('#LTLeft').fancytree('getTree');
			
			// currentlyActive = leftTree.getActiveNode();
			currentlyActive = this.props.currentlyActive; //|| (currentlyActive ? currentlyActive.key : '');
			leftTree.reload(this.state.LibraryTree);
			if (currentlyActive) {
				leftTree.activateKey(currentlyActive, {noFocus: true});
			}
			currentlyActive = leftTree.getNodeByKey(this.props.currentlyActive);
		}
		
		let permission = RemixerFunctions.userPermissions(true);
		return <div id='LTForm'>
			<div className="LTFormHeader" style={{backgroundColor: permission.color}}>
				<div className='LTTitle'><Tooltip title={permission.description}>
					<div style={{display: 'flex', alignItems: 'center'}}>{this.props.permission} Mode
						<Info style={{marginLeft: 10}}/></div>
				</Tooltip></div>
				<Button variant="contained" onClick={this.handleReRemix} disabled={!currentlyActive}
				        className={'expandedLabel'}>
					<span>ReRemix selection</span><DoubleArrowIcon/>
				</Button>
			</div>
			<div id='LTFormContainer'>
				<div>Library Panel<select id='LTFormSubdomain'
				                          onChange={this.setSubdomain}
				                          value={this.state.subdomain}>{this.getSelectOptions()}</select>
					<div id='LTLeft' className='treePanel'></div>
				</div>
			</div>
			<Dialog open={!this.state.initialized} aria-labelledby="form-dialog-title"
			        id="editDialog">
				<DialogTitle id="form-dialog-title">Loading ReRemixer
				</DialogTitle>
				<DialogContent style={{display: 'flex', justifyContent: 'center', padding: 50}}>
					<CircularProgress size={100}/>
				</DialogContent>
			</Dialog>
			<Dialog open={this.state.transferring} aria-labelledby="form-dialog-title"
			        id="editDialog">
				<DialogTitle id="form-dialog-title">Loading Content for ReRemix
				</DialogTitle>
				<DialogContent style={{display: 'flex', justifyContent: 'center', padding: 50}}>
					<CircularProgress size={100}/>
				</DialogContent>
			</Dialog>
		</div>;
	}
	
	debug() {
		let root = $('#LTRight').fancytree('getTree').getNodeByKey('ROOT');
		return root.toDict(true);
	}
	
	setSubdomain = async (e) => {
		let subdomain = e.target.value;
		let [, destination] = LibreTexts.parseURL();
		destination = `https://${subdomain}.libretexts.org/${destination}`;
		
		if (confirm(`The ReRemixer requires you to be on the same library as your content. Would you like to be navigated to ${destination}?`))
			window.location.href = destination;
	};
	
	getSelectOptions() {
		let current = window.location.origin.split('/')[2].split('.')[0];
		let libraries = LibreTexts.libraries;
		let result = [];
		Object.keys(libraries).map(function (key, index) {
			result.push(<option value={libraries[key]} key={key}>{key}</option>);
		});
		return result;
	}
	
	handleReRemix = async () => {
		if (!this.props.currentlyActive) {
			return;
		}
		const LTLeft = $('#LTLeft').fancytree('getTree');
		let currentlyActive = LTLeft.getNodeByKey(this.props.currentlyActive);
		if (!currentlyActive) {
			this.props.enqueueSnackbar('Invalid node! Please try selecting the node again', {
				variant: 'error',
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'right',
				},
			});
			return;
		}
		if (!currentlyActive.isLazy()) {
			this.props.enqueueSnackbar('Node must have children to ReRemix!', {
				variant: 'error',
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'right',
				},
			});
			return;
		}
		else if (currentlyActive.data.security && currentlyActive.data.security === 'Viewer') {
			this.props.enqueueSnackbar('You have insufficient permissions to modify this page', {
				variant: 'error',
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'right',
				},
			});
			return;
		}
		this.setState({transferring: true});
		await currentlyActive.visitAndLoad();
		this.setState({transferring: false});
		
		currentlyActive = currentlyActive.toDict(true);
		currentlyActive.key = 'ROOT';
		currentlyActive.expanded = true;
		let rootPath = currentlyActive.data.path;
		RemixerFunctions.ReRemixTree(currentlyActive, rootPath);
		
		this.props.enqueueSnackbar(`${currentlyActive.title} is ready for ReRemixing!`, {
			variant: 'success',
			anchorOrigin: {
				vertical: 'bottom',
				horizontal: 'right',
			},
		});
		this.props.updateRemixer({stage: 'Remixing', RemixTree: currentlyActive, currentlyActive: ''});
	}
}

export default withSnackbar(ReRemixerPanel); //Allows snackbars