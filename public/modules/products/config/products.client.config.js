'use strict';

// Configuring the Articles module
angular.module('products').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Products', 'products', 'dropdown', '/products(/create)?');
		Menus.addSubMenuItem('topbar', 'products', 'CWS', 'products/cws');
		Menus.addSubMenuItem('topbar', 'products', 'CJK', 'products/cjk');
		Menus.addSubMenuItem('topbar', 'products', 'CSR', 'products/csr');
		Menus.addSubMenuItem('topbar', 'products', 'New Product', 'products/create');
	}
]);