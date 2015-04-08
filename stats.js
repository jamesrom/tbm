var Stats = (function() {
	var self = {};

	self.resets = 0;
	self.f1 = 0;
	self.f2 = 0;
	self.f3 = 0;
	self.f4 = 0;
	self.f5 = 0;
	self.f6 = 0;
	
	self.render = function() {
		_(self)
			.keys()
			.filter(function(key) {
				return key != "render" && key != "resize";
			})
			.each(function(key, i) {
				$('#' + key).text(self[key]);
			})
			.value();

		self.resize();
		Timer.resize();
	}

	self.resize = function() {
		if ($(window).width() < 400) {
			$('#stats').addClass('small');
		}
		$('#stats')
			.removeClass('small')
			.css('left', ($('#chart').offset().left))
			.css('top', Chart.margins.top);
	}

	return self;
}());