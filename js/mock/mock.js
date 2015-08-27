!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

.config(['$injector', '$provide', function($injector, $provide){
    $provide.decorator('$httpBackend', function($delegate){
        var wrapper = function(method, url, data, callback, headers){
            var interceptor = function(){
                var self = this, params = Array.prototype.slice.call(arguments);
                window.setTimeout(function(){
                    callback.apply(self, params);
                }, 500);
            };
            return $delegate.call(this, method, url, data, interceptor, headers);
        };
        for(var key in $delegate) {
            wrapper[key] = $delegate[key];
        };
        return wrapper;
    });
}])

.run(['$injector', function($injector){
    var
    $config         = $injector.get('config'),
    $tools          = $injector.get('tools'),
    $httpBackend    = $injector.get('$httpBackend');
    
    var item = function(){
        return {id: $tools.getRandom(1, 10000), src: 'http://placekitten.com//200/200?image=' + $tools.getRandom(1, 10)};
    };
    var items = function(count){
        var list = []; count = count * 1;
        for(var i = 0; i < count; i++){list.push(item());};
        return list;
    };
    
    $httpBackend.whenPOST('/feed/list').respond(function(method, url, data, headers){
        var requestData = angular.isObject(data) ? data : (angular.isString(data) ? (data[0] == '{' || data[0] == '[' ? angular.fromJson(data) : $tools.getUrlParams(data)) : {});
        var respondData = {
            success: true,
            error: {code:0, message:''},
            data: {total:100, list:items(requestData.limit)}
        };
        return [200, respondData, {}];
    });
    
    //Don't mock for everything else 
    $httpBackend.whenJSONP(/.*/).passThrough();
    $httpBackend.whenGET(/.*/).passThrough();
    $httpBackend.whenPOST(/.*/).passThrough();
    $httpBackend.whenPUT(/.*/).passThrough();
    $httpBackend.whenDELETE(/.*/).passThrough();
}]);

//------------------------------------------------------ end
}(angular);