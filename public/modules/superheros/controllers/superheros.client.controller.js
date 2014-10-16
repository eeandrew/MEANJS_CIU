'use strict';

// Superheros controller
angular.module('superheros').controller('SuperherosController', ['$scope', '$stateParams', '$location', 'Authentication', 'Superheros','$modal','Releaser','Downloader','$timeout',
	function($scope, $stateParams, $location, Authentication, Superheros,$modal,Releaser,Downloader,$timeout) {
		$scope.authentication = Authentication;

		var socket;
		// Create new Superhero
		$scope.create = function() {
			// Create new Superhero object
			var superhero = new Superheros ({
				version: this.version,
				notifiee: this.notifiee,
				description: this.description
			});

			// Redirect after save
			superhero.$save(function(response) {
				$location.path('superheros');

				// Clear form fields
				$scope.version = '';
				$scope.notifiee = '';
				$scope.description = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Superhero
		$scope.remove = function( superhero ) {
			if ( superhero ) { superhero.$remove();

				for (var i in $scope.superheros ) {
					if ($scope.superheros [i] === superhero ) {
						$scope.superheros.splice(i, 1);
					}
				}
			} else {
				$scope.superhero.$remove(function() {
					$location.path('superheros');
				});
			}
		};

		// Update existing Superhero
		$scope.update = function() {
			var superhero = $scope.superhero ;

			superhero.$update(function() {
				$location.path('superheros/' + superhero._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Superheros
		$scope.find = function() {
			$scope.superheros = Superheros.query();
		};

		// Find existing Superhero
		$scope.findOne = function() {
			debugger;
			$scope.superheroId = $stateParams.superheroId;
			$scope.superhero = Superheros.get({ 
				superheroId: $stateParams.superheroId
			});
			if($scope.superhero.revokeTimes == 0) {
				$scope.status = 'glyphicon-flash fail';
			}
		};

		//Release Updater
		$scope.confirmRelease = function(firstScope) {
			console.log('release');
			var releaser = new Releaser({
				superheroId: $stateParams.superheroId,
				releaseType: $scope.releaseType
			});
			releaser.$update({
				superheroId: $stateParams.superheroId,
				releaseType: $scope.releaseType
			});
			//  Releaser.get({ 
			// 	superheroId: $stateParams.superheroId,
			// 	releaseType: $scope.releaseType
			// }).$promise.then(function(superhero){
			// 	firstScope.superhero = superhero;
			// });

			//$scope.releaser.$update({superheroId: $stateParams.superheroId,releaseType: $scope.releaseType});
			//$scope.releaser.$get({superheroId: $stateParams.superheroId,releaseType: $scope.releaseType});
		};

		$scope.convertedList = [];
		$scope.infLineCount = 0;
		$scope.convertedLine = 0;
		$scope.initSocket = function() {
			$scope.hideReleaseBar = true;
			 socket = io.connect('http://172.26.142.234:3000',{'forceNew':true});
			//Connection to background server with SocketIO
			 socket.on('connected',function(data){
				console.log('Connect to server successfully');
				//joinRoom
				socket.emit('join',{
					roomName: $stateParams.superheroId
				});
			});

			 socket.on('updater-inf-line-count',function(data){
			 	console.log(data);
			 	$scope.convertedList.push(data.convertedLine);
				$scope.$apply(function(){
					$scope.hideReleaseBar = false;
					$scope.infLineCount = parseInt(data.infLine);
			 		$scope.convertedLine = parseInt(data.convertedLine);
			 		$scope.superhero = data.superhero;

			 		if($scope.convertedLine === $scope.infLineCount){
			 			$timeout(function(){
			 				$scope.convertedList = [];
			 				$scope.hideReleaseBar = true;
			 				$scope.infLineCount = 0;
			 				$scope.convertedLine = 0;
			 			},1000);
			 	}
				});	 	
			 });
		};

		$scope.testSocket = function(releaseType){
			socket.emit('start-to-release-updater',{
				updaterVersion: $scope.superhero.version,
				superhero:$scope.superhero,
				releaseType: releaseType,
				roomName: $stateParams.superheroId
			});
			$scope.hideReleaseBar = false;
		}

		//Download Updater
		$scope.downloadCompanyUpdater = function(){
			console.log('download updater...');
			$scope.downloader = Downloader.get({ 
				superheroId: $stateParams.superheroId,
			});
			//$scope.downloader.$update({superheroId: $stateParams.superheroId});
		};

		

		$scope.open = function(dlgHtmlTmplate) {
			var modalInstance = $modal.open({
				templateUrl: 'dialogTemplate/' +dlgHtmlTmplate + '-superhero.client.view.html',
				size: 'lg',
				controller: modalInstanceCtrl,
				resolve: {
					superhero: function(){
						return $scope.superhero;
					},
					remove: function(){
						return $scope.remove;
					},
					confirmRelease: function() {
						return $scope.testSocket;
					}
				}
			});
			modalInstance.result.then(function(releaseType){
				$scope.releaseType = releaseType;
				$scope.testSocket(releaseType);
			},function(){

			})
		};

		

	}
]);

var modalInstanceCtrl = function($scope,$modalInstance,superhero,remove,confirmRelease) {
	$scope.superhero = superhero;
	$scope.remove = remove;
	$scope.confirmRelease = confirmRelease;
	$scope.releaseType = {releaseType:'test'};
	$scope.test = 'development';
	$scope.close = function(){
		$modalInstance.dismiss('cancel');
	};
	
	$scope.confirmDelete = function(){
		$scope.remove();
		$modalInstance.close();
	};

	$scope.confirmRelease_ = function(){
		//$scope.confirmRelease($scope.firstScope);
		console.log($scope.releaseType.releaseType);
		$modalInstance.close($scope.releaseType.releaseType);
	};
};