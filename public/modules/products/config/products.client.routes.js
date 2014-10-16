'use strict';

//Setting up route
angular.module('products').config(['$stateProvider',
	function($stateProvider) {
		// Products state routing
		$stateProvider.
		state('listProducts', {
			url: '/products',
			templateUrl: 'modules/products/views/list-products.client.view.html'
		}).
		state('createProduct', {
			url: '/products/create/{productCode}',
			templateUrl: 'modules/products/views/create-product.client.view.html'
		}).
		state('viewProduct', {
			url: '/products/{productCode}',
			templateUrl: 'modules/products/views/cws-product.client.view.html'
		});
	}
]);