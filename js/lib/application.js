!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

// Events --------------------------
// app:init                         scope, element

.config(['$sceDelegateProvider', '$sceProvider', '$compileProvider', function($sceDelegateProvider, $sceProvider, $compileProvider){
    $sceProvider.enabled(false);
    $sceDelegateProvider.resourceUrlWhitelist(['self', '**']);
    $compileProvider.aHrefSanitizationWhitelist(/.+/);
    $compileProvider.imgSrcSanitizationWhitelist(/.+/);
}])

.constant('agent', (function(){
    var
    a = navigator.userAgent.toLowerCase(),
    r = {device:'desktop', name:'unnamed', os:'UnknownOS', browser:'unknown', version:'0', engine:'unknown', jsPrefix:'', cssPrefix:'', transition:false, isHttps:false},
    s = document.body.style,
    v = function(){
        var n = navigator.appName, u = navigator.userAgent, t;
        var m = u.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if(m && (t = u.match(/version\/([\.\d]+)/i)) != null){m[2] = t[1];};
        m = m ? [m[1], m[2]] : [n, navigator.appVersion, '-?'];
        return m;
    };
    
    if(/ipad/.test(a))                            {r.name = 'ipad'; r.os = 'iOS'; r.device = 'mobile'; r.transition = true;}
    else if(/ipod/.test(a))                       {r.name = 'ipod'; r.os = 'iOS'; r.device = 'mobile'; r.transition = true;}
    else if(/iphone/.test(a))                     {r.name = 'iphone'; r.os = 'iOS'; r.device = 'mobile'; r.transition = true;}
    else if(/android/.test(a))                    {r.name = 'android'; r.os = 'Android'; r.device = 'mobile'; r.transition = true;}
    else if(/blackberry|playbook|bb10/.test(a))   {r.name = 'blackberry'; r.os = 'BlackBerryOS'; r.device = 'mobile'; r.transition = true;}
    else if(/palm/.test(a))                       {r.name = 'palm'; r.os = 'PalmOS'; r.device = 'mobile';}
    else if(/win/.test(a))                        {r.name = 'windows'; r.os = 'WindowsOS';}
    else if(/mac/.test(a))                        {r.name = 'mac'; r.os = 'MacOS';}
    else if(/linux/.test(a))                      {r.name = 'linux'; r.os = 'LinuxOS';};
    if(/mobile/.test(a))                          {r.device = 'mobile'; r.name == 'windows' && (r.os = 'WindowsPhoneOS');};
    if(/webkit/.test(a))                          {r.engine = 'webkit'; r.jsPrefix = 'webkit'; r.cssPrefix = '-webkit-'; r.transition = true;}
    else if(/opera/.test(a))                      {r.browser = 'opera'; r.engine = 'opera'; r.jsPrefix = 'O'; r.cssPrefix = '-o-';}
    else if(/msie/.test(a))                       {r.browser = 'msie'; r.engine = 'msie'; r.jsPrefix = 'ms'; r.cssPrefix = '-ms-';}
    else if(/firefox/.test(a))                    {r.browser = 'firefox'; r.engine = 'mozilla'; r.jsPrefix = 'Moz'; r.cssPrefix = '-moz-';};
    if(/safari/.test(a))                          {r.browser = 'safari';};
    if(/chrome/.test(a))                          {r.browser = 'chrome';};
    
    r.webkit = (/applewebkit\/([\d.]+)/.exec(a) || [0,0])[1];
    r.webkitInt = parseInt(r.webkit, 10) || 0;
    r.webkitFloat = parseFloat(r.webkit, 10) || 0;
    r.version = parseInt(v()[1], 10);
    r.device == 'mobile' && (r.os += a.replace(/.*(os|android)\s*([0-9\.]+).*/, '$2').replace(/\./g, '_') || '');
    r.transition = (typeof(s['webkitTransition']) + typeof(s['MozTransition']) + typeof(s['msTransition']) + typeof(s['OTransition']) + typeof(s['transition'])).indexOf('string') >= 0;
    r.isHttps = document.location.protocol == 'https:';
    r.isStandalone = angular.isDefined(window.navigator.standalone) && window.navigator.standalone;
    r.uuid = (window.device && window.device.uuid) || '';
    r.cordova = (window.device && window.device.cordova) || '';
    if(r.browser == 'unknown' && /trident(\.*rv:([0-9]{1,}[\.0-9]{0,}))|(\/\d\.\d)/.test(a)){
        r.browser = 'msie'; r.engine = 'msie'; r.version = 11;
        r.jsPrefix = 'ms'; r.cssPrefix = '-ms-';
    };
    app.$Agent = r;
    return r;
})())

