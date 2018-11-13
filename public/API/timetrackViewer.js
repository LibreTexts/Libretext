class timetrackViewer {
	constructor() {
		this.user = document.getElementById("usernameHolder").innerText;
		this.dataset = "contributions";

		const chartHeader = document.getElementById("chartHeader");
		chartHeader.innerHTML = `
			<div style="border: 2px solid green; padding: 10px; border-radius: 10px">
				<div>Administrative Authentication required</div>
<!--				<div>Username to Authenticate: <input id="user" placeholder="Username"/></div>
				<div>Password to Authenticate: <input id="password" placeholder="Password" type="password"/></div>-->
			</div>`;
		const chartButtons = document.getElementById("chartButtons");
		chartButtons.innerHTML = `
			<div>
				<button onClick="timetrack.loadDataset('contributions')">Contributions</button>
				<button onClick="timetrack.loadDataset('edit')">Edit</button>
				<button onClick="timetrack.loadDataset('view')">View</button>
				<button onClick="timetrack.loadDataset('idle')">Idle</button>
			</div>
			<div style="display: flex">
				<input id="searchUsername" placeholder="Search by Student Username"/>
				<button onClick="timetrack.searchUser()">Search for user</button>
			</div>`;

		var options = {
			url: function (username) {
				return `${window.location.origin}/@api/deki/users/search?fullname=${encodeURIComponent(username)}&dream.out.format=json`;
			},

			getValue: function (json) {
				console.log(json);
				let user = json.user;
				if (user) {
					if (user.length) {
						return $.map(user, (item) => item.fullname);
					}
					return user.fullname;
				}
				return [];
			},
			requestDelay: 500,

			list: {
				match: {
					enabled: true
				}
			}
		};

		$("#searchUsername").easyAutocomplete(options);
		this.searchUser();
	}

	async searchUser() {
		let username = document.getElementById("searchUsername");
		if (username && username.value) {
			this.user = username.value;
		}

		await Promise.all([this.getContributions(), this.getTracking()]);
		this.loadDataset();
	}

	loadDataset(set) {
		if (set) {
			this.dataset = set;
		}
		switch (this.dataset) {
			case "contributions":
				this.parseContributions(this.contributions);
				break;
			case "edit":
				this.loadTracking(this.edit);
				break;
			case "idle":
				this.loadTracking(this.idle);
				break;
			case "view":
				this.loadTracking(this.view);
				break;

		}
	}

	async getContributions() {
		const response = await fetch(`${window.location.origin}/@api/deki/users/=${encodeURIComponent(encodeURIComponent(this.user))}/feed?limit=500&format=raw&dream.out.format=json`);
		if (response.ok) {
			let json = await response.json();
			let array = json.change;
			let result = [];
			if (array) {
				/*				if (array.length === 100) {
									array = array.concat(await getOffset(100));
								}*/
				console.log(array.length);
				for (let i = 0; i < array.length; i++) {
					let time = "" + array[i].rc_timestamp;
					let date = `${time.substring(0, 4)}-${time.substring(4, 6)}-${time.substring(6, 8)}T${time.substring(8, 10)}:${time.substring(10, 12)}:${time.substring(12, 14)}`;

					date = new Date(date);

/*					date = new Date(Date.UTC(parseInt(time.substring(0, 4)), //Year
						parseInt(time.substring(4, 6)), //Month
						parseInt(time.substring(6, 8)), //Day
						parseInt(time.substring(8, 10)), //Hour
						parseInt(time.substring(10, 12)), //Minute
						parseInt(time.substring(12, 14)))); //Second*/
					result.push(date);
				}
			}
			else {
				alert("No known contributions");
			}
			this.contributions = result;
		}
		else {
			alert("Lookup failed! Error " + response.status + " " + response.statusText);
		}
	}

	loadTracking(data) {
		const viewerDays = 14;

		let labelsX;
		let today = new Date();

		for (let i = viewerDays; i >= 0; i--) {
			labelsX = [];
			let currentDay = new Date();
			currentDay.setDate(today.getDate() - i);
			for (let j = 0; j < 24; j++) {
				labelsX.push(j === 12 ? 12 : j % 12);
			}
		}
		update(data, labelsX);
	}

	parseContributions(data) { //for parsing contributions
		const viewerDays = 14;

		let labelsX;
		let result = [];
		let today = new Date();

		for (let i = viewerDays; i >= 0; i--) {
			labelsX = [];
			let values = [];
			let currentDay = new Date();
			currentDay.setDate(today.getDate() - i);
			for (let j = 0; j < 24; j++) {
				labelsX.push(j === 12 ? 12 : j % 12);
				values[j] = 0;
			}

			result.push({
				label: currentDay.toDateString(),
				date: currentDay,
				values: values
			});
		}

		result = parseData(data, result);
		update(result, labelsX);

		function parseData(data, result) {
			for (let i = 0; i < data.length; i++) {
				let activity = data[i];

				if (activity > result[0].date) {
					//Find Date
					for (let i = 0; i <= viewerDays; i++) {
						if (activity.getMonth() === result[i].date.getMonth() && activity.getDate() === result[i].date.getDate() && activity.getFullYear() === result[i].date.getFullYear()) {
							//Find Time
							result[i].values[activity.getHours()]++;
							break;
						}
					}
				}
			}
			return result;
		}
	}

	async getTracking() {
		const response = await fetch(`https://api.libretexts.org/timetrack/editorStats?user=${this.user}`);
		if (response.ok) {
			const json = await response.json();
			this.idle = json.Inactivity;
			this.view = json.Activity;
			this.edit = json.Editor;
		}
		else {
			alert("Tracking lookup failed! Error " + response.status + " " + response.statusText);
		}
	}
}

