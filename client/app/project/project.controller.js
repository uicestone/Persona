(function () {
    'use strict';

    angular.module('app.project')
    .controller('projectCtrl', ['$scope', '$window', projectCtrl]);

    function projectCtrl($scope, $window) {
        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.projects = [
        	{name:'昆城一元购', platform:'微信', manager:{name:'Elsie'}, createdAt:new Date('2017-1-2'), status:'进行中'},
        	{name:'暖暖内涵光', platform:'微信', manager:{name:'Natt'}, createdAt:new Date('2016-1-10'), status:'准备中'},
        	{name:'昆宠帮帮帮', platform:'微信', manager:{name:'Natt'}, createdAt:new Date('2016-11-5'), status:'已结束'}
        ];

        $scope.projects = [];
    }
    
})(); 



