(function () {
    'use strict';

    angular.module('app.page')
    .controller('invoiceCtrl', ['$scope', '$window', invoiceCtrl])
    .controller('authCtrl', ['$scope', '$window', '$location', '$http', 'authService', authCtrl]);

    function invoiceCtrl($scope, $window) {
        var printContents, originalContents, popupWin;
        
        $scope.printInvoice = function() {
            printContents = document.getElementById('invoice').innerHTML;
            originalContents = document.body.innerHTML;        
            popupWin = window.open();
            popupWin.document.open();
            popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="styles/main.css" /></head><body onload="window.print()">' + printContents + '</html>');
            popupWin.document.close();
        }
    }

    function authCtrl($scope, $window, $location, $http, authService) {

        $scope.login = function() {
            $scope.$parent.$parent.user = authService.login($scope.username, $scope.password);
        }

        $scope.signup = function() {
            $location.url('/')
        }

        $scope.reset = function() {
            $location.url('/')
        }

        $scope.unlock = function() {
            $location.url('/')
        }     

        $scope.updateUser = function(user) {
            user.$save();
        };

        $http.get('http://localhost:8080/api/wechat-auth').then(function (res) {
            $scope.wechatAuthUrl = res.data + encodeURIComponent('http://localhost:8080/api/wechat-auth?intendedUri=' + $location.url() + '&homeUrl=' + window.location.protocol + '//' + window.location.host);
        });
    }

})(); 