.constant('cookie', (function(){
    var obj = this;
    obj.set = function(name, value, timeinterval, path, domain ,secure){
        var expires = new Date();
        expires.setTime(expires.getTime() + (timeinterval || 0));
        value = escape(value);
        document.cookie = name + '=' + value +
        (timeinterval ? '; expires=' + expires.toGMTString() : '') +
        (path ? '; path=' + path : '') +
        (domain ? '; domain=' + domain : '') +
        (secure ? '; secure' : '');
        return obj;
    };
    obj.get = function(name){
        var prefix = name + '=', begin = document.cookie.indexOf('; ' + prefix);
        if(begin == -1){
            begin = document.cookie.indexOf(prefix);
            if(begin != 0){return null;};
        }else{
            begin += 2;
        };
        var end = document.cookie.indexOf(';', begin);
        if(end == -1){end = document.cookie.length;};
        var value = document.cookie.substring(begin + prefix.length, end);
        return value ? decodeURIComponent(decodeURI(value)) : '';
    };
    obj.del = function(name, path, domain){
        if(obj.get(name)){
            document.cookie = name + '=' +
            (path ? '; path=' + path : '') +
            (domain ? '; domain=' + domain : '') +
            '; expires=Thu, 01-Jan-70 00:00:01 GMT';
        };
        return obj;
    };
    app.$Cookie = obj;
    return obj;
}).call({}))

.constant('storage', (function(){
    var obj = this;
    obj.is = function(){
        return Boolean(window['localStorage'] || false);
    };
    obj.save = function(key, value, saveEmpty){
        if(!obj.is){return false;};
        try{
            if(value || saveEmpty){
                localStorage.setItem(key, angular.toJson(value));
            }else{
                localStorage.removeItem(key);
            };
        }catch(e){
            // 5 MB quota
        };
        return obj;
    };
    obj.load = function(key){
        if(!obj.is){return null;};
        var str = localStorage.getItem(key);
		if(str){
			try{
				var data = angular.fromJson(str);
				return data;
			}catch(e){
				return undefined;
			};
		}else{
			return undefined;
		};
    };
    obj.remove = function(key){
        if(!obj.is){return null;};
        localStorage.removeItem(key);
        return obj;
    };
    obj.clear = function(list){
        if(!obj.is){return null;};
        if(list){
            angular.forEach(list, function(key){
                obj.remove(key);
            });
        }else{
            localStorage.clear();
        };
        return obj;
    };
    app.$Storage = obj;
    return obj;
}).call({}))

