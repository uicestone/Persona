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

        $scope.project = {startDate:'2016-11-11', endDate:'2016-11-30'};

        $scope.project.kpis = [{type:'提交次数',value:8888}, {type:'分享次数', value:3000}];
        $scope.project.channels = [
            {name:'同道大叔', startDate:'2016-11-13', endDate:'2016-11-22'},
            {name:'姜茶茶', startDate:'2016-11-14', endDate:'2016-11-25'},
        ];

        $scope.addKpiForm = function() {
            $scope.project.kpis.push({});
        };
        $scope.project.duration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
        $scope.project.channels.map(channel => {
            channel.startDatePercentage = (new Date(channel.startDate) - new Date($scope.project.startDate)) / $scope.project.duration * 100;
            channel.endDatePercentage = (new Date(channel.endDate) - new Date($scope.project.startDate)) / $scope.project.duration * 100;
            channel.durationPercentage = (new Date(channel.endDate) - new Date(channel.startDate)) / $scope.project.duration * 100;
            return channel;
        });

        // $scope.$watch('channels', function(channels) {
        //     $scope.project.channels = channels.filter(channel => channel.selected);
        // }, true);

    }
    
})(); 



