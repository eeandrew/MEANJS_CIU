'use strict';

// Configuring the Articles module
angular.module('superheros').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Superheros', 'superheros', 'dropdown', '/superheros(/create)?');
		Menus.addSubMenuItem('topbar', 'superheros', 'List Superheros', 'superheros');
		Menus.addSubMenuItem('topbar', 'superheros', 'New Superhero', 'superheros/create');
	}
]);