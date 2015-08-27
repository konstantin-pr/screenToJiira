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

        var isChrome = /chrome|webkit/i.test(navigator.userAgent);
        var isInit = false;
        var isLocal = document.location.protocol == 'file:';
        var isolator = null;

        var gaQuery = function(){
            return (isInit ? (isolator ? isolator.contentWindow.ga : window.ga) : []) || [];
        };
        var gaTracker = function(key){
            return tracker ? tracker + '.' + key : key;
        };
        var gaSetVars = function(vars, isStr){
            var list = [], slot = 1;
            for(var key in vars){
                if(isStr){
                    list.push('ga("' + gaTracker('set') + '","dimension' + slot + '","' + String(vars[key]) + '")');
                }else{
                    window.ga(gaTracker('set'), 'dimension' + slot, String(vars[key]));
                };
                slot++;
            };
            return isStr ? list.join(';') : list;
        };
        var gaDelVars = function(vars, isStr){
            var list = [], slot = 0;
            for(var key in vars){
                if(isStr){
                    list.push('window.ga("' + gaTracker('set') + '","dimension' + slot + '","")');
                }else{
                    window.ga(gaTracker('set'), 'dimension' + slot, '');
                };
                slot++;
            };
            return isStr ? list.join(';') : list;
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
                        try{
                            //isolator.contentWindow.document.open();
                            isolator.contentWindow.document.writeln([
                                '<script>(function(i,s,g,r,a){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){',
                                '(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement("script"),',
                                'a.async=1;a.src=g;s.getElementsByTagName("head")[0].appendChild(a)',
                                '})(window,document,"https://www.google-analytics.com/analytics.js","ga");',
                                'window.ga("create","' + account + '",' + (isLocal ? '{cookieDomain:"none",storage:"none",name:"' + tracker + '"}' : '"auto"') + ',{name:"' + tracker + '"});',
                                'window.ga("' + gaTracker('set') + '","forceSSL",true);',
                                angular.isObject(vars) ? gaSetVars(vars, true) + ';' : '',
                                isLocal ? 'window.ga("' + gaTracker('set') + '","checkProtocolTask",function(){});' : '',
                                referrer ? 'window.ga("' + gaTracker('set') + '","referrer","' + referrer + '");' : '',
                                '</' + 'script>'
                            ].join(''));
                            //isolator.contentWindow.document.close();
                        }catch(e){};
                        isInit = true;
                    });
                    isolator.src = angular.isString(isolate) ? isolate : 'about:blank';
                    document.body.appendChild(isolator);
                });
            }else{
                if(angular.isUndefined(window['ga'])){
                    (function(i,s,g,r,a){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement('script'),
                    a.async=1;a.src=g;s.getElementsByTagName('head')[0].appendChild(a)
                    })(window,document,'https://www.google-analytics.com/analytics.js','ga');
                };
                window.ga('create', account, isLocal ? {cookieDomain:'none', storage:'none', name: tracker} : 'auto', {name: tracker});
                window.ga(gaTracker('set'), 'forceSSL', true);
                angular.isObject(vars) && gaSetVars(vars);
                isLocal && window.ga(gaTracker('set'), 'checkProtocolTask', function(){});
                referrer && window.ga(gaTracker('set'), 'referrer', referrer);
                isInit = true;
            };
            return obj;
        };

        obj.providers = (function(){
            var obj = this;
            obj.event = function(category, action, label, value){
                gaQuery()(gaTracker('send'), 'event', String(category || 'unknown'), String(action || 'null'), String(label || ''), parseFloat(value, 10) || 0);
                return obj;
            };
            obj.view = function(view){
                gaQuery()(gaTracker('send'), 'pageview', view);
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
                log(query, label, style(method));                
                method && obj.providers[method].apply(obj.providers, params.slice(1));
            }catch(e){};
            return obj;
        };
        
        obj.call = function(method, key, value){
            method = gaTracker(method);
            if(angular.isDefined(value)){
                gaQuery()(method, key, value);
            }else{
                gaQuery()(method, key);
            };
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
            if(options.disabled || !options.data.tracks || angular.isUndefined(options.data.tracks[k]) || (skipDoubleTrack && funnel.length && funnel[funnel.length - 1] == k)){return tracker;};
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

        return {instance:instance, tracker:tracker};
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