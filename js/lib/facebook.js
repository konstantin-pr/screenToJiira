!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

// Events --------------------------
// facebook                         type, data
// facebook:fan                     true / false
// facebook:fanLike                 true / false
// facebook:connect                 true / false
// facebook:auth                    data
// facebook:like                    url
// facebook:unlike                  url
// facebook:comment                 url
// facebook:login
// facebook:allowLogin
// facebook:cancelLogin
// facebook:loginRedirect
// facebook:allowLoginRedirect
// facebook:cancelLoginRedirect
// facebook:permissions             permissions   
// facebook:logout
// facebook:share                   data
// facebook:action                  data
// facebook:feed                    data
// facebook:invite                  data
// facebook:send                    data
// facebook:dialogOpen              method
// facebook:dialogClose             method

// Methods -------------------------
// .sign
// .token
// .api
// .ui
// .grow
// .userId
// .redirect
// .login
// .logout
// .user
// .scores
// .pages
// .friends
// .albums                          data           // get all albums
// .phototag                        data           // get photos with user tag
// .photos                          data           // get photos by album id
// .pictures                        data           // get all photos
// .share
// .send
// .invite                          data           // invites friends
// .feed                            data           // posts news feed
// .action                          data           // posts OG action
// .permissions                     data           // get permissions list
// .deauthorize                     true / false   // deauthorize app
// .access                          true / false   // check permissions
// .pagetab                                        // add app as the page tab
// .fan                             true / false

// Directives ----------------------
// appFbPlugin
// appFbInvite
// appFbShare

.config(['$injector', function($injector){
    var
    $tools           = $injector.get('tools'),
    $config          = $injector.get('config');
    
    $config.fb.appDataObject = $tools.getAppdataParams($config.fb.appData || '');
}])

