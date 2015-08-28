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

  $scope.goTolist = function(loginForm){
      console.log(loginForm);
      console.log(loginForm.$valid);
      
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
//    $route    = $injector.get('$route');

//
//    $scope.taskId = $route.params.id; 
    $scope.submit = function(upload_form){
        console.log('image now', typeof(upload_form.image));
        if (typeof(upload_form.image)=='string'){
            $rootScope.modal.show('success.html', {message:'Screenshot have been attached!', caption:'Success'});
        } else {
            $rootScope.modal.show('warning.html', {message:'Please upload file', caption:'Warning'});
        }
    }

    $scope.backToTasks = function(){
        $location.path('/tasks/');
    }
}]);

//------------------------------------------------------ end
}(angular);