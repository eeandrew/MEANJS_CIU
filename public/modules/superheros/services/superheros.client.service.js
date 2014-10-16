'use strict';

//Superheros service used to communicate Superheros REST endpoints
angular.module('superheros').factory('Superheros', ['$resource',
	function($resource) {
		return $resource('superheros/:superheroId', { superheroId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]).factory('Releaser',['$resource',function($resource){
	return $resource('superheros/:superheroId/release/:releaseType',null,{
		update:{
			method: 'POST'
		}
	});
}]).factory('Downloader',['$resource',function($resource){
	return $resource('superheros/:superheroId/download',{superheroId: '@_id'});
}]);