.constant('tools', (function(){
    var self = this;
    
    // Objects
    self.tags = (function(){
        var obj = this, tags = {loading:true}, el = angular.element(document.documentElement);
        obj.set = function(name, value){
            if(value && !tags[name]){
                tags[name] = true;
                el.addClass('app-' + name);
            }else if(!value && tags[name]){
                delete tags[name];
                el.removeClass('app-' + name);
            };
            return obj;
        };
        obj.get = function(name){
            return !!tags[name];
        };
        obj.del = function(mask){
            for(var name in tags){name.indexOf(mask) >= 0 && obj.set(name, false);};
            return obj;
        };
        obj.all = function(prefix){
            var data = ['']; for(var name in tags){data.push(name)};
            return data.join(' ' + (prefix == undefined ? 'app-' : prefix)).substring(1);            
        };
        obj.list = function(){
            return tags;
        };
        return obj;
    }).call({});

    self.getUrlString = function(data, json){
        var serialize = function(obj, prefix){
            var result = [];
            for(var key in obj){
                var value = obj[key] == null ? '' : obj[key];
                var key = prefix ? prefix + '[' + key + ']' : key
                value != 'undefined' && result.push(
                    angular.isObject(value) ? (json ? key + '=' + encodeURIComponent(angular.toJson(value)) : serialize(value, key)) : key + '=' + encodeURIComponent(value)
                );
            };
            return result.join('&');
        };
        return serialize(data);
    };

    self.getUrlParams = function(url){
        var result = {};
        var isArray = /^([a-zA-Z0-9]+)((\[\d+\])|(%5B\d+%5D))$/;
        url.replace(/#.*$/, '').replace(/([^=&\?\/\.]+)=([^&]*)/g, function(str, key, value){
            value = decodeURIComponent(decodeURI(value));
            if(isArray.test(key)){
                key = key.replace(isArray, '$1');
                result[key] = result[key] || [];
                result[key].push(value);
            }else{
                result[key] = value;
            };
        });
        return result;
    };
    
    self.getUrlParam = function(url, name){
        return ((new RegExp('[?&#]+' + name + '=([^&#]*)')).exec(url) || [])[1] || '';
    };
    
    self.strMap = function(str, map){
        if(angular.isObject(map)){
            for(var i in map){str = str.replace(new RegExp('\{\{' + i + '\}\}', 'g'), map[i]);};
            str = str.replace(/\{\{[a-zA-Z0-9_]+\}\}/, '');
        }else{
            str = str.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, map);
        };
        return str;
    };

    self.getAppdataParams = function(url){
        var result; if(!url){return {};};
        //...?app_data=key1(value1)key2(value2) - object
        //...?app_data=0((value1))1((value2)) - array
        url.replace(/([0-9a-zA-Z_]+)\(\(?(.+?)(\)\)?|$)/g, function(str, key, value, bracket){
            result = result || (bracket == '))' ? [] : {});
            result[key] = decodeURIComponent(unescape(value));
            if(/^\d+$/.test(result[key])){
                result[key] = parseInt(result[key], 10);
            }else if(/^\d+\.\d+$/.test(result[key])){
                result[key] = parseFloat(result[key]);
            }else if(/^["\[\{].+/.test(result[key])){
                try{result[key] = JSON.parse(result[key]);}catch(e){result[key] = undefined;};
            };
        });
        return result;
    };
    
    self.getAppdataString = function(obj){
        var result = [], brackets = angular.isArray(obj) ? ['((', '))'] : ['(', ')']
        for(var key in obj){
            var value = obj[key] == null ? '' : obj[key];
            if(angular.isDefined(value)){
                try{
                    value = escape(angular.isObject(value) || angular.isArray(value) ? encodeURIComponent(angular.toJson(value)) : encodeURIComponent(value));
                    result.push(key + brackets[0] + value + brackets[1]);
                }catch(e){};
            };
        };
        return result.join('');
    };

    self.getRange = function(start, end, step){
        start *= 1; end *= 1; step = Math.abs(step || 1);
        if(arguments.length == 1){end = Math.max(start - 1, 0); start = 0;};
        var arr = [], dec = end < start; step *= dec ? -1 : 1;
        while(dec ? start > end : start < end){
            arr.push(start);
            start += step;
        };
        arr.push(end);
        return arr;
    };
    
    self.getRandom = function(min, max){
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    self.getRandomItem = function(list){
        return list[Math.floor(Math.random() * list.length)];
    };

    self.listFind = function(list, find){
        var result = [], search = function(l, f, i){
            if(l.indexOf){
                i = l.indexOf(f);
                return i < 0 ? false : i;
            }else{
                i = l.length;
                while(i--){if(l[i] == f){return i;};}
                return false;
            };
        };
        if(angular.isArray(find)){
            find.forEach(function(v){
                result.push(search(list, v));
                if(!result[result.length - 1]){return false;};
            });
            return result;
        }else{
            return search(list, find);
        };
    };
    
    self.getElementOffset = function(el, parent, isScroll){
        var result = {x:0, y:0};
        while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop) && (!parent || (parent && parent != el))){
            result.x += el.offsetLeft - (isScroll ? el.scrollLeft : 0);
            result.y += el.offsetTop - (isScroll ? el.scrollTop : 0);
            el = el.offsetParent;
        };
        return result;
    };
    
    self.getParentBySelector = function(el, parentSelector){
        var all = document.querySelectorAll(parentSelector);
        el = el.parentNode;
        while(el){
            if(self.listFind(all, el) === false){
                el = el.parentNode;    
            }else{
                return el;
            };
        };
        return null;
    };
    
    self.objectMap = function(obj, callback){
        for(var key in obj){
            angular.isObject(obj['key']) ? self.objectMap(obj['key']) : callback(key, obj['key'], obj);
        };
    };
    
    self.getWindow = function(url, w, h){
        var p =['location'];
        var l = w ? (screen.width - w) / 2 >> 0 : 0;
        var t = h ? (screen.height - h) / 2 >> 0 : 0;
        w && p.push('width=' + w) && p.push('left=' + l);
        h && p.push('height=' + h) && p.push('top=' + t);
        var win = window.open(url, 'win' + new Date().getTime(), p.join(','));
        win && win.focus && win.focus();
        return win;
    };
    
    // Set
    self.setViewportContent = function(str){
        var content = '';
        if(typeof(document.querySelector) != 'undefined'){
            var element = document.querySelector('meta[name="viewport"]');
            content = element.getAttribute('content');
            element.setAttribute('content', str);
        };
        return content;
    };   

    self.setViewport = function(width, initScale, minScale, maxScale, scalable){
        var content = '', attr = [], delim = ',';
        width && attr.push('width=' + width);
        initScale && attr.push('initial-scale=' + initScale);
        minScale && attr.push('minimum-scale=' + minScale);
        maxScale && attr.push('maximum-scale=' + maxScale);
        scalable && attr.push('user-scalable=' + scalable);
        return self.setViewportContentfunction(attr.join(delim));
    };
    
    self.scrollTo = function(x, y, holderSelector, animateDuration, onFinish, onStart){
        if(holderSelector){
            var h = angular.isString(holderSelector) ? document.querySelector(holderSelector) : holderSelector;
            if(!h){return;};
            if(animateDuration){
                return self.animate(
                    [h.scrollLeft, h.scrollTop],
                    [x || 0, y || 0],
                    animateDuration,
                    function(v){h.scrollLeft = v[0]; h.scrollTop = v[1];},
                    function(v){h.scrollLeft = v[0]; h.scrollTop = v[1]; angular.isFunction(onFinish) && onFinish();},
                    onStart
                );
            }else{
                angular.isFunction(onStart) && onStart();
                h.scrollLeft = x || 0;
                h.scrollTop = y || 0;
                angular.isFunction(onFinish) && onFinish();
            };
        }else{
            if(animateDuration){
                return self.animate(
                    [window.scrollX, window.scrollY]
                    [x || 0, y || 0],
                    animateDuration,
                    function(v){window.scrollTo(v[0], v[1]);},
                    function(v){window.scrollTo(v[0], v[1]); angular.isFunction(onFinish) && onFinish();},
                    onStart
                );
            }else{
                angular.isFunction(onStart) && onStart();
                window.scrollTo(x, y);
                angular.isFunction(onFinish) && onFinish();
            };            
        };
    };
    self.scrollToElement = function(elementSelector, holderSelector, xOffset, yOffset, animateDuration, onFinish, onStart){
        var e = angular.isString(elementSelector) ? document.querySelector(elementSelector) : elementSelector;
        var h = holderSelector ? (angular.isString(holderSelector) ? self.getParentBySelector(e, holderSelector) : holderSelector) : document.body;
        if(!h || !e){return;};
        var offset = self.getElementOffset(e, h);
        if(animateDuration){
            return self.animate(
                [h.scrollLeft, h.scrollTop],
                [offset.x + (xOffset || 0), offset.y + (yOffset || 0)],
                animateDuration,
                function(v){h.scrollLeft = v[0]; h.scrollTop = v[1];},
                function(v){h.scrollLeft = v[0]; h.scrollTop = v[1]; angular.isFunction(onFinish) && onFinish();},
                onStart
            );
        }else{
            angular.isFunction(onStart) && onStart();
            h.scrollLeft = offset.x + (xOffset || 0);
            h.scrollTop = offset.y + (yOffset || 0);
            angular.isFunction(onFinish) && onFinish();
        };
    };
    
    self.animate = function(from, to, duration, onFrame, onFinish, onStart, onCancel, fps){
        var isArray = angular.isArray(from);
        from = isArray ? from : [from];
        to = angular.isArray(to) ? to : [to];
        
        fps = fps || 60;
        duration = parseFloat(duration, 10) || 1000; duration = duration > 1 ? duration : duration * 1000;
        
        var i, l, stop, now, delta, stamp = Date.now(), rate = 1000 / fps, values = [], steps = [], finish = true, cancel = function(){stop = true;};
        for(i = 0, l = from.length; i < l; i++){
            if(to.length <= i){return;};
            from[i] = from[i] || 0;
            to[i] = to[i] || 0;
            finish = finish && from[i] == to[i];
            values.push(from[i]);
            steps.push(Math.abs(to[i] - from[i]) / duration * rate * (from[i] > to[i] ? -1 : 1));
        };
        if(finish){
            angular.isFunction(onStart) && onStart(isArray ? from : from[0]);
            angular.isFunction(onFinish) && onFinish(isArray ? to : to[0]);
            return;
        };
        var timeout = (function(){
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
            function(callback, element){window.setTimeout(callback, Math.round(rate));};
        })();
        var iteration = function(){
            now = Date.now();
            delta = now - stamp;
            if(stop){
                onCancel && onCancel.apply({}, isArray ? [values, from, to] : [values[0], from[0], to[0]]);
                return;
            };
            if(delta >= rate){
                finish = true;
                for(i = 0, l = from.length; i < l; i++){
                    values[i] += steps[i] * delta / rate;
                    finish = finish && (values[i] == to[i] || (to[i] > from[i] ? values[i] > to[i] : values[i] < to[i]));
                };
                if(finish){
                    angular.isFunction(onFinish) && onFinish(isArray ? to : to[0]);
                }else{
                    angular.isFunction(onFrame) && onFrame.apply({}, isArray ? [values, from, to] : [values[0], from[0], to[0]]);
                    timeout(iteration);
                };
                stamp = now;
            }else{
                timeout(iteration);
            };
        };
        angular.isFunction(onStart) && onStart(isArray ? from : from[0]);
        timeout(iteration);
        return cancel;
    };
    
    // Require
    self.require = function(condition, src1, src2){
        self.include(condition ? src1 : src2);
    };
    
    self.include = function(src){
        if(/.+.js$/.test(src)){
            document.writeln('<script src="' + src + '" type="text/javascript"></' + 'script>');
        }else if(/.+.css$/.test(src)){
            document.writeln('<link rel="stylesheet" type="text/css" href="' + src + '" />');
        };
    };
    
    app.$Tools = self;
    return self;
}).call({}))

