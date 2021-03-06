'use strict';

//Products service used to communicate Products REST endpoints
angular.module('products').factory('Products', ['$resource',
	function($resource) {
		return $resource('products/:productCode', null
		, {
			update: {
				method: 'PUT'
			}
		});
	}
]);