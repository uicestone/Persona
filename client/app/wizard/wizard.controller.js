(function () {
    'use strict';

    angular.module('app.wizard')
    .controller('wizardCtrl', ['$scope', '$window', '$state', 'userService', 'channelService', 'projectService', wizardCtrl]);

    function wizardCtrl($scope, $window, $state, userService, channelService, projectService) {

        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.cities = [
            '上海', '北京', '深圳', '广州', '杭州', '南京', '成都', '武汉', '大连', '青岛'
        ];

        $scope.users = userService.query();

        $scope.channels = channelService.query();

        if($state.params.id) {
            $scope.project = projectService.get({id:$state.params.id});
            $scope.project.$promise.then(project => {
                project.startDate && (project.startDate = new Date(project.startDate));
                project.endDate && (project.endDate = new Date(project.endDate));
                if(project.channels) {
                    project.channels.forEach(channel => {
                        channel.startDate && (channel.startDate = new Date(channel.startDate));
                        channel.endDate && (channel.endDate = new Date(channel.endDate));
                    });
                }
            });
        }
        else {
            $scope.project = new projectService();
        }

        // add default empty kpi form
        if($state.current.name === 'wizard/set-kpi') {
            $scope.$watch('project.kpis', function(kpis) {
                if(kpis && kpis.length === 0) {
                    $scope.project.kpis = [{}];
                }
            });
        }

        // check items in channel list which are already in project.channels
        Promise.all([$scope.project.$promise, $scope.channels.$promise]).then(result => {
            const [project, channels] = result;
            const projectChannelIds = project.channels.map(channel => channel._id);
            channels.forEach(channel => {
                if(projectChannelIds.indexOf(channel._id) > -1) {
                    channel.selected = true;
                }
            });
        });

        $scope.addKpiForm = function() {
            $scope.project.kpis.push({});
        };

        $scope.startDatePercentage = function(item) {
            const projectDuration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
            return (new Date(item.startDate) - new Date($scope.project.startDate)) / projectDuration * 100;
        };

        $scope.durationPercentage = function(item) {
            const projectDuration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
            return (new Date(item.endDate) - new Date(item.startDate)) / projectDuration * 100;
        };

        $scope.saveProject = function(project) {
            project.$save();
        };

        $scope.updateProjectChannel = function(channel){
            
            if(channel.selected) {
                //we add this channel to project
                $scope.project.channels.push(channel);
            }
            else {
                // we remove this channel from project
                $scope.project.channels = $scope.project.channels.filter(currentChannel => currentChannel._id !== channel._id);
            }
        };
    }
    
})(); 