const timetrack = new timetrackViewer();

//Punchcard code
const margin = {top: 10, right: 10, bottom: 10, left: 15};
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const padding = 3;
const xLabelHeight = 30;
const yLabelWidth = 80;
const borderWidth = 3;
const duration = 500;

const chart = d3.select('#chart').append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

const border = chart.append('rect')
	.attr('x', yLabelWidth)
	.attr('y', xLabelHeight)
	.style('fill-opacity', 0)
	.style('stroke', '#000')
	.style('stroke-width', borderWidth)
	.style('shape-rendering', 'crispEdges');

// load('sample1.csv');

function load(name) {
	name = "http://awesomefiles.libretexts.org/API/" + name;
	d3.text(name, function (dataCSV) {

		let labelsX = null;
		const data = [];

		d3.csv.parseRows(dataCSV, function (d) {

			if (labelsX === null) return labelsX = d.slice(1);

			const values = d.slice(1);
			let i = 0;

			for (; i < values.length; i++) {
				values[i] = parseInt(values[i], 10)
			}

			data.push({
				label: d[0],
				values: values
			})

		});

		update(data, labelsX)
	})
}

function update(data, labelsX) {

	const allValues = Array.prototype.concat.apply([], data.map(function (d) {
		return d.values
	}));
	const maxWidth = d3.max(data.map(function (d) {
		return d.values.length
	}));
	let maxR = d3.min([(width - yLabelWidth) / maxWidth, (height - xLabelHeight) / data.length]) / 2;

	const r = function (d) {
		if (d === 0) return 0;

		f = d3.scale.sqrt()
			.domain([d3.min(allValues), d3.max(allValues)])
			.rangeRound([2, maxR - padding]);

		return f(d)
	};

	const c = d3.scale.linear()
		.domain([d3.min(allValues), d3.max(allValues)])
		.rangeRound([255 * 0.8, 0]);

	const rows = chart.selectAll('.row')
		.data(data, function (d) {
			return d.label
		});

	rows.enter().append('g')
		.attr('class', 'row');

	rows.exit()
		.transition()
		.duration(duration)
		.style('fill-opacity', 0)
		.remove();

	rows.transition()
		.duration(duration)
		.attr('transform', function (d, i) {
			return 'translate(' + yLabelWidth + ',' + (maxR * i * 2 + maxR + xLabelHeight) + ')'
		});

	const dots = rows.selectAll('circle')
		.data(function (d) {
			return d.values
		});

	dots.enter().append('circle')
		.attr('cy', 0)
		.attr('r', 0)
		.style('fill', '#ffffff')
		.text(function (d) {
			return d
		});

	dots.exit()
		.transition()
		.duration(duration)
		.attr('r', 0)
		.remove();

	dots.transition()
		.duration(duration)
		.attr('r', function (d) {
			return r(d)
		})
		.attr('cx', function (d, i) {
			return i * maxR * 2 + maxR
		})
		.style('fill', function (d) {
			return 'rgb(' + 0x00 + ',' + c(d) + ',' + c(d) + ')'
		});

	const dotLabels = rows.selectAll('.dot-label')
		.data(function (d) {
			return d.values
		});

	const dotLabelEnter = dotLabels.enter().append('g')
		.attr('class', 'dot-label')
		.on('mouseover', function (d) {
			const selection = d3.select(this);
			selection.select('rect').transition().duration(100).style('opacity', 1);
			selection.select("text").transition().duration(100).style('opacity', 1)
		})
		.on('mouseout', function (d) {
			const selection = d3.select(this);
			selection.select('rect').transition().style('opacity', 0);
			selection.select("text").transition().style('opacity', 0)
		});

	dotLabelEnter.append('rect')
		.style('fill', '#000000')
		.style('opacity', 0);

	dotLabelEnter.append('text')
		.style('text-anchor', 'middle')
		.style('fill', '#ffffff')
		.style('opacity', 0);

	dotLabels.exit().remove();

	dotLabels
		.attr('transform', function (d, i) {
			return 'translate(' + (i * maxR * 2) + ',' + (-maxR) + ')'
		})
		.select('text')
		.text(function (d) {
			return d
		})
		.attr('y', maxR + 4)
		.attr('x', maxR);

	dotLabels
		.select('rect')
		.attr('width', maxR * 2)
		.attr('height', maxR * 2);

	const xLabels = chart.selectAll('.xLabel')
		.data(labelsX);

	xLabels.enter().append('text')
		.attr('y', xLabelHeight)
		.attr('transform', 'translate(0,-6)')
		.attr('class', 'xLabel')
		.style('text-anchor', 'middle')
		.style('fill-opacity', 0);

	xLabels.exit()
		.transition()
		.duration(duration)
		.style('fill-opacity', 0)
		.remove();

	xLabels.transition()
		.text(function (d) {
			return d
		})
		.duration(duration)
		.attr('x', function (d, i) {
			return maxR * i * 2 + maxR + yLabelWidth
		})
		.style('fill-opacity', 1);

	const yLabels = chart.selectAll('.yLabel')
		.data(data, function (d) {
			return d.label
		});

	yLabels.enter().append('text')
		.text(function (d) {
			return d.label
		})
		.attr('x', yLabelWidth)
		.attr('class', 'yLabel')
		.style('text-anchor', 'end')
		.style('fill-opacity', 0);

	yLabels.exit()
		.transition()
		.duration(duration)
		.style('fill-opacity', 0)
		.remove();

	yLabels.transition()
		.duration(duration)
		.attr('y', function (d, i) {
			return maxR * i * 2 + maxR + xLabelHeight
		})
		.attr('transform', 'translate(-6,' + maxR / 2.5 + ')')
		.style('fill-opacity', 1);

	const vert = chart.selectAll('.vert')
		.data(labelsX);

	vert.enter().append('line')
		.attr('class', 'vert')
		.attr('y1', xLabelHeight + borderWidth / 2)
		.attr('stroke', '#888')
		.attr('stroke-width', 1)
		.style('shape-rendering', 'crispEdges')
		.style('stroke-opacity', 0);

	vert.exit()
		.transition()
		.duration(duration)
		.style('stroke-opacity', 0)
		.remove();

	vert.transition()
		.duration(duration)
		.attr('x1', function (d, i) {
			return maxR * i * 2 + yLabelWidth
		})
		.attr('x2', function (d, i) {
			return maxR * i * 2 + yLabelWidth
		})
		.attr('y2', maxR * 2 * data.length + xLabelHeight - borderWidth / 2)
		.style('stroke-opacity', function (d, i) {
			return i ? 1 : 0
		});

	const horiz = chart.selectAll('.horiz').data(data, function (d) {
		return d.label
	});

	horiz.enter().append('line')
		.attr('class', 'horiz')
		.attr('x1', yLabelWidth + borderWidth / 2)
		.attr('stroke', '#888')
		.attr('stroke-width', 1)
		.style('shape-rendering', 'crispEdges')
		.style('stroke-opacity', 0);

	horiz.exit()
		.transition()
		.duration(duration)
		.style('stroke-opacity', 0)
		.remove();

	horiz.transition()
		.duration(duration)
		.attr('x2', maxR * 2 * labelsX.length + yLabelWidth - borderWidth / 2)
		.attr('y1', function (d, i) {
			return i * maxR * 2 + xLabelHeight
		})
		.attr('y2', function (d, i) {
			return i * maxR * 2 + xLabelHeight
		})
		.style('stroke-opacity', function (d, i) {
			return i ? 1 : 0
		});

	border.transition()
		.duration(duration)
		.attr('width', maxR * 2 * labelsX.length)
		.attr('height', maxR * 2 * data.length)

}