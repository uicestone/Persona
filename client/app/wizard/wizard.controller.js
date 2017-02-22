(function () {
    'use strict';

    angular.module('app.wizard')
    .controller('wizardCtrl', ['$scope', '$window', wizardCtrl]);

    function wizardCtrl($scope, $window) {
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

        $scope.project = {};

        $scope.project.kpis = [{}];

        $scope.addKpiForm = function() {
            $scope.project.kpis.push({});
        };

        $scope.$watch('channels', function(channels) {
            console.log(channels);
            $scope.project.channels = channels.filter(channel => channel.selected);
        }, true);

    }
    
})(); 



