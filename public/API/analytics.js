if (!window["analytics.js"]) {
	window["analytics.js"] = true;
	ay();

	function ay() {
		const isSafari = navigator.userAgent.toLowerCase().indexOf('safari') !== -1;
		const sessionID = '_' + Math.random().toString(36).substr(2, 9);
		const root = "api.libretexts.org";
		// const root = "home.miniland1333.com";


		window.addEventListener('load', function () {
			fetch(`https://${root}/ay/ping`).then((response) => {
				if (response.ok) {
					console.log("2BH");
					track();
				}
				else {
					console.error(response.status)
				}
			});
		});

		function track() {
			report('accessed');

			const pageTitle = document.getElementById("title").innerText;
			TimeMe.initialize({
				currentPageName: pageTitle, // current page
				idleTimeoutInSeconds: 600 // seconds
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
				// console.log(TimeMe.getTimeOnCurrentPageInSeconds());
				if (isSafari) { //workaround due to pagehide asynchronous http request bug in safari
					$.ajax({
						type: "POST",
						async: false,
						url: `https://${root}/ay/receive`,
						data: getBody('left', 'page', {
							type: 'ajax',
							result: {'timeMe': TimeMe.getTimeOnCurrentPageInSeconds()}
						}),
						timeout: 5000
					});
				}
				else {
					navigator.sendBeacon(`https://${root}/ay/receive`, getBody('left', 'page', {
						type: 'beacon',
						result: {'timeMe': TimeMe.getTimeOnCurrentPageInSeconds()}
					}));
				}
				// report('left', 'page', {type:'fetch',result: {'timeMe': TimeMe.getTimeOnCurrentPageInSeconds()}});

			});

			//Scroll depth handling
			jQuery.scrollDepth({
				userTiming: false,
				pixelDepth: false,
				eventHandler: function (data) {
					report('read', null, {result: {'percent': data.eventLabel}})
				}
			});
		}

		function report(verb, object, extra) {
			fetch(`https://${root}/ay/receive`, {
				method: "POST",
				body: getBody(verb, object, extra)
			}).then();
		}

		function getBody(verb, object, extra) {
			let userID = document.getElementById("userIDHolder").innerText;
			let library = window.location.host.split('.')[0];
			let result = {
				actor: {
					library: library,
					id: userID
				},
				verb: verb,
				object: getObject(object)
			};
			result = Object.assign(result, extra);
			console.log(result);
			return JSON.stringify(result);

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
					timestamp: timestamp.toUTCString(),
					pageSession: sessionID,
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
