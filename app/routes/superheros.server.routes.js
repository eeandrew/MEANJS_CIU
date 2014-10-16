'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users');
	var superheros = require('../../app/controllers/superheros');

	// Superheros Routes
	app.route('/superheros')
		.get(superheros.list)
		.post(users.requiresLogin, superheros.create);

	app.route('/superheros/:superheroId')
		.get(superheros.read)
		.put(users.requiresLogin, superheros.hasAuthorization, superheros.update)
		.delete(users.requiresLogin, superheros.hasAuthorization, superheros.delete);

	// // Updater Release Routes
	// app.route('/superheros/:superheroId/release/test')
	// 	.post(users.requiresLogin, superheros.hasAuthorization, superheros.releaseCompanyUpdaterForTest);

	// app.route('/superheros/:superheroId/release/formal')
	// 	.get(users.requiresLogin, superheros.hasAuthorization, superheros.releaseCompanyUpdater);

	//Updater Download Routes
	app.route('/superheros/:superheroId/download')
		.get(users.requiresLogin, superheros.hasAuthorization, superheros.downloadCompanyUpdater);

	// Finish by binding the Superhero middleware
	app.param('superheroId', superheros.superheroByID);
};