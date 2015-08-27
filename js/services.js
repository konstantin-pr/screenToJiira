!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

.service('feed', ['$injector', function($injector){
    var
    $q         = $injector.get('$q'),
    $http      = $injector.get('$http');
    
    return (function(path, defError){
        var self = this;
		
        self.item = function(id){
            var deferred  = $q.defer();
            $http.post(path + '/entry', {id:id}).then(function(response){
                if(!response || !response.data.success){
                    deferred.reject((response && response.data.error && response.data.error.message) || defError);
                    return;
                };
                deferred.resolve(response.data.data || null);
            });
            return deferred.promise;
        };
        self.items = function(options){
            var deferred  = $q.defer(), options = angular.extend({offset: 0, limit: 9, filter: '', sort: ''}, options || {});
            $http.post(path + '/list', options).then(function(response){
                if(!response || !response.data.success){
                    deferred.reject((response && response.data.error && response.data.error.message) || defError);
                    return;
                };
                var list = response.data.data.list || [];
                angular.forEach(list, function(v, k){v.offset = options.offset + k;});
                deferred.resolve({
                    options: angular.extend(options, {total:response.data.data.total || 0}),
                    list: list
                });
            });
			return deferred.promise;
        };
		
        return self;
    }).call({}, '/feed', 'Something went wrong!');
}])

//------------------------------------------------------ end
}(angular);