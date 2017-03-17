(function () {
    'use strict';

    angular.module('app.setting')
    .controller('settingCtrl', ['$scope', '$window', '$mdBottomSheet', '$mdToast', 'channelService', 'userService', 'customerFieldService', 'userRolesConstant', settingCtrl]);

    function settingCtrl($scope, $window, $mdBottomSheet, $mdToast, channelService, userService, customerFieldService, userRolesConstant) {
        
        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.cities = [
            '上海', '北京', '深圳', '广州', '杭州', '南京', '成都', '武汉', '大连', '青岛'
        ];

        $scope.channelTopics = ['星座','娱乐','时尚','母婴'];

        $scope.roles = userRolesConstant;

        $scope.users = userService.query();

        $scope.channels = channelService.query();

        $scope.customerFields = customerFieldService.query();

        $scope.editChannel = function(channel) {
            
            if(!channel) {
                channel = new channelService();
            }

            $scope.channel = channel;

            $mdBottomSheet.show({
                templateUrl: 'app/setting/channel-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.removeChannel = function(channelToRemove) {
            channelToRemove.$delete();
            $scope.channels = $scope.channels.filter(function(channel) {
                return channel._id !== channelToRemove._id;
            });
        };

        $scope.updateChannel = function(channel) {
            $mdBottomSheet.hide();
            channel.$save();
            if(!channel._id) {
                $scope.channels.push(channel);
            }
        };

        $scope.editCustomerField = function(customerField) {
            
            if(!customerField) {
                customerField = new customerFieldService();
            }

            $scope.customerField = customerField;

            $mdBottomSheet.show({
                templateUrl: 'app/setting/customer-field-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.removeCustomerField = function(customerFieldToRemove) {
            customerFieldToRemove.$delete();
            $scope.customerFields = $scope.customerFields.filter(function(customerField) {
                return customerField._id !== customerFieldToRemove._id;
            });
        };

        $scope.updateCustomerField = function(customerField) {
            $mdBottomSheet.hide();
            customerField.$save();
            if(!customerField._id) {
                $scope.customerFields.push(customerField);
            }
        };

        $scope.editUser = function(user) {
            
            if(!user) {
                user = new userService();
                user.roles = [];
            }

            $scope.user = user;

            $mdBottomSheet.show({
                templateUrl: 'app/setting/user-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.removeUser = function(userToRemove) {
            userToRemove.$delete();
            $scope.users = $scope.users.filter(function(user) {
                return user._id !== userToRemove._id;
            });
        };

        $scope.updateUser = function(user) {
            $mdBottomSheet.hide();
            user.$save();
            if(!user._id) {
                $scope.users.push(user);
            }
        };

        $scope.getRolesLabel = function(roleNames) {
            return userRolesConstant.filter(function(role) {
                return roleNames.indexOf(role.name) > -1;
            }).map(function(role) {
                return role.label;
            }).join(', ');
        };
    }
    
})(); 
