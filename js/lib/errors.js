!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

.config(['$injector', function($injector){
    var $config = $injector.get('config');
	
    var log = function(f, m){
		app.$Root.track && app.$Root.track('error', {file:f, message:m});	
	};
	var errorMessage = function(obj, defaultMessage){
        var message = defaultMessage || 'Something went wrong.', keys = ['errors', 'error', 'data', 'response', 'message', 'errorMessage'];
		if(angular.isString(obj)){
            return obj;
        }else if(angular.isArray(obj) && obj.length){
            return errorMessage(obj[0]);
		}else if(angular.isObject(obj)){
			//if(obj.status && (obj.status == 500 || obj.status == 502)){return '';};
			for(var k in keys){
				if(obj[k]){return errorMessage(obj[k]);};
			};
		};
        return message;
    };
    var errorCode = function(obj, defaultCode){
        var code = defaultCode || 0, keys = ['errors', 'error', 'data', 'response', 'errorCode'];
        if(angular.isString(obj) || angular.isNumber(obj)){
            return parseInt(obj, 10);
        }else if(angular.isObject(obj)){
			if(obj.status && (obj.status == 500 || obj.status == 502)){return 502;};
			if(obj.code){return obj.code;};
			for(var k in keys){
				if(obj[k]){return errorCode(obj[k]);};
			};
		};
		return code;
    };
    if($config.environment != 'pruduction'){
		$injector.get('$httpProvider').interceptors.push(['$q', function($q){
			return {
				responseError: function(data){
					log(document.location, data.config.url + ':' + data.config.method + '\n' + errorCode(data) + ';' + errorMessage(data));
					return $q.reject(data);
				},
				requestError: function(data){
					//...
				}
			};
		}]);
		$injector.get('$provide').decorator('$exceptionHandler', ['$delegate', function($delegate){
			return function(exception, cause){
				log(document.location, exception.stack || exception.toString());
				$delegate(exception, cause);
			};
		}]);
		angular.element(window).bind('error', function(e){
			log(document.location, e.filename + ':' + e.lineno + ':' + e.colno + '\n' + e.message);
			return false;
		});
        window.onFBError = function(status, responseText){
			log(document.location, 'FB Error:' + errorCode(status) + ':' + errorMessage(responseText));
		};
        if(window.jQuery){
			window.onjQueryError = function(message){log(document.location, 'jQuery Error:' + errorMessage(message));};
			window.onjQueryAjaxError = function(status, responseText){log(document.location, 'jQuery Ajax Error:' + errorCode(status) + ':' + errorMessage(responseText));};
            jQuery.error = window.onjQueryError;
            jQuery.ajaxSetup({error: window.onjQueryAjaxError});
        };
	};
}])

.run(['$injector', function($injector){
	
}]);

//------------------------------------------------------ end
}(angular);