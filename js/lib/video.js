!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

// Fires Events --------------------------
// video:load             data
// video:play             data
// video:continue         data
// video:end              data
// video:pause            data

// Listens Events --------------------------
// player:play            id
// player:pause           id


.service('video', ['$injector', function($injector){
    var
    self       = this,
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $agent     = $injector.get('agent'),
    $q         = $injector.get('$q'),
    $timeout   = $injector.get('$timeout'),
    $cookie    = $injector.get('cookie'),
    isAPI      = {youtube: false, vimeo: false, vine: false},

    broadcast = function(type, data){
        return $timeout(function(){
            $rootScope.$broadcast('video', {type: type, data: data});
            $rootScope.$broadcast('video:' + type, data);
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
    
    self.videoUrl = function(provider, id, autoplay){
		var url = '//';
        var origin = document.location.origin || document.location.protocol + '//' + document.location.hostname + (document.location.port ? ':' + document.location.port: '');
        switch(provider){
			case 'youtube':
				url += 'www.youtube.com/embed/' + id + '?rel=0&wmode=transparent&showinfo=0&autoplay=' + (autoplay ? '1' : '0') + '&enablejsapi=1&origin=' + origin;
			break;
			case 'vimeo':
				url += 'player.vimeo.com/video/' + id + '?api=1&player_id=' + id + '&wmode=transparent&autoplay=' + (autoplay ? '1' : '0');
			break;
            case 'vine':
				url += 'vine.co/v/' + id + '/embed/simple?audio=' + (autoplay ? '1' : '0');
			break;
		};
		return url;
	};
    
    self.videoHtml = function(provider, id, width, height, autoplay){
        return '<iframe id="' + id + '" width="' + width + '" height="' + height + '" src="' + self.videoUrl(provider, id, autoplay) + '" frameborder="0" webkitAllowFullScreen="1" mozallowfullscreen="1" allowfullscreen="1"></iframe>';
	};
    
    self._players = {};
    self.videoIframe = function(provider, id, width, height, autoplay){
        var iframe = document.createElement('iframe');
        iframe.id = id;
        iframe.width = width;
        iframe.height = height;
        iframe.frameborder = '0'
        iframe.webkitAllowFullScreen = '1'
        iframe.mozallowfullscreen = '1'
        iframe.allowfullscreen = '1'
        iframe.onload = function(){
            var fix, t = 1; broadcast('load', {provider:provider, id:id});
            if(autoplay){
                fix = $timeout(function(){
                    t && broadcast('play', {provider:provider, id:id, autoplay:autoplay});
                    t = 0;
                }, 1000);
            };
            var player = null;
            switch(provider){
                case 'youtube':
                    player = new YT.Player(id, {
                        videoId: id,
                        events: {
                            onStateChange:function(e){
                                if(e.data == YT.PlayerState.PLAYING){
                                    if(fix){
                                        $timeout.cancel(fix);
                                        fix = null;
                                    };
                                    broadcast(t ? 'play' : 'continue', {provider:provider, id:id, autoplay:autoplay}); t = 0;
                                }else if(e.data == YT.PlayerState.ENDED || e.data == YT.PlayerState.PAUSED){
                                    broadcast(e.data == YT.PlayerState.ENDED ? 'end' : 'pause', {provider:provider, id:id, autoplay:autoplay});
                                };
                            }
                        }
                    });
                    self._players[id] = player;
                break;
                case 'vimeo':
                    if(autoplay){
                        broadcast('play', {provider:provider, id:id, autoplay:autoplay}); t = 0;
                    };
                    player = $f(iframe);
                    player.addEvent('ready', function(){
                        player.addEvent('pause', function(){broadcast('pause', {provider:provider, id:id, autoplay:autoplay})});
                        player.addEvent('finish', function(){broadcast('end', {provider:provider, id:id, autoplay:autoplay})});
                        player.addEvent('play', function(){broadcast(t ? 'play' : 'continue', {provider:provider, id:id, autoplay:autoplay}); t = 0;});
                    });
                    self._players[id] = player;
                break;
                case 'vine':
                break;
            };
        };
        iframe.src = self.videoUrl(provider, id, autoplay);
        return iframe;
	};
    
    self.addProvider = function(provider){
        var src = {
            youtube: '//www.youtube.com/iframe_api',
              vimeo: '//secure-a.vimeocdn.com/js/froogaloop2.min.js',
               vine: '//platform.vine.co/static/scripts/embed.js'
        };
        if(!isAPI[provider]){
            var script = document.createElement('script');
            script.async = 'true';
            script.type = 'text/javascript';
            script.src = src[provider];
            script.onload = function(){
                isAPI[provider] = true;
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        };
    };
    
    var _call = function(player, methods){
        angular.forEach(methods, function(method){
            try{
                angular.isFunction(player[method]) && player[method](); 
            }catch(e){};
        });
    };    
    
    self.play = function(id){
        var m = ['playVideo', 'play'];
        if(id){
            typeof(self._players[id]) != 'undefined' && _call(self._players[id], m);
        }else{
            angular.forEach(self._players, function(player){_call(player, m);});
        };
    };
    
    self.pause = function(id){
        var m = ['pauseVideo', 'pause'];
        if(id){
            typeof(self._players[id]) != 'undefined' && _call(self._players[id], m);
        }else{
            angular.forEach(self._players, function(player){_call(player, m);});
        };    
    };
    
    self.destroy = function(id){
        var m = ['destroy'];
        if(id){
            typeof(self._players[id]) != 'undefined' && _call(self._players[id], m);
            delete self._players[id];
        }else{
            angular.forEach(self._players, function(player, id){
                _call(player, m);
                delete self._players[id];
            });
        };    
    };    
    
    self.init = function(){
        $rootScope.$on('player:play', function(e, id){self.play(id)});
        $rootScope.$on('player:pause', function(e, id){self.pause(id)});
        $rootScope.$on('player:destroy', function(e, id){self.destroy(id)});
    };
    
    return self;
}])

.directive('appVideo', ['$injector', function($injector){
    var
    $video      = $injector.get('video'),
    $timeout    = $injector.get('$timeout'),
    $compile    = $injector.get('$compile');

    return{
        restrict: 'A',
        link: function($scope, $element, attributes){
            $video.addProvider(attributes.provider);
            var insertVideo = function(autoplay){
                $video.destroy(attributes.appVideo);
                while($element[0].firstChild){$element[0].removeChild($element[0].firstChild);};
                $element[0].appendChild($video.videoIframe(attributes.provider, attributes.appVideo, '100%', '100%', autoplay || false));
            };
            var insertHtml = function(html){
                $video.destroy(attributes.appVideo);
                $element.html(html); $compile($element.contents())($scope);
            };            
            if(attributes.cover){
                var html = $element.html();
                $element.bind('click', function(){insertVideo(true);});
                attributes.$observe('appVideo', function(){insertHtml(html)});
                $scope.$on('player:click', function(e, id){id == attributes.appVideo && insertVideo(true);});
            }else{
                attributes.$observe('appVideo', function(){
                    insertVideo(attributes.autoplay || false);
                });
                insertVideo(attributes.autoplay || false);
            };
        }
    };
}])

.run(['$injector', function($injector){
    var
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $rootScope = $injector.get('$rootScope'),
    $video     = $injector.get('video'),
    $timeout   = $injector.get('$timeout');

    $rootScope.video = $video;
    $video.init();
}]);

//------------------------------------------------------ end
}(angular);