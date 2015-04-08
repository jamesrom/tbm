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
		.orient('right');
	
	var zoomLvl = 0;
	var scrollLvl = 0;

	svg.selectAll("line.grid").data(yScale.ticks()).enter()
		.append("line")
		.attr({
			'class': 'grid',
			'x1' : 4,
			'x2' : self.width(),
			'y1' : yScale,
			'y2' : yScale,
			'shape-rendering' : 'crispEdges',
		});

	svg.append('g')
		.attr('class', 'x axis')
		.attr('shape-rendering', 'crispEdges')
		.attr('transform', 'translate(-4,' + self.height() + ')');

	svg.append('g')
		.attr('shape-rendering', 'crispEdges')
		.attr('class', 'y axis')
		.attr('transform', 'translate(' + self.width() + ',0)');

	svg.selectAll('g.y.axis')
		.call(yAxis);

	// expose
	self.svg = svg;
	self.xScale = xScale;
	self.yScale = yScale;

	self.render = function(data) {
		var clicks = _.filter(data, 'is_click');
		Stats.resets = clicks.length;

        Stats.f1 = _.filter(clicks, function (click) {  return flairColor(_.property('seconds_left')(click)) === '#820080'; }).length;
        Stats.f2 = _.filter(clicks, function (click) {  return flairColor(_.property('seconds_left')(click)) === '#0083C7'; }).length;
        Stats.f3 = _.filter(clicks, function (click) {  return flairColor(_.property('seconds_left')(click)) === '#02be01'; }).length;
        Stats.f4 = _.filter(clicks, function (click) {  return flairColor(_.property('seconds_left')(click)) === '#E5D900'; }).length;
        Stats.f5 = _.filter(clicks, function (click) {  return flairColor(_.property('seconds_left')(click)) === '#e59500'; }).length;
        Stats.f6 = _.filter(clicks, function (click) {  return flairColor(_.property('seconds_left')(click)) === '#e50000'; }).length;
                
		xScale.domain([scrollLvl, clicks.length+1-zoomLvl+scrollLvl]);
		axisScale.domain([scrollLvl, clicks.length+1-zoomLvl+scrollLvl]);
		svg.selectAll('g.x.axis')
			.call(xAxis);

		yPixel = _.flow(_.property('seconds_left'), yScale);
		flair = _.flow(_.property('seconds_left'), flairColor);

		this.svg.selectAll("path").remove();
        
		var rect = svg.selectAll('rect.bar').data(clicks);
		rect.attr("class", "bar")
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', yPixel)
			.attr('width', function(d, i) {
				return xScale(i+1) - xScale(i);
			})
			.attr('height', function(d, i) {
				return yScale(60) - yPixel(d)
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
				return yScale(60) - yPixel(d)
			})
			.attr('fill', flair);

        
        var prevPrevVal = 0;
        var prevVal = 0;
        var curVal = 0
        var movingAverageLine = d3.svg.line()
        .x(function(d,i) { return xScale(i); })
        .y(function(d,i) {
            if (i == 0) {
                prevPrevVal  = yPixel(d);
                prevVal = yPixel(d);
                curVal =  yPixel(d);
            } else if (i == 1) {
                prevPrevVal = prevVal;
                prevVal = curVal;
                curVal = (prevVal + yPixel(d)) / 2.0;
            } else {
                prevPrevVal = prevVal;
                prevVal = curVal;
                curVal = (prevPrevVal + prevVal + yPixel(d)) / 3.0;
            }
            return curVal;
        })
        .interpolate("basis");

        rect.enter()
            .append("path")
            .attr("class", "average")
            .attr("id", "id")
            .attr("d", movingAverageLine(clicks));

        
        
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
			.data(yScale.ticks());

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