var Comms = (function() {
    var self = {};
    var sock;
    var fmt = d3.format("0,000");
    var clickTimes = new Array(61);
    var timeoutId;

    $('#loading-indicator').show();
    connectToWebsocket();

    function connectToWebsocket() {
        var redditRequester = new XMLHttpRequest();

        redditRequester.onreadystatechange = function () {
            if (redditRequester.readyState !== 4) {
                return;
            }
            var websocketURL;
            if (redditRequester.status !== 200) {
                console.error("Something went wrong, reconnecting in 5 seconds!");
                setTimeout(connectToWebsocket, 5000);
                return;
            }

            var regex = /"(wss:\/\/wss\.redditmedia\.com\/thebutton\?h=[^"]*)"/g;
            websocketURL = regex.exec(redditRequester.responseText)[1];
            
            console.log("Connecting to: " + websocketURL);
            sock = new WebSocket(websocketURL);
            sock.onmessage = tick;
        };
        // Use CORS proxy by lezed1 to get the Reddit homepage!
        redditRequester.open("get", "//cors-unblocker.herokuapp.com/get?url=https%3A%2F%2Fwww.reddit.com%2Fr%2Fthebutton", true);
        redditRequester.send();
    }

    function reconnectToWebsocket() {
        sock.close();

        data.push({seconds_left: -.01});
        Chart.render(data);
        Timer.sync("0");
        $('#loading-indicator').show();

        connectToWebsocket();
    }

    // Set initial values of clickTimes
    clickTimes.total = 0;
    for (var i = 0; i < clickTimes.length; i++) {
        clickTimes[i] = 0;
    };

    function tick(evt) {
        $('#loading-indicator').hide();
        $('#stats').show();
        Stats.start = Stats.start || moment();

        // {"type": "ticking", "payload": {"participants_text": "585,177", "tick_mac": "362a88a8ae0a89c909395f587e329992c656b4d8", "seconds_left": 59.0, "now_str": "2015-04-04-23-44-42"}}
        var packet = JSON.parse(evt.data);
        if (packet.type != "ticking") {
            return;
        }

        // Reconnect if no information is recieved for 10 seconds.
        clearTimeout(timeoutId);
        timeoutId = setTimeout(reconnectToWebsocket, 10000);

        packet.payload.now = moment(packet.payload.now_str + " 0000", "YYYY-MM-DD-HH-mm-ss Z");
        Stats.lag = d3.format("0,000")(packet.payload.now - moment());
        packet.payload.participants = parseInt(packet.payload.participants_text.replace(/[^0-9]/g, ''))

        var last = _.last(data);
        if (data.length > 0 && packet.payload.seconds_left >= last.seconds_left && last.seconds_left >= 0 && packet.payload.participants !== last.participants) {
            last.is_click = true;
            last.clicks = packet.payload.participants - last.participants;
            Stats.clicks += last.clicks;

            var total_resets = _.filter(data, 'is_click').length;
            var last_time = last.seconds_left;

            // Update color stats
            if (last_time <= 11) {
                Stats.total_reds += last.clicks;
            }
            else if (last_time <= 21) {
                Stats.total_oranges += last.clicks;
            }
            else if (last_time <= 31) {
                Stats.total_yellows += last.clicks;
            }
            else if (last_time <= 41) {
                Stats.total_greens += last.clicks;
            }
            else if (last_time <= 51) {
                Stats.total_blues += last.clicks;
            }
            else if (last_time <= 60) {
                Stats.total_purples += last.clicks;
            }

            clickTimes[last_time] += 1;
            clickTimes.total += 1;

            // Find the median value, or the lower of the two needed to be averaged
            var current_index = 0;
            var values_left = Math.floor((clickTimes.total + 1) / 2);
            while (clickTimes[current_index] < values_left) {
                values_left -= clickTimes[current_index];
                current_index += 1;
            }

            if (clickTimes[current_index] === values_left && (clickTimes.total % 2) === 0) {
                var next_index = current_index + 1;
                while (clickTimes[next_index] === 0) {
                    next_index += 1;
                }
                Stats.median_click_time = (current_index + next_index) / 2;
            }
            else {
                Stats.median_click_time = current_index;
            }

            // Update percentages
            Stats.purple_percentage = "(" + (100.0 * Stats.total_purples / Stats.clicks).toFixed(3) + "%)";
            Stats.blue_percentage = "(" + (100.0 * Stats.total_blues / Stats.clicks).toFixed(3) + "%)";
            Stats.green_percentage = "(" + (100.0 * Stats.total_greens / Stats.clicks).toFixed(3) + "%)";
            Stats.yellow_percentage = "(" + (100.0 * Stats.total_yellows / Stats.clicks).toFixed(3) + "%)";
            Stats.orange_percentage = "(" + (100.0 * Stats.total_oranges / Stats.clicks).toFixed(3) + "%)";
            Stats.red_percentage = "(" + (100.0 * Stats.total_reds / Stats.clicks).toFixed(3) + "%)";

            // Update lowest time if needed
            if (Stats.lowest_time > last_time) {
                Stats.lowest_time = last_time;
            }

            // Update average time
            Stats.sum_of_times += last_time;
            Stats.average_time = (1.0 * Stats.sum_of_times / total_resets).toFixed(3);

            // Resets per minute
            Stats.resets_per_minute = (60.0 * total_resets / data.length).toFixed(3);
        }
        else if (data.length > 0 && last.seconds_left < 0) {
            last.is_click = true;
        }
        data.push(packet.payload);
        Stats.ticks = fmt(data.length);
        Stats.participants = packet.payload.participants_text;
        Chart.render(data);
        Timer.sync(packet.payload.seconds_left);
        Stats.render();
    }

    self.resize = function() {
        $('#loading-indicator')
            .css('left', ($(window).width() - $('#loading-indicator').width()) / 2)
            .css('top', ($(window).height() - $('#loading-indicator').height()) * (1/3));
    }

    return self;
}())
