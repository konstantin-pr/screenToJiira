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
        $location = $injector.get('$location')
    /*$storage	= $injector.get('storage');*/

   /* $scope.tasks = list;*/

    $scope.goToUploadView = function(){
        $location.path('/upload/23');
    }


}])

.controller('upload', ['$injector', '$scope', function($injector, $scope){
    var
    $config    = $injector.get('config');
//    $route    = $injector.get('$route');
//    /*$storage	= $injector.get('storage');*/
//
//    $scope.taskId = $route.params.id;
    
//    "!http://...imageUrl|width=800!"
    $scope.submit = function(){
        console.log('submit was successful');
    }
}]);

//------------------------------------------------------ end
}(angular);