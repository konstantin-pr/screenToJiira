!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

.config(['$injector', function($injector){
    var
    $config          = $injector.get('config'),
    $agent           = $injector.get('agent'),
    $cookie          = $injector.get('cookie'),
    $routeProvider   = $injector.get('$routeProvider');
	
	var auth = ['$injector', function($injector){
		var 
        $storage = $injector.get('storage'),
        $location = $injector.get('$location'),
        token = $storage.get('token');
        if(!token){
            $location.path('/login');
        };
	}];

    var list = ['$injector', function($injector){
        var
        $http = $injector.get('$http'),
        $rootScope = $injector.get('$rootScope'),
        $location = $injector.get('$location'),
        token = $injector.get('storage').get('token');
        return true;
        /* $http.get(... token).then(
            function(response){
                //return response.data.list;
            },
            function(e){
                $rootScope.alert('Error', 'Error', function(){$location.path('/login');});
            }
        });*/
    }];
	
    $routeProvider
    .when('/login', {templateUrl: 'html/login.html', controller:'login'})
    .when('/tasks', {templateUrl: 'html/tasks.html', controller:'tasks'}) /* , controller:'tasks'  resolve:{auth:auth, list:list}}*/
	.when('/upload/:id', {templateUrl: 'html/upload.html', controller:'upload'}) /*  resolve:{auth: auth} */
    // .when('/thankyou', {templateUrl: 'html/thankyou.html', controller:'thankyou'})
    .otherwise({redirectTo: '/login'});
}])

.run(['$injector', function($injector){
    var
	$q         = $injector.get('$q'),
    $config    = $injector.get('config'),
    $http      = $injector.get('$http'),
    $agent     = $injector.get('agent'),
    $tools     = $injector.get('tools'),
    $popup     = $injector.get('popup'),
    $timeout   = $injector.get('$timeout'),
    $rootScope = $injector.get('$rootScope'); 
    $rootScope.config = $config;
    
    // Auto scroll to top
    $rootScope.$on('$routeChangeSuccess', function(){$tools.scrollTo(0, 0);});
    
    // Process
    // Show / Hide fullscreen preloader
    $rootScope.process = function(value){$timeout(function(){$rootScope.tags.set('process', Boolean(value));});};
 
    // Popups example. How to create two and more kind of popups
	// $popup.create(popup folder path, [scope (default $rootScope), skin (default path/skin.html), default options]);
	// Developer, please use CSS to stylize popups. For example if you want to make the unique style for alert.html only.
	// Use rules like: .popup.alert-html, .popup.html-desktop-popups.alert-html, .popup.html-mobile-popups.alert-html;
	
    $rootScope.popup = $popup.create('html/popups/');
    $rootScope.modal = $popup.create('html/popups/', null, null, {autoClose:false, autoCloseOutside:false, cssClass:'fixed', isFocusable:false});
	
	// Alert popup example (use as: alert(message, [caption, callback]))
	$rootScope.alert = function(message, caption, callback){
		var d = $q.defer(), p = $rootScope.modal.show('alert.html', {message:message, caption:caption}, {onClose:function(){
			angular.isFunction(callback) && callback.call(p);
			d.resolve();
		}});
		return d.promise;
	};
	
	// Prompt popup example (use as: prompt(message, [caption, value, validator, callback]))
	$rootScope.prompt = function(message, caption, value, validator, callback){
		var d = $q.defer(), p = $rootScope.modal.show('prompt.html', {message:message, caption:caption, value:value || ''}, {isClosable:false, onClose:function(){
			var v = p.popupData.value || '';
			if(angular.isFunction(validator) && validator.call(p, v)){return true;};
			angular.isFunction(callback) && callback.call(p, v);
			d.resolve(v);
		}});
		return d.promise;
	};
}]);

//------------------------------------------------------ end
}(angular);