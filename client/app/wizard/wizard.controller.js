(function () {
    'use strict';

    angular.module('app.wizard')
    .controller('wizardCtrl', ['$scope', '$window', '$state', '$location', 'userService', 'channelService', 'projectService', wizardCtrl]);

    function wizardCtrl($scope, $window, $state, $location, userService, channelService, projectService) {

        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.cities = [
            '上海', '北京', '深圳', '广州', '杭州', '南京', '成都', '武汉', '大连', '青岛'
        ];

        $scope.users = userService.query();

        $scope.channels = channelService.query();

        $scope.isEditing = $location.search().editing;

        if($state.params.id) {
            $scope.project = projectService.get({id:$state.params.id});
        }
        else {
            $scope.project = new projectService();
        }
        
        $scope.$watch('project.kpis', function(kpis) {

            // add default empty kpi form
            if(kpis && kpis.length === 0) {
                $scope.project.kpis = [{}];
            }

            // add default empty timing form for project.kpis
            if(kpis && kpis.length > 0) {
                kpis.forEach(function(kpi) {
                    if(!kpi.timings || kpi.timings.length === 0) {
                        kpi.timings = [{}];
                    }
                });
            }
        }, true);

        if($state.current.name === 'wizard/set-timing') {
            $scope.$watch('project.channels', function(channels) {
                if(!channels) {
                    return;
                }

            })
        }

        // check items in channel list which are already in project.channels
        Promise.all([$scope.project.$promise, $scope.channels.$promise]).then(function(result) {
            var project = result[0];
            var channels = result[1];
            var projectChannelIds;

            if(!project) {
                return;
            }

            projectChannelIds = project.channels.map(function(channel) { return channel._id; });
            channels.forEach(function(channel) {
                if(projectChannelIds.indexOf(channel._id) > -1) {
                    channel.selected = true;
                }
            });
        });

        $scope.addKpiForm = function() {
            $scope.project.kpis.push({});
        };

        $scope.addKpiTimingForm = function(kpi) {
            kpi.timings.push({});
        }

        $scope.startDatePercentage = function(item) {
            const projectDuration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
            return (new Date(item.startDate) - new Date($scope.project.startDate)) / projectDuration * 100;
        };

        $scope.durationPercentage = function(item) {
            const projectDuration = new Date($scope.project.endDate) - new Date($scope.project.startDate) + 86400000;
            return (new Date(item.endDate) - new Date(item.startDate)) / projectDuration * 100;
        };

        $scope.saveProject = function(project, then) {
            project.$save().then(function(project) {
                if(then) {
                    $location.path(then + '/' + project._id);
                }
            });
        };

        $scope.updateProjectChannel = function(channel){
            
            if(channel.selected) {
                //we add this channel to project
                $scope.project.channels.push(channel);
            }
            else {
                // we remove this channel from project
                $scope.project.channels = $scope.project.channels.filter(function(currentChannel) { return currentChannel._id !== channel._id; });
            }
        };
    }
    
})(); 



