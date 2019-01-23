class LTForm {
	static async initialize() {
		this.formScript = document.currentScript;
		let keys = await fetch('https://api.libretexts.org/endpoint/getKey');
		LTForm.keys = await keys.json();

		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		LTForm.content = await this.getSubpages("", subdomain, false, true);
		LTForm.initializeFancyTree();
	}


	static async new() {
		let node = $("#LTRight").fancytree("getActiveNode");
		if (node) {
			node.addChildren({
				title: "New Page",
				padded: "",
				lazy: false,
				expanded: true,
				tooltip: "Newly Created Page",
			});
			await node.setExpanded();
			await LTForm.renumber();
		}
	}

	static mergeUp() {
		let node = $("#LTRight").fancytree("getActiveNode");
		if (node && node.key !== "ROOT") {
			node.setExpanded(true).done(() => {
				if (node.hasChildren()) {
					while (node.hasChildren()) {
						node.getFirstChild().moveTo(node.parent, "child");
					}
					node.remove();
				}
			});
		}
	}

	static delAll() {
		let node = $("#LTRight").fancytree("getActiveNode");
		if (node && node.key !== "ROOT") {
			node.remove();
			LTForm.renumber();
		}
	}

	static default() {
		let node = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		if (confirm("This will delete your work and replace it with the default template. Are you sure?")) {
			const defaultMap = {
				"expanded": true,
				"key": "ROOT",
				"title": "Cover Page.",
				"unselectable": true,
				"children": [
					{
						"expanded": false,
						"key": "_40",
						"lazy": false,
						"selected": false,
						"title": "1: Chapter 1",
						"data": {
							"padded": "01: Chapter 1"
						},
						"children": [
							{
								"expanded": false,
								"key": "_60",
								"lazy": false,
								"selected": false,
								"title": "1.1: Section 1:",
								"data": {
									"padded": "1.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_61",
								"lazy": false,
								"selected": false,
								"title": "1.2: Section 2:",
								"data": {
									"padded": "1.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_62",
								"lazy": false,
								"selected": false,
								"title": "1.3: Section 3:",
								"data": {
									"padded": "1.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_63",
								"lazy": false,
								"selected": false,
								"title": "1.4: Section 4:",
								"data": {
									"padded": "1.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_64",
								"lazy": false,
								"selected": false,
								"title": "1.5: Section 5:",
								"data": {
									"padded": "1.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_65",
								"lazy": false,
								"selected": false,
								"title": "1.6: Section 6:",
								"data": {
									"padded": "1.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_41",
						"lazy": false,
						"selected": false,
						"title": "2: Chapter 2",
						"data": {
							"padded": "02: Chapter 2"
						},
						"children": [
							{
								"expanded": false,
								"key": "_66",
								"lazy": false,
								"selected": false,
								"title": "2.1: Section 1:",
								"data": {
									"padded": "2.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_67",
								"lazy": false,
								"selected": false,
								"title": "2.2: Section 2:",
								"data": {
									"padded": "2.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_68",
								"lazy": false,
								"selected": false,
								"title": "2.3: Section 3:",
								"data": {
									"padded": "2.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_69",
								"lazy": false,
								"selected": false,
								"title": "2.4: Section 4:",
								"data": {
									"padded": "2.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_70",
								"lazy": false,
								"selected": false,
								"title": "2.5: Section 5:",
								"data": {
									"padded": "2.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_71",
								"lazy": false,
								"selected": false,
								"title": "2.6: Section 6:",
								"data": {
									"padded": "2.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_42",
						"lazy": false,
						"selected": false,
						"title": "3: Chapter 3",
						"data": {
							"padded": "03: Chapter 3"
						},
						"children": [
							{
								"expanded": false,
								"key": "_72",
								"lazy": false,
								"selected": false,
								"title": "3.1: Section 1:",
								"data": {
									"padded": "3.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_73",
								"lazy": false,
								"selected": false,
								"title": "3.2: Section 2:",
								"data": {
									"padded": "3.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_74",
								"lazy": false,
								"selected": false,
								"title": "3.3: Section 3:",
								"data": {
									"padded": "3.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_75",
								"lazy": false,
								"selected": false,
								"title": "3.4: Section 4:",
								"data": {
									"padded": "3.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_76",
								"lazy": false,
								"selected": false,
								"title": "3.5: Section 5:",
								"data": {
									"padded": "3.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_77",
								"lazy": false,
								"selected": false,
								"title": "3.6: Section 6:",
								"data": {
									"padded": "3.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_43",
						"lazy": false,
						"selected": false,
						"title": "4: Chapter 4",
						"data": {
							"padded": "04: Chapter 4"
						},
						"children": [
							{
								"expanded": false,
								"key": "_78",
								"lazy": false,
								"selected": false,
								"title": "4.1: Section 1:",
								"data": {
									"padded": "4.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_79",
								"lazy": false,
								"selected": false,
								"title": "4.2: Section 2:",
								"data": {
									"padded": "4.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_80",
								"lazy": false,
								"selected": false,
								"title": "4.3: Section 3:",
								"data": {
									"padded": "4.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_81",
								"lazy": false,
								"selected": false,
								"title": "4.4: Section 4:",
								"data": {
									"padded": "4.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_82",
								"lazy": false,
								"selected": false,
								"title": "4.5: Section 5:",
								"data": {
									"padded": "4.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_83",
								"lazy": false,
								"selected": false,
								"title": "4.6: Section 6:",
								"data": {
									"padded": "4.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_44",
						"lazy": false,
						"selected": false,
						"title": "5: Chapter 5",
						"data": {
							"padded": "05: Chapter 5"
						},
						"children": [
							{
								"expanded": false,
								"key": "_84",
								"lazy": false,
								"selected": false,
								"title": "5.1: Section 1:",
								"data": {
									"padded": "5.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_85",
								"lazy": false,
								"selected": false,
								"title": "5.2: Section 2:",
								"data": {
									"padded": "5.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_86",
								"lazy": false,
								"selected": false,
								"title": "5.3: Section 3:",
								"data": {
									"padded": "5.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_87",
								"lazy": false,
								"selected": false,
								"title": "5.4: Section 4:",
								"data": {
									"padded": "5.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_88",
								"lazy": false,
								"selected": false,
								"title": "5.5: Section 5:",
								"data": {
									"padded": "5.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_89",
								"lazy": false,
								"selected": false,
								"title": "5.6: Section 6:",
								"data": {
									"padded": "5.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_45",
						"lazy": false,
						"selected": false,
						"title": "6: Chapter 6",
						"data": {
							"padded": "06: Chapter 6"
						},
						"children": [
							{
								"expanded": false,
								"key": "_90",
								"lazy": false,
								"selected": false,
								"title": "6.1: Section 1:",
								"data": {
									"padded": "6.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_91",
								"lazy": false,
								"selected": false,
								"title": "6.2: Section 2:",
								"data": {
									"padded": "6.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_92",
								"lazy": false,
								"selected": false,
								"title": "6.3: Section 3:",
								"data": {
									"padded": "6.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_93",
								"lazy": false,
								"selected": false,
								"title": "6.4: Section 4:",
								"data": {
									"padded": "6.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_94",
								"lazy": false,
								"selected": false,
								"title": "6.5: Section 5:",
								"data": {
									"padded": "6.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_95",
								"lazy": false,
								"selected": false,
								"title": "6.6: Section 6:",
								"data": {
									"padded": "6.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_46",
						"lazy": false,
						"selected": false,
						"title": "7: Chapter 7",
						"data": {
							"padded": "07: Chapter 7"
						},
						"children": [
							{
								"expanded": false,
								"key": "_96",
								"lazy": false,
								"selected": false,
								"title": "7.1: Section 1:",
								"data": {
									"padded": "7.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_97",
								"lazy": false,
								"selected": false,
								"title": "7.2: Section 2:",
								"data": {
									"padded": "7.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_98",
								"lazy": false,
								"selected": false,
								"title": "7.3: Section 3:",
								"data": {
									"padded": "7.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_99",
								"lazy": false,
								"selected": false,
								"title": "7.4: Section 4:",
								"data": {
									"padded": "7.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_100",
								"lazy": false,
								"selected": false,
								"title": "7.5: Section 5:",
								"data": {
									"padded": "7.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_101",
								"lazy": false,
								"selected": false,
								"title": "7.6: Section 6:",
								"data": {
									"padded": "7.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_47",
						"lazy": false,
						"selected": false,
						"title": "8: Chapter 8",
						"data": {
							"padded": "08: Chapter 8"
						},
						"children": [
							{
								"expanded": false,
								"key": "_102",
								"lazy": false,
								"selected": false,
								"title": "8.1: Section 1:",
								"data": {
									"padded": "8.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_103",
								"lazy": false,
								"selected": false,
								"title": "8.2: Section 2:",
								"data": {
									"padded": "8.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_104",
								"lazy": false,
								"selected": false,
								"title": "8.3: Section 3:",
								"data": {
									"padded": "8.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_105",
								"lazy": false,
								"selected": false,
								"title": "8.4: Section 4:",
								"data": {
									"padded": "8.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_106",
								"lazy": false,
								"selected": false,
								"title": "8.5: Section 5:",
								"data": {
									"padded": "8.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_107",
								"lazy": false,
								"selected": false,
								"title": "8.6: Section 6:",
								"data": {
									"padded": "8.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_48",
						"lazy": false,
						"selected": false,
						"title": "9: Chapter 9",
						"data": {
							"padded": "09: Chapter 9"
						},
						"children": [
							{
								"expanded": false,
								"key": "_108",
								"lazy": false,
								"selected": false,
								"title": "9.1: Section 1:",
								"data": {
									"padded": "9.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_109",
								"lazy": false,
								"selected": false,
								"title": "9.2: Section 2:",
								"data": {
									"padded": "9.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_110",
								"lazy": false,
								"selected": false,
								"title": "9.3: Section 3:",
								"data": {
									"padded": "9.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_111",
								"lazy": false,
								"selected": false,
								"title": "9.4: Section 4:",
								"data": {
									"padded": "9.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_112",
								"lazy": false,
								"selected": false,
								"title": "9.5: Section 5:",
								"data": {
									"padded": "9.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_113",
								"lazy": false,
								"selected": false,
								"title": "9.6: Section 6:",
								"data": {
									"padded": "9.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_49",
						"lazy": false,
						"selected": false,
						"title": "10: Chapter 10",
						"data": {
							"padded": "10: Chapter 10"
						},
						"children": [
							{
								"expanded": false,
								"key": "_114",
								"lazy": false,
								"selected": false,
								"title": "10.1: Section 1:",
								"data": {
									"padded": "10.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_115",
								"lazy": false,
								"selected": false,
								"title": "10.2: Section 2:",
								"data": {
									"padded": "10.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_116",
								"lazy": false,
								"selected": false,
								"title": "10.3: Section 3:",
								"data": {
									"padded": "10.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_117",
								"lazy": false,
								"selected": false,
								"title": "10.4: Section 4:",
								"data": {
									"padded": "10.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_118",
								"lazy": false,
								"selected": false,
								"title": "10.5: Section 5:",
								"data": {
									"padded": "10.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_119",
								"lazy": false,
								"selected": false,
								"title": "10.6: Section 6:",
								"data": {
									"padded": "10.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_50",
						"lazy": false,
						"selected": false,
						"title": "11: Chapter 11",
						"data": {
							"padded": "11: Chapter 11"
						},
						"children": [
							{
								"expanded": false,
								"key": "_120",
								"lazy": false,
								"selected": false,
								"title": "11.1: Section 1:",
								"data": {
									"padded": "11.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_121",
								"lazy": false,
								"selected": false,
								"title": "11.2: Section 2:",
								"data": {
									"padded": "11.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_122",
								"lazy": false,
								"selected": false,
								"title": "11.3: Section 3:",
								"data": {
									"padded": "11.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_123",
								"lazy": false,
								"selected": false,
								"title": "11.4: Section 4:",
								"data": {
									"padded": "11.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_124",
								"lazy": false,
								"selected": false,
								"title": "11.5: Section 5:",
								"data": {
									"padded": "11.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_125",
								"lazy": false,
								"selected": false,
								"title": "11.6: Section 6:",
								"data": {
									"padded": "11.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_51",
						"lazy": false,
						"selected": false,
						"title": "12: Chapter 12",
						"data": {
							"padded": "12: Chapter 12"
						},
						"children": [
							{
								"expanded": false,
								"key": "_126",
								"lazy": false,
								"selected": false,
								"title": "12.1: Section 1:",
								"data": {
									"padded": "12.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_127",
								"lazy": false,
								"selected": false,
								"title": "12.2: Section 2:",
								"data": {
									"padded": "12.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_128",
								"lazy": false,
								"selected": false,
								"title": "12.3: Section 3:",
								"data": {
									"padded": "12.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_129",
								"lazy": false,
								"selected": false,
								"title": "12.4: Section 4:",
								"data": {
									"padded": "12.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_130",
								"lazy": false,
								"selected": false,
								"title": "12.5: Section 5:",
								"data": {
									"padded": "12.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_131",
								"lazy": false,
								"selected": false,
								"title": "12.6: Section 6:",
								"data": {
									"padded": "12.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_52",
						"lazy": false,
						"selected": false,
						"title": "13: Chapter 13",
						"data": {
							"padded": "13: Chapter 13"
						},
						"children": [
							{
								"expanded": false,
								"key": "_132",
								"lazy": false,
								"selected": false,
								"title": "13.1: Section 1:",
								"data": {
									"padded": "13.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_133",
								"lazy": false,
								"selected": false,
								"title": "13.2: Section 2:",
								"data": {
									"padded": "13.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_134",
								"lazy": false,
								"selected": false,
								"title": "13.3: Section 3:",
								"data": {
									"padded": "13.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_135",
								"lazy": false,
								"selected": false,
								"title": "13.4: Section 4:",
								"data": {
									"padded": "13.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_136",
								"lazy": false,
								"selected": false,
								"title": "13.5: Section 5:",
								"data": {
									"padded": "13.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_137",
								"lazy": false,
								"selected": false,
								"title": "13.6: Section 6:",
								"data": {
									"padded": "13.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_53",
						"lazy": false,
						"selected": false,
						"title": "14: Chapter 14",
						"data": {
							"padded": "14: Chapter 14"
						},
						"children": [
							{
								"expanded": false,
								"key": "_138",
								"lazy": false,
								"selected": false,
								"title": "14.1: Section 1:",
								"data": {
									"padded": "14.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_139",
								"lazy": false,
								"selected": false,
								"title": "14.2: Section 2:",
								"data": {
									"padded": "14.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_140",
								"lazy": false,
								"selected": false,
								"title": "14.3: Section 3:",
								"data": {
									"padded": "14.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_141",
								"lazy": false,
								"selected": false,
								"title": "14.4: Section 4:",
								"data": {
									"padded": "14.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_142",
								"lazy": false,
								"selected": false,
								"title": "14.5: Section 5:",
								"data": {
									"padded": "14.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_143",
								"lazy": false,
								"selected": false,
								"title": "14.6: Section 6:",
								"data": {
									"padded": "14.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_54",
						"lazy": false,
						"selected": false,
						"title": "15: Chapter 15",
						"data": {
							"padded": "15: Chapter 15"
						},
						"children": [
							{
								"expanded": false,
								"key": "_144",
								"lazy": false,
								"selected": false,
								"title": "15.1: Section 1:",
								"data": {
									"padded": "15.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_145",
								"lazy": false,
								"selected": false,
								"title": "15.2: Section 2:",
								"data": {
									"padded": "15.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_146",
								"lazy": false,
								"selected": false,
								"title": "15.3: Section 3:",
								"data": {
									"padded": "15.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_147",
								"lazy": false,
								"selected": false,
								"title": "15.4: Section 4:",
								"data": {
									"padded": "15.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_148",
								"lazy": false,
								"selected": false,
								"title": "15.5: Section 5:",
								"data": {
									"padded": "15.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_149",
								"lazy": false,
								"selected": false,
								"title": "15.6: Section 6:",
								"data": {
									"padded": "15.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_55",
						"lazy": false,
						"selected": false,
						"title": "16: Chapter 16",
						"data": {
							"padded": "16: Chapter 16"
						},
						"children": [
							{
								"expanded": false,
								"key": "_150",
								"lazy": false,
								"selected": false,
								"title": "16.1: Section 1:",
								"data": {
									"padded": "16.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_151",
								"lazy": false,
								"selected": false,
								"title": "16.2: Section 2:",
								"data": {
									"padded": "16.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_152",
								"lazy": false,
								"selected": false,
								"title": "16.3: Section 3:",
								"data": {
									"padded": "16.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_153",
								"lazy": false,
								"selected": false,
								"title": "16.4: Section 4:",
								"data": {
									"padded": "16.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_154",
								"lazy": false,
								"selected": false,
								"title": "16.5: Section 5:",
								"data": {
									"padded": "16.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_155",
								"lazy": false,
								"selected": false,
								"title": "16.6: Section 6:",
								"data": {
									"padded": "16.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_56",
						"lazy": false,
						"selected": false,
						"title": "17: Chapter 17",
						"data": {
							"padded": "17: Chapter 17"
						},
						"children": [
							{
								"expanded": false,
								"key": "_156",
								"lazy": false,
								"selected": false,
								"title": "17.1: Section 1:",
								"data": {
									"padded": "17.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_157",
								"lazy": false,
								"selected": false,
								"title": "17.2: Section 2:",
								"data": {
									"padded": "17.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_158",
								"lazy": false,
								"selected": false,
								"title": "17.3: Section 3:",
								"data": {
									"padded": "17.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_159",
								"lazy": false,
								"selected": false,
								"title": "17.4: Section 4:",
								"data": {
									"padded": "17.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_160",
								"lazy": false,
								"selected": false,
								"title": "17.5: Section 5:",
								"data": {
									"padded": "17.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_161",
								"lazy": false,
								"selected": false,
								"title": "17.6: Section 6:",
								"data": {
									"padded": "17.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_57",
						"lazy": false,
						"selected": false,
						"title": "18: Chapter 18",
						"data": {
							"padded": "18: Chapter 18"
						},
						"children": [
							{
								"expanded": false,
								"key": "_162",
								"lazy": false,
								"selected": false,
								"title": "18.1: Section 1:",
								"data": {
									"padded": "18.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_163",
								"lazy": false,
								"selected": false,
								"title": "18.2: Section 2:",
								"data": {
									"padded": "18.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_164",
								"lazy": false,
								"selected": false,
								"title": "18.3: Section 3:",
								"data": {
									"padded": "18.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_165",
								"lazy": false,
								"selected": false,
								"title": "18.4: Section 4:",
								"data": {
									"padded": "18.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_166",
								"lazy": false,
								"selected": false,
								"title": "18.5: Section 5:",
								"data": {
									"padded": "18.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_167",
								"lazy": false,
								"selected": false,
								"title": "18.6: Section 6:",
								"data": {
									"padded": "18.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_58",
						"lazy": false,
						"selected": false,
						"title": "19: Chapter 19",
						"data": {
							"padded": "19: Chapter 19"
						},
						"children": [
							{
								"expanded": false,
								"key": "_168",
								"lazy": false,
								"selected": false,
								"title": "19.1: Section 1:",
								"data": {
									"padded": "19.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_169",
								"lazy": false,
								"selected": false,
								"title": "19.2: Section 2:",
								"data": {
									"padded": "19.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_170",
								"lazy": false,
								"selected": false,
								"title": "19.3: Section 3:",
								"data": {
									"padded": "19.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_171",
								"lazy": false,
								"selected": false,
								"title": "19.4: Section 4:",
								"data": {
									"padded": "19.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_172",
								"lazy": false,
								"selected": false,
								"title": "19.5: Section 5:",
								"data": {
									"padded": "19.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_173",
								"lazy": false,
								"selected": false,
								"title": "19.6: Section 6:",
								"data": {
									"padded": "19.6: Section 6:"
								}
							}
						]
					},
					{
						"expanded": false,
						"key": "_59",
						"lazy": false,
						"selected": false,
						"title": "20: Chapter 20",
						"data": {
							"padded": "20: Chapter 20"
						},
						"children": [
							{
								"expanded": false,
								"key": "_174",
								"lazy": false,
								"selected": false,
								"title": "20.1: Section 1:",
								"data": {
									"padded": "20.1: Section 1:"
								}
							},
							{
								"expanded": false,
								"key": "_175",
								"lazy": false,
								"selected": false,
								"title": "20.2: Section 2:",
								"data": {
									"padded": "20.2: Section 2:"
								}
							},
							{
								"expanded": false,
								"key": "_176",
								"lazy": false,
								"selected": false,
								"title": "20.3: Section 3:",
								"data": {
									"padded": "20.3: Section 3:"
								}
							},
							{
								"expanded": false,
								"key": "_177",
								"lazy": false,
								"selected": false,
								"title": "20.4: Section 4:",
								"data": {
									"padded": "20.4: Section 4:"
								}
							},
							{
								"expanded": false,
								"key": "_178",
								"lazy": false,
								"selected": false,
								"title": "20.5: Section 5:",
								"data": {
									"padded": "20.5: Section 5:"
								}
							},
							{
								"expanded": false,
								"key": "_179",
								"lazy": false,
								"selected": false,
								"title": "20.6: Section 6:",
								"data": {
									"padded": "20.6: Section 6:"
								}
							}
						]
					}
				],
				"data": {
					"padded": false
				},
				"lazy": false
			};
			node.fromDict(defaultMap);
			node.setExpanded();
		}
	}

	static async reset() {
		let node = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		if (confirm("This will delete your work. Are you sure?")) {
			node.removeChildren();
		}
	}

	static async renumber() {
		let root = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		if (!root.children) {
			return false;
		}
		for (let i = 0; i < root.children.length; i++) {
			if (root.children[i].lazy) {
				await root.children[i].visitAndLoad();
			}
		}
		let d = root.toDict(true);
		let depth = this.getDepth(d);
		let chapter = 1;
		let shallow = depth < 2;
		processNode(d, 0, 0, false,);
		root.fromDict(d);
		root.setExpanded(true);

		function processNode(node, index, level, overTen) {
			node.title = node.title.replace('&amp;', 'and');
			if (level && depth - level <= 1 && node.title.includes(": ")) {
				node.title = node.title.replace(/^[^:]*: /, "");
			}
			if ((!shallow && depth - level === 1) || (shallow && level === 1)) { //Chapter handling
				node.data["padded"] = `${overTen ? ("" + index).padStart(2, "0") : index}: ${node.title}`;
				node.title = `${index}: ${node.title}`;
				chapter = index;
			}
			else if (!shallow && depth - level === 0) { //Page handling
				node.data["padded"] = `${chapter}.${overTen ? ("" + index).padStart(2, "0") : index}: ${node.title}`;
				node.title = `${chapter}.${index}: ${node.title}`;
			}
			else {
				node.data["padded"] = false;
			}
			node.lazy = false;
			if (node.children) {
				for (let i = 0; i < node.children.length; i++) {
					node.children[i] = processNode(node.children[i], i + 1, level + 1, node.children.length >= 10);
				}
			}
			return node;
		}
	}

	static debug() {
		let root = $("#LTRight").fancytree("getTree").getNodeByKey("ROOT");
		return root.toDict(true);
	}

	static async setSubdomain() {
		let select = document.getElementById('LTFormSubdomain');
		let subdomain = select.value;
		this.subdomain = subdomain;
		let name = $(`#LTFormSubdomain option[value="${subdomain}"]`).text();
		let LTLeft = $("#LTLeft").fancytree("getTree");
		let LeftAlert = $("#LTLeftAlert");

		LTLeft.enable(false);
		LeftAlert.text(`Loading ${name}`);
		LeftAlert.slideDown();
		LTForm.content = await this.getSubpages("", subdomain, false, true);
		let root = LTLeft.getRootNode();
		root.removeChildren();
		root.addChildren(LTForm.content);

		for (let i = 0; i < root.children.length; i++) {
			let node = root.children[i];
			node.icon = `https://static.libretexts.org/img/LibreTexts/glyphs/${subdomain}.png`;
			node.renderTitle();
		}

		LeftAlert.slideUp();
		LTLeft.enable(true);
	}

	static setName() {
		let name = document.getElementById("LTFormName").value;
		name = name.replace('&', 'and');
		$("#LTRight").fancytree("getTree").getNodeByKey("ROOT").setTitle(name);
	}

	static getDepth(tree) {
		let depth = 0;
		while (tree && tree.children) {
			depth++;
			tree = tree.children[0];
		}
		return depth;
	}

	static async getSubpages(path, subdomain, full, linkTitle) {
		path = path.replace(`https://${subdomain}.libretexts.org/`, "");
		let response = await this.authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
		response = await response.json();
		return await subpageCallback(response);

		async function subpageCallback(info) {
			let subpageArray = info["page.subpage"];
			if (subpageArray) {
				subpageArray = subpageArray.length ? info["page.subpage"] : [info["page.subpage"]];
			}
			const result = [];
			const promiseArray = [];

			async function subpage(subpage, index) {
				let url = subpage["uri.ui"];
				let path = subpage.path["#text"];
				url = url.replace('?title=', '');
				path = path.replace('?title=', '');
				const hasChildren = subpage["@subpages"] === "true";
				let children = hasChildren ? undefined : [];
				if (hasChildren && (full)) { //recurse down
					children = await LTForm.authenticatedFetch(path, 'subpages?dream.out.format=json', subdomain);
					children = await children.json();
					children = await subpageCallback(children, false);
				}
				result[index] = {
					title: linkTitle ? `${subpage.title}<a href="${url}" target="_blank"> ></a>` : subpage.title,
					url: url,
					path: url.replace(`https://${subdomain}.libretexts.org/`, ""),
					id: parseInt(subpage['@id']),
					children: children,
					lazy: !full,
					subdomain: subdomain,
				};
			}

			if (subpageArray && subpageArray.length) {
				for (let i = 0; i < subpageArray.length; i++) {
					promiseArray[i] = subpage(subpageArray[i], i);
				}

				await Promise.all(promiseArray);
				return result;
			}
			else {
				return [];
			}
		}
	}

	static async copyTransclude() {
		let LTRight = $("#LTRight").fancytree("getTree");
		let RightAlert = $("#LTRightAlert");
		let url = window.location.href;

		if (url.includes('?url=')) {
			url = decodeURIComponent(url);
			url = url.split('url=')[1];
			let subdomain = url.split('/')[2].split('.')[0];
			let path = url.split('/').splice(3).join('/');

			LTRight.enable(false);
			RightAlert.text(`Loading Copy-Transclude`);
			RightAlert.slideDown();
			let content = await this.getSubpages(path, subdomain);
			let root = LTRight.getNodeByKey("ROOT");
			root.removeChildren();
			root.addChildren(content);
			await LTForm.renumber();
			RightAlert.slideUp();
			LTRight.enable(true);
		}
	}

	static async initializeFancyTree() {

		if (LTForm.content) {
			let target = document.createElement("div");
			target.id = "LTRemixer";
			const isAdmin = document.getElementById("adminHolder").innerText === 'true';
			const isPro = document.getElementById("proHolder").innerText === 'true';
			const groups = document.getElementById("groupHolder").innerText;
			let allowed = isAdmin || (isPro && groups.includes('faculty'));
			target.innerHTML =
				"<div id='LTForm'>" +
				`<div class='LTFormHeader'><div class='LTTitle'>${allowed ? "Edit Mode" : "Demonstration Mode"}</div><button onclick='LTForm.new()'>New Page</button><button onclick='LTForm.delAll()'>Delete</button><button onclick='LTForm.mergeUp()'>Merge Folder Up</button><button onclick='LTForm.default()'>Default</button><button onclick='LTForm.reset()'>Clear All</button></div>` +
				`<div id='LTFormContainer'><div>Source Panel<select id='LTFormSubdomain' onchange='LTForm.setSubdomain()'>${LTForm.getSelectOptions()}</select><div id='LTLeft'></div></div><div>Editor Panel<div id='LTRight'></div></div></div>` +
				`<div id='LTFormFooter'><div>Select your college<select id='LTFormInstitutions'></select></div><div>Name for your LibreText (Usually your course name)<input id='LTFormName' oninput='LTForm.setName()'/></div>${formMode(isAdmin)}</div>` +
				"<div><button onclick='LTForm.publish()'>Publish your LibreText</button><div id='copyResults'></div><div id='copyErrors'></div> </div>";

			LTForm.formScript.parentElement.insertBefore(target, LTForm.formScript);
			const LTLeft = $("#LTLeft");
			const LTRight = $("#LTRight");
			LTLeft.fancytree({
				source: LTForm.content,
				debugLevel: 0,
				autoScroll: true,
				extensions: ["dnd5"],
				lazyLoad: function (event, data) {
					const dfd = new $.Deferred();
					let node = data.node;
					data.result = dfd.promise();
					LTForm.getSubpages(node.data.url, node.data.subdomain, false, true).then((result) => dfd.resolve(result), node.data.subdomain);
				},
				dnd5: {
					// autoExpandMS: 400,
					// preventForeignNodes: true,
					// preventNonNodes: true,
					// preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
					// preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
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
						data.dataTransfer.dropEffect = "move";
					},
					dragEnd: function (node, data) {
					},

					// --- Drop-support:

					dragEnter: function (node, data) {
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
					},
				},
				icon: function (event, data) {
					let subdomain = window.location.origin.split("/")[2].split(".")[0];
					if ((!LTForm.subdomain || LTForm.subdomain === subdomain) && data.node.getLevel() === 1)
						return `https://static.libretexts.org/img/LibreTexts/glyphs/${subdomain}.png`;
				}
			});
			LTRight.fancytree({
				source: [{
					"expanded": true,
					"key": "ROOT",
					"lazy": false,
					"title": "Cover Page. Drag onto me to get started",
					"unselectable": true,
					"data": {"url": "", "padded": false},
					"children": [{
						"key": "_43",
						"lazy": false,
						"title": "Book: Prealgebra (OpenStax)",
						"data": {
							"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)",
							"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)",
							"id": 4969,
							"subdomain": "math",
							"padded": false
						},
						"children": [{
							"key": "_185",
							"lazy": false,
							"title": "1: Whole Numbers",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers",
								"id": 4976,
								"subdomain": "math",
								"padded": "01: Whole Numbers"
							},
							"children": [{
								"key": "_252",
								"lazy": false,
								"title": "1.1: Introduction to Whole Numbers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.1%3A_Introduction_to_Whole_Numbers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.1%3A_Introduction_to_Whole_Numbers_(Part_1)",
									"id": 4970,
									"subdomain": "math",
									"padded": "1.01: Introduction to Whole Numbers (Part 1)"
								}
							}, {
								"key": "_253",
								"lazy": false,
								"title": "1.2: Introduction to Whole Numbers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.1%3A_Introduction_to_Whole_Numbers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.1%3A_Introduction_to_Whole_Numbers_(Part_2)",
									"id": 5260,
									"subdomain": "math",
									"padded": "1.02: Introduction to Whole Numbers (Part 2)"
								}
							}, {
								"key": "_254",
								"lazy": false,
								"title": "1.3: Add Whole Numbers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.2%3A_Add_Whole_Numbers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.2%3A_Add_Whole_Numbers_(Part_1)",
									"id": 4971,
									"subdomain": "math",
									"padded": "1.03: Add Whole Numbers (Part 1)"
								}
							}, {
								"key": "_255",
								"lazy": false,
								"title": "1.4: Add Whole Numbers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.2%3A_Add_Whole_Numbers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.2%3A_Add_Whole_Numbers_(Part_2)",
									"id": 5767,
									"subdomain": "math",
									"padded": "1.04: Add Whole Numbers (Part 2)"
								}
							}, {
								"key": "_256",
								"lazy": false,
								"title": "1.5: Subtract Whole Numbers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.3%3A_Subtract_Whole_Numbers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.3%3A_Subtract_Whole_Numbers_(Part_1)",
									"id": 4972,
									"subdomain": "math",
									"padded": "1.05: Subtract Whole Numbers (Part 1)"
								}
							}, {
								"key": "_257",
								"lazy": false,
								"title": "1.6: Subtract Whole Numbers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.3%3A_Subtract_Whole_Numbers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.3%3A_Subtract_Whole_Numbers_(Part_2)",
									"id": 5769,
									"subdomain": "math",
									"padded": "1.06: Subtract Whole Numbers (Part 2)"
								}
							}, {
								"key": "_258",
								"lazy": false,
								"title": "1.7: Multiply Whole Numbers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.4%3A_Multiply_Whole_Numbers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.4%3A_Multiply_Whole_Numbers_(Part_1)",
									"id": 4973,
									"subdomain": "math",
									"padded": "1.07: Multiply Whole Numbers (Part 1)"
								}
							}, {
								"key": "_259",
								"lazy": false,
								"title": "1.8: Multiply Whole Numbers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.4%3A_Multiply_Whole_Numbers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.4%3A_Multiply_Whole_Numbers_(Part_2)",
									"id": 5772,
									"subdomain": "math",
									"padded": "1.08: Multiply Whole Numbers (Part 2)"
								}
							}, {
								"key": "_260",
								"lazy": false,
								"title": "1.9: Divide Whole Numbers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.5%3A_Divide_Whole_Numbers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.5%3A_Divide_Whole_Numbers_(Part_1)",
									"id": 4974,
									"subdomain": "math",
									"padded": "1.09: Divide Whole Numbers (Part 1)"
								}
							}, {
								"key": "_261",
								"lazy": false,
								"title": "1.10: Divide Whole Numbers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.5%3A_Divide_Whole_Numbers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.5%3A_Divide_Whole_Numbers_(Part_2)",
									"id": 5774,
									"subdomain": "math",
									"padded": "1.10: Divide Whole Numbers (Part 2)"
								}
							}, {
								"key": "_262",
								"lazy": false,
								"title": "1.11: Whole Numbers (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.E%3A_Whole_Numbers_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.E%3A_Whole_Numbers_(Exercises)",
									"id": 5266,
									"subdomain": "math",
									"padded": "1.11: Whole Numbers (Exercises)"
								}
							}, {
								"key": "_263",
								"lazy": false,
								"title": "1.12: Whole Numbers (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.S%3A_Whole_Numbers_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/1%3A_Whole_Numbers/1.S%3A_Whole_Numbers_(Summary)",
									"id": 5269,
									"subdomain": "math",
									"padded": "1.12: Whole Numbers (Summary)"
								}
							}]
						}, {
							"key": "_186",
							"lazy": false,
							"title": "2: Introduction to the Language of Algebra",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra",
								"id": 4983,
								"subdomain": "math",
								"padded": "02: Introduction to the Language of Algebra"
							},
							"children": [{
								"key": "_197",
								"lazy": false,
								"title": "2.1: Use the Language of Algebra (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.1%3A_Use_the_Language_of_Algebra_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.1%3A_Use_the_Language_of_Algebra_(Part_1)",
									"id": 4977,
									"subdomain": "math",
									"padded": "2.01: Use the Language of Algebra (Part 1)"
								}
							}, {
								"key": "_198",
								"lazy": false,
								"title": "2.2: Use the Language of Algebra (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.1%3A_Use_the_Language_of_Algebra_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.1%3A_Use_the_Language_of_Algebra_(Part_2)",
									"id": 5779,
									"subdomain": "math",
									"padded": "2.02: Use the Language of Algebra (Part 2)"
								}
							}, {
								"key": "_199",
								"lazy": false,
								"title": "2.3: Evaluate, Simplify, and Translate Expressions (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.2%3A_Evaluate%2C_Simplify%2C_and_Translate_Expressions_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.2%3A_Evaluate%2C_Simplify%2C_and_Translate_Expressions_(Part_1)",
									"id": 4978,
									"subdomain": "math",
									"padded": "2.03: Evaluate, Simplify, and Translate Expressions (Part 1)"
								}
							}, {
								"key": "_200",
								"lazy": false,
								"title": "2.4: Evaluate, Simplify, and Translate Expressions (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.2%3A_Evaluate%2C_Simplify%2C_and_Translate_Expressions_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.2%3A_Evaluate%2C_Simplify%2C_and_Translate_Expressions_(Part_2)",
									"id": 5781,
									"subdomain": "math",
									"padded": "2.04: Evaluate, Simplify, and Translate Expressions (Part 2)"
								}
							}, {
								"key": "_201",
								"lazy": false,
								"title": "2.5: Solving Equations Using the Subtraction and Addition Properties of Equality (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.3%3A_Solving_Equations_Using_the_Subtraction_and_Addition_Properties_of_Equality_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.3%3A_Solving_Equations_Using_the_Subtraction_and_Addition_Properties_of_Equality_(Part_1)",
									"id": 4979,
									"subdomain": "math",
									"padded": "2.05: Solving Equations Using the Subtraction and Addition Properties of Equality (Part 1)"
								}
							}, {
								"key": "_202",
								"lazy": false,
								"title": "2.6: Solving Equations Using the Subtraction and Addition Properties of Equality (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.3%3A_Solving_Equations_Using_the_Subtraction_and_Addition_Properties_of_Equality_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.3%3A_Solving_Equations_Using_the_Subtraction_and_Addition_Properties_of_Equality_(Part_2)",
									"id": 5954,
									"subdomain": "math",
									"padded": "2.06: Solving Equations Using the Subtraction and Addition Properties of Equality (Part 2)"
								}
							}, {
								"key": "_203",
								"lazy": false,
								"title": "2.7: Find Multiples and Factors (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.4%3A_Find_Multiples_and_Factors_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.4%3A_Find_Multiples_and_Factors_(Part_1)",
									"id": 4980,
									"subdomain": "math",
									"padded": "2.07: Find Multiples and Factors (Part 1)"
								}
							}, {
								"key": "_204",
								"lazy": false,
								"title": "2.8: Find Multiples and Factors (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.4%3A_Find_Multiples_and_Factors_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.4%3A_Find_Multiples_and_Factors_(Part_2)",
									"id": 5957,
									"subdomain": "math",
									"padded": "2.08: Find Multiples and Factors (Part 2)"
								}
							}, {
								"key": "_205",
								"lazy": false,
								"title": "2.9: Prime Factorization and the Least Common Multiple (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.5%3A_Prime_Factorization_and_the_Least_Common_Multiple_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.5%3A_Prime_Factorization_and_the_Least_Common_Multiple_(Part_1)",
									"id": 4981,
									"subdomain": "math",
									"padded": "2.09: Prime Factorization and the Least Common Multiple (Part 1)"
								}
							}, {
								"key": "_206",
								"lazy": false,
								"title": "2.10: Prime Factorization and the Least Common Multiple (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.5%3A_Prime_Factorization_and_the_Least_Common_Multiple_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.5%3A_Prime_Factorization_and_the_Least_Common_Multiple_(Part_2)",
									"id": 5963,
									"subdomain": "math",
									"padded": "2.10: Prime Factorization and the Least Common Multiple (Part 2)"
								}
							}, {
								"key": "_207",
								"lazy": false,
								"title": "2.11: Introduction to the Language of Algebra (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.E%3A_Introduction_to_the_Language_of_Algebra_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.E%3A_Introduction_to_the_Language_of_Algebra_(Exercises)",
									"id": 4982,
									"subdomain": "math",
									"padded": "2.11: Introduction to the Language of Algebra (Exercises)"
								}
							}, {
								"key": "_208",
								"lazy": false,
								"title": "2.12: Introduction to the Language of Algebra (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.S%3A_Introduction_to_the_Language_of_Algebra_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/2%3A_Introduction_to_the_Language_of_Algebra/2.S%3A_Introduction_to_the_Language_of_Algebra_(Summary)",
									"id": 5965,
									"subdomain": "math",
									"padded": "2.12: Introduction to the Language of Algebra (Summary)"
								}
							}]
						}, {
							"key": "_187",
							"lazy": false,
							"title": "3: Integers",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers",
								"id": 4990,
								"subdomain": "math",
								"padded": "03: Integers"
							},
							"children": [{
								"key": "_240",
								"lazy": false,
								"title": "3.1: Introduction to Integers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.1%3A_Introduction_to_Integers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.1%3A_Introduction_to_Integers_(Part_1)",
									"id": 4984,
									"subdomain": "math",
									"padded": "3.01: Introduction to Integers (Part 1)"
								}
							}, {
								"key": "_241",
								"lazy": false,
								"title": "3.2: Introduction to Integers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.1%3A_Introduction_to_Integers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.1%3A_Introduction_to_Integers_(Part_2)",
									"id": 5969,
									"subdomain": "math",
									"padded": "3.02: Introduction to Integers (Part 2)"
								}
							}, {
								"key": "_242",
								"lazy": false,
								"title": "3.3: Add Integers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.2%3A_Add_Integers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.2%3A_Add_Integers_(Part_1)",
									"id": 4985,
									"subdomain": "math",
									"padded": "3.03: Add Integers (Part 1)"
								}
							}, {
								"key": "_243",
								"lazy": false,
								"title": "3.4: Add Integers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.2%3A_Add_Integers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.2%3A_Add_Integers_(Part_2)",
									"id": 6033,
									"subdomain": "math",
									"padded": "3.04: Add Integers (Part 2)"
								}
							}, {
								"key": "_244",
								"lazy": false,
								"title": "3.5: Subtract Integers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.3%3A_Subtract_Integers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.3%3A_Subtract_Integers_(Part_1)",
									"id": 4986,
									"subdomain": "math",
									"padded": "3.05: Subtract Integers (Part 1)"
								}
							}, {
								"key": "_245",
								"lazy": false,
								"title": "3.6: Subtract Integers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.3%3A_Subtract_Integers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.3%3A_Subtract_Integers_(Part_2)",
									"id": 6035,
									"subdomain": "math",
									"padded": "3.06: Subtract Integers (Part 2)"
								}
							}, {
								"key": "_246",
								"lazy": false,
								"title": "3.7: Multiply and Divide Integers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.4%3A_Multiply_and_Divide_Integers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.4%3A_Multiply_and_Divide_Integers_(Part_1)",
									"id": 4987,
									"subdomain": "math",
									"padded": "3.07: Multiply and Divide Integers (Part 1)"
								}
							}, {
								"key": "_247",
								"lazy": false,
								"title": "3.8: Multiply and Divide Integers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.4%3A_Multiply_and_Divide_Integers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.4%3A_Multiply_and_Divide_Integers_(Part_2)",
									"id": 6037,
									"subdomain": "math",
									"padded": "3.08: Multiply and Divide Integers (Part 2)"
								}
							}, {
								"key": "_248",
								"lazy": false,
								"title": "3.9: Solve Equations Using Integers; The Division Property of Equality (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.5%3A_Solve_Equations_Using_Integers%3B_The_Division_Property_of_Equality_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.5%3A_Solve_Equations_Using_Integers%3B_The_Division_Property_of_Equality_(Part_1)",
									"id": 4988,
									"subdomain": "math",
									"padded": "3.09: Solve Equations Using Integers; The Division Property of Equality (Part 1)"
								}
							}, {
								"key": "_249",
								"lazy": false,
								"title": "3.10: Solve Equations Using Integers; The Division Property of Equality (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.5%3A_Solve_Equations_Using_Integers%3B_The_Division_Property_of_Equality_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.5%3A_Solve_Equations_Using_Integers%3B_The_Division_Property_of_Equality_(Part_2)",
									"id": 4989,
									"subdomain": "math",
									"padded": "3.10: Solve Equations Using Integers; The Division Property of Equality (Part 2)"
								}
							}, {
								"key": "_250",
								"lazy": false,
								"title": "3.11: Integers (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.E%3A_Integers_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.E%3A_Integers_(Exercises)",
									"id": 6044,
									"subdomain": "math",
									"padded": "3.11: Integers (Exercises)"
								}
							}, {
								"key": "_251",
								"lazy": false,
								"title": "3.12: Integers (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.S%3A_Integers_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/3%3A_Integers/3.S%3A_Integers_(Summary)",
									"id": 6041,
									"subdomain": "math",
									"padded": "3.12: Integers (Summary)"
								}
							}]
						}, {
							"key": "_188",
							"lazy": false,
							"title": "4: Fractions",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions",
								"id": 4997,
								"subdomain": "math",
								"padded": "04: Fractions"
							},
							"children": [{
								"key": "_209",
								"lazy": false,
								"title": "4.1: Visualize Fractions (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.1%3A_Visualize_Fractions_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.1%3A_Visualize_Fractions_(Part_1)",
									"id": 4991,
									"subdomain": "math",
									"padded": "4.01: Visualize Fractions (Part 1)"
								}
							}, {
								"key": "_210",
								"lazy": false,
								"title": "4.2: Visualize Fractions (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.1%3A_Visualize_Fractions_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.1%3A_Visualize_Fractions_(Part_2)",
									"id": 6047,
									"subdomain": "math",
									"padded": "4.02: Visualize Fractions (Part 2)"
								}
							}, {
								"key": "_211",
								"lazy": false,
								"title": "4.3: Multiply and Divide Fractions (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.2%3A_Multiply_and_Divide_Fractions_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.2%3A_Multiply_and_Divide_Fractions_(Part_1)",
									"id": 4992,
									"subdomain": "math",
									"padded": "4.03: Multiply and Divide Fractions (Part 1)"
								}
							}, {
								"key": "_212",
								"lazy": false,
								"title": "4.4: Multiply and Divide Fractions (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.2%3A_Multiply_and_Divide_Fractions_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.2%3A_Multiply_and_Divide_Fractions_(Part_2)",
									"id": 6054,
									"subdomain": "math",
									"padded": "4.04: Multiply and Divide Fractions (Part 2)"
								}
							}, {
								"key": "_213",
								"lazy": false,
								"title": "4.5: Multiply and Divide Mixed Numbers and Complex Fractions (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.3%3A_Multiply_and_Divide_Mixed_Numbers_and_Complex_Fractions_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.3%3A_Multiply_and_Divide_Mixed_Numbers_and_Complex_Fractions_(Part_1)",
									"id": 4993,
									"subdomain": "math",
									"padded": "4.05: Multiply and Divide Mixed Numbers and Complex Fractions (Part 1)"
								}
							}, {
								"key": "_214",
								"lazy": false,
								"title": "4.6: Multiply and Divide Mixed Numbers and Complex Fractions (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.3%3A_Multiply_and_Divide_Mixed_Numbers_and_Complex_Fractions_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.3%3A_Multiply_and_Divide_Mixed_Numbers_and_Complex_Fractions_(Part_2)",
									"id": 6056,
									"subdomain": "math",
									"padded": "4.06: Multiply and Divide Mixed Numbers and Complex Fractions (Part 2)"
								}
							}, {
								"key": "_215",
								"lazy": false,
								"title": "4.7: Add and Subtract Fractions with Common Denominators",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.4%3A_Add_and_Subtract_Fractions_with_Common_Denominators",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.4%3A_Add_and_Subtract_Fractions_with_Common_Denominators",
									"id": 4994,
									"subdomain": "math",
									"padded": "4.07: Add and Subtract Fractions with Common Denominators"
								}
							}, {
								"key": "_216",
								"lazy": false,
								"title": "4.8: Add and Subtract Fractions with Different Denominators (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.5%3A_Add_and_Subtract_Fractions_with_Different_Denominators_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.5%3A_Add_and_Subtract_Fractions_with_Different_Denominators_(Part_1)",
									"id": 4995,
									"subdomain": "math",
									"padded": "4.08: Add and Subtract Fractions with Different Denominators (Part 1)"
								}
							}, {
								"key": "_217",
								"lazy": false,
								"title": "4.9: Add and Subtract Fractions with Different Denominators (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.5%3A_Add_and_Subtract_Fractions_with_Different_Denominators_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.5%3A_Add_and_Subtract_Fractions_with_Different_Denominators_(Part_2)",
									"id": 6063,
									"subdomain": "math",
									"padded": "4.09: Add and Subtract Fractions with Different Denominators (Part 2)"
								}
							}, {
								"key": "_218",
								"lazy": false,
								"title": "4.10: Add and Subtract Mixed Numbers (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.6%3A_Add_and_Subtract_Mixed_Numbers_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.6%3A_Add_and_Subtract_Mixed_Numbers_(Part_1)",
									"id": 4996,
									"subdomain": "math",
									"padded": "4.10: Add and Subtract Mixed Numbers (Part 1)"
								}
							}, {
								"key": "_219",
								"lazy": false,
								"title": "4.11: Add and Subtract Mixed Numbers (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.6%3A_Add_and_Subtract_Mixed_Numbers_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.6%3A_Add_and_Subtract_Mixed_Numbers_(Part_2)",
									"id": 6066,
									"subdomain": "math",
									"padded": "4.11: Add and Subtract Mixed Numbers (Part 2)"
								}
							}, {
								"key": "_220",
								"lazy": false,
								"title": "4.12: Solve Equations with Fractions (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.7%3A_Solve_Equations_with_Fractions_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.7%3A_Solve_Equations_with_Fractions_(Part_1)",
									"id": 6067,
									"subdomain": "math",
									"padded": "4.12: Solve Equations with Fractions (Part 1)"
								}
							}, {
								"key": "_221",
								"lazy": false,
								"title": "4.13: Solve Equations with Fractions (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.7%3A_Solve_Equations_with_Fractions_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.7%3A_Solve_Equations_with_Fractions_(Part_2)",
									"id": 6070,
									"subdomain": "math",
									"padded": "4.13: Solve Equations with Fractions (Part 2)"
								}
							}, {
								"key": "_222",
								"lazy": false,
								"title": "4.14: Fractions (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.E%3A_Fractions_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.E%3A_Fractions_(Exercises)",
									"id": 6074,
									"subdomain": "math",
									"padded": "4.14: Fractions (Exercises)"
								}
							}, {
								"key": "_223",
								"lazy": false,
								"title": "4.15: Fractions (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.S%3A_Fractions_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/4%3A_Fractions/4.S%3A_Fractions_(Summary)",
									"id": 6073,
									"subdomain": "math",
									"padded": "4.15: Fractions (Summary)"
								}
							}]
						}, {
							"key": "_189",
							"lazy": false,
							"title": "5: Decimals",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals",
								"id": 5004,
								"subdomain": "math",
								"padded": "05: Decimals"
							},
							"children": [{
								"key": "_273",
								"lazy": false,
								"title": "5.1: Decimals (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.1%3A_Decimals_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.1%3A_Decimals_(Part_1)",
									"id": 4998,
									"subdomain": "math",
									"padded": "5.01: Decimals (Part 1)"
								}
							}, {
								"key": "_274",
								"lazy": false,
								"title": "5.2: Decimals (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.1%3A_Decimals_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.1%3A_Decimals_(Part_2)",
									"id": 6221,
									"subdomain": "math",
									"padded": "5.02: Decimals (Part 2)"
								}
							}, {
								"key": "_275",
								"lazy": false,
								"title": "5.3: Decimal Operations (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.2%3A_Decimal_Operations_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.2%3A_Decimal_Operations_(Part_1)",
									"id": 4999,
									"subdomain": "math",
									"padded": "5.03: Decimal Operations (Part 1)"
								}
							}, {
								"key": "_276",
								"lazy": false,
								"title": "5.4: Decimal Operations (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.2%3A_Decimal_Operations_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.2%3A_Decimal_Operations_(Part_2)",
									"id": 6445,
									"subdomain": "math",
									"padded": "5.04: Decimal Operations (Part 2)"
								}
							}, {
								"key": "_277",
								"lazy": false,
								"title": "5.5: Decimals and Fractions (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.3%3A_Decimals_and_Fractions_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.3%3A_Decimals_and_Fractions_(Part_1)",
									"id": 5000,
									"subdomain": "math",
									"padded": "5.05: Decimals and Fractions (Part 1)"
								}
							}, {
								"key": "_278",
								"lazy": false,
								"title": "5.6: Decimals and Fractions (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.3%3A_Decimals_and_Fractions_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.3%3A_Decimals_and_Fractions_(Part_2)",
									"id": 6447,
									"subdomain": "math",
									"padded": "5.06: Decimals and Fractions (Part 2)"
								}
							}, {
								"key": "_279",
								"lazy": false,
								"title": "5.7: Solve Equations with Decimals",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.4%3A_Solve_Equations_with_Decimals",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.4%3A_Solve_Equations_with_Decimals",
									"id": 5001,
									"subdomain": "math",
									"padded": "5.07: Solve Equations with Decimals"
								}
							}, {
								"key": "_280",
								"lazy": false,
								"title": "5.8: Averages and Probability (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.5%3A_Averages_and_Probability_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.5%3A_Averages_and_Probability_(Part_1)",
									"id": 5002,
									"subdomain": "math",
									"padded": "5.08: Averages and Probability (Part 1)"
								}
							}, {
								"key": "_281",
								"lazy": false,
								"title": "5.9: Averages and Probability (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.5%3A_Averages_and_Probability_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.5%3A_Averages_and_Probability_(Part_2)",
									"id": 6453,
									"subdomain": "math",
									"padded": "5.09: Averages and Probability (Part 2)"
								}
							}, {
								"key": "_282",
								"lazy": false,
								"title": "5.10: Ratios and Rate (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.6%3A_Ratios_and_Rate_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.6%3A_Ratios_and_Rate_(Part_1)",
									"id": 5003,
									"subdomain": "math",
									"padded": "5.10: Ratios and Rate (Part 1)"
								}
							}, {
								"key": "_283",
								"lazy": false,
								"title": "5.11: Ratios and Rate (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.6%3A_Ratios_and_Rate_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.6%3A_Ratios_and_Rate_(Part_2)",
									"id": 6455,
									"subdomain": "math",
									"padded": "5.11: Ratios and Rate (Part 2)"
								}
							}, {
								"key": "_284",
								"lazy": false,
								"title": "5.12: Simplify and Use Square Roots (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.7%3A_Simplify_and_Use_Square_Roots_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.7%3A_Simplify_and_Use_Square_Roots_(Part_1)",
									"id": 6456,
									"subdomain": "math",
									"padded": "5.12: Simplify and Use Square Roots (Part 1)"
								}
							}, {
								"key": "_285",
								"lazy": false,
								"title": "5.13: Simplify and Use Square Roots (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.7%3A_Simplify_and_Use_Square_Roots_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.7%3A_Simplify_and_Use_Square_Roots_(Part_2)",
									"id": 6457,
									"subdomain": "math",
									"padded": "5.13: Simplify and Use Square Roots (Part 2)"
								}
							}, {
								"key": "_286",
								"lazy": false,
								"title": "5.14: Decimals (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.E%3A_Decimals_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.E%3A_Decimals_(Exercises)",
									"id": 6459,
									"subdomain": "math",
									"padded": "5.14: Decimals (Exercises)"
								}
							}, {
								"key": "_287",
								"lazy": false,
								"title": "5.15: Decimals (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.S%3A_Decimals_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/5%3A_Decimals/5.S%3A_Decimals_(Summary)",
									"id": 6458,
									"subdomain": "math",
									"padded": "5.15: Decimals (Summary)"
								}
							}]
						}, {
							"key": "_190",
							"lazy": false,
							"title": "6: Percents",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents",
								"id": 5032,
								"subdomain": "math",
								"padded": "06: Percents"
							},
							"children": [{
								"key": "_224",
								"lazy": false,
								"title": "6.1: Understand Percent",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.1%3A_Understand_Percent",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.1%3A_Understand_Percent",
									"id": 5026,
									"subdomain": "math",
									"padded": "6.1: Understand Percent"
								}
							}, {
								"key": "_225",
								"lazy": false,
								"title": "6.2: Solve General Applications of Percent",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.2%3A_Solve_General_Applications_of_Percent",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.2%3A_Solve_General_Applications_of_Percent",
									"id": 5027,
									"subdomain": "math",
									"padded": "6.2: Solve General Applications of Percent"
								}
							}, {
								"key": "_226",
								"lazy": false,
								"title": "6.3: Solve Sales Tax, Commission, and Discount Applications",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.3%3A_Solve_Sales_Tax%2C_Commission%2C_and_Discount_Applications",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.3%3A_Solve_Sales_Tax%2C_Commission%2C_and_Discount_Applications",
									"id": 5028,
									"subdomain": "math",
									"padded": "6.3: Solve Sales Tax, Commission, and Discount Applications"
								}
							}, {
								"key": "_227",
								"lazy": false,
								"title": "6.4: Solve Simple Interest Applications",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.4%3A_Solve_Simple_Interest_Applications",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.4%3A_Solve_Simple_Interest_Applications",
									"id": 5029,
									"subdomain": "math",
									"padded": "6.4: Solve Simple Interest Applications"
								}
							}, {
								"key": "_228",
								"lazy": false,
								"title": "6.5: Solve Proportions and their Applications (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.5%3A_Solve_Proportions_and_their_Applications_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.5%3A_Solve_Proportions_and_their_Applications_(Part_1)",
									"id": 5030,
									"subdomain": "math",
									"padded": "6.5: Solve Proportions and their Applications (Part 1)"
								}
							}, {
								"key": "_229",
								"lazy": false,
								"title": "6.6: Solve Proportions and their Applications (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.5%3A_Solve_Proportions_and_their_Applications_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.5%3A_Solve_Proportions_and_their_Applications_(Part_2)",
									"id": 6891,
									"subdomain": "math",
									"padded": "6.6: Solve Proportions and their Applications (Part 2)"
								}
							}, {
								"key": "_230",
								"lazy": false,
								"title": "6.7: Percents (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.E%3A_Percents_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.E%3A_Percents_(Exercises)",
									"id": 6893,
									"subdomain": "math",
									"padded": "6.7: Percents (Exercises)"
								}
							}, {
								"key": "_231",
								"lazy": false,
								"title": "6.8: Percents (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.S%3A_Percents_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/6%3A_Percents/6.S%3A_Percents_(Summary)",
									"id": 5031,
									"subdomain": "math",
									"padded": "6.8: Percents (Summary)"
								}
							}]
						}, {
							"key": "_191",
							"lazy": false,
							"title": "7: The Properties of Real Numbers",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers",
								"id": 5039,
								"subdomain": "math",
								"padded": "07: The Properties of Real Numbers"
							},
							"children": [{
								"key": "_264",
								"lazy": false,
								"title": "7.1: Rational and Irrational Numbers",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.1%3A_Rational_and_Irrational_Numbers",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.1%3A_Rational_and_Irrational_Numbers",
									"id": 5033,
									"subdomain": "math",
									"padded": "7.1: Rational and Irrational Numbers"
								}
							}, {
								"key": "_265",
								"lazy": false,
								"title": "7.2: Commutative and Associative Properties (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.2%3A_Commutative_and_Associative_Properties_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.2%3A_Commutative_and_Associative_Properties_(Part_1)",
									"id": 5034,
									"subdomain": "math",
									"padded": "7.2: Commutative and Associative Properties (Part 1)"
								}
							}, {
								"key": "_266",
								"lazy": false,
								"title": "7.3: Commutative and Associative Properties (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.2%3A_Commutative_and_Associative_Properties_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.2%3A_Commutative_and_Associative_Properties_(Part_2)",
									"id": 6897,
									"subdomain": "math",
									"padded": "7.3: Commutative and Associative Properties (Part 2)"
								}
							}, {
								"key": "_267",
								"lazy": false,
								"title": "7.4: Distributive Property",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.3%3A_Distributive_Property",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.3%3A_Distributive_Property",
									"id": 5035,
									"subdomain": "math",
									"padded": "7.4: Distributive Property"
								}
							}, {
								"key": "_268",
								"lazy": false,
								"title": "7.5: Properties of Identity, Inverses, and Zero",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.4%3A_Properties_of_Identity%2C_Inverses%2C_and_Zero",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.4%3A_Properties_of_Identity%2C_Inverses%2C_and_Zero",
									"id": 5036,
									"subdomain": "math",
									"padded": "7.5: Properties of Identity, Inverses, and Zero"
								}
							}, {
								"key": "_269",
								"lazy": false,
								"title": "7.6: Systems of Measurement (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.5%3A_Systems_of_Measurement_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.5%3A_Systems_of_Measurement_(Part_1)",
									"id": 5037,
									"subdomain": "math",
									"padded": "7.6: Systems of Measurement (Part 1)"
								}
							}, {
								"key": "_270",
								"lazy": false,
								"title": "7.7: Systems of Measurement (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.5%3A_Systems_of_Measurement_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.5%3A_Systems_of_Measurement_(Part_2)",
									"id": 5038,
									"subdomain": "math",
									"padded": "7.7: Systems of Measurement (Part 2)"
								}
							}, {
								"key": "_271",
								"lazy": false,
								"title": "7.8: The Properties of Real Numbers (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.E%3A_The_Properties_of_Real_Numbers_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.E%3A_The_Properties_of_Real_Numbers_(Exercises)",
									"id": 6904,
									"subdomain": "math",
									"padded": "7.8: The Properties of Real Numbers (Exercises)"
								}
							}, {
								"key": "_272",
								"lazy": false,
								"title": "7.9: The Properties of Real Numbers (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.S%3A_The_Properties_of_Real_Numbers_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/7%3A_The_Properties_of_Real_Numbers/7.S%3A_The_Properties_of_Real_Numbers_(Summary)",
									"id": 6903,
									"subdomain": "math",
									"padded": "7.9: The Properties of Real Numbers (Summary)"
								}
							}]
						}, {
							"key": "_192",
							"lazy": false,
							"title": "8: Solving Linear Equations",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations",
								"id": 5025,
								"subdomain": "math",
								"padded": "08: Solving Linear Equations"
							},
							"children": [{
								"key": "_232",
								"lazy": false,
								"title": "8.1: Solve Equations Using the Subtraction and Addition Properties of Equality (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.1%3A_Solve_Equations_Using_the_Subtraction_and_Addition_Properties_of_Equality_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.1%3A_Solve_Equations_Using_the_Subtraction_and_Addition_Properties_of_Equality_(Part_1)",
									"id": 5019,
									"subdomain": "math",
									"padded": "8.1: Solve Equations Using the Subtraction and Addition Properties of Equality (Part 1)"
								}
							}, {
								"key": "_233",
								"lazy": false,
								"title": "8.2: Solve Equations Using the Subtraction and Addition Properties of Equality (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.1%3A_Solve_Equations_Using_the_Subtraction_and_Addition_Properties_of_Equality_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.1%3A_Solve_Equations_Using_the_Subtraction_and_Addition_Properties_of_Equality_(Part_2)",
									"id": 6906,
									"subdomain": "math",
									"padded": "8.2: Solve Equations Using the Subtraction and Addition Properties of Equality (Part 2)"
								}
							}, {
								"key": "_234",
								"lazy": false,
								"title": "8.3: Solve Equations Using the Division and Multiplication Properties of Equality",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.2%3A_Solve_Equations_Using_the_Division_and_Multiplication_Properties_of_Equality",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.2%3A_Solve_Equations_Using_the_Division_and_Multiplication_Properties_of_Equality",
									"id": 5020,
									"subdomain": "math",
									"padded": "8.3: Solve Equations Using the Division and Multiplication Properties of Equality"
								}
							}, {
								"key": "_235",
								"lazy": false,
								"title": "8.4: Solve Equations with Variables and Constants on Both Sides (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.3%3A_Solve_Equations_with_Variables_and_Constants_on_Both_Sides_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.3%3A_Solve_Equations_with_Variables_and_Constants_on_Both_Sides_(Part_1)",
									"id": 5021,
									"subdomain": "math",
									"padded": "8.4: Solve Equations with Variables and Constants on Both Sides (Part 1)"
								}
							}, {
								"key": "_236",
								"lazy": false,
								"title": "8.5: Solve Equations with Variables and Constants on Both Sides (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.3%3A_Solve_Equations_with_Variables_and_Constants_on_Both_Sides_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.3%3A_Solve_Equations_with_Variables_and_Constants_on_Both_Sides_(Part_2)",
									"id": 6910,
									"subdomain": "math",
									"padded": "8.5: Solve Equations with Variables and Constants on Both Sides (Part 2)"
								}
							}, {
								"key": "_237",
								"lazy": false,
								"title": "8.6: Solve Equations with Fraction or Decimal Coefficients",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.4%3A_Solve_Equations_with_Fraction_or_Decimal_Coefficients",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.4%3A_Solve_Equations_with_Fraction_or_Decimal_Coefficients",
									"id": 5022,
									"subdomain": "math",
									"padded": "8.6: Solve Equations with Fraction or Decimal Coefficients"
								}
							}, {
								"key": "_238",
								"lazy": false,
								"title": "8.7: Solving Linear Equations (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.E%3A_Solving_Linear_Equations_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.E%3A_Solving_Linear_Equations_(Exercises)",
									"id": 5024,
									"subdomain": "math",
									"padded": "8.7: Solving Linear Equations (Exercises)"
								}
							}, {
								"key": "_239",
								"lazy": false,
								"title": "8.8: Solving Linear Equations (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.S%3A_Solving_Linear_Equations_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/8%3A_Solving_Linear_Equations/8.S%3A_Solving_Linear_Equations_(Summary)",
									"id": 5023,
									"subdomain": "math",
									"padded": "8.8: Solving Linear Equations (Summary)"
								}
							}]
						}, {
							"key": "_193",
							"lazy": false,
							"title": "9: Math Models and Geometry",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry",
								"id": 5011,
								"subdomain": "math",
								"padded": "09: Math Models and Geometry"
							},
							"children": [{
								"key": "_288",
								"lazy": false,
								"title": "9.1: Use a Problem Solving Strategy (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.1%3A_Use_a_Problem_Solving_Strategy_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.1%3A_Use_a_Problem_Solving_Strategy_(Part_1)",
									"id": 5005,
									"subdomain": "math",
									"padded": "9.01: Use a Problem Solving Strategy (Part 1)"
								}
							}, {
								"key": "_289",
								"lazy": false,
								"title": "9.2: Use a Problem Solving Strategy (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.1%3A_Use_a_Problem_Solving_Strategy_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.1%3A_Use_a_Problem_Solving_Strategy_(Part_2)",
									"id": 7020,
									"subdomain": "math",
									"padded": "9.02: Use a Problem Solving Strategy (Part 2)"
								}
							}, {
								"key": "_290",
								"lazy": false,
								"title": "9.3: Solve Money Applications",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.2%3A_Solve_Money_Applications",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.2%3A_Solve_Money_Applications",
									"id": 5006,
									"subdomain": "math",
									"padded": "9.03: Solve Money Applications"
								}
							}, {
								"key": "_291",
								"lazy": false,
								"title": "9.4: Use Properties of Angles, Triangles, and the Pythagorean Theorem (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.3%3A_Use_Properties_of_Angles%2C_Triangles%2C_and_the_Pythagorean_Theorem_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.3%3A_Use_Properties_of_Angles%2C_Triangles%2C_and_the_Pythagorean_Theorem_(Part_1)",
									"id": 5007,
									"subdomain": "math",
									"padded": "9.04: Use Properties of Angles, Triangles, and the Pythagorean Theorem (Part 1)"
								}
							}, {
								"key": "_292",
								"lazy": false,
								"title": "9.5: Use Properties of Angles, Triangles, and the Pythagorean Theorem (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.3%3A_Use_Properties_of_Angles%2C_Triangles%2C_and_the_Pythagorean_Theorem_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.3%3A_Use_Properties_of_Angles%2C_Triangles%2C_and_the_Pythagorean_Theorem_(Part_2)",
									"id": 7024,
									"subdomain": "math",
									"padded": "9.05: Use Properties of Angles, Triangles, and the Pythagorean Theorem (Part 2)"
								}
							}, {
								"key": "_293",
								"lazy": false,
								"title": "9.6: Use Properties of Rectangles, Triangles, and Trapezoids (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.4%3A_Use_Properties_of_Rectangles%2C_Triangles%2C_and_Trapezoids_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.4%3A_Use_Properties_of_Rectangles%2C_Triangles%2C_and_Trapezoids_(Part_1)",
									"id": 5008,
									"subdomain": "math",
									"padded": "9.06: Use Properties of Rectangles, Triangles, and Trapezoids (Part 1)"
								}
							}, {
								"key": "_294",
								"lazy": false,
								"title": "9.7: Use Properties of Rectangles, Triangles, and Trapezoids (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.4%3A_Use_Properties_of_Rectangles%2C_Triangles%2C_and_Trapezoids_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.4%3A_Use_Properties_of_Rectangles%2C_Triangles%2C_and_Trapezoids_(Part_2)",
									"id": 7027,
									"subdomain": "math",
									"padded": "9.07: Use Properties of Rectangles, Triangles, and Trapezoids (Part 2)"
								}
							}, {
								"key": "_295",
								"lazy": false,
								"title": "9.8: Solve Geometry Applications: Circles and Irregular Figures",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.5%3A_Solve_Geometry_Applications%3A_Circles_and_Irregular_Figures",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.5%3A_Solve_Geometry_Applications%3A_Circles_and_Irregular_Figures",
									"id": 5009,
									"subdomain": "math",
									"padded": "9.08: Solve Geometry Applications: Circles and Irregular Figures"
								}
							}, {
								"key": "_296",
								"lazy": false,
								"title": "9.9: Solve Geometry Applications: Volume and Surface Area (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.6%3A_Solve_Geometry_Applications%3A_Volume_and_Surface_Area_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.6%3A_Solve_Geometry_Applications%3A_Volume_and_Surface_Area_(Part_1)",
									"id": 5010,
									"subdomain": "math",
									"padded": "9.09: Solve Geometry Applications: Volume and Surface Area (Part 1)"
								}
							}, {
								"key": "_297",
								"lazy": false,
								"title": "9.10: Solve Geometry Applications: Volume and Surface Area (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.6%3A_Solve_Geometry_Applications%3A_Volume_and_Surface_Area_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.6%3A_Solve_Geometry_Applications%3A_Volume_and_Surface_Area_(Part_2)",
									"id": 7134,
									"subdomain": "math",
									"padded": "9.10: Solve Geometry Applications: Volume and Surface Area (Part 2)"
								}
							}, {
								"key": "_298",
								"lazy": false,
								"title": "9.11: Solve a Formula for a Specific Variable",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.7%3A_Solve_a_Formula_for_a_Specific_Variable",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.7%3A_Solve_a_Formula_for_a_Specific_Variable",
									"id": 7242,
									"subdomain": "math",
									"padded": "9.11: Solve a Formula for a Specific Variable"
								}
							}, {
								"key": "_299",
								"lazy": false,
								"title": "9.12: Math Models and Geometry (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.E%3A_Math_Models_and_Geometry_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.E%3A_Math_Models_and_Geometry_(Exercises)",
									"id": 7247,
									"subdomain": "math",
									"padded": "9.12: Math Models and Geometry (Exercises)"
								}
							}, {
								"key": "_300",
								"lazy": false,
								"title": "9.13: Math Models and Geometry (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.S%3A_Math_Models_and_Geometry_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/9%3A_Math_Models_and_Geometry/9.S%3A_Math_Models_and_Geometry_(Summary)",
									"id": 7238,
									"subdomain": "math",
									"padded": "9.13: Math Models and Geometry (Summary)"
								}
							}]
						}, {
							"key": "_194",
							"lazy": false,
							"title": "10: Polynomials",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials",
								"id": 5018,
								"subdomain": "math",
								"padded": "10: Polynomials"
							},
							"children": [{
								"key": "_304",
								"lazy": false,
								"title": "10.1: Add and Subtract Polynomials",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.1%3A_Add_and_Subtract_Polynomials",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.1%3A_Add_and_Subtract_Polynomials",
									"id": 5012,
									"subdomain": "math",
									"padded": "10.01: Add and Subtract Polynomials"
								}
							}, {
								"key": "_305",
								"lazy": false,
								"title": "10.2: Use Multiplication Properties of Exponents (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.2%3A_Use_Multiplication_Properties_of_Exponents_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.2%3A_Use_Multiplication_Properties_of_Exponents_(Part_1)",
									"id": 5013,
									"subdomain": "math",
									"padded": "10.02: Use Multiplication Properties of Exponents (Part 1)"
								}
							}, {
								"key": "_306",
								"lazy": false,
								"title": "10.3: Use Multiplication Properties of Exponents (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.2%3A_Use_Multiplication_Properties_of_Exponents_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.2%3A_Use_Multiplication_Properties_of_Exponents_(Part_2)",
									"id": 5014,
									"subdomain": "math",
									"padded": "10.03: Use Multiplication Properties of Exponents (Part 2)"
								}
							}, {
								"key": "_307",
								"lazy": false,
								"title": "10.4: Multiply Polynomials (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.3%3A_Multiply_Polynomials_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.3%3A_Multiply_Polynomials_(Part_1)",
									"id": 7253,
									"subdomain": "math",
									"padded": "10.04: Multiply Polynomials (Part 1)"
								}
							}, {
								"key": "_308",
								"lazy": false,
								"title": "10.5: Multiply Polynomials (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.3%3A_Multiply_Polynomials_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.3%3A_Multiply_Polynomials_(Part_2)",
									"id": 7268,
									"subdomain": "math",
									"padded": "10.05: Multiply Polynomials (Part 2)"
								}
							}, {
								"key": "_309",
								"lazy": false,
								"title": "10.6: Divide Monomials (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.4%3A_Divide_Monomials_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.4%3A_Divide_Monomials_(Part_1)",
									"id": 5015,
									"subdomain": "math",
									"padded": "10.06: Divide Monomials (Part 1)"
								}
							}, {
								"key": "_310",
								"lazy": false,
								"title": "10.7: Divide Monomials (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.4%3A_Divide_Monomials_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.4%3A_Divide_Monomials_(Part_2)",
									"id": 7270,
									"subdomain": "math",
									"padded": "10.07: Divide Monomials (Part 2)"
								}
							}, {
								"key": "_311",
								"lazy": false,
								"title": "10.8: Integer Exponents and Scientific Notation (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.5%3A_Integer_Exponents_and_Scientific_Notation_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.5%3A_Integer_Exponents_and_Scientific_Notation_(Part_1)",
									"id": 5016,
									"subdomain": "math",
									"padded": "10.08: Integer Exponents and Scientific Notation (Part 1)"
								}
							}, {
								"key": "_312",
								"lazy": false,
								"title": "10.9: Integer Exponents and Scientific Notation (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.5%3A_Integer_Exponents_and_Scientific_Notation_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.5%3A_Integer_Exponents_and_Scientific_Notation_(Part_2)",
									"id": 7274,
									"subdomain": "math",
									"padded": "10.09: Integer Exponents and Scientific Notation (Part 2)"
								}
							}, {
								"key": "_313",
								"lazy": false,
								"title": "10.10: Introduction to Factoring Polynomials",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.6%3A_Introduction_to_Factoring_Polynomials",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.6%3A_Introduction_to_Factoring_Polynomials",
									"id": 5017,
									"subdomain": "math",
									"padded": "10.10: Introduction to Factoring Polynomials"
								}
							}, {
								"key": "_314",
								"lazy": false,
								"title": "10.11: Polynomials (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.E%3A_Polynomials_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.E%3A_Polynomials_(Exercises)",
									"id": 7278,
									"subdomain": "math",
									"padded": "10.11: Polynomials (Exercises)"
								}
							}, {
								"key": "_315",
								"lazy": false,
								"title": "10.12: Polynomials (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.S%3A_Polynomials_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/10%3A_Polynomials/10.S%3A_Polynomials_(Summary)",
									"id": 7277,
									"subdomain": "math",
									"padded": "10.12: Polynomials (Summary)"
								}
							}]
						}, {
							"key": "_195",
							"lazy": false,
							"title": "11: Graphs",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs",
								"id": 5046,
								"subdomain": "math",
								"padded": "11: Graphs"
							},
							"children": [{
								"key": "_316",
								"lazy": false,
								"title": "11.1: Use the Rectangular Coordinate System (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.1%3A_Use_the_Rectangular_Coordinate_System_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.1%3A_Use_the_Rectangular_Coordinate_System_(Part_1)",
									"id": 5040,
									"subdomain": "math",
									"padded": "11.01: Use the Rectangular Coordinate System (Part 1)"
								}
							}, {
								"key": "_317",
								"lazy": false,
								"title": "11.2: Use the Rectangular Coordinate System (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.1%3A_Use_the_Rectangular_Coordinate_System_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.1%3A_Use_the_Rectangular_Coordinate_System_(Part_2)",
									"id": 7280,
									"subdomain": "math",
									"padded": "11.02: Use the Rectangular Coordinate System (Part 2)"
								}
							}, {
								"key": "_318",
								"lazy": false,
								"title": "11.3: Graphing Linear Equations (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.2%3A_Graphing_Linear_Equations_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.2%3A_Graphing_Linear_Equations_(Part_1)",
									"id": 5041,
									"subdomain": "math",
									"padded": "11.03: Graphing Linear Equations (Part 1)"
								}
							}, {
								"key": "_319",
								"lazy": false,
								"title": "11.4: Graphing Linear Equations (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.2%3A_Graphing_Linear_Equations_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.2%3A_Graphing_Linear_Equations_(Part_2)",
									"id": 7288,
									"subdomain": "math",
									"padded": "11.04: Graphing Linear Equations (Part 2)"
								}
							}, {
								"key": "_320",
								"lazy": false,
								"title": "11.5: Graphing with Intercepts (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.3%3A_Graphing_with_Intercepts_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.3%3A_Graphing_with_Intercepts_(Part_1)",
									"id": 5042,
									"subdomain": "math",
									"padded": "11.05: Graphing with Intercepts (Part 1)"
								}
							}, {
								"key": "_321",
								"lazy": false,
								"title": "11.6: Graphing with Intercepts (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.3%3A_Graphing_with_Intercepts_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.3%3A_Graphing_with_Intercepts_(Part_2)",
									"id": 7291,
									"subdomain": "math",
									"padded": "11.06: Graphing with Intercepts (Part 2)"
								}
							}, {
								"key": "_322",
								"lazy": false,
								"title": "11.7: Understand Slope of a Line (Part 1)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.4%3A_Understand_Slope_of_a_Line_(Part_1)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.4%3A_Understand_Slope_of_a_Line_(Part_1)",
									"id": 5043,
									"subdomain": "math",
									"padded": "11.07: Understand Slope of a Line (Part 1)"
								}
							}, {
								"key": "_323",
								"lazy": false,
								"title": "11.8: Understand Slope of a Line (Part 2)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.4%3A_Understand_Slope_of_a_Line_(Part_2)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.4%3A_Understand_Slope_of_a_Line_(Part_2)",
									"id": 5044,
									"subdomain": "math",
									"padded": "11.08: Understand Slope of a Line (Part 2)"
								}
							}, {
								"key": "_324",
								"lazy": false,
								"title": "11.9: Graphs (Exercises)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.E%3A_Graphs_(Exercises)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.E%3A_Graphs_(Exercises)",
									"id": 7296,
									"subdomain": "math",
									"padded": "11.09: Graphs (Exercises)"
								}
							}, {
								"key": "_325",
								"lazy": false,
								"title": "11.10: Graphs (Summary)",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.S%3A_Graphs_(Summary)",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/11%3A_Graphs/11.S%3A_Graphs_(Summary)",
									"id": 5045,
									"subdomain": "math",
									"padded": "11.10: Graphs (Summary)"
								}
							}]
						}, {
							"key": "_196",
							"lazy": false,
							"title": "12: Appendix",
							"data": {
								"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/Appendix",
								"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/Appendix",
								"id": 7298,
								"subdomain": "math",
								"padded": "12: Appendix"
							},
							"children": [{
								"key": "_301",
								"lazy": false,
								"title": "12.1: Cumulative Review",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/Appendix/A%3A_Cumulative_Review",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/Appendix/A%3A_Cumulative_Review",
									"id": 7299,
									"subdomain": "math",
									"padded": "12.1: Cumulative Review"
								}
							}, {
								"key": "_302",
								"lazy": false,
								"title": "12.2: Powers and Roots",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/Appendix/B%3A_Powers_and_Roots",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/Appendix/B%3A_Powers_and_Roots",
									"id": 7303,
									"subdomain": "math",
									"padded": "12.2: Powers and Roots"
								}
							}, {
								"key": "_303",
								"lazy": false,
								"title": "12.3: Geometric Formulas",
								"data": {
									"url": "https://math.libretexts.org/Bookshelves/Book%3A_Prealgebra_(OpenStax)/Appendix/C%3A_Geometric_Formulas",
									"path": "Bookshelves/Book%3A_Prealgebra_(OpenStax)/Appendix/C%3A_Geometric_Formulas",
									"id": 7304,
									"subdomain": "math",
									"padded": "12.3: Geometric Formulas"
								}
							}]
						}]
					}]
				}],
				debugLevel: 0,
				autoScroll: true,
				extensions: ["dnd5", "edit"],
				lazyLoad: function (event, data) {
					const dfd = new $.Deferred();
					let node = data.node;
					data.result = dfd.promise();
					LTForm.getSubpages(node.data.url, node.data.subdomain).then((result) => dfd.resolve(result));
				},
				tooltip: (event, data) => {
					return data.node.data.url ? "Originally " + data.node.data.url : "Newly created page";
				},
				edit: {
					// Available options with their default:
					adjustWidthOfs: 4,   // null: don't adjust input size to content
					inputCss: {minWidth: "3em"},
					triggerStart: ["clickActive", "f2", "dblclick", "shift+click", "mac+enter"],
					beforeEdit: function (event, data) {
						return data.node.key !== "ROOT";
					},
					/*save: function (event, data) {
						setTimeout(() => data.node.setTitle(data.orgTitle.replace(/(?<=target="_blank">).*?(?=<\/a>$)/, data.node.title)), 500);
					},*/
					close: function (event, data) {
						LTForm.renumber();
					}
				},
				dnd5: {
					// autoExpandMS: 400,
					// preventForeignNodes: true,
					// preventNonNodes: true,
					// preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
					// preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
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
						data.dataTransfer.dropEffect = "move";
					},
					dragEnd: function (node, data) {
					},

					// --- Drop-support:

					dragEnter: function (node, data) {
						// node.debug("dragEnter", data);
						data.dataTransfer.dropEffect = "move";
						data.dataTransfer.effectAllowed = "copy";
						return true;
					},
					dragOver: function (node, data) {
						data.dataTransfer.dropEffect = "move";
						data.dataTransfer.effectAllowed = "copy";
					},
					dragLeave: function (node, data) {
					},
					dragDrop: async function (node, data) {
						/* This function MUST be defined to enable dropping of items on
						 * the tree.
						 */
						const transfer = data.dataTransfer;

						if (data.otherNode) {
							// Drop another Fancytree node from same frame
							// (maybe from another tree however)
							var sameTree = (data.otherNode.tree === data.tree);
							if (node.getLevel() <= 1) {
								data.hitMode = "over";
							}
							if (data.hitMode === "over") {
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
								title: transfer.getData("text")
							}, data.hitMode);
						}
						await LTForm.renumber();

						async function doTransfer() {
							if (sameTree) {
								data.otherNode.moveTo(node, data.hitMode);
							}
							else {
								data.otherNode.copyTo(node, data.hitMode, function (n) {
									n.title = n.title.replace(/<a.* ><\/a>/, "");
									n.key = null; // make sure, a new key is generated
								});
								let LTRight = $("#LTRight").fancytree("getTree");
								LTRight.enable(false);
								const RightAlert = $("#LTRightAlert");
								RightAlert.text('Importing content. Please wait...');
								RightAlert.slideDown();
								await data.otherNode.visitAndLoad();
								RightAlert.slideUp();
								LTRight.enable(true);
							}
						}
					}
				},
			});
			await LTForm.getInstitutions();


			LTLeft.append('<div id=\'LTLeftAlert\'>You shouldn\'t see this</div>');
			LTRight.append('<div id=\'LTRightAlert\'>You shouldn\'t see this</div>');
			$("#LTRightAlert,#LTLeftAlert").hide();
			await LTForm.copyTransclude();
		}

		function formMode(isAdmin) {
			return isAdmin ? `<div>Remixer Type<select id='LTFormCopyMode'><option value='transclude'>Transclude</option><option value='copy'>Copy Source</option><option value='deep'>Copy Full [SLOW]</option></select></div>` : '';
		}
	}

	static getSelectOptions() {
		let current = window.location.origin.split('/')[2].split('.')[0];
		let libraries = {
			'Biology': 'bio',
			'Business': 'biz',
			'Chemistry': 'chem',
			'Engineering': 'eng',
			'Geology': 'geo',
			'Humanities': 'human',
			'Mathematics': 'math',
			'Medicine': 'med',
			'Physics': 'phys',
			'Social Sciences': 'socialsci',
			'Statistics': 'stats',
			'Workforce': 'workforce'
		};
		let result = '';
		Object.keys(libraries).map(function (key, index) {
			result += `<option value="${libraries[key]}" ${current === libraries[key] ? 'selected' : ''}>${key}</option>`;
		});
		return result;
	}

	static async getInstitutions() {
		const select = document.getElementById("LTFormInstitutions");
		let response;
		try {
			response = await fetch("/@api/deki/pages/=LibreTexts/subpages?dream.out.format=json");
		} catch (e) {
			response = await fetch("/@api/deki/pages/=Course_LibreTexts/subpages?dream.out.format=json");
		}
		response = await response.json();
		const subpageArray = response["page.subpage"] || [];
		const result = [];
		for (let i = 0; i < subpageArray.length; i++) {
			let institution = subpageArray[i];
			result.push(`<option value="${institution["uri.ui"]}">${institution.title}</option>`);
		}
		result.push(`<option value="">Not listed? Contact info@libretexts.org</option>`);

		select.innerHTML = result.concat();
	}

	static async publish() {
		let institution = document.getElementById("LTFormInstitutions");
		if (institution.value === "") {
			if (confirm("Would you like to send an email to info@libretexts.com to request your institution?"))
				window.open("mailto:info@libretexts.org?subject=Remixer%20Institution%20Request", "_blank");
			return false;
		}
		let name = document.getElementById("LTFormName").value;
		let college = institution.value;
		if (college.includes('Remixer_University')) {
			college += `/Username:_${document.getElementById("usernameHolder").innerText}`;
			await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(`${college.replace(window.location.origin, "")}`)) + "/contents?edittime=now", {
				method: "POST",
				body: "<p>{{template.ShowCategory()}}</p>"
			});
			await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(`${college.replace(window.location.origin, "")}`)) + "/tags", {
				method: "PUT",
				body: '<tags><tag value="article:topic-category"/></tags>',
				headers: {"Content-Type": "text/xml; charset=utf-8"}
			});
		}
		let url = `${college}/${name.replace(/ /g, "_")}`;
		if (!name) {
			alert("No name provided!");
			return false
		}
		let response = await fetch(`/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(`${college.replace(window.location.origin, "")}/${name}`))}/info`);
		if (response.ok) {
			alert(`The page ${url} already exists!`);
			return false;
		}
		LTForm.renumber();


		const isAdmin = document.getElementById("adminHolder").innerText === 'true';
		const isPro = document.getElementById("proHolder").innerText === 'true';
		const groups = document.getElementById("groupHolder").innerText.toLowerCase();
		let allowed = isAdmin || (isPro && groups.includes('faculty'));
		if (!allowed) {
			alert("This feature is not available in Demonstration Mode.");
			return false;
		}
		let copyMode = document.getElementById("LTFormCopyMode").value;
		if (copyMode === 'copy' && !isAdmin) {
			alert("Direct copy is restricted to administratiors. Use Forker afterwards to copy over individual pages.");
			document.getElementById("LTFormCopyMode").value = 'transclude';
			return false;
		}

		// let subdomain = window.location.origin.split("/")[2].split(".")[0];
		let LTRight = $("#LTRight").fancytree("getTree");
		let RightAlert = $("#LTRightAlert");

		RightAlert.text('Beginning Publication process');
		RightAlert.slideDown();
		LTRight.enable(false);
		let tree = LTRight.toDict()[0];
		tree.data = {url: url};
		let destRoot = tree.data.url;
		const results = document.getElementById("copyResults");
		const errors = document.getElementById("copyErrors");
		results.innerText = "Processing";
		console.log(tree);
		let counter = 0;
		let startedAt = new Date();
		let failedCounter = 0;
		let errorText = "";
		const total = getTotal(tree.children);

		await coverPage(tree);
		await doCopy(destRoot, tree.children, 1);
		const text = `${"Finished: " + counter + " pages completed" + (failedCounter ? "\\nFailed: " + failedCounter : "")}`;
		results.innerHTML = `<div><div>${text}</div><a href="${destRoot}" target="_blank">Visit your new LibreText here</a></div>`;
		RightAlert.text(text);
		RightAlert.slideUp();
		LTRight.enable(true);

		function decodeHTML(content) {
			let ret = content.replace(/&gt;/g, '>');
			ret = ret.replace(/&lt;/g, '<');
			ret = ret.replace(/&quot;/g, '"');
			ret = ret.replace(/&apos;/g, "'");
			ret = ret.replace(/&amp;/g, '&');
			return ret;
		}

		async function coverPage(tree) {
			let path = tree.data.url.replace(window.location.origin + "/", "");
			let content = "<p>{{template.ShowCategory()}}</p>";
			await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?abort=exists", {
				method: "POST",
				body: content
			});
			let tags = '<tags><tag value="article:topic-category"/><tag value="coverpage:yes"/></tags>';
			let propertyArray = [putProperty('mindtouch.page#welcomeHidden', true), putProperty('mindtouch.idf#subpageListing', 'simple'), fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
				method: "PUT",
				body: tags,
				headers: {"Content-Type": "text/xml; charset=utf-8"}
			})];

			await Promise.all(propertyArray);
			await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/move?title=" + tree.title + "&name=" + encodeURIComponent(tree.title.replace(" ", "_")), {
				method: "POST"
			});

			async function putProperty(name, value) {
				await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
					method: "POST",
					body: value,
					headers: {"Slug": name}
				})
			}
		}

		function getTotal(treeArray) {
			let result = treeArray.length;
			for (let i = 0; i < treeArray.length; i++) {
				let child = treeArray[i].children;
				if (child) {
					result += getTotal(child);
				}
			}
			return result;
		}

		async function doCopy(destRoot, tree, depth) {

			for (let i = 0; i < tree.length; i++) {
				const child = tree[i];
				let url = destRoot + "/" + (child.data.padded || child.title);
				let path = url.replace(window.location.origin + "/", "");
				if (!child.data.url) { //New Page
					const isGuide = depth === 1;
					await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?abort=exists", {
						method: "POST",
						body: isGuide ? "<p>{{template.ShowGuide()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-guide</a></p>\n"
							: "",
					});
					let tags = `<tags><tag value="${isGuide ? "article:topic-guide" : "article:topic"}"/></tags>`;
					await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
						method: "PUT",
						body: tags,
						headers: {"Content-Type": "text/xml; charset=utf-8"}
					});
					// Title cleanup
					if (child.data.padded) {
						fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/move?title=" + child.title + "&name=" + child.data.padded, {
							method: "POST"
						}).then();
					}
					if (isGuide) {
						await Promise.all(
							[putProperty("mindtouch.idf#guideDisplay", "single", path),
								putProperty('mindtouch.page#welcomeHidden', true, path),
								putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path)]);
					}
				}
				else {
					// child.path = child.data.url.replace(window.location.origin + "/", ""); //source
					child.path = child.data.path;
					let content;
					//get info
					let info = await LTForm.authenticatedFetch(child.path, 'info?dream.out.format=json', child.data.subdomain);

					//get Tags
					let copyMode = document.getElementById("LTFormCopyMode").value;
					let copyContent = copyMode === 'copy';
					let response = await LTForm.authenticatedFetch(child.path, 'tags?dream.out.format=json', child.data.subdomain);
					let tags = await response.json();
					if (response.ok && tags["@count"] !== "0") {
						if (tags.tag) {
							if (tags.tag.length) {
								tags = tags.tag.map((tag) => tag["@value"]);
							}
							else {
								tags = [tags.tag["@value"]];
							}
						}
						copyContent = copyContent || tags.includes("article:topic-category") || tags.includes("article:topic-guide");
						if (!copyContent) {
							tags.push("transcluded:yes");
						}
						tags = tags.map((tag) => `<tag value="${tag}"/>`).join("");
						tags = "<tags>" + tags + "</tags>";
					}
					else {
						tags = null;
					}

					//copy Content
					info = await info;
					info = await info.json();
					let current = window.location.origin.split('/')[2].split('.')[0];
					if (copyContent) {
						if (child.data.subdomain === current) {
							content = await LTForm.authenticatedFetch(child.path, 'contents?mode=raw', child.data.subdomain);
							content = await content.text();
							content = content.match(/<body>([\s\S]*?)<\/body>/)[1].replace("<body>", "").replace("</body>", "");
							content = decodeHTML(content);
						}
						else {
							//Get cross content
							content = await fetch('https://api.libretexts.org/endpoint/contents', {
								method: 'PUT',
								body: JSON.stringify({
									path: child.path,
									api: 'contents?mode=raw',
									subdomain: child.data.subdomain,
								})
							});
							content = await content.text();
							content = content.match(/<body>([\s\S]*?)<\/body>/)[1].replace("<body>", "").replace("</body>", "");
							content = decodeHTML(content);

							let copyMode = document.getElementById("LTFormCopyMode").value;
							if (copyMode === 'copy') {
								content = content.replace(/\/@api\/deki/g, `https://${child.data.subdomain}.libretexts.org/@api/deki`);
								content = content.replace(/ fileid=".*?"/g, '');
							}
							else if (copyMode === 'deep') {
								//Fancy file transfer VERY SLOW BUT EFFECTIVE
								response = await LTForm.authenticatedFetch(child.path, 'files?dream.out.format=json', child.data.subdomain);
								if (response.ok) {
									let files = await response.json();
									if (files["@count"] !== "0") {
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
											promiseArray.push(processFile(file, child, path, file['@id']));
									}
									promiseArray = await Promise.all(promiseArray);
									for (let i = 0; i < promiseArray.length; i++) {
										if (promiseArray[i]) {
											content = content.replace(promiseArray[i].original, promiseArray[i].final);
											content = content.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
										}
									}
								}
							}
						}
					}
					else if (child.data.subdomain !== current) {
						content = `<p class="mt-script-comment">Cross Library Transclusion</p>

<pre class="script">
template('CrossTransclude/Web',{'Library':'${child.data.subdomain}','PageID':${child.data.id}});</pre>

<div class="comment">
<div class="mt-comment-content">
<p><a href="${child.data.url}">Cross-Library Link: ${child.data.url}</a></p>
</div>
</div>`
					}
					else {
						content = `<div class="mt-contentreuse-widget" data-page="${child.path}" data-section="" data-show="false">
<pre class="script">
wiki.page("${child.path}", NULL)</pre>
</div>

<div class="comment">
<div class="mt-comment-content">
<p><a href="${child.data.url}">Content Reuse Link: ${child.data.url}</a></p>
</div>
</div>`;
					}
					response = await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?edittime=now", {
						method: "POST",
						body: content
					});
					if (response.status >= 400) {
						failedCounter++;
					}
					switch (response.status) {
						case 403:
							errorText += "403 Forbidden - User does not have permission to create" + path + "\n";
							break;
						case 500:
							errorText += "500 Server Error " + path + "\n";
							break;
						case 409:
							errorText += "409 Conflict - Page already exists " + path + "\n";
							break;
						default:
							errorText += "Error " + response.status + " " + path + "\n";
							break;
						case 200:
							//copy Tags
							if (tags) {
								fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/tags", {
									method: "PUT",
									body: tags,
									headers: {"Content-Type": "text/xml; charset=utf-8"}
								}).then();
							}
							//Properties
							LTForm.authenticatedFetch(child.path, 'properties?dream.out.format=json', child.data.subdomain).then(async (response) => {
								let content = await response.json();
								if (content["@count"] !== "0") {
									if (content.property) {
										if (content.property.length) {
											content = content.property.map((property) => {
												return {name: property["@name"], value: property["contents"]["#text"]}
											});
										}
										else {
											content = [{
												name: content.property["@name"],
												value: content.property["contents"]["#text"]
											}];
										}
									}
								}
								for (let i = 0; i < content.length; i++) {
									switch (content[i].name) {
										//subpageListing check
										case "mindtouch.idf#subpageListing":
											if (tags.includes("article:topic-category")) {
												fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
													method: "POST",
													body: content[i].value,
													headers: {"Slug": content[i].name}
												}).then();
											}
											break;
										//subpageListing check
										case "mindtouch.idf#guideDisplay":
											if (tags.includes("article:topic-guide")) {
												fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
													method: "POST",
													body: content[i].value,
													headers: {"Slug": content[i].name}
												}).then();
											}
											break;
										//pagecontent
										case "mindtouch.page#overview":
										case "mindtouch#idf.guideTabs":
										case "mindtouch.page#welcomeHidden":
										case "mindtouch.idf#product-image": //NEED FILE TRANSFER
											fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
												method: "POST",
												body: content[i].value,
												headers: {"Slug": content[i].name}
											}).then();
											break;
									}
								}
							});

							// Title cleanup
							if (child.data.padded) {
								fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/move?title=" + child.title + "&name=" + child.data.padded, {
									method: "POST"
								}).then();
							}

							//Thumbnail
							LTForm.authenticatedFetch(child.path, 'files', child.data.subdomain).then(async (response) => {
								if (response.ok) {
									let files = await response.text();
									if (files.includes('mindtouch.page#thumbnail') || files.includes('mindtouch.page%23thumbnail')) {
										let image = await LTForm.authenticatedFetch(child.path, 'thumbnail', child.data.subdomain);

										image = await image.blob();
										fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/files/=mindtouch.page%2523thumbnail", {
											method: "PUT",
											body: image
										}).then();
									}
								}
							});
					}
				}


				counter++;
				var elapsed = (new Date() - startedAt) / 1000;
				var rate = counter / elapsed;
				var estimated = total / rate;
				var eta = estimated - elapsed;
				var etah = secondsToStr(eta);
				const text = `Processing: ${counter}/${total} pages completed (${Math.round(counter * 100 / total)}%)` + (failedCounter ? "\nFailed: " + failedCounter : "");


				results.innerText = `${text} ETA: ${etah}`;
				RightAlert.text(text);
				errors.innerText = errorText;
				if (child.children) {
					await doCopy(url, child.children, depth + 1);
				}
			}


			async function putProperty(name, value, path) {
				fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/properties", {
					method: "POST",
					body: value,
					headers: {"Slug": name}
				})
			}

			async function processFile(file, child, path, id) {
				//only files with extensions
				if (!(file.contents['@href'].includes('mindtouch.page#thumbnail') || file.contents['@href'].includes('mindtouch.page%23thumbnail'))) {
					let filename = file['filename'];
					let image = await LTForm.authenticatedFetch(child.path, `files/${filename}`, child.data.subdomain);

					image = await image.blob();
					let response = await fetch(`/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}?dream.out.format=json`, {
						method: "PUT",
						body: image
					});
					response = await response.json();
					let original = file.contents['@href'].replace(`https://${child.data.subdomain}.libretexts.org`, '');
					return {
						original: original,
						oldID: id,
						newID: response['@id'],
						final: `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}`
					};
				}
				return false;
			}
		}
	}

	static async authenticatedFetch(path, api, subdomain) {
		let current = window.location.origin.split('/')[2].split('.')[0];
		let token = LTForm.keys[subdomain];
		subdomain = subdomain || current;
		if (subdomain)
			return await fetch(`https://${subdomain}.libretexts.org/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/${api}`,
				current === subdomain ? {} : {headers: {'x-deki-token': token}});
		else
			console.error(`Invalid subdomain ${subdomain}`);
	}
}

function secondsToStr(seconds) {
	return millisecondsToStr(seconds * 1000);
}

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
	//TODO: Months! Maybe weeks?
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

function formatNumber(it) {
	return it.toPrecision(4);
}

LTForm.initialize();
