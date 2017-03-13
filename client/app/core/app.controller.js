(function () {
    'use strict';

    angular.module('app')
        .controller('AppCtrl', [ '$scope', '$rootScope', '$location', '$document', 'appConfig', 'authService', AppCtrl]); // overall control
    
    function AppCtrl($scope, $rootScope, $location, $document, appConfig, authService) {

        $scope.pageTransitionOpts = appConfig.pageTransitionOpts;
        $scope.main = appConfig.main;
        $scope.color = appConfig.color;

        $scope.user = authService.user();

        $scope.logout = function(){

            authService.logout().$promise.then(function() {
                $window.localStorage.removeItem('token');
            });

            $location.search({intended:$location.url()}).path('signin');
        };

        window.$scope = $scope;

        $scope.$watch('user', function(user) {
            if(user.$resolved !== false && !user._id && $location.path() !== '/signin') {
                $location.search({intended:$location.url()}).path('signin');
            }
            else if(user._id && $location.path() === '/signin') {
                $location.url($location.search().intended || '/');
            }
        }, true);

        $rootScope.$on("$routeChangeSuccess", function (event, currentRoute, previousRoute) {
            $document.scrollTo(0, 0);
        });
    }

})(); 