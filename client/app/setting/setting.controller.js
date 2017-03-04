(function () {
    'use strict';

    angular.module('app.setting')
    .controller('settingCtrl', ['$scope', '$window', '$mdBottomSheet', '$mdToast', 'channelService', 'userService', settingCtrl]);

    function settingCtrl($scope, $window, $mdBottomSheet, $mdToast, channelService, userService) {
        
        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.cities = [
            '上海', '北京', '深圳', '广州', '杭州', '南京', '成都', '武汉', '大连', '青岛'
        ];

        $scope.channelTopics = ['星座','娱乐','时尚','母婴'];

        $scope.users = userService.query();

        $scope.channels = channelService.query();

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
            $scope.channels.push(channel);
        };

    }
    
})(); 
