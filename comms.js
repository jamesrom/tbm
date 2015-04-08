var Comms = (function() {
	var self = {};
	var sock;
	var redditRequester = new XMLHttpRequest();

	redditRequester.onreadystatechange = function () {
		if (redditRequester.readyState !== 4) {
			return;
		}
		var websocketURL;
		if (redditRequester.status === 200) {
			var regex = /"(wss:\/\/wss\.redditmedia\.com\/thebutton\?h=[^"]*)"/g;
			websocketURL = regex.exec(redditRequester.responseText)[1];
		}

		websocketURL = websocketURL || "wss://wss.redditmedia.com/thebutton?h=7f66bf82878e6151f7688ead7085eb63a0baff0b&e=1428621271";
		
		console.log("Connecting to: " + websocketURL);
		sock = new WebSocket(websocketURL);
		sock.onmessage = tick;
	};
	// Use CORS proxy by lezed1 to get the Reddit homepage!
	redditRequester.open("get", "//cors-unblocker.herokuapp.com/get?url=https%3A%2F%2Fwww.reddit.com%2Fr%2Fthebutton", true);
	redditRequester.send();

	self.keep = 0; //Amount of data points to keep, 0 means an infinite amount
	self.newClick = false;
	
	function tick(evt) {
		// {"type": "ticking", "payload": {"participants_text": "585,177", "tick_mac": "362a88a8ae0a89c909395f587e329992c656b4d8", "seconds_left": 59.0, "now_str": "2015-04-04-23-44-42"}}
		var packet = JSON.parse(evt.data);
		if (packet.type != "ticking") {
			return;
		}

		packet.payload.now = moment(packet.payload.now_str + " 0000", "YYYY-MM-DD-HH-mm-ss Z");
		Stats.lag = d3.format("0,000")(packet.payload.now - moment());

		if (data.length > 0 && packet.payload.seconds_left >= _.last(data).seconds_left) {
			_.last(data).is_click = true;
			
			//Update number of clicks when a new one is added
			updateClicks();
			
			//Truncate data if the limit is reached
			if (self.keep != 0 && clicks.length > self.keep) {
				truncateData(self.keep);
			}
			
			self.newClick = true;
		} else { self.newClick = false; }
		data.push(packet.payload);
		Stats.ticks = fmt(data.length);
		Stats.participants = packet.payload.participants_text;

		Chart.render(data);
		Timer.sync(packet.payload.seconds_left);
		Stats.render();
	}

	self.setKeep = function(val) {
		if (val < clicks.length && val != 0) {
			//If the amount of data to keep is less than the amount of data stored, warn the user
			if (confirm("Warning, this will irreversibly truncate your current data.")) {
				self.keep = val;
				truncateData(self.keep);
				Chart.render(data);
				return true;
			}
			return false;
		}
		self.keep = val;
		return true;
	}
	
	function updateClicks() {
		clicks = _.filter(data, 'is_click');
	}
	
	function truncateData(num) {
		var begin = clicks[clicks.length - num];
		data = data.slice(data.indexOf(begin));
		updateClicks();
	}
	
	return self;
}())
