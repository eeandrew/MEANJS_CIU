'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors'),
	Superhero = mongoose.model('Superhero'),
	_ = require('lodash'),
	//updaterService = require('../service/superheros'),
	archiver = require('archiver');

/**
 * Create a Superhero
 */
exports.create = function(req, res) {
	var superhero = new Superhero(req.body);
	superhero.user = req.user;

	superhero.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(superhero);
		}
	});
};

/**
 * Show the current Superhero
 */
exports.read = function(req, res) {
	debugger;
	res.jsonp(req.superhero);
};

/**
 * Update a Superhero
 */
exports.update = function(req, res) {
	var superhero = req.superhero ;
	superhero = _.extend(superhero , req.body);

	superhero.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			console.log(superhero);
			res.jsonp(superhero);
		}
	});
};


/**
 * Delete an Superhero
 */
exports.delete = function(req, res) {
	var superhero = req.superhero ;

	superhero.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(superhero);
		}
	});
};

/**
 * List of Superheros
 */
exports.list = function(req, res) { Superhero.find().sort('-created').populate('user', 'displayName').exec(function(err, superheros) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(superheros);
		}
	});
};

/**
 * Superhero middleware
 */
exports.superheroByID = function(req, res, next, id) { Superhero.findById(id).populate('user', 'displayName').exec(function(err, superhero) {
		if (err) return next(err);
		if (! superhero) return next(new Error('Failed to load Superhero ' + id));
		req.superhero = superhero ;
		next();
	});
};

/**
 * Superhero authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.superhero.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};



/**
 * Gather release file for Updater
 */

// exports.releaseCompanyUpdater = function(req,res) {
// 	var superhero = req.superhero ;
// 	updaterService.releaseCompanyUpdater(superhero.version);
// };

/**
  *Release Company Updater For Test Purpose
  */
// exports.releaseCompanyUpdaterForTest = function(req,res) {
// 	var superhero = req.superhero;
// 	console.log(1);
// 	// updaterService.releaseCompanyUpdater(superhero.version).then(function(){
// 	// 	console.log(3);
// 	// 	req.superhero.testReleaseTimes++;
// 	// 	console.log(4);
// 	// 	//The last step
// 	// 	exports.update(req,res);
// 	// 	console.log(5);
// 	// });

// 	updaterService.releaseCompanyUpdater(superhero.version);
// 	req.superhero.testReleaseTimes++;
// 	console.log(4);
// 	//The last step
// 	exports.update(req,res);
	
// };


/**
 * Download zipped Updater package
 */
exports.downloadCompanyUpdater = function(req,res,next) {
	console.log('download');
	var superhero = req.superhero ;
	var version = superhero.version;
	var updaterName = version + '.zip';
	var updaterZip = archiver('zip');
	var resourceFolder = './download/updater/' + version + '/**/*';
	res.setHeader('Content-disposition', 'attachment; filename=' + updaterName);
	updaterZip.pipe(res);
	updaterZip.bulk([{src:[resourceFolder]}]);
	updaterZip.finalize();
};
