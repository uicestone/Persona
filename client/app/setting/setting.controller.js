(function () {
    'use strict';

    angular.module('app.setting')
    .controller('settingCtrl', ['$scope', '$window', '$location', '$mdBottomSheet', '$mdToast', 'channelService', 'userService', 'customerFieldService', 'userRolesConstant', settingCtrl]);

    function settingCtrl($scope, $window, $location, $mdBottomSheet, $mdToast, channelService, userService, customerFieldService, userRolesConstant) {
        
        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.cities = [
            '上海', '北京', '深圳', '广州', '杭州', '南京', '成都', '武汉', '大连', '青岛'
        ];

        $scope.channelTopics = ['星座','娱乐','时尚','母婴'];

        $scope.roles = userRolesConstant;

        $scope.query = {page: 1, limit: 20};

        function ucfirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        $scope.getChannels = function() {
            $scope.promise = channelService.query($scope.query).$promise
            .then(function(channels) {
                $scope.channels = channels;
            });
        };

        $scope.getCustomerFields = function(type) {
            $scope['promiseCustomer' + ucfirst(type) + 'Fields'] = customerFieldService.query(angular.extend({type: type}, $scope.query)).$promise
            .then(function(customerFields) {
                $scope['customer' + ucfirst(type) + 'Fields'] = customerFields;
            });
        };

        $scope.getCustomerCharFields = function () {
            $scope.getCustomerFields('char');
        };

        $scope.getCustomerActFields = function () {
            $scope.getCustomerFields('act');
        };

        $scope.getCustomerCalcFields = function () {
            $scope.getCustomerFields('calc');
        };

        $scope.getUsers = function() {
            $scope.promise = userService.query($scope.query).$promise
                .then(function(channels) {
                    $scope.users = channels;
                });
        };

        switch ($location.path()) {
            case '/setting/data': $scope.getCustomerCharFields(); $scope.getCustomerActFields(); $scope.getCustomerCalcFields(); break;
            case '/setting/channel': $scope.getChannels(); break;
            case '/setting/user': $scope.getUsers(); break;
        }

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
            if (!confirm('确定要删除渠道 ' + channelToRemove.name + ' 吗？')) {
                return;
            }

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

        $scope.editCustomerField = function(customerField, type) {
            
            if(!customerField) {
                customerField = new customerFieldService();
            }

            $scope.customerField = customerField;

            if (type) {
                $scope.customerField.type = type;
            }

            $mdBottomSheet.show({
                templateUrl: 'app/setting/customer-field-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.addCustomerField = function (type) {
            $scope.editCustomerField(null, type);
        };

        $scope.removeCustomerField = function(customerFieldToRemove) {

            var customerFieldKeyName = 'customer' + ucfirst(customerFieldToRemove.type) + 'Fields';

            if (!confirm ('确定要删除字段 ' + customerFieldToRemove.label)) {
                return;
            }
            customerFieldToRemove.$delete();

            $scope[customerFieldKeyName] = $scope[customerFieldKeyName].filter(function(customerField) {
                return customerField._id !== customerFieldToRemove._id;
            });
        };

        $scope.updateCustomerField = function(customerField) {
            var customerFieldKeyName = 'customer' + ucfirst(customerField.type) + 'Fields';
            $mdBottomSheet.hide();
            customerField.$save();
            if(!customerField._id) {
                $scope[customerFieldKeyName].push(customerField);
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
