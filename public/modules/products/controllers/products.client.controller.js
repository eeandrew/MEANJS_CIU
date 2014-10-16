'use strict';

// Products controller
angular.module('products').controller('ProductsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Products','$timeout','$http','$modal',
	function($scope, $stateParams, $location, Authentication, Products, $timeout,$http,$modal) {
		$scope.authentication = Authentication;
		var sockets = {};
		// Create new Product
		$scope.create = function() {
			// Create new Product object
			var product = new Products ({
				productCode: this.productCode,
				productVersion: this.productVersion,
				productDirectory: this.productDirectory,
				etjarSvnUrl: this.etjarSvnUrl
			});

			// Redirect after save
			product.$save(function(response) {
				$location.path('products/' + response.productCode);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.createProduct = function(productCode){
			$scope.productCode = $stateParams.productCode;
			alert($scope.productCode);
		}

		// Remove existing Product
		$scope.remove = function( product ) {
			$http({method:'DELETE',url:'products/cws/'+ product._id})
			.success(function(data, status, headers, config){
				for (var i in $scope.products ) {
					if ($scope.products [i] === product ) {
						$scope.products.splice(i, 1);
					}
				}
			})
			.error(function(data, status, headers, confi){
				console.log('fail');
			});
		};

		$scope.alerts = [];

    	$scope.closeAlert = function(index) {
    		$scope.alerts.splice(index, 1);
    	};

    	$scope.addAlert = function(myAlert) {
    		$scope.alerts.push(myAlert);
    	};

		// Update existing Product
		$scope.update = function() {
			var product = $scope.product ;

			product.$update(function() {
				$location.path('products/' + product._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Products
		$scope.find = function() {
			$scope.products = Products.query({ 
				productCode: $stateParams.productCode
			});
		};


		$scope.initSocket = function(product) {
			 sockets[product.productVersion] = io.connect('http://172.26.142.234:3000',{'forceNew':true});
			sockets[product.productVersion].on('connected',function(data){
				console.log('Connect to server successfully' + product.productVersion);
			});
			sockets[product.productVersion].on('connected',function(data){
				console.log('Connect to server successfully');
				//joinRoom
				sockets[product.productVersion].emit('join',{
					roomName: product.productVersion.toLowerCase().trim()
				});
			});
			console.log(product.productVersion.toLowerCase().trim());
			sockets[product.productVersion].on(product.productVersion.toLowerCase(),function(data){
				console.log('totalTasks'+product.productVersion);
				console.log(data);
				$scope.$apply(function(){
					//Change Status
					for(var i=0;i<$scope.products.length;i++){
						if($scope.products[i].productVersion === data.productVersion){
							$scope.products[i].status = data.status;
							$scope.products[i].totalTasks = data.totalTasks;
							$scope.products[i].finishedTasks = data.finishedTasks;
							$scope.disabled = true;

							if(data.totalTasks === data.finishedTasks) {
								$timeout(function(){
									for(var i=0;i<$scope.products.length;i++){
										if($scope.products[i].productVersion === data.productVersion){
											$scope.products[i].status = 0;
											$scope.disabled =false;
											break;
										} 
									}
								$scope.products[i].totalTasks = 0;
								$scope.products[i].finishedTasks = 0;
								$scope.addAlert({type:'success',msg:data.productVersion + ' is successfully converted :-)'});
								},1000);
							}
							break;
						}
					}
					//
				});
			});
		}

		// Find existing Product
		$scope.findOne = function() {
			$scope.product = Products.get({ 
				productId: $stateParams.productId
			});
		};

		$scope.startConvert = function(product) {
			var index = 0;
			for(var i=0;i<$scope.products.length;i++){
				if($scope.products[i].productVersion === product.productVersion){
					$scope.products[i].status = 1;
					index = i;
					sockets[product.productVersion].emit('start-to-convert-product',{
						productVersion: product.productVersion,
						productDirectory: product.productDirectory,
						etjarSvnUrl: product.etjarSvnUrl
					});
					break;
				}
			}
		}

		//Try to get the product full version
		$scope.onCWSDirectoryInput = function() {
			//alert($scope.productDirectory);
			if(!$scope.productDirectory) return;
			$scope.disableAddCWS = 'disable';
			$scope.showProgress = true;
			$scope.etjarSvnUrl = '';
			$scope.productVersion = '';
			console.log($scope.productDirectory);
			$http({method:'POST',url:'products/create/' + $stateParams.productCode ,
				data:{productCode:$stateParams.productCode,productDirectory:utf8.encode($scope.productDirectory)}})
			.success(function(data, status, headers, config){
				$scope.showProgress = false;
				console.log(data.productVersion);
				$scope.productVersion = data.productVersion;
				$scope.etjarSvnUrl = data.etjarSvnUrl;
				if(data.productVersion.indexOf('Error') >=0 ) {
					$scope.disableAddCWS = 'disable';
				}else
				{
					$scope.disableAddCWS = '';
				}
			})
			.error(function(data, status, headers, confi){
				$scope.showProgress = false;
				$scope.productVersion = 'Error: Can not get product version';
				$scope.disableAddCWS = 'disable';
			});
		}

		$scope.productCode = $stateParams.productCode;
		$scope.disabled = false;
		
		$scope.open = function(dlgHtmlTmplate,product) {
			var modalInstance = $modal.open({
				templateUrl: 'dialogTemplate/' +dlgHtmlTmplate + '-product.client.view.html',
				size: 'lg',
				controller: modalInstanceController,
				 resolve: {
				// 	superhero: function(){
				// 		return $scope.superhero;
				// 	},
				 	remove: function(){
				 		return $scope.remove;
				 	},
				 	product: function(){
				 		return product;
				 	},
				 	startConvert: function(){
				 		return $scope.startConvert;
				 	}
				// 	confirmRelease: function() {
				// 		return $scope.testSocket;
				// 	}
				 }
			});
			 modalInstance.result.then(function(releaseType){
			 	
			 },function(){

			 })
		};
	}
]);

var modalInstanceController = function($scope,$modalInstance,remove,product,startConvert) {
	$scope.remove = remove;
	$scope.startConvert = startConvert;
	$scope.close = function(){
		$modalInstance.dismiss('cancel');
	};
	
	$scope.confirmDelete = function(){
		$modalInstance.close();
		$scope.remove(product);
	};

	$scope.confirmConvert = function() {
		$modalInstance.close();
		$scope.startConvert(product);
	}

	$scope.confirmRelease_ = function(){
		//$scope.confirmRelease($scope.firstScope);
		$modalInstance.close($scope.releaseType.releaseType);
	};
};