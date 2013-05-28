var i2c = require('i2c');
var async = require('async');
var address = 0x53;
var wire;

/**
 *
 * @param {Object} vars
 * @param {Object} callback
 */

function ADXL345(callback)
{
	this.SAMPLECOUNT = 400;
 	this.accelScaleFactor = [0.0,0.0,0.0];
	this.runTimeAccelBias = [0, 0, 0];
	this.accelOneG = 0.0;
	this.meterPerSecSec = [0.0,0.0,0.0];
	this.accelSample = [0,0,0];
	this.accelSampleCount = 0;
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
}
ADXL345.prototype.measureAccel = function(callback) {

	wire.readBytes(0x32, 6, function(err, res) {
		if (!err) {
			for (var axis = global.XAXIS; axis <= global.ZAXIS; axis++) {
				this.meterPerSecSec[axis] = res.readInt16LE(axis*2) * this.accelScaleFactor[axis] + this.runTimeAccelBias[axis];
			}
			callback(null);
		} else {
			callback(err);
		}
	});

}

ADXL345.prototype.measureAccelSum = function(callback) {
	//get values from sensor here
	wire.readBytes(0x32, 6, function(err, res) {
		if (!err) {
			for (var axis = global.XAXIS; axis <= global.ZAXIS; axis++) {
				this.accelSample[axis] += res.readInt16LE(axis*2)
			}
			this.accelSampleCount++;
			callback(null);
		} else {
			callback(err);
		}
	});

}

ADXL345.prototype.evaluateMetersPerSec = function(callback) {
	for (var axis = global.XAXIS; axis <= global.ZAXIS; axis++) {
		this.meterPerSecSec[axis] = (this.accelSample[axis] / this.accelSampleCount) * this.accelScaleFactor[axis] + this.runTimeAccelBias[axis];
		this.accelSample[axis] = 0;
	}
	this.accelSampleCount = 0;
}

ADXL345.prototype.computeAccelBias = function(callback) {
	function getSamples() {
		if (this.accelSampleCount < this.SAMPLECOUNT) {
			this.measureAccelSum(function() {
				setTimeout(getSamples, 2.5);
			});
		} else {
			for (var axis = 0; axis < 3; axis++) {
				this.meterPerSecSec[axis] = (this.accelSample[axis] / this.SAMPLECOUNT) * this.accelScaleFactor[axis];
				this.accelSample[axis] = 0;
			}
			this.accelSampleCount = 0;

			this.runTimeAccelBias[XAXIS] = -this.meterPerSecSec[XAXIS];
			this.runTimeAccelBias[YAXIS] = -this.meterPerSecSec[YAXIS];
			this.runTimeAccelBias[ZAXIS] = -9.8065 - this.meterPerSecSec[ZAXIS];

			this.accelOneG = Math.abs(this.meterPerSecSec[ZAXIS] + this.runTimeAccelBias[ZAXIS]);
			callback();
		}
	}

	getSamples();
}

module.exports = ADXL345;
