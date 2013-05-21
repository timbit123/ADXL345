global.XAXIS = 0;
global.YAXIS = 1;
global.ZAXIS = 2;

var adxl345 = require('./index.js');

var globalvar = {
	SAMPLECOUNT : 400,
	accelScaleFactor : [0.0, 0.0, 0.0],
	runTimeAccelBias : [0, 0, 0],
	accelOneG : 0.0,
	meterPerSecSec : [0.0, 0.0, 0.0],
	accelSample : [0, 0, 0],
	accelSampleCount : 0
}

globalvar.accelScaleFactor[global.XAXIS] = 0.0371299982;
globalvar.accelScaleFactor[global.YAXIS] = -0.0374319982;
globalvar.accelScaleFactor[global.ZAXIS] = -0.0385979986;

adxl345.init(globalvar, function(err) {
	if (!err) {
		adxl345.computeAccelBias(function() {
			if (!err) {
				setInterval(function() {
					adxl345.measureAccel(function(err) {
						if (!err) {
							console.log("Roll: " + globalvar.meterPerSecSec[global.XAXIS] + " Pitch : " + globalvar.meterPerSecSec[global.YAXIS] + " Yaw : " + globalvar.meterPerSecSec[global.ZAXIS]);
						} else {
							console.log(err);
						}
					});
				}, 10);
			} else {
				console.log(err);
			}
		});
	} else {
		console.log(err);
	}
})
