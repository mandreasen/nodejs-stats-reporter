const OS = require('os');
const HTTPS = require('https');
const Crypto = require('crypto');
const QueryString = require('querystring');

const REPORT_HOST = "nodestats.mandreasen.com";
const REPORT_PATH = "/report.php";

class Reporter {
	constructor(packageJson) {
		// Show debug output. Default: false.
		this.debug = process.env.MA_NODEJS_STATS_REPORTER_DEBUG || false;

		// Report stats. Default: true.
		this.report = process.env.MA_NODEJS_STATS_REPORTER_REPORT || true;

		// Machine identifier.
		this.machineID = this.getMachineID();

		// Start up timestamp.
		this.startupTimestamp = Math.floor(Date.now() / 1000);

		// Reporter version
		this.reporterVersion = require('./package.json').version || "0.0.0";

		// Modules there is reporting stats.
		this.modules = {};
	}

	setup(packageJson) {
		// Start reporting if not started yet.
		if (Object.keys(this.modules).length <= 0) {
			// Setup stats report.
			this.setupReporting();
		}

		// Add module to the modules list if not added yet.
		if (!this.modules.hasOwnProperty(packageJson.name)) {
			this.modules[packageJson.name] = {
				name: packageJson.name,
				version: packageJson.version
			};
		}
	}

	getMachineID() {
		var macs = [];
		var iface = null;
		var interfaces = OS.networkInterfaces();

		for (var ifName in interfaces) {
			iface = interfaces[ifName];

			iface.forEach(function(virtualInterface) {
				if (virtualInterface.mac != "00:00:00:00:00:00" && macs.indexOf(virtualInterface.mac) == -1) {
					macs.push(virtualInterface.mac);
				}
			});
		}

		macs.sort();
		var hash = Crypto.createHash('sha1');
		hash.update(macs.join(','), 'ascii');
		var id = hash.digest('hex');

		if (this.debug) {
			console.log("Machine identifier:", id);
		}

		return id;
	}

	setupReporting() {
		if (this.report) {
			// Report stats hourly.
			setInterval(this.reportStats.bind(this), 1000 * 60 * 60);

			// Report stats immediately 15 minutes after start.
			setTimeout(this.reportStats.bind(this), 1000 * 60 * 15);

			if (this.debug) {
				// Report stats immediately in 5 seconds.
				setTimeout(this.reportStats.bind(this), 1000 * 5);
			}
		}
	}

	reportStats() {
		if (this.report) {
			var stats = QueryString.stringify({
				node_version: process.versions.node,
				reporter_version: this.reporterVersion,
				machine_identifier: this.machineID,
				os_platform: OS.platform(),
				os_release: OS.release(),
				app_uptime: Math.floor(Date.now() / 1000) - this.startupTimestamp
			});

			for (var module in this.modules) {
				stats += "&modules[" + module + "]=" + this.modules[module].version;
			}

			var request = HTTPS.request({
				"method": "POST",
				"hostname": REPORT_HOST,
				"path": REPORT_PATH,
				"headers": {
					"Content-Type": "application/x-www-form-urlencoded",
					"Content-Length": stats.length,
					"User-Agent": "node/" + process.versions.node + " nodejs-stats-reporter/" + this.reporterVersion
				}
			}, (result) => {
				result.on('data', (chunk) => {
					if (this.debug && chunk.length > 0) {
						console.log(chunk.toString('ascii'));
					}
				});

				if (this.debug) {
					console.log("-----------------------------------------------------------");
					console.log("Stats reported.");
					console.log("Status code:", result.statusCode);
					console.log("Data:", stats);
					console.log("-----------------------------------------------------------");
				}
			});

			request.on('error', (error) => {
				if (this.debug) {
					console.log(error);
				}
			});

			request.end(stats);
		}
	}
}

module.exports = new Reporter();