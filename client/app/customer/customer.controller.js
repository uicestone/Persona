(function () {
    'use strict';

    angular.module('app.customer')
    .controller('customerCtrl', ['$scope', '$window', '$location', '$mdBottomSheet', 'customerService', 'customerGroupService', customerCtrl]);

    function customerCtrl($scope, $window, $location, $mdBottomSheet, customerService, customerGroupService) {
        
        $scope.query = {withTags:[], withoutTags:[]};
        
        $scope.showKeys = [
            {key:'mobile', label:'手机号码', show:true},
            {key:'province', 'label':'居住城市', show:true},
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

        $scope.customerGroups = customerGroupService.query();

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

        $scope.createGroup = function(group) {

            if(!group) {
                group = new customerGroupService();
                group.showKeys = $scope.showKeys;
                group.query = $scope.query;
            }

            $scope.group = group;

            $mdBottomSheet.show({
                templateUrl: 'app/customer/create-group-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.updateGroup = function(group) {
            group.$save();
            $mdBottomSheet.hide();
            $scope.group = undefined;
        };
    }
    
})(); 
