!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

// Events --------------------------
// youtube:auth                    token
// youtube:login
// youtube:logout
// youtube:allowLogin
// youtube:cancelLogin

// Methods -------------------------
// .login

.config(['$injector', function($injector){
    var
    $tools           = $injector.get('tools'),
    $config          = $injector.get('config');
    
    if($config.yt){
        $config.yt.appDataObject = $tools.getAppdataParams($config.yt.appData || '');
    };
    if($config.gl){
        $config.gl.appDataObject = $tools.getAppdataParams($config.gl.appData || '');
    };    
}])

.service('youtube', ['$injector', function($injector){
    var
    self       = this,
    $config    = $injector.get('config'),
    $options   = $config.yt || {},
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $http      = $injector.get('$http'),
    $agent     = $injector.get('agent'),
    $q         = $injector.get('$q'),
    $timeout   = $injector.get('$timeout'),
    $cookie    = $injector.get('cookie'),

    broadcast = function(type, data){
        return $timeout(function(){
            $rootScope.$broadcast('youtube', {type: type, data: data});
            $rootScope.$broadcast('youtube:' + type, data);
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
    };
    
    self.cache = (function(){
        var s = this;
        s.store = {};
        s.use = true;
        s.clr = function(){s.store = {};};
        s.get = function(k){return typeof(s.store[k]) != 'undefined' ? s.store[k] : null;};
        s.set = function(k, v){s.use && (s.store[k] = v); return s;};
        s.del = function(k){if(typeof(s.store[k]) != 'undefined'){delete s.store[k];}; return s;};
        s.disable = function(){s.use = false; return !s.use;};
        s.enable = function(){s.use = true;return !s.use;};
        return s;
    }).call({});
    
    self.token = $cookie.get('youtubeToken') || '';

    self.api = function(method, data, callback){
        var deferred = $q.defer();
        if(self.token){
            data = data || {};
            data.access_token = self.token;
            data.v = 2;
            data.alt = 'json';
            data.callback = 'JSON_CALLBACK';
            var key = 'https://gdata.youtube.com/' + method + '?' + $tools.getUrlString(data), response;
            if(self.cache.use && !!(response = self.cache.get(key))){
                resolve(deferred, response, callback);
            }else{
                $http.jsonp(key).then(function(response){
                    self.cache.set(key, response);
                    resolve(deferred, response, callback);
                }, function(){reject(deferred, null, callback);});
            };
        }else{
            return reject(deferred, null, callback);
        };
        return deferred.promise;
    };

    self.login = function(permissions, callback){
        return produce(function(deferred){
            if(!self.token){
                broadcast('login');
                permissions = permissions || $options.permissions || decodeURIComponent(decodeURI('https://gdata.youtube.com'));
                var p = ($agent.isHttps ? 'https' : 'http') + '_call_' + String((new Date).getTime()) + Math.round(Math.random() * 1000000);
                var w = $tools.getWindow('https://accounts.google.com/o/oauth2/auth?client_id=' + $options.appId + '&response_type=token' + (permissions ? '&scope=' + permissions : '') + '&state=' + p + '&redirect_uri=' + $options.channelUrl, 600, 400);
                var c = function(t){
                    if(t){
                        self.token = t;
                        $cookie.set('youtubeToken', self.token, 3600 * 1000);
                        broadcast('auth', t);
                        broadcast('allowLogin');
                        $tools.tags
                        .set('yt-connect', true)
                        .set('yt-disconnect', false);
                        resolve(deferred, t, callback);
                    }else{
                        self.token = '';
                        $cookie.del('youtubeToken');
                        broadcast('cancelLogin');
                        $tools.tags
                        .set('yt-connect', false)
                        .set('yt-disconnect', true);
                        reject(deferred, '', callback);
                    };
                    w.close();
                    window[p] = null;
                    delete window[p];
                };
                self.cache.clr();
                setTimeout(function(){if(window[p]){c();}}, 30000);
                window[p] = c;
            }else{
                resolve(deferred, self.token, callback);
            };
        });
    };
    
    self.logout = function(callback){
    };

    self.deauthorize = function(callback){
    };
    
    self.user = function(callback){
        //...
    };
    
    self.videos = function(options, callback){
        return self.api('feeds/api/users/default/uploads', options, callback).then(function(response){
            return (response.data.feed && response.data.feed.entry) || [];
        });
    };
    
    self.init = function(){
        if(!$options.appId){return false;};
        $tools.tags
        .set('yt-disconnect', true);
    };
    
    return self;
}])

.run(['$injector', function($injector){
    var
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $youtube   = $injector.get('youtube'),
    $timeout   = $injector.get('$timeout'),
    $http      = $injector.get('$http');

    $rootScope.youtube = $youtube;
    $youtube.init();
}]);

//------------------------------------------------------ end
}(angular);