var i2c = require('i2c');
var async = require('async');
var address = 0x53;

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
	this.wire = new i2c(address, {
		device : '/dev/i2c-1'
	});
	
	var self = this;
	
	async.waterfall([
	function(cb) {
		self.wire.writeBytes(0x2D, [1 << 3], function(err) {
			cb(err);
		});
	},
	function(cb) {
		self.wire.writeBytes(0x31, [0x09], function(err) {
			cb(err);
		});
	},
	function(cb) {
		self.wire.writeBytes(0x2C, [8 + 2 + 1], function(err) {
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

	var self = this;

	this.wire.readBytes(0x32, 6, function(err, res) {
		if (!err) {
			for (var axis = XAXIS; axis <= ZAXIS; axis++) {
				self.meterPerSecSec[axis] = res.readInt16LE(axis*2) * self.accelScaleFactor[axis] + self.runTimeAccelBias[axis];
			}
			callback(null);
		} else {
			callback(err);
		}
	});

}

ADXL345.prototype.measureAccelSum = function(callback) {
	//get values from sensor here
	var self = this;
	this.wire.readBytes(0x32, 6, function(err, res) {
		if (!err) {
			for (var axis = XAXIS; axis <= ZAXIS; axis++) {
				self.accelSample[axis] += res.readInt16LE(axis*2)
			}
			self.accelSampleCount++;
			callback(null);
		} else {
			callback(err);
		}
	});

}

ADXL345.prototype.evaluateMetersPerSec = function() {
	for (var axis = XAXIS; axis <= ZAXIS; axis++) {
		this.meterPerSecSec[axis] = (this.accelSample[axis] / this.accelSampleCount) * this.accelScaleFactor[axis] + this.runTimeAccelBias[axis];
		this.accelSample[axis] = 0;
	}
	this.accelSampleCount = 0;
}

ADXL345.prototype.computeAccelBias = function(callback) {
	var self = this;
	function getSamples() {
		if (self.accelSampleCount < self.SAMPLECOUNT) {
			self.measureAccelSum(function() {
				setTimeout(getSamples, 2.5);
			});
		} else {
			for (var axis = 0; axis < 3; axis++) {
				self.meterPerSecSec[axis] = (self.accelSample[axis] / self.SAMPLECOUNT) * self.accelScaleFactor[axis];
				self.accelSample[axis] = 0;
			}
			self.accelSampleCount = 0;

			self.runTimeAccelBias[XAXIS] = -self.meterPerSecSec[XAXIS];
			self.runTimeAccelBias[YAXIS] = -self.meterPerSecSec[YAXIS];
			self.runTimeAccelBias[ZAXIS] = -9.8065 - self.meterPerSecSec[ZAXIS];

			self.accelOneG = Math.abs(self.meterPerSecSec[ZAXIS] + self.runTimeAccelBias[ZAXIS]);
			callback();
		}
	}

	getSamples();
}

module.exports = ADXL345;
