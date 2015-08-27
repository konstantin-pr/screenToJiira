!function(angular){
'use strict';
(window.app || (window.app = angular.module('app', [])))
//------------------------------------------------------ start

.service('dubug', ['$injector', function($injector){
    var
    self       = this,
    $compile   = $injector.get('$compile'),
    $scope     = $injector.get('$rootScope').$new();
    
    self.bar = null;
    self.init = function(bar){
        var tmpl = '', obj = {}; if(self.bar){return;};
        angular.forEach(bar, function(value){
            var id = 'appDebugBar_' + String((new Date).getTime()) + Math.round(Math.random() * 1000000); obj[id] = value;
            tmpl += '<li ng-click="action(\'' + id + '\');">' + value.title + '</li>';
        });
        self.bar = obj;
        tmpl = '<div id="appDebugBar" ng-controller="appDebugBarController">app<ul>' + tmpl + '</ul></div>';
        $compile(tmpl)($scope, function(result){document.body.appendChild(result[0]);});
    };
    return self;
}])

.controller('appDebugBarController', ['$injector', '$scope', function($injector, $scope){
    var
    bar        = $injector.get('dubug').bar,
    $http      = $injector.get('$http');
    
    $scope.action = function(id){
        var action = bar[id] && bar[id].action;
        if(!action){return;};
        if(angular.isFunction(action)){
            var result = action.call();
            result && (angular.isString(result) ? alert(result) : console.log(result));
        }else if(angular.isString(action)){
            action = action.replace(/{{[^{}]*}}/g, function(str, key, value){
                return prompt('Please enter "' + str.replace(/[{}]/g, '') + '":');
            });
            $http.post(action).then(function(response){
                if(!response || !response.data.success){return;};
                response.data.data && (angular.isString(response.data.data) ? alert(response.data.data) : console.log(response.data.data));
			});
        };
    };
}])

.run(['$injector', function($injector){
    var
    $facebook  = typeof(window['FB']) != 'undefined' && $injector.get('facebook'),
    $config    = $injector.get('config');
        
    $injector.get('$rootScope').$on('app:init', function(){
        $injector.get('dubug').init([
            {
                title: 'Authorize user',
                action: function(){$facebook && $facebook.login();}
            },{
                title: 'Deauthorize user',
                action: function(){$facebook && $facebook.deauthorize(function(){document.location.reload();});}
            },{
                title: 'Add app to page',
                action: function(){$facebook && $facebook.pagetab();}
            },{
                title: 'Delete me',
                action: '/debug/user.delete'
            },{
                title: 'Delete any user',
                action: '/debug/user.delete?id={{userFbId}}'
            },{
                title: 'Update DB Schema',
                action: '/debug/db.update'
            },{
                title: 'Clear DB Cache',
                action: '/debug/db.clear'
            }
        ]);
    });
}]);

//------------------------------------------------------ end
}(angular);