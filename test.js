global.XAXIS = 0;
global.YAXIS = 1;
global.ZAXIS = 2;

var ADXL345 = require('./index.js');

var globalvar = {
	SAMPLECOUNT : 400,
	accelScaleFactor : [0.0, 0.0, 0.0],
	runTimeAccelBias : [0, 0, 0],
	accelOneG : 0.0,
	meterPerSecSec : [0.0, 0.0, 0.0],
	accelSample : [0, 0, 0],
	accelSampleCount : 0
}

var accel = new ADXL345(function(err) {
	accel.accelScaleFactor[XAXIS] = 0.0371299982;
	accel.accelScaleFactor[YAXIS] = -0.0374319982;
	accel.accelScaleFactor[ZAXIS] = -0.0385979986;
	if (!err) {
		computeAccelBias();
	} else {
		console.log(err);
	}
})
function computeAccelBias() {
	accel.computeAccelBias(function() {
		measureAccel();
	});
}

function measureAccel() {
	setInterval(function() {
		accel.measureAccel(function(err) {
			if (!err) {
				console.log("Roll: " + accel.meterPerSecSec[global.XAXIS] + " Pitch : " + accel.meterPerSecSec[global.YAXIS] + " Yaw : " + accel.meterPerSecSec[global.ZAXIS]);
			} else {
				console.log(err);
			}
		});
	}, 10);
}
