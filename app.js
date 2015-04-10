var data = [];
var mouseX;
var fmt = d3.format("0,000");
var clicks = [];

//Function to move components to front from D3
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function init() {
	$(window).on('resize', resize);
	$('#chart').on('mousewheel', mouseWheel)
			   .on('mousedown', mouseDown);
	Stats.start = moment().format("YYYY-MM-DD HH:mm:ss");
	resize();
}

function flairColor(seconds) {
	if (seconds > 51) {
		return '#820080';
	}
	if (seconds > 41) {
		return '#0083C7';
	}
	if (seconds > 31) {
		return '#02be01';
	}
	if (seconds > 21) {
		return '#E5D900';
	}
	if (seconds > 11) {
		return '#e59500';
	}

	return '#e50000';
}

function resize() {
	Chart.resize();
	Stats.resize();
	Timer.resize();
	Comms.resize();

	if ($(window).width() < 400) {
		$('.footer.twitter, .footer.web').hide();
	}
	else {
		$('.footer.twitter, .footer.web').show();
	}
}

//Mouse functions

function mouseWheel(e) {
	e = window.event || e;
	var deltaY = Math.max(-1, Math.min(1, (e.deltaFactor ? e.deltaY : -e.deltaY) || e.wheelDelta));
	Chart.zoom(deltaY, e.pageX);
	Chart.render(data);
	Timer.updateBar();
}

function mouseDown(e) {
	//e = window.event || e;
	mouseX = e.pageX;
	
	//Bind scrolling functions
	$(window).on('mousemove', mouseMove)
			 .on('mouseup', mouseUp);
}

function mouseMove(e) {
	mouseDelta = mouseX - e.pageX;
	mouseX = e.pageX;
	
	Chart.scroll(mouseDelta);
	Chart.render(data);
	Timer.updateBar();
	
	e.preventDefault();
}

function mouseUp(e) {
	//Unbind scrolling functions
	$(window).off('mousemove')
			 .off('mouseup');
}