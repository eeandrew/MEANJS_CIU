'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication','usSpinnerService',
	function($scope, $http, $location, Authentication ,usSpinnerService) {
		$scope.authentication = Authentication;

		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');


		$scope.signup = function() {
            $scope.isDisable = true;
            usSpinnerService.spin('spinner-1');
			$http.post('/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				//$scope.authentication.user = response;
				// And redirect to the index page
                usSpinnerService.stop('spinner-1');
                $scope.isDisable = false;
				$location.path('/insignup');
			}).error(function(response) {
                $scope.isDisable = false;
                usSpinnerService.stop('spinner-1');
				$scope.error = response.message;
			});
		};

		$scope.signin = function() {
            usSpinnerService.spin('spinner-2');
			$http.post('/auth/signin', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;
                console.log('signin success');
				// And redirect to the index page
				$location.path('/');
                usSpinnerService.stop('spinner-2');
			}).error(function(response) {
                debugger;
				$scope.error = response.message;
                console.log('signin fail');
                console.log(response.message);
                usSpinnerService.stop('spinner-2');
            });
		};
	}
]);