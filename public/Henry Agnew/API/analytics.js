if (!window["analytics.js"]) {
	window["analytics.js"] = true;
	ay();
	
	function ay() {
		const ua = navigator.userAgent.toLowerCase();
		const isSafari = ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
		const sessionID = '_' + Math.random().toString(36).substr(2, 9);
		const root = "api.libretexts.org";
		// const root = "home.miniland1333.com";
		
		
		window.addEventListener('load', function () {
			if (sessionStorage.getItem('ay')) {
				console.log("LAL");
				track()
			}
			else {
				fetch(`https://${root}/ay/ping`).then((response) => {
					if (response.ok) {
						console.log("LA");
						sessionStorage.setItem('ay', 'true');
						track();
					}
					else {
						console.error(response.status)
					}
				});
			}
		});
		
		function track() {
			report('accessed');
			
			let pageTitle = document.getElementById("title");
			pageTitle = pageTitle ? pageTitle.innerText : document.title;
			TimeMe.initialize({
				currentPageName: pageTitle, // current page
				idleTimeoutInSeconds: 600 // seconds
			});
			
			//Page switch handling
			let hidden, visibilityChange, isActive = true;
			if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
				hidden = "hidden";
				visibilityChange = "visibilitychange";
			}
			else if (typeof document.msHidden !== "undefined") {
				hidden = "msHidden";
				visibilityChange = "msvisibilitychange";
			}
			else if (typeof document.webkitHidden !== "undefined") {
				hidden = "webkitHidden";
				visibilityChange = "webkitvisibilitychange";
			}
			document.addEventListener(visibilityChange, function () {
				if (document[hidden] && isActive) { //leaving
					isActive = false;
					report('switched away');
				}
				else if (!document[hidden] && !isActive) { //returning
					isActive = true;
					report('switched to');
				}
			});
			
			//LTI iframe event handling
			window.addEventListener('message', function (message) {
				try {
					message = JSON.parse(message.data);
					console.log(message);
					if (message && message.subject === 'caliper.event') {
						let {type, action, element_id} = message;
						report(action, {id: type, element_id: element_id});
					}
				} catch (e) {
				
				}
			});
			
			//Time on page handling
			window.addEventListener('pagehide', function () {
				if (isSafari) { //workaround due to pagehide asynchronous http request bug in safari
					$.ajax({
						type: "POST",
						async: false,
						url: `https://${root}/ay/receive`,
						data: getBody('left', 'page', {
							type: 'ajax'
						}),
						timeout: 5000
					});
				}
				report('left', 'page', {
					type: 'pagehide'
				});
			});
			//Backup event for time on page
			window.addEventListener('beforeunload', function () {
				report('left', 'page', {
					type: 'beforeunload'
				});
			});
			
			//Scroll depth handling
			jQuery.scrollDepth({
				userTiming: false,
				pixelDepth: false,
				noCache: true,
				eventHandler: function (data) {
					report('read', null, {result: {'percent': data.eventLabel}})
				}
			});
			
			//Answer Reveal
			$('dl > dt').click(function () {
				report('answerReveal', null, {result: {'answer': this.innerText}})
			});
			
			//Recommended Link
			$('a.mt-related-listing-link').click(function () {
				report('recommendedTo', null, {result: {'recommendation': this.href}})
			})
		}
		
		function report(verb, object, extra) {
			navigator.sendBeacon(`https://${root}/ay/receive`, getBody(verb, object, extra));
		}
		
		function getGroup() {
			let groups = document.getElementById('groupHolder').innerText;
			let classArray = ['Chem-110A-F20'];
			let result = [];
/*			if (window.location.href.includes('Facciotti') && document.getElementsByClassName('nb_sidebar').length) {
				result.push('Bis2AFacciotti');
			}*/
			
			for (let i = 0; i < classArray.length; i++) {
				if (groups.includes(classArray[i])) {
					result.push(classArray[i]);
				}
			}
			
			if (!result.length)
				return undefined;
			else if (result.length === 1)
				return result[0];
			else
				return result;
		}
		
		function getBody(verb, object, extra) {
			let result = {
				actor: getActor(),
				verb: verb,
				object: getObject(object)
			};
			result = Object.assign(result, extra);
			return JSON.stringify(result);
			
			function getActor() {
				let library = window.location.host.split('.')[0];
				let userID;
				switch (library) {
					case 'bio':
						//nb handling
						let cookies = document.cookie.split('; ');
						let nbUser = cookies.find(function (element) {
							return element.startsWith('userinfo=') &&  element.includes('email');
						});
						
						if (nbUser) {
							nbUser = decodeURIComponent(decodeURIComponent(nbUser.replace('userinfo=', '')));
							nbUser = JSON.parse(nbUser);
							userID = md5(nbUser.email);
						}
						else {
							userID = 'unknown'
						}
						return {
							courseName: getGroup(),
							library: library,
							id: userID,
							platform: platform,
						};
					case 'webwork':
						let url = window.location.href;
						userID = url.match(/user=[A-Za-z]*/);
						if (userID) {
							userID = userID[0];
							userID = userID.replace('user=', '');
							console.log(userID);
						}
						else {
							userID = 'unknown'
						}
						return {
							courseName: getGroup(),
							library: library,
							id: userID,
							platform: platform,
						};
					default:
						userID = document.getElementById("userIDHolder").innerText;
						return {
							courseName: getGroup(),
							library: library,
							id: userID,
							platform: platform
						};
				}
			}
			
			function getVerb(verb) {
				switch (verb) {
					case  'read':
						return {
							"name": {
								"en-US": "read"
							},
							"description": {
								"en-US": "Indicates that the actor read the object. This is typically only applicable for objects representing printed or written content, such as a book, a message or a comment. The \"read\" verb is a more specific form of the \"consume\", \"experience\" and \"play\" verbs."
							}
						};
					case 'accessed':
						return {
							"name": {
								"en-US": "accessed"
							},
							"description": {
								"en-US": "Indicates that the actor has accessed the object. For instance, a person accessing a room, or accessing a file."
							}
						};
					case 'left':
						return {
							"name": {
								"en-US": "left"
							},
							"description": {
								"en-US": "Indicates that the actor has left the object. For instance, a Person leaving a Group or checking-out of a Place."
							}
						};
					default:
						return verb;
				}
			}
			
			function getObject(object = 'page') {
				let timestamp = new Date();
				let result = {
					page: window.location.href,
					id: document.getElementById('pageIDHolder').innerText,
					timestamp: timestamp.toUTCString(),
					pageSession: sessionID,
					timeMe: TimeMe.getTimeOnCurrentPageInSeconds()
				};
				
				/*				switch (object) {
									case 'page':
										result.definition = {
											"name": {
												"en-US": "page"
											},
											"description": {
												"en-US": "Represents an area, typically a web page, that is representative of, and generally managed by a particular entity. Such areas are usually dedicated to displaying descriptive information about the entity and showcasing recent content such as articles, photographs and videos. Most social networking applications, for example, provide individual users with their own dedicated \"profile\" pages. Several allow similar types of pages to be created for commercial entities, organizations or events. While the specific details of how pages are implemented, their characteristics and use may vary, the one unifying property is that they are typically \"owned\" by a single entity that is represented by the content provided by the page itself."
											}
										};
										break;

									default:
										result.definition = object;
								}*/
				
				return result;
			}
		}
	}
}
