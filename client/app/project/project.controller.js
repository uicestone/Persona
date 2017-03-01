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

        $scope.kpiNames = {pv:'PV', uv:'UV', converts:'转化数', convertRate:'转化率', users:'获取用户数', timeStay:'平均停留时间', shareRate:'分享率'};

        $scope.users = userService.query();

        if($state.params.id) {
            $scope.project = projectService.get({id:$state.params.id});
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

        if($scope.project) {
            
            $scope.kpiByChannels = projectService.getKpiByChannels({id:$state.params.id});
            $scope.kpiByChannelsTree = {};

            $scope.uvByChannelsChart = {};
            $scope.pvByChannelsChart = {};
            $scope.convertsByChannelsChart = {};
            $scope.convertRateByChannelsChart = {};
            $scope.usersByChannelsChart = {};
            $scope.timeStayByChannelsChart = {};
            $scope.shareRateByChannelsChart = {};

            Promise.all([$scope.project.$promise, $scope.kpiByChannels.$promise]).then(function(result) {

                var project = result[0];
                var kpiByChannels = result[1];

                kpiByChannels.map(function(kpiPerChannel) {
                    
                    kpiPerChannel.name = project.channels[kpiPerChannel._id - 1].name;
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
        }
    }
})(); 



