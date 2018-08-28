var Chart = (function() {
	var self = {
		margins: {top: 30, bottom: 70, left: 0, right: 30}
	};

	self.height = function() {
		return $('#chart').height() - self.margins.top - self.margins.bottom;
	};

	self.width = function() {
		return $('#chart').width() - self.margins.left - self.margins.right;
	};

	self.sorted = false;

	var svg = d3.select('#chart')
		.append('svg:svg')
		.attr({width: '100%', height: '100%'})
		.append('g')
		.attr('transform', 'translate(' + self.margins.left + ',' + self.margins.top + ')');

	var xScale = d3.scale.linear()
		.domain([0, 1])
		.range([4, self.width()]);

	var axisScale = d3.scale.linear()
		.domain([0, 1])
		.range([8, self.width() + 4]);
	var yScale = d3.scale.linear()
		.domain([60, 0])
		.range([self.height(), 0]);

	var xAxis = d3.svg.axis()
		.scale(axisScale)
		.tickFormat(d3.format("d"))
		.orient('bottom');

	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient('right')
		.tickValues([60, 51, 41, 31, 21, 11, 0]);

	var tip = d3.tip()
		.attr('class', 'tooltip')
		.offset([-12, 0])
		.html(function(d) {
			return '<div>Seconds Left: ' + d.seconds_left + '</div>'
				+ '<div>Time Stamp: ' + d.now.format("YYYY-MM-DD HH:mm:ss") + '</div>'
				+ '<div>Clicks: ' + d.clicks + '</div>';
		});

	var zoomLvl = 0;
	var scrollLvl = 0;

	svg.selectAll("line.grid").data(yAxis.tickValues()).enter()
		.append("line")
		.attr({
			'class': 'grid',
			'x1' : 4,
			'x2' : self.width(),
			'y1' : yScale,
			'y2' : yScale,
			'shape-rendering' : 'crispEdges',
		})
		.attr("stroke", function (d) {
			switch (d) {
				case 60: return "#6ea2d5";
				case 0: return "#6ea2d5";
				default: return flairColor(d);
			}
		})

	svg.append('g')
		.attr('class', 'x axis')
		.attr('shape-rendering', 'crispEdges')
		.attr('transform', 'translate(-4,' + self.height() + ')');

	svg.append('g')
		.attr('shape-rendering', 'crispEdges')
		.attr('class', 'y axis')
		.attr('transform', 'translate(' + self.width() + ',0)')
		.append('rect')
		.attr({
			x: 0,
			y: 0,
			width: '100%',
			height: self.height(),
			fill: 'white'
		});

	svg.selectAll('g.y.axis')
		.call(yAxis);

	svg.call(tip);

	// expose
	self.svg = svg;
	self.xScale = xScale;
	self.yScale = yScale;


	function sortClicksBySecondsLeft(e1, e2) {
		return e2.seconds_left - e1.seconds_left;
	}

	function copySortedArray(arr) {
		var s = arr.filter(function(e) {
			return !!e.clicks && e.clicks > 0;
		});

		s.sort(sortClicksBySecondsLeft);
		return s;
	}


	self.render = function(data) {
		if (self.sorted) {
			data = copySortedArray(data);
		}

		var clicks = _.filter(data, 'is_click');
		Stats.resets = clicks.length;

		xScale.domain([scrollLvl, clicks.length+1-zoomLvl+scrollLvl]);
		axisScale.domain([scrollLvl, clicks.length+1-zoomLvl+scrollLvl]);
		svg.selectAll('g.x.axis')
			.call(xAxis);

		yPixel = _.flow(_.property('seconds_left'), yScale);
		flair = _.flow(_.property('seconds_left'), flairColor);

		var rect = svg.selectAll('rect.bar').data(clicks);
		rect.attr("class", "bar")
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', function(d, i) {
				if (d.seconds_left == 60) {return yScale(59.5); }
				else {return yPixel(d); }
			})
			.attr('width', function(d, i) {
				return xScale(i+1) - xScale(i);
			})
			.attr('height', function(d, i) {
				if (d.seconds_left == 60){ return yScale(0.5); }
				else {return yScale(60) - yPixel(d); }
			})
			.attr('fill', flair);

		rect.enter()
			.append('rect')
			.attr("class", "bar")
			.attr('shape-rendering', 'crispEdges')
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', yPixel)
			.attr('width', function(d, i) {
				return xScale(i+1) - xScale(i);
			})
			.attr('height', function(d, i) {
				return yScale(60) - yPixel(d);
			})
			.attr('fill', flair)
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide);

		rect.exit()
			.remove();

		//Put axis in front of bars in case they overlap
		svg.select('.y.axis').moveToFront();
	}

	self.resize = function() {
		if ($(window).width() < 400) {
			$('#chart').addClass('small');
		}
		else {
			$('#chart').removeClass('small');
		}
		xScale.range([4, self.width()]);
		axisScale.range([8, self.width() + 4]);
		yScale.range([Chart.height(), 0]);

		var grids = svg.selectAll("line.grid")
			.data(yAxis.tickValues());

		grids.attr({
				'class': 'grid',
				'x1' : 4,
				'x2' : self.width(),
				'y1' : yScale,
				'y2' : yScale,
				'shape-rendering' : 'crispEdges',
			})

		grids.enter()
			.append("line")
			.attr({
				'class': 'grid',
				'x1' : 4,
				'x2' : self.width(),
				'y1' : yScale,
				'y2' : yScale,
				'shape-rendering' : 'crispEdges',
			});

		grids.exit()
			.remove();

		svg.selectAll('g.x.axis')
			.attr('transform', 'translate(-4,' + Chart.height() + ')')
			.call(xAxis);
		svg.selectAll('g.y.axis')
			.attr('transform', 'translate(' + Chart.width() + ',0)')
			.call(yAxis);

		svg.selectAll('g.y.axis rect')
			.attr('height', self.height());
	}

	self.zoom = function(delta, pos) {
		//Different zoom depending on level (accelerate zoom every time you zoom out by 50)
		var v = delta * Math.floor((Stats.resets - zoomLvl)/50) + delta;

		zoomLvl += v;
		if (zoomLvl < 0) { zoomLvl = 0; }
		if (zoomLvl > Stats.resets) { zoomLvl = Stats.resets; }

		//Adjust scrolling to center on mouse
		scrollLvl += pos / self.width() * v;
		if (scrollLvl < 0) { scrollLvl = 0; }
		if (scrollLvl > zoomLvl) { scrollLvl = zoomLvl; }
	}

	self.scroll = function(dist) {
		//Adjust scrolling speed according to domain
		scrollLvl += dist / self.width() * (xScale.domain()[1] - xScale.domain()[0]);
		if (scrollLvl < 0) { scrollLvl = 0; }
		if (scrollLvl > zoomLvl) { scrollLvl = zoomLvl; }
	}

	return self;
}());
