!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

// Events --------------------------

.service('pinterest', ['$injector', function($injector){
    var
    self       = this,
    $config    = $injector.get('config'),
    $options   = $config.ig || {},
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $agent     = $injector.get('agent'),
    $q         = $injector.get('$q'),
    $timeout   = $injector.get('$timeout'),
    $cookie    = $injector.get('cookie'),

    broadcast = function(type, data){
        return $timeout(function(){
            $rootScope.$broadcast('pinterest', {type: type, data: data});
            $rootScope.$broadcast('pinterest:' + type, data);
        }, 10);
    },
    resolve = function(deferred, data, call){
        $timeout(function(){
            angular.isFunction(call) && call(data);
            deferred.resolve(data);
        });
        return deferred.promise;
    },
    reject = function(deferred, data, call){
        $timeout(function(){
            angular.isFunction(call) && call(data);
            deferred.reject(data);
        });
        return deferred.promise;
    },
    produce = function(fun){
        var deferred = $q.defer();
        if(angular.isFunction(fun)){
            fun(deferred);
        }else{
            resolve(deferred);
        };
        return deferred.promise;
    },
    get = function(){
        for(var n in window){
            if(n.indexOf('PIN_') == 0){
                return window[n];
            };
        };
        return null;
    };
    
    self.init = function(){
        if(!self.instance){
            var script = document.createElement('script');
            script.async = 'true';
            script.type = 'text/javascript';
            script.src = '//assets.pinterest.com/js/pinit_main.js';
            script.onload = function(){
                self.instance = get();
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        };
    };
    
    self.instance = get();
    
    return self;
}])

.directive('appPnPlugin', ['$injector', function($injector){
    var
    $pinterest  = $injector.get('pinterest'),
    $timeout    = $injector.get('$timeout');
    return{
        restrict: 'A',
        link: function($scope, $element, attributes){
            var render = function(description, url, media){
                $element[0].innerHTML = '<a href="//www.pinterest.com/pin/create/button/?media=' + encodeURIComponent(media) + '&url=' + encodeURIComponent(encodeURI(url)) + '&description=' + escape(description || '') + '" data-pin-do="buttonPin" data-pin-config="above"><img src="//assets.pinterest.com/images/pidgets/pinit_fg_en_rect_gray_20.png" /></a>';
                $timeout(function(){
                    $pinterest.instance.f.render.buttonPin($element[0].firstChild);
                }, 10);
            };
            var changeHash = '';
            var change = function(){
                var hash = [attributes.description, attributes.url, attributes.media].join(''); if(changeHash == hash){return;};
                render(attributes.description, attributes.url, attributes.media);
                changeHash = hash;
            };
            attributes.$observe('url', change);
            attributes.$observe('description', change);
            attributes.$observe('media', change);
            change();
        }
    };
}])

.directive('appPnShare', ['$injector', function($injector){
    return {
        restrict: 'A',
        terminal: true,
        link: function($scope, $element, attributes){
            var render = function(description, url, media){
                $element[0].setAttribute('href', 'http://www.pinterest.com/pin/create/button/?media=' + encodeURIComponent(media) + '&url=' + encodeURIComponent(encodeURI(url)) + '&description=' + escape(description || ''));
            };
            var changeHash = '';
            var change = function(){
                var hash = [attributes.description, attributes.url, attributes.media].join(''); if(changeHash == hash){return;};
                render(attributes.description, attributes.url, attributes.media);
                changeHash = hash;
            };
            attributes.$observe('url', change);
            attributes.$observe('description', change);
            attributes.$observe('media', change);
            change();
        }
    };
}])

.run(['$injector', function($injector){
    var
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $pinterest = $injector.get('pinterest'),
    $timeout   = $injector.get('$timeout'),
    $http      = $injector.get('$http');

    $rootScope.pinterest = $pinterest;
    $pinterest.init();
}]);

//------------------------------------------------------ end
}(angular);