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
				url = url.replace('?title=','');
				path = path.replace('?title=','');
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
				"<div id='LTFormFooter'><div>Select your college<select id='LTFormInstitutions'></select></div><div>Name for your LibreText (Usually your course name)<input id='LTFormName' oninput='LTForm.setName()'/></div></div>" +
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
			});
			LTRight.fancytree({
				source: [{
					title: "Cover Page. Drag onto me to get started",
					key: "ROOT",
					url: "",
					padded: "",
					unselectable: true,
					expanded: true,
					children: [{
						"expanded": true,
						"key": "_9",
						"lazy": false,
						"title": "1: Chapter 1",
						"tooltip": "Newly Created Page",
						"data": {"padded": "01: Chapter 1"}
					}, {
						"expanded": true,
						"key": "_10",
						"lazy": false,
						"title": "2: Chapter 2",
						"tooltip": "Newly Created Page",
						"data": {"padded": "02: Chapter 2"}
					}, {
						"expanded": true,
						"key": "_11",
						"lazy": false,
						"title": "3: Chapter 3",
						"tooltip": "Newly Created Page",
						"data": {"padded": "03: Chapter 3"}
					}, {
						"expanded": true,
						"key": "_12",
						"lazy": false,
						"title": "4: Chapter 4",
						"tooltip": "Newly Created Page",
						"data": {"padded": "04: Chapter 4"}
					}, {
						"expanded": true,
						"key": "_13",
						"lazy": false,
						"title": "5: Chapter 5",
						"tooltip": "Newly Created Page",
						"data": {"padded": "05: Chapter 5"}
					}, {
						"expanded": true,
						"key": "_14",
						"lazy": false,
						"title": "6: Chapter 6",
						"tooltip": "Newly Created Page",
						"data": {"padded": "06: Chapter 6"}
					}, {
						"expanded": true,
						"key": "_15",
						"lazy": false,
						"title": "7: Chapter 7",
						"tooltip": "Newly Created Page",
						"data": {"padded": "07: Chapter 7"}
					}, {
						"expanded": true,
						"key": "_16",
						"lazy": false,
						"title": "8: Chapter 8",
						"tooltip": "Newly Created Page",
						"data": {"padded": "08: Chapter 8"}
					}, {
						"expanded": true,
						"key": "_17",
						"lazy": false,
						"title": "9: Chapter 9",
						"tooltip": "Newly Created Page",
						"data": {"padded": "09: Chapter 9"}
					}, {
						"expanded": true,
						"key": "_18",
						"lazy": false,
						"title": "10: Chapter 10",
						"tooltip": "Newly Created Page",
						"data": {"padded": "10: Chapter 10"}
					}, {
						"expanded": true,
						"key": "_19",
						"lazy": false,
						"title": "11: Chapter 11",
						"tooltip": "Newly Created Page",
						"data": {"padded": "11: Chapter 11"}
					}, {
						"expanded": true,
						"key": "_20",
						"lazy": false,
						"title": "12: Chapter 12",
						"tooltip": "Newly Created Page",
						"data": {"padded": "12: Chapter 12"}
					}, {
						"expanded": true,
						"key": "_21",
						"lazy": false,
						"title": "13: Chapter 13",
						"tooltip": "Newly Created Page",
						"data": {"padded": "13: Chapter 13"}
					}, {
						"expanded": true,
						"key": "_22",
						"lazy": false,
						"title": "14: Chapter 14",
						"tooltip": "Newly Created Page",
						"data": {"padded": "14: Chapter 14"}
					}, {
						"expanded": true,
						"key": "_23",
						"lazy": false,
						"title": "15: Chapter 15",
						"tooltip": "Newly Created Page",
						"data": {"padded": "15: Chapter 15"}
					}, {
						"expanded": true,
						"key": "_24",
						"lazy": false,
						"title": "16: Chapter 16",
						"tooltip": "Newly Created Page",
						"data": {"padded": "16: Chapter 16"}
					}, {
						"expanded": true,
						"key": "_25",
						"lazy": false,
						"title": "17: Chapter 17",
						"tooltip": "Newly Created Page",
						"data": {"padded": "17: Chapter 17"}
					}, {
						"expanded": true,
						"key": "_26",
						"lazy": false,
						"title": "18: Chapter 18",
						"tooltip": "Newly Created Page",
						"data": {"padded": "18: Chapter 18"}
					}, {
						"expanded": true,
						"key": "_27",
						"lazy": false,
						"title": "19: Chapter 19",
						"tooltip": "Newly Created Page",
						"data": {"padded": "19: Chapter 19"}
					}, {
						"expanded": true,
						"key": "_28",
						"lazy": false,
						"title": "20: Chapter 20",
						"tooltip": "Newly Created Page",
						"data": {"padded": "20: Chapter 20"}
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
			'Workforce': 'careered'
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
		const subpageArray = response["page.subpage"];
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
		let url = `${institution.value}/${name.replace(/ /g, "_")}`;
		if (!name) {
			alert("No name provided!");
			return false
		}
		let response = await fetch(`/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(`${institution.value.replace(window.location.origin, "")}/${name}`))}/info`);
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
		// let subdomain = window.document.origin.split("/")[2].split(".")[0];
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
					let copyContent = false;
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
						}
						else {
							content = await fetch('https://api.libretexts.org/endpoint/redirect', {
								method: 'PUT',
								body: JSON.stringify({
									path: child.path,
									api: 'contents?mode=raw',
									username: document.getElementById("usernameHolder").innerText,
									subdomain: child.data.subdomain,
								})
							})
						}
						content = await content.text();
						content = content.match(/<body>([\s\S]*?)<\/body>/)[1].replace("<body>", "").replace("</body>", "");
						content = decodeHTML(content);
					}
					else if (child.data.subdomain !== current) {
						content = `<p class="mt-script-comment">Cross Library Transclusion</p>

<pre class="script">
template('CrossTransclude/Web',{'Library':'${child.data.subdomain}','PageID':${child.data.id}});
template('TranscludeAutoNumTitle');</pre>`
					}
					else {
						content = `<div class="mt-contentreuse-widget" data-page="${child.path}" data-section="" data-show="false">
<pre class="script">
wiki.page("${child.path}", NULL)</pre>
</div>`;
					}
					response = await fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path)) + "/contents?abort=exists", {
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

						/*					//Thumbnail
											fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(child.path)) + "/files/mindtouch.page%2523thumbnail").then(async (response) => {
												if (response.ok) {
													let image = await response.blob();
													fetch("/@api/deki/pages/=" + encodeURIComponent(encodeURIComponent(path + child.relativePath)) + "/files/mindtouch.page%2523thumbnail", {
														method: "PUT",
														body: image
													}).then();
												}
											});*/
					}
				}


				counter++;
				var elapsed = (new Date() - startedAt)/1000;
				var rate = counter/elapsed;
				var estimated = total/rate;
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

function secondsToStr (seconds) {
	return millisecondsToStr(seconds*1000);
}

// http://stackoverflow.com/a/8212878
function millisecondsToStr (milliseconds) {
	// TIP: to find current time in milliseconds, use:
	// var  current_time_milliseconds = new Date().getTime();

	function numberEnding (number) {
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

function formatNumber (it) {
	return it.toPrecision(4);
}

LTForm.initialize();
