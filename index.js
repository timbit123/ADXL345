var i2c = require('i2c');
var async = require('async');
var address = 0x53;
var wire;
var classADXL345 = {};

/**
 * global Variables contain
 *
 * SAMPLECOUNT = 400;
 * accelScaleFactor = [0.0,0.0,0.0];
 * runTimeAccelBias = [0, 0, 0];
 * accelOneG = 0.0;
 * meterPerSecSec = [0.0,0.0,0.0];
 * accelSample = [0,0,0];
 * accelSampleCount = 0;
 */
var globVar;

/**
 *
 * @param {Object} vars
 * @param {Object} callback
 */
classADXL345.init = function(vars, callback) {
	globVar = vars;
	//init stuff here
	wire = new i2c(address, {
		device : '/dev/i2c-1'
	});
	async.waterfall([
	function(cb) {
		wire.writeBytes(0x2D, [1 << 3], function(err) {
			cb(err);
		});
	},
	function(cb) {
		wire.writeBytes(0x31, [0x09], function(err) {
			cb(err);
		});
	},
	function(cb) {
		wire.writeBytes(0x2C, [8 + 2 + 1], function(err) {
			cb(err);
		});
	}], function(err) {
		if (!err) {
			setTimeout(function() {
				callback(null);
			}, 10);
		} else {
			callback(err);
		}
	});
};

classADXL345.measureAccel = function(callback) {

	wire.readBytes(0x32, 6, function(err, res) {
		if (!err) {
			for (var axis = global.XAXIS; axis <= global.ZAXIS; axis++) {
				globVar.meterPerSecSec[axis] = res.readInt16LE(axis*2) * globVar.accelScaleFactor[axis] + globVar.runTimeAccelBias[axis];
			}
			callback(null);
		} else {
			callback(err);
		}
	});

}

classADXL345.measureAccelSum = function(callback) {
	//get values from sensor here
	wire.readBytes(0x32, 6, function(err, res) {
		if (!err) {
			for (var axis = global.XAXIS; axis <= global.ZAXIS; axis++) {
				globVar.accelSample[axis] += res.readInt16LE(axis*2)
			}
			globVar.accelSampleCount++;
			callback(null);
		} else {
			callback(err);
		}
	});

}

classADXL345.evaluateMetersPerSec = function(callback) {
	for (var axis = global.XAXIS; axis <= global.ZAXIS; axis++) {
		globVar.meterPerSecSec[axis] = (globVar.accelSample[axis] / globVar.accelSampleCount) * globVar.accelScaleFactor[axis] + globVar.runTimeAccelBias[axis];
		globVar.accelSample[axis] = 0;
	}
	globVar.accelSampleCount = 0;
}

classADXL345.computeAccelBias = function(callback) {
	function getSamples() {
		if (globVar.accelSampleCount < globVar.SAMPLECOUNT) {
			classADXL345.measureAccelSum(function() {
				setTimeout(getSamples, 2.5);
			});
		} else {
			for (var axis = 0; axis < 3; axis++) {
				globVar.meterPerSecSec[axis] = (globVar.accelSample[axis] / globVar.SAMPLECOUNT) * globVar.accelScaleFactor[axis];
				globVar.accelSample[axis] = 0;
			}
			globVar.accelSampleCount = 0;

			globVar.runTimeAccelBias[XAXIS] = -globVar.meterPerSecSec[XAXIS];
			globVar.runTimeAccelBias[YAXIS] = -globVar.meterPerSecSec[YAXIS];
			globVar.runTimeAccelBias[ZAXIS] = -9.8065 - globVar.meterPerSecSec[ZAXIS];

			globVar.accelOneG = Math.abs(globVar.meterPerSecSec[ZAXIS] + globVar.runTimeAccelBias[ZAXIS]);
			callback();
		}
	}

	getSamples();
}

module.exports = classADXL345;
