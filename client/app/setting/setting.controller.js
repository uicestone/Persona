(function () {
    'use strict';

    angular.module('app.setting')
    .controller('settingCtrl', ['$scope', '$window', '$mdBottomSheet', '$mdToast', settingCtrl]);

    function settingCtrl($scope, $window, $mdBottomSheet, $mdToast) {
        $scope.users = [
            {name: 'Tracy'},
            {name: 'David'},
            {name: 'Uice'},
            {name: 'Natt'}
        ];

        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.cities = [
            '上海', '北京', '深圳', '广州', '杭州', '南京', '成都', '武汉', '大连', '青岛'
        ];

        $scope.channels = [
            {name:'同道大叔', topic:'星座', rank:4.5},
            {name:'姜茶茶', topic:'娱乐', rank:4},
            {name:'雌时尚', topic:'时尚', rank:5},
            {name:'四个辣妈', topic:'母婴', rank:3}
        ];

        $scope.channelTopics = ['星座','娱乐','时尚','母婴'];

        $scope.editChannel = function(channel) {
            $scope.alert = '';
            $scope.channel = channel;
            $mdBottomSheet.show({
                templateUrl: 'app/setting/channel-bottom-sheet.html',
                scope: $scope,
                clickOutsideToClose: false
            });
        };

        $scope.updateChannel = function(channel) {
            $mdBottomSheet.hide();
        };

    }
    
})(); 