// Events --------------------------
// popup                         type, scope
// popup:open                    scope
// popup:load                    scope
// popup:animate:load:start      scope
// popup:animate:load:end        scope
// popup:close                   scope
// popup:animate:close:start     scope
// popup:animate:close:end       scope
.factory('popup', ['$injector', function($injector){
    var
    $compile   = $injector.get('$compile'),
    $timeout   = $injector.get('$timeout'),
    $window    = $injector.get('$window'),
    $tools     = $injector.get('tools'),
    $document  = $injector.get('$document'),
    $rootScope = $injector.get('$rootScope');
    
    var broadcast = function(type, data){
        return $timeout(function(){
            $rootScope.$broadcast('popup', {type:type, data:data});
            $rootScope.$broadcast('popup:' + type, data);
        }, 10);
    };
    
    var self = {
        count: 0,
        stack: {},
        countBySkin: {},
        create: function(path, $scope, skin, defs){
            path = path.replace(/\/+$/, '');
            skin = skin || 'skin.html';
            defs = angular.extend({
                onShow:null,
                onLoad:null,
                onClose:null,
                autoClose:true,
                autoCloseOutside:true,
                isClosable:true,
                isFocusable:true,
                focusableOffset:40,
                cssClass:'',
                closeDelay:0,
                loadDelay:0,
                useScope:null,
                isolateScope:false,
                swipeSensitivity:0,
                listeners:[]
            }, defs || {});
            return {
                show: function(file, data, options){
                    var
                    popup,
                    popupTmpl,
                    scrollTop,
                    options = angular.extend({}, angular.copy(defs), options || {}),
                    underFB = angular.isDefined(window['FB']) && $rootScope.config && $rootScope.config.fb && ($rootScope.config.fb.isTab || $rootScope.config.fb.isCanvas),                    
                    $popupScope = (options.useScope || $scope || $rootScope).$new(options.isolateScope);
                    
                    var closeCallback = false;
                    var loadCallback = false;
                    var callListeners = function(action){
                        angular.forEach($popupScope.popupListeners, function(method){
                            angular.isFunction(method) && method.call($popupScope, action);
                        })
                    };
                    var duration = function(el){
                        if(angular.isDefined(window.getComputedStyle)){
                            var s = window.getComputedStyle(el);
                            var dur = parseFloat(
                                s['transition-duration'] ||
                                s['-webkit-transition-duration'] ||
                                s['-ms-transition-duration'] ||
                                s['-moz-transition-duration'] ||
                                s['-o-transition-duration']
                            ) || 0;
                            var del = parseFloat(
                                s['transition-delay'] ||
                                s['-webkit-transition-delay'] ||
                                s['-ms-transition-delay'] ||
                                s['-moz-transition-delay'] ||
                                s['-o-transition-delay']
                            ) || 0;
                            return (dur > 1000 ? dur : dur * 1000) + (del > 1000 ? del : del * 1000);
                        };
                        return 0;
                    };
                    
                    $popupScope.popupId = 'popup_' + String((new Date).getTime()) + Math.round(Math.random() * 1000000);
                    $popupScope.popupInitHeight = 0;
                    $popupScope.popupInitWidth = 0;
                    $popupScope.popupInitContentHeight = 0;
                    $popupScope.popupInitContentWidth = 0;
                    $popupScope.popupInitMarginTop = 0;
                    $popupScope.popupIsAutoClose = options.autoClose;
                    $popupScope.popupIsAutoCloseOutside = options.autoCloseOutside;
                    $popupScope.popupIsClosable = options.isClosable;
                    $popupScope.popupLoadDelay = options.loadDelay;
                    $popupScope.popupCloseDelay = options.closeDelay;
                    $popupScope.popupIsFocusable = options.isFocusable;
                    $popupScope.popupCssClass = options.cssClass;
                    $popupScope.popupSkinClass = (path).replace(/[\.\/\\]+/g, '-').replace(/^-+|-+$/g, '');
                    $popupScope.popupInstanceClass = (file).replace(/[\.\/\\]+/g, '-').replace(/^-+|-+$/g, '');
                    $popupScope.popupClass = $popupScope.popupSkinClass + ' ' + $popupScope.popupInstanceClass;
                    $popupScope.popupFile = file;
                    $popupScope.popupTpl = path + '/' + file;
                    $popupScope.popupData = data || '';
                    $popupScope.popupSkin = path + '/' + skin;
                    $popupScope.popupListeners = options.listeners || [];
                    $popupScope.getPopupScope = function(){return $popupScope;};
                    $popupScope.getPopupOptions = function(){return options;};
                    $popupScope.popupClose = function(noOnClose, isAutoClose, noAnimationNoDelay){
                        var close = function(){
                            if(closeCallback){return;};
                            closeCallback = true;
                            popup && angular.element(popup).removeClass('popup-animate-close');
                            callListeners('animate:close:end');
                            broadcast('animate:close:end', $popupScope);

                            self.count--;
                            self.countBySkin[$popupScope.popupSkinClass]--;
                            
                            callListeners('close');
                            broadcast('close', $popupScope);
                            $tools.tags.set($popupScope.popupSkinClass, !!self.countBySkin[$popupScope.popupSkinClass]).set($popupScope.popupInstanceClass, false);
                            
                            delete self.stack[$popupScope.popupId];
                            angular.isDefined(scrollTop) && (underFB ? FB.Canvas.scrollTo(0, scrollTop) : $window.scrollTo(0, scrollTop));
                            
                            $timeout(function(){
                                popup && popup.parentElement && popup.parentElement.removeChild(popup);
                                popupTmpl && popupTmpl.parentElement && popupTmpl.parentElement.removeChild(popupTmpl);
                                $popupScope.$destroy();
                            }, 100);
                        };
                        var tmp = function(){
                            if(!popup){return;};
                            document.activeElement && document.activeElement.blur && document.activeElement.blur();
                            popup && angular.element(popup).addClass('popup-on-close popup-animate-close');
                            callListeners('animate:close:start');
                            broadcast('animate:close:start', $popupScope);
                            $timeout(function(){
                                if(noAnimationNoDelay){
                                    close();
                                }else{
                                    var d = duration(popup) || 0;
                                    if(d){
                                        angular.element(popup).one('webkitTransitionEnd msTransitionEnd mozTransitionEnd oTransitionEnd transitionend', function(){
                                            $timeout(close, $popupScope.popupCloseDelay || 10);
                                        });
                                        $timeout(function(){close();}, d + $popupScope.popupCloseDelay || 10); // life hack to prevent the transition error
                                    }else{
                                        $timeout(close, $popupScope.popupCloseDelay || 10);
                                    };
                                };
                            }, 100);
                        };
                        if(!noOnClose && angular.isFunction(options.onClose)){
                            if(options.onClose.call($popupScope, !!isAutoClose)){
                                return true;
                            };
                            tmp();
                        }else{
                            tmp();
                        };
                    };
                    $popupScope.popupAutoClose = function(e){
                        if(!$popupScope.popupIsAutoClose || !$popupScope.popupIsClosable || (e && e.type == 'click' && !$popupScope.popupIsAutoCloseOutside)){return;};
                        var el = e.target;
                        while(el){
                            if(el.className.indexOf && el.className.indexOf('popup-content') >= 0){
                                return;
                            }else if(el.id == $popupScope.popupId){
                                $popupScope.popupClose(undefined, true);
                                e.stopPropagation();
                                e.preventDefault();
                                return false;
                            }else{
                                el = el.parentElement;
                                if(el && el.nodeName == 'BODY'){return;};
                            };
                        };
                    };
                    $popupScope.popupOnload = function(){
                        $tools.tags.set($popupScope.popupSkinClass, true).set($popupScope.popupInstanceClass, true);
                        $timeout(function(){
                            popup = document.getElementById($popupScope.popupId);
                            $popupScope.popupInitWidth = popup ? Math.max(popup.offsetWidth || 0, popup.clientWidth || 0) : 0;
                            $popupScope.popupInitHeight = popup ? Math.max(popup.offsetHeight || 0, popup.clientHeight || 0) : 0;
                            var content = popup.querySelector('.popup-content');
                            $popupScope.popupInitContentWidth = content ? Math.max(content.offsetWidth || 0, content.clientWidth || 0) : 0;
                            $popupScope.popupInitContentHeight = content ? Math.max(content.offsetHeight || 0, content.clientHeight || 0) : 0;
                            $popupScope.popupInitMarginTop = Math.max(($popupScope.popupInitHeight - $popupScope.popupInitContentHeight) / 2, 0);
                            if(popup){
                                angular.element(popup).addClass('popup-on-load popup-animate-load');
                                callListeners('animate:load:start');
                                broadcast('animate:load:start', $popupScope);
                                var done = function(){
                                    if(loadCallback){return;};
                                    loadCallback = true;
                                    popup && angular.element(popup).removeClass('popup-animate-load');
                                    callListeners('animate:load:end');
                                    broadcast('animate:load:end', $popupScope);
                                };
                                var d = duration(popup) || 0;
                                if(d){
                                    angular.element(popup).one('webkitTransitionEnd msTransitionEnd mozTransitionEnd oTransitionEnd transitionend', function(){
                                        $timeout(done, $popupScope.popupLoadDelay || 10);
                                    });
                                    $timeout(function(){done();}, d + $popupScope.popupLoadDelay || 10); // life hack to prevent the transition error
                                }else{
                                    $timeout(done, $popupScope.popupLoadDelay || 10);
                                };
                                if(options.isFocusable){
                                    var el = angular.isDefined(popup.querySelector) ? popup.querySelector('[ng-include]') : popup;
                                    var pos = $tools.getElementOffset(el);
                                    if(underFB){
                                        FB.Canvas.getPageInfo(function(data){scrollTop = data.scrollTop;});
                                        FB.Canvas.scrollTo(0, pos.y - options.focusableOffset);
                                    }else{
                                        scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                                        $window.scrollTo(0, pos.y - options.focusableOffset);
                                    };
                                };
                                options.swipeSensitivity && $popupScope.popupIsClosable && (function(){
                                    var 
                                    from, dif, timer,
                                    touch = false, cancel = false,
                                    autoCloseOutside = $popupScope.popupIsAutoCloseOutside,
                                    el = content || popup,
                                    property = el.style.transitionProperty || el.style.webkitTransitionProperty || el.style.msTransitionProperty || '',
                                    duration = el.style.transitionDuration || el.style.webkitTransitionDuration || el.style.msTransitionDuration || '',
                                    transform = el.style.transform || el.style.webkitTransform || el.style.msTransform || '',
                                    shadow = el.style.boxShadow || '',
                                    width = Math.max(document.body.clientWidth, document.body.offsetWidth),
                                    height = Math.max(document.body.clientHeight, document.body.offsetHeight);
                                    
                                    var touchEl = angular.element('<div class="popup-touch-section"></div>').css({
                                        position:'absolute', left:0, top:0, bottom:0, opacity: 0.001, cursor:'pointer',
                                        width:options.swipeSensitivity + 'px',
                                        backgroundColor:'#000',
                                    });
                                    angular.element(popup).append(touchEl);
                                    
                                    var move = function(x, y, dim, dur, prop){
                                        x = Math.min(width, x || 0); y = Math.min(height, y || 0); dim = dim || 'px'; dur = dur || '0s';
                                        if(prop){el.style.transitionProperty = el.style.webkitTransitionProperty = el.style.msTransitionProperty = prop;};
                                        el.style.transitionDuration = el.style.webkitTransitionDuration = el.style.msTransitionDuration = dur;  
                                        el.style.transform = el.style.webkitTransform = el.style.msTransform = [transform, 'translate3d(' + x + dim +', ' + y + dim + ', 0px)'].join(' ');
                                    };
                                    var reset = function(noTransition){
                                        var r = function(){
                                            el.style.transitionProperty = el.style.webkitTransitionProperty = el.style.msTransitionProperty = property;
                                            el.style.transitionDuration = el.style.webkitTransitionDuration = el.style.msTransitionDuration = duration;
                                            el.style.transform = el.style.webkitTransform = el.style.msTransform = transform;
                                            el.style.boxShadow = el.style.webkitBoxShadow = shadow;
                                            cancel = false;
                                            touch = false;
                                            from = 0;
                                            dif = 0;                                            
                                        };
                                        if(noTransition){
                                            r();
                                        }else{
                                            var t = Math.min((Date.now() - timer) / 1000, 0.5);
                                            cancel = true;
                                            move(0, 0, 'px', t + 's', angular.isDefined(el.style.webkitTransitionProperty) ? '-webkit-transform' : 'transform');
                                            $timeout(function(){r();}, t * 1000 + 100);
                                        };
                                    };
                                    var touchHandler = function(e){
                                        if(touch){return;};
                                        from = e.pageX || (e.touches && e.touches[0].pageX) || 0;
                                        if(from > options.swipeSensitivity){from = 0; return;};
                                        touch = true;
                                        timer = Date.now();
                                        el.style.boxShadow = '-20px 0px 20px rgba(0,0,0,0.4)';
                                        el.style.pointerEvents = 'none';
                                        
                                        $popupScope.popupIsAutoCloseOutside = false;
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                    };
                                    var moveHandler = function(e){
                                        if(!touch || cancel){return;};
                                        dif = (e.pageX || (e.touches && e.touches[0].pageX) || 0) - from;
                                        move(dif, 0);

                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                    };
                                    var cancelHandler = function(e){
                                        el.style.pointerEvents = '';
                                        if(!touch){return;};
                                        if(dif > width / 3){
                                            cancel = true;
                                            var t = Math.min((Date.now() - timer) / 1000, 0.5);
                                            move(width, 0, 'px', t + 's', angular.isDefined(el.style.webkitTransitionProperty) ? '-webkit-transform' : 'transform');
                                            $timeout(function(){
                                                el.style.boxShadow = el.style.webkitBoxShadow = shadow;
                                                $popupScope.popupClose(undefined, undefined, true) && reset(true);
                                            }, t * 1000 + 100);
                                        }else{
                                            reset();
                                        };
                                        $timeout(function(){
                                            $popupScope.popupIsAutoCloseOutside = autoCloseOutside;
                                        }, 100);
                                    };
                                    var register = function(){
                                        touchEl.bind('mousedown touchstart', touchHandler);
                                        $document.bind('mousemove touchmove', moveHandler);
                                        $document.bind('mouseup touchend touchcancel', cancelHandler);
                                    };
                                    var unregister = function(){
                                        touchEl.unbind('mousedown touchstart', touchHandler);
                                        $document.unbind('mousemove touchmove', moveHandler);
                                        $document.unbind('mouseup touchend touchcancel', cancelHandler);
                                    };
                                    register();
                                    $popupScope.$on('$destroy', function(){unregister();});
                                })();
                            };
                        }, 100);
                        callListeners('load');
                        broadcast('load', $popupScope);
                        angular.isFunction(options.onLoad) && options.onLoad.call($popupScope);
                    };
                    var tmp = ['<div',
                    ' id="', $popupScope.popupId, '"',
                    ' class="popup popup-on-show ', $popupScope.popupClass, '"',
                    ' ng-class="popupCssClass"',
                    ' ng-click="popupAutoClose($event)"',
                    ' ng-include="\'' + $popupScope.popupSkin + '\'"',
                    !$popupScope.popupIsAutoClose ? ' ontouchstart="event.target.id==\'' + $popupScope.popupId + '\'&&event.preventDefault();"' : '',
                    '></div>'].join('');
                    $compile(tmp)($popupScope, function(result){
                        popupTmpl = result[0];
                        if($popupScope.popupIsFocusable){
                            scrollTop = document.documentElement.scrollTop || document.body.scrollTop || 0;
                        };
                        document.activeElement && document.activeElement.blur && document.activeElement.blur();
                        if(document.selection && document.selection.empty){document.selection.empty();}
                        else if(window.getSelection){window.getSelection().removeAllRanges();};
                        document.body.appendChild(popupTmpl);
                        angular.isFunction(options.onShow) && options.onShow.call($popupScope);
                        callListeners('open');
                        broadcast('open', $popupScope);
                    });
                    self.count++;
                    self.countBySkin[$popupScope.popupSkinClass] = self.countBySkin[$popupScope.popupSkinClass] || 0;
                    self.countBySkin[$popupScope.popupSkinClass]++
                    self.stack[$popupScope.popupId] = $popupScope;
                    return $popupScope;
                },
                hide: function(id, noOnClose){
                    var s = path + '/' + skin;
                    if(id){
                        var scope = self.stack[id];
                        scope && scope.popupSkin == s && scope.popupClose(noOnClose);
                    }else{
                        for(var i in self.stack){
                            if(self.stack[i].popupSkin == s){
                                self.stack[i].popupClose(noOnClose);
                            };
                        };
                    };
                }
            }
        },
        getTop: function(){
            var list = document.querySelectorAll('body > .popup'); if(!list.length){return null;};
            return angular.element(document.querySelectorAll('body > .popup')[list.length - 1]).scope();
        },
        closeTop: function(noOnClose){
            var scope = self.getTop();
            scope && scope.popupClose && scope.popupClose(noOnClose);
        },
        closeById: function(id, noOnClose){
            self.stack[id] && self.stack[id].popupClose(noOnClose);
        },        
        closeByTpl: function(file, noOnClose){
            for(var i in self.stack){
                if(self.stack[i].popupFile == file){
                    self.stack[i].popupClose(noOnClose);
                    break;
                };
            };
        },
        closeAll: function(file, noOnClose){
            for(var i in self.stack){
                self.stack[i].popupClose(noOnClose);
            };
        },
        isByTpl: function(file){
            for(var i in self.stack){
                if(self.stack[i].popupFile == file){
                    return true;
                };
            };
            return false;
        }
    };
    angular.element(document).bind('backbutton keydown', function(e){
        if(e.type == 'keydown' && e.keyCode != 27){return;};
        var scope = self.getTop();
        scope && scope.popupIsAutoClose && scope.popupIsClosable && scope.popupClose && scope.popupClose(undefined, true);
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    
    return self;
}])

.directive('appInit', ['$injector', function($injector){
    return{
        restrict: 'A',
        link: function($scope, $element, attributes){
            $injector.get('tools').tags.set('loading', false);
            $injector.get('$rootScope').$broadcast('app:init', {scope:$scope, element:$element});
        }
    };
}])

.run(['$injector', function($injector){
    var
    $config    = $injector.get('config'),
    $tools     = $injector.get('tools'),
    $agent     = $injector.get('agent'),
    $cookie    = $injector.get('cookie'),
    $timeout   = $injector.get('$timeout'),
    $rootScope = $injector.get('$rootScope'),
    $location  = $injector.get('$location'),
    $http      = $injector.get('$http');
    
    document.documentElement.setAttribute('app-init', 'true');

    $http.defaults.headers.common['X-App-Version'] = ($config.app && $config.app.version) || 1;
    if(!$config.app.jsonPayload){
        $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
        $http.defaults.transformRequest = [function(data){
            return angular.isObject(data) && String(data) !== '[object File]' ? $tools.getUrlString(data) : data;
        }];
    };

    $rootScope.agent = $agent;
    $rootScope.cookie = $cookie;
    $rootScope.config = $config;
    $rootScope.tags = $tools.tags;

    $tools.tags
    .set('phase' + ($config.app.phase || 1), true)
    .set($agent.name, true)
    .set($agent.device, true)
    .set($agent.browser, true)
    .set($agent.browser + '-' + $agent.version, true)
    .set($agent.os, true)
    .set($agent.engine, true)
    .set('webkit-' + $agent.webkitInt, true)
    .set('standalone', $agent.isStandalone)
    .set('transition', $agent.transition)

    $rootScope.$on('$routeChangeStart', function(e, next, current){
        $tools.tags.set('process', true);
    });
    $rootScope.$on('$routeChangeSuccess', function(e, next, current){
        var r = $location.path().replace(/(^\/+)|(\/.+)/g, '');
        var p = $location.path().replace(/^\/+/, '').replace(/\/+/g, '-');
        $tools.tags.del('route-');
        r && $tools.tags.set('route-' + r, true); 
        p && $tools.tags.set('route-' + p, true); 
        $rootScope.route = r;
        $tools.tags.set('process', false);
    });

    $rootScope.safeApply = function(scope, fn){
        scope = scope || this;
        if(!scope.$root || ({$apply:1, $digest:1})[scope.$root.$$phase]){
            angular.isFunction(fn) && fn();
        }else{
            scope.$apply(fn);
        };
    };
    app.$Root = $rootScope;
    app.$Config = $config;
}]);

//------------------------------------------------------ end
}(angular);
!function(){
    var f = function(){/* ... */};
    if(!window.console){window.console = {log:f, info:f, warn:f, debug:f, error:f};};
}();