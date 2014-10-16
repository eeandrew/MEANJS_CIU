'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Superhero Schema
 */
var SuperheroSchema = new Schema({
	version: {
		type: String,
		default: '',
		required: 'Please fill version name',
		trim: true
	},
	notifiee: {
		type: String,
		default: '',
		required: 'Please fill email address',
		trim: true
	},
	description: {
		type: String,
		default: '',
		required: 'Please fill description',
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	//<!--Expected Time for shippment-->
	scheduleDate: {
		type: Date,
		default: Date.now
	},
	//date when this updater is released
	releaseDate: {
		type: Date,
		default: Date.now
	},
	releaseTimes: {
		type: Number,
		default: '0'
	},
	testReleaseTimes: {
		type: Number,
		default: '0'
	},
	revokeTimes: {
		type: Number,
		default: '0'	
	},
	//date when this updater is revoked
	revokeDate: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Superhero', SuperheroSchema);