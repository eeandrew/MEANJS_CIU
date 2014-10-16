'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Product Schema
 */
var ProductSchema = new Schema({
	productVersion: {
		type: String,
		default: '',
		required: 'Please fill Product Version',
		trim: true
	},
	productCode: {
		type: String,
		default: '',
		required: 'Please fill Product Code',
		trim: true
	},
	productDirectory: {
		type: String,
		default: '',
		require: 'Please fill Product Directory',
		trim: true
	},
	etjarSvnUrl: {
		type: String,
		default: '',
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	status: {
		type: Number,
		default: 0
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Product', ProductSchema);