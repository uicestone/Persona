(function () {
    'use strict';

    angular.module('app')
        .directive('customPage', customPage);


    // add class for specific pages to achieve fullscreen, custom background etc.
    function customPage() {

        return {
            restrict: 'A',
            controller: ['$scope', '$element', '$location', '$rootScope', customPageCtrl]
        };

        function customPageCtrl($scope, $element, $location, $rootScope) {
            var addBg, path;

            path = function() {
                return $location.path();
            };

            addBg = function(path) {
                $element.removeClass('on-canvas');
                $element.removeClass('body-wide body-err body-lock body-auth body-welcome body-customer-collecting');
                switch (path) {
                    case '/welcome':
                        return $element.addClass('body-welcome');
                    case '/404':
                    case '/500':
                        return $element.addClass('body-wide body-err');
                    case '/signin':
                    case '/signup':
                    case '/forgot-password':
                        return $element.addClass('body-wide body-auth');
                    case '/lock-screen':
                        return $element.addClass('body-wide body-lock');
                }

                if (path.match(/\/customer\/collecting/)) {
                    return $element.addClass('body-wide body-customer-collecting');
                }
            };

            addBg($location.path());

            $rootScope.$on('$routeChangeSuccess', function() {
                return addBg($location.path());
            });
        }        
    }
 
})(); 


