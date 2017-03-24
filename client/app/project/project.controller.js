(function () {
    'use strict';

    angular.module('app.project')
    .controller('projectCtrl', ['$scope', '$window', '$location', '$route', '$mdToast', 'userService', 'projectService', projectCtrl]);

    function projectCtrl($scope, $window, $location, $route, $mdToast, userService, projectService) {

        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.cities = [
            '上海', '北京', '深圳', '广州', '杭州', '南京', '成都', '武汉', '大连', '青岛'
        ];

        $scope.kpiNames = {pv:'PV', uv:'UV', converts:'转化数', convertRate:'转化率', users:'获取用户数', timeStay:'平均停留时间', shareRate:'分享率'};

        $scope.users = userService.query();

        $scope.timelineStartDate = moment().startOf('year');

        $scope.$watch('timelineStartDate', function(timelineStartDate) {
            $scope.timelineEndDate = timelineStartDate.clone().endOf('quarter');

            $scope.timelineMonths = [];

            for (var d = timelineStartDate.clone(); d <= $scope.timelineEndDate; d.add(1, 'M')) {
                $scope.timelineMonths.push({
                    startDate: d.clone().startOf('month'),
                    endDate: d.clone().endOf('month'),
                    date: d.clone()
                });
            }

            $scope.timelineWeeks = [];

            for (var d = timelineStartDate.clone().startOf('week'); d <= $scope.timelineEndDate; d.add(1, 'w')) {
                $scope.timelineWeeks.push({
                    inPreviousTimeline: d.clone().startOf('week') < timelineStartDate,
                    startDate: Math.max(d.clone().startOf('week'), timelineStartDate),
                    endDate: d.clone().endOf('week'),
                    date: d.clone()
                });
            }
        }, true);

        $scope.now = moment();

        $scope.startOfYear = new Date((new Date()).getFullYear() + '-01-01');
        $scope.endOfYear = new Date((new Date()).getFullYear() + '-12-31');

        if($route.current.params.id) {
            $scope.project = projectService.get({id:$route.current.params.id});
        }
        else {
            $scope.query = {page: 1, limit: 20};
            $scope.projects = projectService.query($scope.query);
            $scope.projectsPromise = $scope.projects.$promise;
        }

        $scope.colors = ['#F88', '#8F8', '#88F', '#8FF', '#F8F', '#FF8']

        $scope.navigateQuarter = function(offset) {
            $scope.timelineStartDate.add(offset, 'quarters');
        };

        $scope.getProjects = function() {
            $scope.projectsPromise = projectService.query($scope.query, function(projects) {
                $scope.projects = projects;
            }).$promise;
        };

        $scope.inTimeline = function(projects) {
            return projects.filter(function(project) {
                return project.endDate > $scope.timelineStartDate.toDate()
                    && project.startDate < $scope.timelineEndDate.toDate()
            }).map(function(project) {
                project.startsBeforeTimeline = project.startDate < $scope.timelineStartDate.toDate();
                project.endsAfterTimeline = project.endDate > $scope.timelineEndDate.toDate();
                return project;
            });
        };

        $scope.showProjectDetail = function(project) {
            $location.path('project/' + project._id);
        };

        $scope.updateProject = function(project) {
            project.$save()
            .then(function(project) {
                project.startDate && (project.startDate = new Date(project.startDate));
                project.endDate && (project.endDate = new Date(project.endDate));
                $mdToast.showSimple('项目概况已保存');
            });
        };

        $scope.removeProject = function(project) {
            if(!confirm('确定要删除项目“' + project.name + '”吗？')) {
                return;
            }
            project.$delete().then(function() {
                $location.path('project/list');
            });
        };

        $scope.getUsers = function(roles, name) {
            return userService.query({roles:roles, name: name}).$promise;
        };

        $scope.startDatePercentage = function(item, timelineStartDate, timelineEndDate) {
            var projectDuration = (timelineEndDate || new Date($scope.project.endDate)) - (timelineStartDate || new Date($scope.project.startDate)) + 86400000;
            var percentage =  (new Date(item.startDate) - (timelineStartDate || new Date($scope.project.startDate))) / projectDuration * 100;
            return Math.max(0, percentage);
        };

        $scope.durationPercentage = function(item, timelineStartDate, timelineEndDate) {
            var projectDuration = (timelineEndDate || new Date($scope.project.endDate)) - (timelineStartDate || new Date($scope.project.startDate)) + 86400000;
            return (new Date(item.endDate) - new Date(item.startDate)) / projectDuration * 100;
        };

        // 渠道监控图表数据
        if($scope.project) {
            
            $scope.kpiByChannels = projectService.getKpiByChannels({id:$route.current.params.id});
            
            $scope.queryCampaignRecords = {page: 1, limit: 10, id: $route.current.params.id};
            
            $scope.getCampaignRecords = function() {
                $scope.promiseCampaignRecords = projectService.getCampaignRecords($scope.queryCampaignRecords).$promise.then(function(campaignRecords) {
                    $scope.campaignRecords = campaignRecords;
                });
            };

            $scope.getCampaignRecords();

            $scope.kpiByDate = projectService.getKpiByDate({id:$route.current.params.id});
            $scope.kpiByRegion = projectService.getKpiByRegion({id:$route.current.params.id});
            $scope.kpiByDevice = projectService.getKpiByDevice({id:$route.current.params.id});

            $scope.kpiByChannelsTree = {};

            $scope.uvByChannelsChart = {};
            $scope.pvByChannelsChart = {};
            $scope.convertsByChannelsChart = {};
            $scope.convertRateByChannelsChart = {};
            $scope.usersByChannelsChart = {};
            $scope.timeStayByChannelsChart = {};
            $scope.shareRateByChannelsChart = {};

            $scope.uvByDateChart = {};
            $scope.convertsByDateChart = {}
            $scope.uvByDeviceChart = {};
            $scope.convertsByDeviceChart = {};
            $scope.convertsByRegionChart = {};

            Promise.all([$scope.project.$promise, $scope.kpiByChannels.$promise]).then(function(result) {

                var project = result[0];
                var kpiByChannels = result[1];

                kpiByChannels.map(function(kpiPerChannel) {
                    
                    var channel = project.channels[kpiPerChannel._id - 1];

                    kpiPerChannel.name = channel ? channel.name : '';
                    kpiPerChannel.users = kpiPerChannel.uv;
                    kpiPerChannel.pv = kpiPerChannel.uv * 4;
                    kpiPerChannel.convertRate = kpiPerChannel.converts / kpiPerChannel.users;
                    kpiPerChannel.shareRate = kpiPerChannel.shares / kpiPerChannel.users;

                    $scope.kpiByChannelsTree[kpiPerChannel.name] = {};

                    Object.keys(kpiPerChannel).forEach(function(kpiKey) {

                        if(!$scope.kpiNames[kpiKey]) {
                            return;
                        }

                        $scope.kpiByChannelsTree[kpiPerChannel.name][$scope.kpiNames[kpiKey]] = kpiPerChannel[kpiKey];
                    });

                    return kpiPerChannel;
                });

                $scope.chartColors = ['#2ec7c9','#b6a2de', '#5ab1ef', '#ffb980'];

                $scope.uvByChannelsChart.options = {
                    title : {
                        text: 'UV',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left',
                        data: kpiByChannels.map(function(kpiPerChannel) {
                            return kpiPerChannel.name;
                        })
                    },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    series : [
                        {
                            name:'渠道',
                            type:'pie',
                            radius : '55%',
                            center: ['50%', '60%'],
                            data: kpiByChannels.map(function(kpiPerChannel) {
                                return {
                                    name: kpiPerChannel.name,
                                    value: kpiPerChannel.uv
                                };
                            })
                        }
                    ]
                };

                $scope.pvByChannelsChart.options = {
                    title : {
                        text: 'PV',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left',
                        data: project.channels.map(function(channel) {
                            return channel.name;
                        })
                    },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    series : [
                        {
                            name:'渠道',
                            type:'pie',
                            radius : '55%',
                            center: ['50%', '60%'],
                            data: kpiByChannels.map(function(kpiPerChannel) {
                                return {
                                    name: kpiPerChannel.name,
                                    value: kpiPerChannel.pv
                                };
                            })
                        }
                    ]
                };

                $scope.convertsByChannelsChart.options = {
                    title : {
                        text: '转化数',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    // legend: {
                    //     data:[]
                    // },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'category',
                            data : kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.name;
                            })
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : [
                        {
                            name:'转化数',
                            type:'bar',
                            data: kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.converts;
                            }),
                            markPoint : {
                                data : [
                                    {type : 'max', name: '最多'},
                                    {type : 'min', name: '最少'}
                                ]
                            },
                            itemStyle : {
                                normal : {
                                    color:function(d){ return $scope.chartColors[d.dataIndex]; }
                                }
                            }
                            // markLine : {
                            //     data : [
                            //         {type : 'average', name: 'Average'}
                            //     ]
                            // }
                        }
                    ]
                };

                $scope.convertRateByChannelsChart.options = {
                    title : {
                        text: '转化率',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    // legend: {
                    //     data:[]
                    // },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'category',
                            data : kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.name;
                            })
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : [
                        {
                            name:'转化率',
                            type:'bar',
                            data: kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.convertRate;
                            }),
                            itemStyle : {
                                normal : {
                                    color:function(d){ return $scope.chartColors[d.dataIndex]; }
                                }
                            }
                            // markLine : {
                            //     data : [
                            //         {type : 'average', name: 'Average'}
                            //     ]
                            // }
                        }
                    ]
                };

                $scope.usersByChannelsChart.options = {
                    title : {
                        text: '获取用户数',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    // legend: {
                    //     data:[]
                    // },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'category',
                            data : kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.name;
                            })
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : [
                        {
                            name:'获取用户数',
                            type:'bar',
                            data: kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.users;
                            }),
                            itemStyle : {
                                normal : {
                                    color:function(d){ return $scope.chartColors[d.dataIndex]; }
                                }
                            }
                            // markLine : {
                            //     data : [
                            //         {type : 'average', name: 'Average'}
                            //     ]
                            // }
                        }
                    ]
                };

                $scope.timeStayByChannelsChart.options = {
                    title : {
                        text: '平均停留时间',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    // legend: {
                    //     data:[]
                    // },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'category',
                            data : kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.name;
                            })
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : [
                        {
                            name:'平均停留时间',
                            type:'bar',
                            data: kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.timeStay;
                            }),
                            itemStyle : {
                                normal : {
                                    color:function(d){ return $scope.chartColors[d.dataIndex]; }
                                }
                            }
                            // markLine : {
                            //     data : [
                            //         {type : 'average', name: 'Average'}
                            //     ]
                            // }
                        }
                    ]
                };

                $scope.shareRateByChannelsChart.options = {
                    title : {
                        text: '分享率',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    // legend: {
                    //     data:[]
                    // },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'category',
                            data : kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.name;
                            })
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : [
                        {
                            name:'分享率',
                            type:'bar',
                            data: kpiByChannels.map(function(kpiPerChannel) {
                                return kpiPerChannel.shareRate;
                            }),
                            itemStyle : {
                                normal : {
                                    color:function(d){ return $scope.chartColors[d.dataIndex]; }
                                }
                            }
                            // markLine : {
                            //     data : [
                            //         {type : 'average', name: 'Average'}
                            //     ]
                            // }
                        }
                    ]
                };
            });

            $scope.kpiByDate.$promise.then(function(kpiByDate) {

                $scope.uvByDateChart.options = {
                    title : {
                        text: '访问数 - 日期分布',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis',
                        axisPointer : {
                            type : 'shadow'
                        }
                    },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'time'
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : [
                        {
                            name:'UV',
                            type:'line',
                            data:kpiByDate.map(function(kpiPerDate) {
                                return [kpiPerDate._id, kpiPerDate.uv]
                            }),
                            itemStyle: {normal: {areaStyle: {type: 'default'}}}
                        }
                    ]
                };

                $scope.convertsByDateChart.options = {
                    title : {
                        text: '转化率 - 日期分布',
                        x:'center'
                    },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    xAxis : [
                        {
                            type : 'time'
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : [
                        {
                            name:'转化率',
                            type:'line',
                            data: kpiByDate.map(function(kpiPerDate) {
                                return [kpiPerDate._id, kpiPerDate.converts]
                            }),
                            markPoint : {
                                data : [
                                    {type : 'max', name: '最多'},
                                    {type : 'min', name: '最少'}
                                ]
                            },
                            itemStyle: {normal: {areaStyle: {type: 'default'}}}
                        }
                    ]
                };
            });

            $scope.kpiByRegion.$promise.then(function(kpiByRegion) {
                $scope.convertsByRegionChart.options = {
                    title: {
                        text: '转化率 - 区域分布',
                        left: 'center'
                    },
                    tooltip: {
                        trigger: 'item'
                    },
                    visualMap: {
                        min: 0,
                        max: 2500,
                        left: 'left',
                        top: 'bottom',
                        // text: ['高','低'],           // 文本，默认为数值文本
                        calculable: true
                    },
                    toolbox: {
                        show: true,
                        orient: 'vertical',
                        left: 'right',
                        top: 'center',
                        feature: {
                            dataView: {readOnly: false},
                            restore: {},
                            saveAsImage: {}
                        }
                    },
                    series: [
                        {
                            name: '转化率',
                            type: 'map',
                            mapType: 'china',
                            roam: false,
                            label: {
                                normal: {
                                    show: true
                                },
                                emphasis: {
                                    show: true
                                }
                            },
                            data: kpiByRegion.map(function(kpiPerRegion) {
                                return {name: kpiPerRegion._id.replace(/省|市|自治区/, ''), value: kpiPerRegion.converts}
                            })
                        }
                    ]
                };
            });
            
            $scope.kpiByDevice.$promise.then(function(kpiByDevice) {

                $scope.uvByDeviceChart.options = {
                    title : {
                        text: '访问数 - 设备分布',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left',
                        data: kpiByDevice.map(function(kpiPerDevice) {
                            return kpiPerDevice._id;
                        })
                    },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    series : [
                        {
                            name:'设备',
                            type:'pie',
                            radius : '55%',
                            center: ['50%', '60%'],
                            data: kpiByDevice.map(function(kpiPerDevice) {
                                return {
                                    name: kpiPerDevice._id,
                                    value: kpiPerDevice.uv
                                };
                            })
                        }
                    ]
                };

                $scope.convertsByDeviceChart.options = {
                    title : {
                        text: '转化率 - 设备分布',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left',
                        data: kpiByDevice.map(function(kpiPerDevice) {
                            return kpiPerDevice._id;
                        })
                    },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    series : [
                        {
                            name:'设备',
                            type:'pie',
                            radius : '55%',
                            center: ['50%', '60%'],
                            data: kpiByDevice.map(function(kpiPerDevice) {
                                return {
                                    name: kpiPerDevice._id,
                                    value: kpiPerDevice.converts
                                };
                            })
                        }
                    ]
                };

            });            
        }
    }
})(); 



