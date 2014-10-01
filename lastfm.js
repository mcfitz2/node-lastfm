var request = require("request");
var async = require("async");
var extend = function(obj) {
	Array.prototype.slice.call(arguments, 1).forEach(function(source) {
		Object.keys(source).forEach(function(prop) {
			obj[prop] = source[prop];
		});
	});
	return obj;
};

function mkRange(n) {
	var data = [];
	for (var i = 1; i < n; i++) {
		data.push(i);
	}
	return data;
}
module.exports = LastFM = function(config) {
	var self = this;
	self.base_url = "http://ws.audioscrobbler.com/2.0/";
	self.config = config;
	self.params = {
		api_key: config.api_key,
		format: "json"
	};
	require("./methods.js").forEach(function(str) {
		var resource = str.split(".")[0];
		var method = str.split(".")[1];
		if (!self[resource]) {
			self[resource] = {};
		}
		self[resource][method] = function(params, callback) {
			params = extend(params, {
				method: resource + "." + method
			}, self.params);
			request.get({
				url: self.base_url,
				json: true,
				qs: params
			}, callback);
		};
	});
	self.fetchScrobbles = function(userName, options, callback) {
		self.user.getRecentTracks({
			user: userName,
			limit: 200
		}, function(err, res, body) {
			console.log(body);
			if (err) {
				return callback(err);
			}
			var totalPages = body.recenttracks["@attr"].totalPages;
			var totalScrobbles = body.recenttracks["@attr"].total;
			async.concatSeries(mkRange(totalPages), function(page, callback) {
				async.retry(5, function(callback) {
					self.user.getRecentTracks({
						user: userName,
						limit: 200,
						page: page
					}, function(err, res, body) {
						console.log(body);
							callback(err, body.recenttracks);
					});
				}, function(err) {
					callback(err);
				});
			}, callback);
		});
	};
};
if (require.main === module) {
	var l = new LastFM({
		api_key: "9d4a08fd16f30cc44ab8cd4feefcf018"
	});
	l.user.getInfo({
		user: 10042241
	}, function(err, res, body) {
		l.fetchScrobbles(body.user.name, {}, function(err, tracks) {
			console.log(tracks.length, tracks[0]);
		});
	});
}
module.exports = LastFM;