.service('facebook', ['$injector', function($injector){
    var
    self       = this,
    isFB       = typeof(window['FB']) != 'undefined',
    $config    = $injector.get('config'),
    $options   = $config.fb || {},
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $q         = $injector.get('$q'),
    $timeout   = $injector.get('$timeout'),

    broadcast = function(type, data){
        return $timeout(function(){
            $rootScope.$broadcast('facebook', {type: type, data: data});
            $rootScope.$broadcast('facebook:' + type, data);
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
        if(isFB && angular.isFunction(fun)){
            fun(deferred);
        }else{
            resolve(deferred);
        };
        return deferred.promise;
    };

    self.isTab = !!(/^app_runner/).test(window.name);
    self.isCanvas = !!(/^iframe_canvas/).test(window.name);
    self.isMobile = !!(/^fbforiphone/).test(window.navigator.userAgent);
    
    self.cache = (function(){
        var s = this;
        s.store = {};
        s.use = true;
        s.clr = function(){s.store = {};};
        s.get = function(k){return typeof(s.store[k]) != 'undefined' ? JSON.parse(s.store[k]) : null;};
        s.set = function(k, v){s.use && (s.store[k] = JSON.stringify(v)); return s;};
        s.del = function(k){if(typeof(s.store[k]) != 'undefined'){delete s.store[k];}; return s;};
        s.disable = function(){s.use = false; return !s.use;};
        s.enable = function(){s.use = true;return !s.use;};
        return s;
    }).call({});

    self.call = function(method){
        var deferred = $q.defer();
        if(isFB){
            var key = angular.toJson(Array.prototype.slice.call(arguments, 0)), response, params = [], method = arguments[0] || '', callback = null;
            angular.forEach(arguments, function(value, key){
                if(key > 0){
                    if(angular.isFunction(value)){
                        callback = value;
                    }else{
                        params.push(value);
                    };
                };
            });
            if(method == 'api' && self.cache.use && !!(response = self.cache.get(key))){
                $timeout(function(){
                    response && response.error && angular.isFunction(window.onFBError) && window.onFBError(response.error.type, angular.toJson(response));
                    angular.isFunction(callback) && callback.call(FB, response);
                    deferred[!response || response.error ? 'reject' : 'resolve'](response);
                }, 100); // cache delay
                return deferred.promise;
            };
            method == 'ui' && broadcast('dialogOpen', method);
            method && FB[method].apply(FB, params.concat(function(response){
                response && !response.error && method == 'api' && self.cache.set(key, response);
                response && response.error && angular.isFunction(window.onFBError) && window.onFBError(response.error.type, angular.toJson(response));
                $timeout(function(){
                    angular.isFunction(callback) && callback.call(FB, response);
                    deferred[!response || response.error ? 'reject' : 'resolve'](response);
                    method == 'ui' && broadcast('dialogClose', method);
                });
            }));
        }else{
            return reject(deferred, null, callback);
        };
        return deferred.promise;
    };

    self.sign = function(){
        return isFB && FB.getAuthResponse() && typeof(FB.getAuthResponse()['signedRequest']) != 'undefined' ? FB.getAuthResponse().signedRequest : '';
    };

    self.token = function(){
        return (isFB && FB.getAccessToken()) || '';
    };

    self.api = function(){
        return self.call.apply(self, ['api'].concat([].slice.call(arguments)));
    };

    self.ui = function(){
        return self.call.apply(self, ['ui'].concat([].slice.call(arguments)));
    };

    self.grow = function(value, dontScroll){
        if(isFB && (self.isTab || self.isCanvas)){
            FB.Canvas.setAutoGrow(false);
            $timeout(function(){
                var height = value || Math.max(document.body.scrollHeight, document.body.offsetHeight);
                if(typeof(height) == 'string'){
                    var obj = document.getElementById(height);
                    height = Math.max(obj.scrollHeight, obj.offsetHeight);
                };
                FB.Canvas.setSize({height: height});
                $timeout(function(){FB.Canvas.setAutoGrow(true);}, 100);
            }, 1000);
            !dontScroll && FB.Canvas.scrollTo(0, 0);
        };
        !dontScroll && window.scroll(0, 0);
    };
    
    self.userId = function(){
        return isFB && self.sign() && FB.getUserID();
    };

    self.redirect = function(redirect){
        broadcast('loginRedirect');
        window.location = 'https://' + (app.$Agent.device == 'mobile' ? 'm.' : '') + 'facebook.com/dialog/oauth?client_id=' + $options.appId + '&state=login-redirect&redirect_uri=' + encodeURIComponent((redirect || $config.app.url) + '#login-redirect') + '&scope=' + ($options.permissions || '');
    };

    self.login = function(permissions, callback){
        return produce(function(deferred){
            if(angular.isFunction(permissions)){callback = permissions; permissions = '';};
            permissions = permissions || $options.permissions || '';
            broadcast('login');
            isFB && FB.login(function(response){
                response.authResponse && self.permissions();
                broadcast(response.authResponse ? 'allowLogin' : 'cancelLogin');
                resolve(deferred, response, callback);
            }, {scope:permissions, auth_type:'rerequest'});
        });
    };

    self.logout = function(callback){
        return produce(function(deferred){
            broadcast('logout');
            isFB && FB.logout(function(response){
                resolve(deferred, response, callback);
            });
        });
    };

    self.user = function(id, callback){
        return produce(function(deferred){
            if(angular.isFunction(id)){callback = id; id = '';};
            self.api('/' + (id ? id : 'me'), function(response){
                resolve(deferred, response, callback);
            });
        });
    };

    self.scores = function(scores, userId, callback){
        return produce(function(deferred){
            if(angular.isFunction(userId)){callback = userId; userId = '';};
            self.api('/' + (id ? id : 'me') + '/scores', 'post', {score:scores, access_token:self.token()}, function(response){
                resolve(deferred, response, callback);
            });
        });
    };
    
    self.pages = function(callback){
        return produce(function(deferred){
            self.api('me/accounts', function(response){
                resolve(deferred, response.data, callback);
            });
        });
    };    

    self.friends = function(callback){
        return produce(function(deferred){
            self.api('me/friends', function(response){
                resolve(deferred, response.data, callback);
            });
        });
    };
    
    self.albums = function(limit, cursor, callback){
        return produce(function(deferred){
            var params = {limit:limit || 500, fields:'name,count,link,privacy,can_upload,cover_photo,picture'};
            if(cursor){
                cursor = cursor.split(/;/g);
                if(cursor.length >= 2){
                    params[cursor[0]] = cursor[1] || '';
                };
            };
            self.api('me/albums', params).then(
                function(response){
                    var data = response.data || [];
                    for(var i = 0, l = data.length; i < l; i++){
                        // return album like a photo
                        data[i].is_album = true;
                        data[i].picture = data[i].picture.data.url;
                        data[i].source = data[i].picture
                        data[i].images = [{source:data[i].picture}];
                    };
                    resolve(deferred, {
                        next:response.paging && response.paging.next && (response.paging.cursors && response.paging.cursors.after) ? 'after;' + response.paging.cursors.after : '',
                        prev:response.paging && response.paging.previous && (response.paging.cursors && response.paging.cursors.before) ? 'before;' + response.paging.cursors.before : '',
                        data:data
                    }, callback);
                },
                function(err){
                    reject(deferred, err, callback);
                }
            );
        });        
    };
    
    self.photos = function(albumId, cursor, limit, callback){
        return produce(function(deferred){
            var params = {limit:limit || 500};
            if(cursor){
                cursor = cursor.split(/;/g);
                if(cursor.length >= 2){
                    params[cursor[0]] = cursor[1] || '';
                };
            };
            self.api(albumId + '/photos', params).then(
                function(response){
                    var data = {
                        next:response.paging && response.paging.next && (response.paging.cursors && response.paging.cursors.after) ? 'after;' + response.paging.cursors.after : '',
                        prev:response.paging && response.paging.previous && (response.paging.cursors && response.paging.cursors.before) ? 'before;' + response.paging.cursors.before : '',
                        data:response.data || []
                    };
                    resolve(deferred, data, callback);
                },
                function(err){
                    reject(deferred, err, callback);
                }
            );
        });        
    };    
    
    self.pictures = function(albumId, callback){
        // this method returns all photos via recursive request
        if(angular.isFunction(albumId) && arguments.length < 2){
            callback = albumId;
            albumId = undefined;
        };
        if(albumId){
            return produce(function(deferred){
                var result = [], isAlbum = angular.isObject(albumId);
                $q.when(isAlbum ? albumId : self.api('/' + albumId, albumId == 'me' ? {fields:'name,link,picture'} : {fields:'name,count,link,privacy,can_upload,cover_photo,picture'})).then(
                    function(album){
                        var next = function(cursor){
                            self.photos(album.id, cursor).then(
                                function(data){
                                    result = result.concat(data.data);
                                    if(data.next){
                                        next(data.next);
                                    }else{
                                        if(!isAlbum){
                                            album.is_album = true;
                                            album.picture = album.picture.data.url;
                                            album.source = album.picture;
                                            album.images = [{source:album.picture}];
                                        };
                                        album.photos = result;
                                        !album.count && (album.count = album.photos.length);
                                        resolve(deferred, album, callback);
                                    };
                                },
                                function(err){
                                    reject(deferred, err, callback);
                                }
                            );
                        };
                        next();
                    },
                    function(err){
                        reject(deferred, err, callback);
                    }
                );
            });        
        }else{
            var calls = [], albums = [];
            return produce(function(deferred){
                self.albums().then(
                    function(response){
                        albums = response.data;
                        angular.forEach(albums, function(album){
                            calls.push(self.pictures(album).then(function(data){
                                album = data;
                            }));
                        });
                        $q.all(calls).then(function(response){
                            resolve(deferred, albums, callback);
                        });
                    },
                    function(err){
                        reject(deferred, err, callback);
                    }
                );
            });
        };
    };
    
    self.phototag = function(callback){
        return self.pictures('me', callback);
    };    

    self.share = function(data, callback, redirect){
        // data is object {name, caption, description, link, picture, actions, to}
        var params = angular.extend({method:'feed', app_id:$options.appId}, data || {});
        
        if(params.display == 'popup' || params.redirect_uri || redirect){
            !params.redirect_uri && (params.redirect_uri = angular.isString(redirect) ? redirect : $config.app.url);
            var url = document.location.protocol + '//' + 'facebook.com/dialog/feed?' + $tools.getUrlString(params, true);
        };
        if(params.display == 'popup'){
            var win = $tools.getWindow(url);
            return;
        };
        if(params.redirect_uri || redirect){
            window.location = url;
            return;
        };
        return produce(function(deferred){
            self.ui(params, function(response){
                broadcast('share', {data:data, response:response});
                resolve(deferred, response, callback);
            });
        });
    };

    self.invite = function(data, callback, redirect){
        // data is object {title, message, data}
        var params = angular.extend({method:'apprequests', app_id:$options.appId}, data || {});
        
        if(params.display == 'popup' || params.redirect_uri || redirect){
            !params.redirect_uri && (params.redirect_uri = angular.isString(redirect) ? redirect : $config.app.url);
            var url = document.location.protocol + '//' + 'facebook.com/dialog/apprequests?' + $tools.getUrlString(params, true);
        };
        if(params.display == 'popup'){
            var win = $tools.getWindow(url);
            return;
        };
        if(params.redirect_uri || redirect){
            window.location = url;
            return;
        };
        return produce(function(deferred){
            self.ui(params, function(response){
                broadcast('invite', {data:data, response:response});
                resolve(deferred, response, callback);
            });
        });
    };

    self.feed = function(data, callback){
        // data is object {name, message, caption, description, link, picture}
        return produce(function(deferred){
            self.api('/me/feed', 'post', data, function(response){
                broadcast('feed', {data:data, response:response});
                resolve(deferred, response, callback);
            });
        });
    };

    self.action = function(data, action, objectName, link, callback){
        // data is object {message, ref, tags}
        return produce(function(deferred){
            data = angular.extend({}, data);
            data[objectName] = link;
            self.api('/me/' + $options.appNamespace + ':' + action, 'post', data, function(response){
                broadcast('action', {data:data, action:action, object:objectName, response:response});
                resolve(deferred, response, callback);
            });
        });
    };

    self.send = function(data){
        // data is object {name, description, link, picture, to, callback}
        return produce(function(deferred){
            var params = angular.extend({method:'send'}, data || {});
            self.ui(params, function(response){
                broadcast('send', {data:data, response:response});
                resolve(deferred, response, callback);
            });
        });
    };
    
    self.pagetab = function(callback, redirect){
        return produce(function(deferred){
            self.ui({method:'pagetab', redirect_uri:redirect || $options.tabUrl}, function(response){
                broadcast('pagetab', response);
                resolve(deferred, response, callback);
            });
        });
    };    
    
    self.permissionsCache = '';
    self.permissions = function(callback){
        var result = [];
        var deferred = $q.defer();
        if(isFB && self.sign()){
            var tmp = self.cache.disable();
            self.api('/me/permissions', function(response){
                if(response.data && response.data.length){
                    for(var i = 0; i < response.data.length; i++){
                        response.data[i].status == 'granted' && result.push(response.data[i].permission);
                    };
                };
                self.permissionsCache = result.join(' ');
                broadcast('permissions', self.permissionsCache);
                resolve(deferred, self.permissionsCache, callback);
            });
            self.cache.use = tmp;
        }else{
            self.permissionsCache = ''; 
            resolve(deferred, '', callback);
        };
        return deferred.promise;
    };

    self.access = function(permissions, callback){
        var deferred = $q.defer();
        if(angular.isFunction(permissions)){callback = permissions; permissions = '';};
        permissions = permissions || $options.permissions || '';
        self.permissions().then(function(data){
            var result = true;
            var list = permissions ? String(permissions).split(/\s*,\s*/g) : []; list.push('public_profile');
            for(var i = 0; i < list.length; i++){
                if(data.indexOf(list[i]) < 0){
                    result = false;
                    break;
                };
            };
            result ? resolve(deferred, result, callback) : reject(deferred, result, callback);
        });
        return deferred.promise;
    };
    
    self.deauthorize = function(callback){
        var deferred = $q.defer();
        if(isFB && self.sign()){
            var tmp = self.cache.disable();
            self.api('/me/permissions', 'delete', function(response){
                resolve(deferred, response, callback);
			});
            self.cache.use = tmp;
        }else{
            resolve(deferred, '', callback);
        };
        return deferred.promise;
    };
    
    self.fan = function(callback){
        var deferred = $q.defer(), result = {status: false, api: 'error'};
        if(isFB && self.sign()){
            try{
                self.api('me/likes/' + $options.pageId, function(response){
                    result.status = Boolean(response.data && response.data.length);
                    result.api = 'likes';
                    resolve(deferred, result, callback);
                });
            }catch(e){
                resolve(deferred, result, callback);
            };
        }else{
            resolve(deferred, result, callback);
        };
        return deferred.promise;
    };

    self.init = function(){
        if(!$options.appId){return false;};
        $tools.tags
        .set('fb-app-' + $options.appId, true)
        .set('fb-page-' + $options.pageId, $options.pageId)
        .set('fb-disconnect', true)
        .set('fb-fan', $options.isFan)
        .set('fb-nofan', !$options.isFan)
        .set('fb-tab', self.isTab)
        .set('fb-canvas', self.isCanvas)
        .set('fb-mobile', self.isMobile)
        .set('fb-locale-' + $options.locale, true)
		.set((/^(ar_)|(he_IL)/i).test($options.locale) ? 'fb-locale-rtl' : 'fb-locale-ltr', true)
        .get('fb-tab') && (function(){
            FB.Canvas.setAutoGrow(500);
            document.body.scroll = 'no';
            document.body.style.overflowY = 'hidden';
        })();
		
        var handleInit = function(){
            // Returns
            $timeout(function(){
                var params = $tools.getUrlParams(document.location.href);
                if(params.state == 'login-redirect' && document.location.hash.indexOf('login-redirect') >= 0){
                    broadcast(params.code ? 'allowLoginRedirect' : 'cancelLoginRedirect');
                    document.location.hash = '#_';
                };
                if(params.request && params.to && document.location.hash.indexOf('_=_') >= 0){
                    broadcast('invite', {data: {}, response: {to: params.to}});
                    document.location.hash = '#_';
                };
                if(params.post_id && document.location.hash.indexOf('_=_') >= 0){
                    broadcast('share', {data: {}, response: {post_id: params.post_id}});
                    document.location.hash = '#_';
                };
            });
        };
        var handleConnect = function(connect){
            self.access().then(function(){
                broadcast('connect', connect);
                $tools.tags.set('fb-disconnect', !connect).set('fb-connect', connect);
            });
        };
        var handleFan = function(like){
            broadcast('fan', like);
            $tools.tags.set('fb-nofan', !like).set('fb-fan', like);
        };
        isFB && FB.Event.subscribe('auth.authResponseChange', function(response){
            self.cache.clr();
            handleConnect(Boolean(response.authResponse));
            self.fan(function(data){handleFan(data.status);});
            self.permissions();
            broadcast('auth', response);
        });
        isFB && FB.Event.subscribe('edge.create', function(response){
            response.indexOf($options.pageUrl) >= 0 && broadcast('fanLike', true) && handleFan(true);
            broadcast('like', response);
        });
        isFB && FB.Event.subscribe('edge.remove', function(response){
            response.indexOf($options.pageUrl) >= 0 && broadcast('fanLike', false) && handleFan(false);
            broadcast('unlike', response);
        });
        isFB && FB.Event.subscribe('comment.create', function(response){
            broadcast('comment', response.href);
        });
        isFB && FB.getLoginStatus(function(response){handleConnect(response.status == 'connected');});
        if(!$options.isFan && $options.detectFan){
            self.fan(function(data){
                handleFan(data.status);
                handleInit();
            });
        }else{
            handleInit();
        };
    };
    return self;
}])

.directive('appFbPlugin', ['$injector', function($injector){
    var
    isFB       = typeof(window['FB']) != 'undefined',
    $timeout   = $injector.get('$timeout');
    return{
        restrict: 'A',
        link: function($scope, $element, attributes){
            var render = function(){
                $timeout(function(){
                    $element[0].innerHTML = '';
                    $element[0].removeAttribute('fb-xfbml-state');
                    isFB && FB.XFBML.parse($element[0].parentElement);
                }, 10);
            };
            $timeout(function(){
                render();
                $scope.$watch(function(){
                    return attributes.href;
                }, function(newVal, oldVal, scope){
                    newVal != oldVal && render();
                }, true);
            }, 500);
        }
    };
}])

.directive('appFbInvite', ['$injector', function($injector){
    var
    $tools     = $injector.get('tools'),
    $facebook  = $injector.get('facebook');
    return function($scope, $element, attributes){
        $element.bind('click', function(e){
            var t = $tools.tags.list();
            var uri = attributes.redirectUri ? {redirect_uri: attributes.redirectUri} : {};
            $facebook.invite(
                angular.extend({
                    title: attributes.title || '',
                    message: attributes.message || '',
                    data: attributes.data || '',
                    display: attributes.display || ''
                }, uri),
                null,
                app.$Agent.device == 'mobile' && (t['blackberry'] || t['windows'] || t['Android2_2'] || t['Android2_3'])
            );
        });
    };
}])

.directive('appFbShare', ['$injector', function($injector){
    var
    $tools     = $injector.get('tools'),
    $facebook  = $injector.get('facebook');
    return function($scope, $element, attributes){
        $element.bind('click', function(e){
            var t = $tools.tags.all();
            var uri = attributes.redirectUri ? {redirect_uri: attributes.redirectUri} : {};
            $facebook.share(
                angular.extend({
                    name: attributes.name || '',
                    caption: attributes.caption || '',
                    description: attributes.description || '',
                    link: attributes.link || '',
                    picture: attributes.picture || '',
                    actions: attributes.action ? [{name: attributes.action, link: attributes.link}] : null,
                    to: attributes.to || '',
                    display: attributes.display || ''
                }, uri),
                function(r){
                    r && $scope.$eval(attributes.callback);
                },
                app.$Agent.device == 'mobile' && (t['blackberry'] || t['windows'] || t['Android2_2'] || t['Android2_3'])
            );
        });
    };
}])

.run(['$injector', function($injector){
    var
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $facebook  = $injector.get('facebook'),
    $rootScope = $injector.get('$rootScope'),
    $timeout   = $injector.get('$timeout'),
    $http      = $injector.get('$http');

    $rootScope.facebook = $facebook;
    $facebook.init();

    if(!$config.app.jsonPayload){
		$http.defaults.transformRequest.push(function(data, getHeaders){
			var fbData = null, sign = $facebook.sign();
			if(sign){
				fbData = {};
				fbData.signed_request = sign;
				fbData.access_token = $facebook.token();
			};
			if(!data && fbData){
				return $tools.getUrlString(fbData);
			}else if(angular.isString(data)){
				return data + (fbData ? '&' + $tools.getUrlString(fbData) : '');
			}else if(angular.isObject(data) && String(data) !== '[object File]'){
				return $tools.getUrlString(angular.extend(data, fbData || {}));
			};
		});
	};

    var onGrow = function(e){$timeout(function(){
        var view = document.getElementById('view');
        view && $facebook.grow(Math.max(view.offsetHeight, view.clientHeight), $facebook.isTab || $facebook.isCanvas);
    }, 500);};
    ($facebook.isTab || $facebook.isCanvas) && $rootScope.$on('$routeChangeSuccess', onGrow);
}]);

!function(options){
    if(options.appId){
        window.fbAsyncInit = function(){
            FB.init({
                //1.0
                //channelUrl: options.channelUrl || '',
                //status: true,
                //cookie: false,
                //oauth: true,          
                version: 'v2.2',
                appId: options.appId,
                xfbml: false
            });
            FB.getLoginStatus(function(response){
                if(options.autoConnect && (response.status == 'not_authorized' || response.status == 'unknown') && document.location.hash.indexOf('login-redirect') < 0){
                    window.location = 'https://' + (app.$Agent.device == 'mobile' ? 'm.' : '') + 'facebook.com/dialog/oauth?client_id=' + options.appId + '&state=login-redirect&redirect_uri=' + encodeURIComponent(options.redirectUrl + '#login-redirect') + '&scope=' + (options.permissions || '');
                    return;
                };
                angular.isFunction(options.onInit) && options.onInit.call({}, angular);
            }, true);
        };
        if(options.appId && !document.getElementById('fb-root')){
            var div = document.createElement('div');
            div.id = 'fb-root';
            var script = document.createElement('script');
            script.async = 'true';
            script.type = 'text/javascript';
            script.src = '//connect.facebook.net/' + options.locale + '/' + (options.debug && !(app.$Agent.browser == 'msie' && app.$Agent.version <= 8) ? 'sdk/debug' : 'sdk') + '.js';
            document.body.appendChild(div);
            document.getElementsByTagName('head')[0].appendChild(script);
        };
    }else{
        angular.isFunction(options.onInit) && options.onInit.call({}, angular);
    };
}.call({}, window.appConfig.fb || {});

//------------------------------------------------------ end
}(angular);