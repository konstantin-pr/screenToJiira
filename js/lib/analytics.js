!function(angular){
'use strict';
var compileProvider; (window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

.config(['$compileProvider', function($compileProvider){
    compileProvider = $compileProvider;
}])

.service('analytics', ['$injector', function($injector){
    var self = this;

    // Core
    var core = function(account, vars, tracker, referrer, isolate){
        var obj = this;

        var isChrome = /chrome/i.test(navigator.userAgent);
        var isInit = false;
        var isolator = null;

        var gaQuery = function(){
            return (isInit ? (isolator ? isolator.contentWindow._gaq : window._gaq) : []) || [];
        };
        var gaTracker = function(key){
            return tracker ? tracker + '.' + key : key;
        };
        var gaSetVars = function(vars, isStr){
            var list = [], slot = 0;
            for(var key in vars){
                if(isStr){
                    list.push('["' + gaTracker('_setCustomVar') + '",' + (++slot) + ',"' + key + '","' + vars[key] + '",2]');
                }else{
                    list.push([gaTracker('_setCustomVar'), ++slot, key, String(vars[key]), 2]);
                };
            };
            return isStr ? list.join(',') : list;
        };
        var gaDelVars = function(vars, isStr){
            var list = [], slot = 0;
            for(var key in vars){
                if(isStr){
                    list.push('["' + gaTracker('_deleteCustomVar') + '",' + (++slot) + ']');
                }else{
                    list.delCvars([gaTracker('_deleteCustomVar'), ++slot]);
                };
            };
            return isStr ? list.join(',') : list;
        };
        var echo = function(){
            if(angular.isUndefined(window['console'])){return;};
            if(angular.isFunction(window.console['log'])){
                window.console.log.apply(window.console, arguments);
            }else{
                for(var i = 0, j = arguments.length; i < j; i++){window.console.log(arguments[i]);}
            };
        };
        var log = function(query, label, style){
            query = angular.isString(query) ? query : angular.toJson(query);
            isChrome && style ? echo('%c ' + (label || 'Track') + ': ' + query + ' ', style) : echo((label || 'Track') + ': ' + query);
        };
        var style = function(method){
            switch(method){
                case 'img': return 'background:#e2ecfa;color:#1c5ab4';
                case 'view': return 'background:#fdd;color:#c33';
                case 'omniture': return 'background:#f3e8f5;color:#9948a7';
                case 'event': return 'background:#cfc;color:#399839';
                default: return 'background:#e1e1e1;color:#4e4e4e';
            };
        };
        var event = function(obj, type, fn){
            if(obj.addEventListener){
                obj.addEventListener(type, fn, false);
            }else if(obj.attachEvent){
                obj.attachEvent('on' + type, fn);
            }else if(obj['on' + type]){
                var origHandler = obj['on' + type];
                obj['on' + type] = function(e){origHandler(e); return fn(e);};
            }else{
                obj['on' + type] = fn;
            };
        };

        obj.init = function(){
            if(isInit){
                return;
            }else if(isolate){
                event(window, 'load', function(){
                    isolator = document.createElement('IFRAME');
                    isolator.style.position = 'absolute';
                    isolator.style.height = isolator.style.width = '1px';
                    isolator.style.top = isolator.style.left = '-10000px';
                    isolator.style.border = 'none';
                    isolator.scrolling = isolator.frameBorder = 'no';
                    event(isolator, 'load', function(){
                        if(isInit){return;};
                        isInit = true;
                        try{
                            //isolator.contentWindow.document.open();
                            isolator.contentWindow.document.writeln(
                                '<script>_gaq=[];' +
                                (account ? '_gaq.push(["' + gaTracker('_setAccount') + '","' + account + '"]);' : '') +
                                (referrer ? '_gaq.push(["' + gaTracker('_setReferrerOverride') + '","' + referrer + '"]);' : '') +
                                (angular.isString(isolate) ? '_gaq.push(["' + gaTracker('_setDomainName') + '","none"]);' : '') +
                                '_gaq.push(' + gaSetVars(vars, true) + ');_gaq.push(["' + gaTracker('_trackPageview') + '"]);</' + 'script>'
                            );                            
                            isolator.contentWindow.document.writeln('<script src="' + ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js" async="true"></' + 'script>');
                            //isolator.contentWindow.document.close();
                        }catch(e){};
                    });
                    isolator.src = angular.isString(isolate) ? isolate : 'about:blank';
                    document.body.appendChild(isolator);
                });
            }else{
                window._gaq = !angular.isUndefined(window['_gaq']) ? window._gaq : [];
                account && window._gaq.push([gaTracker('_setAccount'), account]);
                referrer && window._gaq.push([gaTracker('_setReferrerOverride'), referrer]);
                angular.isObject(vars) && window._gaq.push.apply(window._gaq, gaSetVars(vars));
                window._gaq.push([gaTracker('_trackPageview')]);
                if(angular.isUndefined(window['_gat'])){
                    var s = document.createElement('script');
                    s.async = true;
                    s.type = 'text/javascript';
                    s.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                    document.getElementsByTagName('head')[0].appendChild(s);
                };
                isInit = true;
            };
            return obj;
        };

        obj.providers = (function(){
            var obj = this;
            obj.event = function(category, action, label, value){
                gaQuery().push([gaTracker('_trackEvent'), String(category || 'unknown'), String(action || 'null'), String(label || ''), parseFloat(value, 10) || 0]);
                return obj;
            };
            obj.view = function(view){
                gaQuery().push([gaTracker('_trackPageview'), view]);
                return obj;
            };
            obj.img = function(src){
                if(src){
                    var img = new Image();
                    document.body.appendChild(img);
                    img.onload = function(){document.body.removeChild(this);};
                    img.onerror = function(){document.body.removeChild(this);};
                    img.style.position = 'absolute';
                    img.style.left = '-1000px';
                    img.style.top = '-1000px';
                    img.src = src;
                };
                return obj;
            };
            obj.omniture = function(omnitureVars, method, methodVars){
                if(angular.isUndefined(window['s']) || !angular.isFunction(window.s[method])){return obj;};
                var cache = {};
                try{omnitureVars = (angular.isString(omnitureVars) ? angular.fromJson(omnitureVars) : omnitureVars) || {};}catch(e){omnitureVars = {};};
                try{methodVars = (angular.isString(methodVars) ? angular.fromJson(methodVars) : methodVars) || [];}catch(e){methodVars = methodVars ? [methodVars] : [];};
                for(key in omnitureVars){cache[key] = window.s[key] || ''; window.s[key] = omnitureVars[key];};
                try{window.s[method].apply(window.s, methodVars);}catch(e){};
                for(key in cache){window.s[key] = cache[key];};
                return obj;
            };
            return obj;
        }).call({});

        obj.track = function(query, queryDelimiter, label){
            try{
                var params = query || [];
                if(angular.isString(query)){
                    query = query.replace(new RegExp('\\s*' + (queryDelimiter || ';') + '\\s*$'), '');
                    params = query.split(new RegExp('\\s*' + (queryDelimiter || ';') + '\\s*', 'g'));
                };
                var method = params.length && !angular.isUndefined(obj.providers[params[0]]) && params[0];
                method && obj.providers[method].apply(obj.providers, params.slice(1));
                log(query, label, style(method));
            }catch(e){};
            return obj;
        };
        return obj;
    };

    self.init = function(options){
        options = angular.extend({
            tracker:   'tracker',
            account:   '',
            delimiter: ';',
            data:      {tracks:{}, funnel:{}},
            vars:      {},
            isolate:   false
        }, options);

        var instance = new core(options.account, options.vars, options.tracker, options.referrer, options.isolate).init();
        var funnel = [], tracker = function(k, map, skipDoubleTrack){
            // Track
            if(!options.data.tracks || angular.isUndefined(options.data.tracks[k]) || (skipDoubleTrack && funnel.length && funnel[funnel.length - 1] == k)){return tracker;};
            var query = options.data.tracks[k];
            if(angular.isObject(map)){
                for(var i in map){query = query.replace(new RegExp('\{\{' + i + '\}\}', 'g'), map[i]);};
                query = query.replace(/\{\{[a-zA-Z0-9]+\}\}/g, '');
            }else{
                map = query.indexOf('img') == 0 ? (new Date()).getTime() :  map || '';
                query = query.replace(/\{\{[a-zA-Z0-9]+\}\}/g, map);
            };
            var isFunnel = query.length && query.charAt(0) == '~';
            if(isFunnel){
                query = query.substring(1);
                funnel.push(k);
            };
            instance.track(query, options.delimiter, k);
            // Funnel
            if(!options.data.funnel || !isFunnel){return tracker;};
            var r, stack = funnel.join(options.delimiter);
            for(var i in options.data.funnel){
                r = i
                .replace(/[\.\?\/\\]/g, '')
                .replace(/\+/g, '([^' + options.delimiter + ']+)')
                .replace(/\*/g, '([^' + options.delimiter + ']+;[^' + options.delimiter + ']+)+');
                if((new RegExp(r + '$').test(stack))){
                    query = options.data.funnel[i];
                    map = query.indexOf('img') == 0 ? (new Date()).getTime() :  '';
                    query = query.replace(new RegExp('\{\{[a-zA-Z0-9]+\}\}', 'g'), map);
                    instance.track(query, options.delimiter, 'Funnel');
                    break;
                };
            };
            return tracker;
        };

        compileProvider.directive(options.tracker, function($injector){
            return function($scope, $element, attributes){
                $element.bind('click', function(e){
                    var args = $scope.$eval(attributes[options.tracker]) || attributes[options.tracker];
                    angular.isFunction(args) && (args = args());
                    if(angular.isArray(args) && args.length){
                        if(angular.isArray(args[0])){
                            angular.forEach(args, function(v){
                                tracker.apply({}, v);
                            });
                        }else{
                            tracker.apply({}, args);
                        };
                    }else if(angular.isString(args) && args.length){
                        tracker(args, null, false);
                    }else{
                        tracker(attributes[options.tracker], null, false);
                    };
                });
            };
        })

        return tracker;
    };

    return self;
}])

/*
.config(['$provide', function($provide){
    $provide.decorator('ngClickDirective', ['$delegate', function($delegate){
        var original = $delegate[0].compile;
        $delegate[0].compile = function(element, attrs, transclude){
            // ng-click tracking...
            return original(element, attrs, transclude);
        };
        return $delegate;
    }]);
}])
*/

.run(['$injector', function($injector){
    //...
}]);

//------------------------------------------------------ end
}(angular);