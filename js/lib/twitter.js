!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

// Events --------------------------
// twitter:click             data
// twitter:tweet             data
// twitter:retweet           data
// twitter:favorite          data
// twitter:follow            data

.service('twitter', ['$injector', function($injector){
    var
    self       = this,
    isTwttr    = typeof(window['twttr']) != 'undefined',
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $agent     = $injector.get('agent'),
    $q         = $injector.get('$q'),
    $timeout   = $injector.get('$timeout'),
    $cookie    = $injector.get('cookie'),

    broadcast = function(type, data){
        return $timeout(function(){
            $rootScope.$broadcast('twitter', {type: type, data: data});
            $rootScope.$broadcast('twitter:' + type, data);
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
    
    self.init = function(){
        var handler = function(event){
            broadcast(event.type, {
                url: event.target.getAttribute('data-url'),
                text: event.target.getAttribute('data-text'),
                hashtags: event.target.getAttribute('data-hashtags')
            });
        };
        var listener = function(){
            if(typeof(twttr['events']) == 'undefined'){return;};
            twttr.events.bind('click', handler);
            twttr.events.bind('tweet', handler);
            twttr.events.bind('retweet', handler);
            twttr.events.bind('favorite', handler);
            twttr.events.bind('follow', handler);
        };
        if(isTwttr){
            listener();
        }else{
            var script = document.createElement('script');
            script.async = 'true';
            script.type = 'text/javascript';
            script.id = 'twitter-wjs';
            script.src = '//platform.twitter.com/widgets.js';
            script.onload = function(){
                isTwttr = true;
                listener();
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        };
    };    
    
    return self;
}])

.directive('appTwPlugin', ['$injector', function($injector){
    var
    $shortener  = $injector.get('shortener'),
    $timeout    = $injector.get('$timeout');
    return{
        restrict: 'A',
        link: function($scope, $element, attributes){
            var link = {longUrl:'', shortUrl:''};
            var render = function(text, url, hashtags){
                $element[0].innerHTML = '<a href="https://twitter.com/share" class="twitter-share-button" data-url="' + (url || '') + '" data-text="' + (text || '') + '" data-hashtags="' + (hashtags || '') + '">Tweet</a>';
                $timeout(function(){
                    typeof(window['twttr']) != 'undefined' && typeof(twttr['widgets']) != 'undefined' && twttr.widgets.load();
                }, 10);
            };
            var shortener = function(t, u, h){
                if(attributes.shortener && link.longUrl != u){
                    $shortener[attributes.shortener](u).then(function(shortUrl){
                        link.longUrl = u;
                        link.shortUrl = shortUrl;
                        render(t || '', link.shortUrl, h || '');
                    });
                }else{
                    link.longUrl = u;
                    render(t || '', link.shortUrl || link.longUrl, h || '');
                };
            };
            var changeHash = '';
            var change = function(){
                var hash = [attributes.text, attributes.url, attributes.hashtags].join(''); if(changeHash == hash){return;};
                shortener(attributes.text, attributes.url, attributes.hashtags);
                changeHash = hash;
            };
            attributes.$observe('url', change);
            attributes.$observe('text', change);
            attributes.$observe('hashtags', change);
            change();
        }
    };
}])

.directive('appTwShare', ['$injector', function($injector){
    var
    $shortener  = $injector.get('shortener');
    
    return {
        restrict: 'A',
        terminal: true,
        link: function($scope, $element, attributes){
            var link = {longUrl:'', shortUrl:''};
            var render = function(text, url, hashtags){
                $element[0].setAttribute('href', '//twitter.com/intent/tweet?text=' + (text || '') + '&hashtags=' + (hashtags || '') + '&url=' + encodeURIComponent(encodeURI(url)));
            };
            var shortener = function(t, u, h){
                if(attributes.shortener && link.longUrl != u){
                    $element[0].style.visibility = 'hidden';
                    $shortener[attributes.shortener](u).then(function(shortUrl){
                        link.longUrl = u;
                        link.shortUrl = shortUrl;
                        render(t || '', link.shortUrl, h || '');
                        $element[0].style.visibility = 'visible';
                    });
                }else{
                    link.longUrl = u;
                    render(t || '', link.shortUrl || link.longUrl, h || '');
                };
            };
            var changeHash = '';
            var change = function(){
                var hash = [attributes.text, attributes.url, attributes.hashtags].join(''); if(changeHash == hash){return;};
                shortener(attributes.text, attributes.url, attributes.hashtags);
                changeHash = hash;
            };
            attributes.$observe('url', change);
            attributes.$observe('text', change);
            attributes.$observe('hashtags', change);
            change();
        }
    };
}])

.service('shortener', ['$injector', function($injector){
    var
    $q          = $injector.get('$q'),
    $http       = $injector.get('$http'),
    $agent      = $injector.get('agent'),
    $tools      = $injector.get('tools'),
    $config     = $injector.get('config');
    
    var bitlyOptions = {
        apiUrl: 'https://api-ssl.bitly.com/v3/shorten?',
        token: $config.app.bitlyShortenerToken || 'e552859003cb46ca04d325bd6358b3d56137f2cb'
    };
    var googleOptions = {
        apiUrl: 'https://www.googleapis.com/urlshortener/v1/url',
        apiKey: $config.app.googleShortenerKey || 'AIzaSyCYKsmJHA_-yEtXlnnRr70pggF3EK9depc'
    };
    
    return (function(){
        var self = this; window.s = self;

        self.bitly = function(link){
            var deferred  = $q.defer();
            $http.jsonp(
                bitlyOptions.apiUrl + $tools.getUrlString({format: 'json', callback: 'JSON_CALLBACK', access_token: bitlyOptions.token, longUrl: link})
            ).then(function(response){
                deferred.resolve(response && response.data && response.data.data && response.data.data.url ? response.data.data.url : link);
            }, function(){
                deferred.resolve(link);
            });
            return deferred.promise;
        };
        
        self.google = function(link){
            var deferred  = $q.defer();
            $http.post(
                googleOptions.apiUrl + '?key=' + googleOptions.apiKey,
                {longUrl: link},
                {headers: {'Content-type': 'application/json'},  transformRequest: function(data){return angular.toJson(data);}}
            ).then(function(response){
                deferred.resolve(response && response.data && response.data.id ? response.data.id : link);
            }, function(){
                deferred.resolve(link);
            });
            return deferred.promise;
        };
        
        return self;
    }).call({})
}])

.run(['$injector', function($injector){
    var
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $twitter   = $injector.get('twitter'),
    $timeout   = $injector.get('$timeout'),
    $http      = $injector.get('$http');

    $rootScope.twitter = $twitter;
    $twitter.init();
}]);

//------------------------------------------------------ end
}(angular);