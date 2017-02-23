(function () {
    'use strict';

    angular.module('app.project')
    .controller('projectCtrl', ['$scope', '$window', projectCtrl]);

    function projectCtrl($scope, $window) {
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

        $scope.projects = [
        	{name:'昆城一元购', platform:'微信', manager:{name:'Elsie'}, createdAt:new Date('2017-1-2'), status:'进行中'},
        	{name:'暖暖内涵光', platform:'微信', manager:{name:'Natt'}, createdAt:new Date('2016-1-10'), status:'准备中'},
        	{name:'昆宠帮帮帮', platform:'微信', manager:{name:'Natt'}, createdAt:new Date('2016-11-5'), status:'已结束'}
        ];

        $scope.projects = [];
        
        $scope.project = {name:'昆城广场宠物帮帮帮项目', startDate:new Date('2016-11-11'), endDate:new Date('2016-11-30')};

        $scope.project.kpis = [
            {type:'提交次数',value:8888, timings:[
                {name:'前期目标', startDate:new Date('2016-11-13'), endDate:new Date('2016-11-22'), percentage: 40},
                {name:'后期目标', startDate:new Date('2016-11-23'), endDate:new Date('2016-11-29'), percentage: 40}
            ]},
            {type:'分享次数', value:3000}
        ];

        $scope.project.channels = [
            {name:'同道大叔', startDate:new Date('2016-11-13'), endDate:new Date('2016-11-22')},
            {name:'姜茶茶', startDate:new Date('2016-11-14'), endDate:new Date('2016-11-25')},
        ];

        $scope.startDatePercentage = function(item) {
            const projectDuration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
            return (new Date(item.startDate) - new Date($scope.project.startDate)) / projectDuration * 100;
        };

        $scope.durationPercentage = function(item) {
            const projectDuration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
            return (new Date(item.endDate) - new Date(item.startDate)) / projectDuration * 100;
        };
    }
    
})(); 



