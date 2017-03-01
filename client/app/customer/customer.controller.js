(function () {
    'use strict';

    angular.module('app.customer')
    .controller('customerCtrl', ['$scope', '$window', '$location', 'customerService', customerCtrl]);

    function customerCtrl($scope, $window, $location, customerService) {
        
        $scope.query = {withTags:[], withoutTags:[]};
        
        $scope.showKeys = [
            {key:'mobile', label:'手机号码', show:true},
            {key:'privince', 'label':'居住城市', show:true},
            {key:'sex', 'label':'性别', show:true},
            {key:'tags', 'label':'标签', show:true}
        ];

        $scope.otherKeys = [
            {key:'nuid', label:'NUID'},
            {key:'carrier', label:'手机号运营商'},
            {key:'mobileAge', label:'手机号入网年限'},
            {key:'studyCity', label:'就学城市'},
            {key:'workingCity', label:'工作城市'},
            {key:'sexualOrientation', label:'性取向'},
            {key:'creditCards', label:'信用卡数量'},
            {key:'hasChild', label:'有孩子'},
            {key:'annualSalary', label:'年收入'},
            {key:'education', label:'学历'},
            {key:'age', label:'年龄'},
            {key:'marriage', label:'婚否'}
        ];

        $scope.addShowKey = function(newShowKey) {
            if(!newShowKey) {
                return;
            }

            $scope.otherKeys = $scope.otherKeys.filter(function(key) {
                return key.key !== newShowKey.key;
            });
            newShowKey.show = true;
            $scope.showKeys.push(newShowKey);
        }

        $scope.$watch('query', function(query) {
            $location.search(query);
            $scope.customers = customerService.query(query);
        }, true);
    }
    
})(); 
