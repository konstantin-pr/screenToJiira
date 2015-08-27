!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

// Events --------------------------
// instagram:auth                    token
// instagram:login
// instagram:logout
// instagram:allowLogin
// instagram:cancelLogin

// Methods -------------------------
// .login

.service('instagram', ['$injector', function($injector){
    var
    self       = this,
    $config    = $injector.get('config'),
    $options   = $config.ig || {},
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $http      = $injector.get('$http'),
    $agent     = $injector.get('agent'),
    $q         = $injector.get('$q'),
    $timeout   = $injector.get('$timeout'),
    $cookie    = $injector.get('cookie'),

    broadcast = function(type, data){
        return $timeout(function(){
            $rootScope.$broadcast('instagram', {type: type, data: data});
            $rootScope.$broadcast('instagram:' + type, data);
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
    
    self.token = $cookie.get('instagramToken') || '';

    self.api = function(method, data, callback){
        var deferred = $q.defer();
        if(self.token){
            data = data || {};
            data.access_token = self.token;
            data.callback = 'JSON_CALLBACK';
            var key = 'https://api.instagram.com/v1/' + method + '?' + $tools.getUrlString(data), response;
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
                permissions = permissions || $options.permissions || '';
                var p = ($agent.isHttps ? 'https' : 'http') + '_call_' + String((new Date).getTime()) + Math.round(Math.random() * 1000000);
                var w = $tools.getWindow('https://instagram.com/oauth/authorize/?client_id=' + $options.appId + '&response_type=token' + (permissions ? '&scope=' + permissions : '') + '&state=' + p + '&redirect_uri=' + $options.channelUrl, 500, 350);
                var c = function(t){
                    if(t){
                        self.token = t;
                        $cookie.set('instagramToken', self.token);
                        broadcast('auth', t);
                        broadcast('allowLogin');
                        $tools.tags
                        .set('ig-connect', true)
                        .set('ig-disconnect', false);
                        resolve(deferred, t, callback);
                    }else{
                        self.token = '';
                        $cookie.del('instagramToken');
                        broadcast('cancelLogin');
                        $tools.tags
                        .set('ig-connect', false)
                        .set('ig-disconnect', true);
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
        return produce(function(deferred){
            var w = document.createElement('IFRAME'); w.setAttribute('style', 'position:absolute;left:1px;top:1px;width:1px;height:1px;');
            var c = function(){
                document.body.removeChild(w);
                broadcast('logout');
                self.token = '';
                $cookie.del('instagramToken');
                broadcast('logout');
                $tools.tags
                .set('ig-connect', false)
                .set('ig-disconnect', true);
                self.cache.clr();
                resolve(deferred, '', callback);
            };
            w.onload = function(){c();};
            w.src = '//instagram.com/accounts/logout';
            document.body.appendChild(w);
        });
    };

    self.deauthorize = function(callback){
        self.cache.clr();
        //$http.post('https://instagram.com/oauth/revoke_access', {token:self.token});
    };
    
    self.user = function(callback){
        return self.api('users/self', {}, callback).then(function(response){
            return response.data.data || null;
        });
    };
    
    self.photos = function(options, callback){
        return self.api('users/self/media/recent', angular.extend({count: 250}, options || {}), callback).then(function(response){
            return response.data;
        });
    };
    
    self.pictures = function(callback){
        var data = [];
        var loop = function(r, d){
            data = data.concat(r.data || []);
            if(r.pagination && r.pagination.next_max_id){
                self.photos({max_id: r.pagination.next_max_id}).then(function(r){
                    loop(r, d);
                }, function(){
                    resolve(d, data, callback);
                });
            }else{
                resolve(d, data, callback);
            };
        };
        return produce(function(deferred){
            self.photos().then(function(response){
                loop(response, deferred);
            }, function(){
                resolve(deferred, data, callback);
            });
        });
    };    
    
    self.init = function(){
        if(!$options.appId){return false;};
        $tools.tags
        .set('ig-app-' + $options.appId, true)
        .set('ig-disconnect', true);
    };
    
    return self;
}])

.run(['$injector', function($injector){
    var
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $instagram = $injector.get('instagram'),
    $timeout   = $injector.get('$timeout'),
    $http      = $injector.get('$http');

    $rootScope.instagram = $instagram;
    $instagram.init();
}]);

//------------------------------------------------------ end
}(angular);