!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

.controller('login', ['$injector', '$scope', function($injector, $scope){
    var
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $http     = $injector.get('$http'),
    $location = $injector.get('$location'),
	$storage	= $injector.get('storage');
	//$location.path('/tasks')
  $scope.goTolist = function(){
      $location.path('/tasks');
  }
}])

.controller('tasks', ['$injector', '$scope', /*'list'*/ function($injector, $scope /*list*/){
    var
    $config    = $injector.get('config'),
    $location = $injector.get('$location');
    /*$storage	= $injector.get('storage');*/

   /* $scope.tasks = list;*/
        function getRandomArbitrary(min, max) {
            return Math.floor(Math.random() * (max - min) + min);
        }
    $scope.goToUploadView = function(){
        $location.path('/upload/'+ getRandomArbitrary(1, 50));
    }
}])

.controller('upload', ['$injector', '$scope','$rootScope', function($injector, $scope, $rootScope){
    var
    $config    = $injector.get('config'),
    $location = $injector.get('$location');
    //$rootScope = $injector.get('$rootScope');
//    $route    = $injector.get('$route');
//    /*$storage	= $injector.get('storage');*/
//
//    $scope.taskId = $route.params.id; 
 
    $scope.submit = function(){
        $rootScope.alert("Screenshot have been attached!");
        /* if ng model file; file*/
         
    }

    $scope.backToTasks = function(){
        $location.path('/tasks/');
    }
}]);

//------------------------------------------------------ end
}(angular);