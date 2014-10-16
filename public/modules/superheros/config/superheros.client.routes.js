'use strict';

//Setting up route
angular.module('superheros').config(['$stateProvider',
	function($stateProvider) {
		// Superheros state routing
		$stateProvider.
		state('listSuperheros', {
			url: '/superheros',
			templateUrl: 'modules/superheros/views/list-superheros.client.view.html'
		}).
		state('createSuperhero', {
			url: '/superheros/create',
			templateUrl: 'modules/superheros/views/create-superhero.client.view.html'
		}).
		state('viewSuperhero', {
			url: '/superheros/:superheroId',
			templateUrl: 'modules/superheros/views/view-superhero.client.view.html'
		}).
		state('editSuperhero', {
			url: '/superheros/:superheroId/edit',
			templateUrl: 'modules/superheros/views/edit-superhero.client.view.html'
		});
	}
]);