(function () {
    'use strict';

    angular.module('app.page')
        .directive('customPage', customPage);


    // add class for specific pages to achieve fullscreen, custom background etc.
    function customPage() {
        var directive = {
            restrict: 'A',
            controller: ['$scope', '$element', '$location', customPageCtrl]
        };

        return directive;

        function customPageCtrl($scope, $element, $location) {
            var addBg, path;

            path = function() {
                return $location.path();
            };

            addBg = function(path) {
                $element.removeClass('on-canvas');
                $element.removeClass('body-wide body-err body-lock body-auth');
                switch (path) {
                    case '/welcome':
                        return $element.addClass('body-wide body-welcome');
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
            };

            addBg($location.path());

            $scope.$watch(path, function(newVal, oldVal) {
                if (newVal === oldVal) {
                    return;
                }
                return addBg($location.path());
            });
        }        
    }
 
})(); 


