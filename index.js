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

	//return err
	callback(null);
	//if no error, send null
};

classADXL345.measureAccel = function(callback) {
	var accelValueRaw; //get values from sensor here
	
	for (var axis = global.XAXIS; axis <= global.ZAXIS; axis++) {
		globVar.meterPerSecSec[axis] = accelValueRaw[axis] * globVar.accelScaleFactor[axis] + globVar.runTimeAccelBias[axis];
	}
	callback();
}

classADXL345.measureAccelSum = function(callback) {
	var accelValueRaw; //get values from sensor here
	
	for (var axis = global.XAXIS; axis <= global.ZAXIS; axis++) {
		globVar.accelSample[axis] += accelValueRaw[axis];
	}
	globVar.accelSampleCount++;
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
		if (accelSampleCount < SAMPLECOUNT) {
			measureAccelSum(function() {
				setTimeout(getSamples, 2.5);
			});
		} else {
			for (var axis = 0; axis < 3; axis++) {
				globVar.meterPerSecSec[axis] = (float(globVar.accelSample[axis]) / globVar.SAMPLECOUNT) * globVar.accelScaleFactor[axis];
				globVar.accelSample[axis] = 0;
			}
			globVar.accelSampleCount = 0;

			globVar.runTimeAccelBias[XAXIS] = -globVar.meterPerSecSec[XAXIS];
			globVar.runTimeAccelBias[YAXIS] = -globVar.meterPerSecSec[YAXIS];
			globVar.runTimeAccelBias[ZAXIS] = -9.8065 - globVar.meterPerSecSec[ZAXIS];

			globVar.accelOneG = Math.abs(meterPerSecSec[ZAXIS] + runTimeAccelBias[ZAXIS]);
			callback();
		}
	}

	getSamples();
}

module.exports = classADXL345;
