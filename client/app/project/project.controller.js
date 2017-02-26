(function () {
    'use strict';

    angular.module('app.project')
    .controller('projectCtrl', ['$scope', '$window', '$location', '$state', 'userService', 'projectService', projectCtrl]);

    function projectCtrl($scope, $window, $location, $state, userService, projectService) {

        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.cities = [
            '上海', '北京', '深圳', '广州', '杭州', '南京', '成都', '武汉', '大连', '青岛'
        ];

        $scope.users = userService.query();

        if($state.params.id) {
            $scope.project = projectService.get({id:$state.params.id});
            $scope.project.$promise.then(function(project) {
                project.startDate && (project.startDate = new Date(project.startDate));
                project.endDate && (project.endDate = new Date(project.endDate));
                if(project.channels) {
                    project.channels.forEach(function(channel) {
                        channel.startDate && (channel.startDate = new Date(channel.startDate));
                        channel.endDate && (channel.endDate = new Date(channel.endDate));
                    });
                }
                if(project.kpis) {
                    project.kpis.forEach(function(kpi) {
                        if(kpi.timings) {
                            kpi.timings.forEach(function(timing) {
                                timing.startDate && (timing.startDate = new Date(timing.startDate));
                                timing.endDate && (timing.endDate = new Date(timing.endDate));
                            });
                        }
                    });
                }
            });
        }
        else {
            $scope.projects = projectService.query();
        }

        $scope.showProjectDetail = function(project) {
            $location.path('project/' + project._id);
        };

        $scope.updateProject = function(project) {
            project.$save()
            .then(function(project) {
                project.startDate && (project.startDate = new Date(project.startDate));
                project.endDate && (project.endDate = new Date(project.endDate));
            });
        };

        $scope.startDatePercentage = function(item) {
            var projectDuration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
            return (new Date(item.startDate) - new Date($scope.project.startDate)) / projectDuration * 100;
        };

        $scope.durationPercentage = function(item) {
            var projectDuration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
            return (new Date(item.endDate) - new Date(item.startDate)) / projectDuration * 100;
        };
    }
    
})(); 



