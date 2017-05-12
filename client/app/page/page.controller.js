(function () {
    'use strict';

    angular.module('app.page')
    .controller('invoiceCtrl', ['$scope', '$window', invoiceCtrl])
    .controller('authCtrl', ['$scope', '$window', '$location', '$http', 'authService', 'brandService', 'wechatService', 'userRolesConstant', authCtrl]);

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

    function authCtrl($scope, $window, $location, $http, authService, brandService, wechatService, userRolesConstant) {

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

        if ($location.path().match(/^\/profile/)) {
            $http.get('http://localhost:8080/api/wechat-auth').then(function (res) {
                $scope.wechatAuthUrl = res.data + encodeURIComponent('http://localhost:8080/api/wechat-auth?intendedUri=' + $location.url() + '&homeUrl=' + window.location.protocol + '//' + window.location.host + '&token=' + localStorage.getItem('token'));
            });
        }

        $scope.roleLabels = {};

        userRolesConstant.forEach(function (role) {
            $scope.roleLabels[role.name] = role.label;
        });

        $scope.$watch('$parent.$parent.user.$resolved', function (resolved) {
            if (!resolved) {
                return false;
            }

            $scope.brand = brandService.get({id:$scope.$parent.$parent.user.brand.name});
        });

        $scope.sync = function (wechat) {
            wechatService.sync(wechat);
        };
    }

})(); 



