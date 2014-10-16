'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users');
	var products = require('../../app/controllers/products');

	// Products Routes
	app.route('/products')
		.get(products.list)
		.post(users.requiresLogin, products.create);

	app.route('/products/cws')
		.get(products.getCWSProducts);

	app.route('/products/cjk')
		.get(products.getCJKProducts);

	app.route('/products/cws/:productVersion')
		.delete(users.requiresLogin, products.delete);

	app.route('/products/create/cws')
		.post(products.getCWSVersion);

	app.route('/products/create/cjk')
		.post(products.getCWSVersion);

	// app.route('/products/:productCD/:productId')
	// 	.get(products.read)
	// 	.put(users.requiresLogin, products.hasAuthorization, products.update)
	// 	.delete(users.requiresLogin, products.hasAuthorization, products.delete);

	app.route('/products/:productId/download')
		.get(products.downloadProducts);

	// Finish by binding the Product middleware
	app.param('productId', products.productByID);
};