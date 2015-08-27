!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

// Events --------------------------
// oauth:allow                   data
// oauth:deny                    data
// oauth:open                    data
// oauth:close                   data

// Methods -------------------------
// .login
// .loginFacebook
// .loginGoogle
// .loginTwitter
// .loginInstagram
// .token
// .tokenFacebook
// .tokenGoogle
// .tokenTwitter
// .tokenInstagram

.service('oauth', ['$injector', function($injector){
    var
    self       = this,
    $q         = $injector.get('$q'),
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $agent     = $injector.get('agent'),
    $cookie    = $injector.get('cookie'),    
    $timeout   = $injector.get('$timeout'),
    $rootScope = $injector.get('$rootScope'),

    broadcast = function(type, data){
        return $timeout(function(){
            $rootScope.$broadcast('oauth', {type: type, data: data});
            $rootScope.$broadcast('oauth:' + type, data);
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
    
    storage = {};
    
    self.useCookie = true;
	self.redirectUrl = (document.location.origin || (document.location.protocol + '//' + document.location.hostname + (document.location.port ? ':' + document.location.port: ''))) + '/socialChannel.html';
    self.popupPrefix = '_window_';
	self.callPrefix = '_call_';
	
	self.reset = function(win, origin, callbackName){
		win && win.focus && win.close();
		window[callbackName] = null;
		delete window[callbackName];
		broadcast('close', {origin:origin});
	};
	
    self.login = function(url, options, isNew, width, height, callback){
        return produce(function(deferred){
            var
			token = '',
			origin = (/^.*:\/\/(www\.|)([^\/]+)/.exec(url) || [])[2] || '',
			id = String((new Date).getTime()) + Math.round(Math.random() * 1000000),
			name = 'token.' + origin;
            
            if(isNew){
                if(self.useCookie){
                    $cookie.del(name);
                }else{
                    delete storage[name];
                };
            }else{
                if(self.useCookie){
                    token = $cookie.get(name);
                }else{
                    token = storage[name] || '';
                };
            };
            
            if(!token){
                broadcast('open', {origin:origin});
                options = angular.extend({redirect_uri: self.redirectUrl, state: ($agent.isHttps ? 'https' : 'http') + self.callPrefix + id}, options || {});
                var w = $tools.getWindow(url + '?' + $tools.getUrlString(options), width || 600, height || 400); w.name = self.popupPrefix + id;
				var c = function(url, popup){
                    var
					params = $tools.getUrlParams(url.replace(/#/g, '&')), // hack to parse params inside the hash string
                    code = params.code || null,
					token = params.access_token || null,
                    expires = (params.expires_in * 1) || 3600;
                    if(token){
                        if(self.useCookie){
                            $cookie.set(name, token, expires * 1000);
                        }else{
                            storage[name] = token;
                        };
                        broadcast('allow', {popup:w, origin:origin, id:id, token:token});
                        resolve(deferred, {popup:w, origin:origin, id:id, token:token}, callback);
						self.reset(w, origin, options.state);
                    }else if(code){
                        broadcast('code', {popup:w, origin:origin, id:id, code:code});
                        resolve(deferred, {popup:w, origin:origin, id:id, code:code}, callback);
					}else{
						broadcast('deny', {popup:w, origin:origin, id:id, params:params});
                        reject(deferred, {popup:w, origin:origin, id:id, params:params}, callback);
						self.reset(w, origin, options.state);
                    };
                };
                setTimeout(function(){
                    if(angular.isFunction(window[options.state])){
                        window[options.state]('timeout');
                };}, 50000);
                window[options.state] = c;
            }else{
                resolve(deferred, token, callback);
            };
        });
    };
    
    self.loginFacebook = function(appId, permissions, isNew, callback){
        return self.login(
            'https://facebook.com/dialog/oauth',
            {
                client_id: appId || '', 
                scope: permissions || undefined,
                response_type: 'token',
                display: 'popup'
            },
            isNew
        );
    };
    
    self.loginGoogle = function(appId, permissions, isNew, callback){
        return self.login(
            'https://accounts.google.com/o/oauth2/auth',
            {
                client_id: appId || '',
                scope: permissions || undefined,
                response_type: 'token'
            },
            isNew
        );
    };
    
    self.loginInstagram = function(appId, permissions, isNew, callback){
        return self.login(
            'https://instagram.com/oauth/authorize',
            {
                client_id: appId || '',
                scope: permissions || undefined
            },
            isNew    
        );
    };    
    
    self.loginTwitter = function(appId, permissions, isNew, callback){
        return self.login(
            'https://api.twitter.com/oauth2/token',
            {
                client_id: appId || '',
                scope: permissions || undefined
            },
            isNew
        );
    };
    
    self.loginLinkedin  = function(appId, permissions, isNew, callback, secret){
		/*
		if(typeof(window['IN']) != 'undefined'){
			return produce(function(deferred){
				//IN.init({api_key:appId, authorize:true});
				IN.User.authorize(function(){
					//..
				}, permissions);
			});
		}else{
		*/
			return self.login(
				'https://www.linkedin.com/uas/oauth2/authorization',
				{
					client_id: appId || '',
					scope: permissions || undefined,
					response_type: 'code'
				},
				isNew
			).then(function(data){
				if(data.code && secret){
					var f = document.createElement('form');
					f.setAttribute('method', 'post');
					f.setAttribute('action', 'https:www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code&code=' + data.code + '&redirect_uri=' + self.redirectUrl + '&client_id=' + appId + '&client_secret=' + secret);
					f.setAttribute('target', self.popupPrefix + data.id);							   
					f.style.display = 'none';
					document.body.appendChild(f);
					f.submit();
					setTimeout(function(){document.body.removeChild(f);}, 2000);
				}else{
					self.reset(data.popup, data.origin, self.callPrefix + data.id);
					return data;
				};
			});
			// https://developer.linkedin.com/documents/authentication#oauth2-redirect-uri
			// POST: exchange code to token
			// https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=YOUR_REDIRECT_URI&client_id=YOUR_API_KEY&client_secret=YOUR_SECRET_KEY
		/*
		};
		*/
    };

    self.exchangeLinkedin  = function(appId, code, callback){
        return self.login(
            'https://www.linkedin.com/uas/oauth2/authorization',
            {
                client_id: appId || '',
                scope: permissions || undefined,
                response_type: 'code'
            },
            isNew
        );
    };    
    
    self.token = function(origin){
        return (self.useCookie ? $cookie.get('token.' + origin) : storage['token.' + origin]) || '';
    };

    self.tokenFacebook = function(){
        return self.token('facebook.com');
    };
    
    self.tokenGoogle = function(){
        return self.token('accounts.google.com');
    };
    
    self.tokenInstagram = function(){
        return self.token('instagram.com');
    };    
    
    self.tokenTwitter = function(){
        return self.token('api.twitter.com');
    };
    
    self.tokenLinkedin = function(){
        return self.token('linkedin.com');
    };    
    
    self.getData = function(){
        return {
            facebook: self.tokenFacebook(),
            google: self.tokenGoogle(),
            instagram: self.tokenInstagram(),
            twitter: self.tokenTwitter(),
            linkedin: self.tokenLinkedin()
        };
    };
    
    self.init = function(){
    
    };
    
    /*    
    Authorization Endpoint URL: https://www.facebook.com/dialog/oauth
    Access Token Endpoint URL: https://graph.facebook.com/oauth/access_token
    User Profile Service URL: https://graph.facebook.com/me
    OAuth 2.0 Provider logout service: http://www.facebook.com/logout.php

    Google
    Authorization Endpoint URL: https://accounts.google.com/o/oauth2/auth
    Access Token Endpoint URL: https://accounts.google.com/o/oauth2/token
    User Profile Service URL: https://www.googleapis.com/oauth2/v1/userinfo
    OAuth 2.0 Provider logout service: https://mail.google.com/mail/?logout
    */
    
    return self;
}])

.run(['$injector', function($injector){
    var
    $oauth     = $injector.get('oauth');

    $injector.get('$rootScope').oauth = $oauth;
    $oauth.init();
}]);

//------------------------------------------------------ end
}(angular);