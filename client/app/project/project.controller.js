(function () {
    'use strict';

    angular.module('app.project')
    .controller('projectCtrl', ['$scope', '$window', '$location', '$route', '$mdToast', 'userService', 'projectService', 'regionService', projectCtrl]);

    function projectCtrl($scope, $window, $location, $route, $mdToast, userService, projectService, regionService) {

        $scope.platforms = [
            '微信', '微博', 'QQ'
        ];

        $scope.provinces = regionService.query();
        $scope.cities = [];

        $scope.$watch('project.region[0]', function(province) {
            if(!province || !province.id) {
                return;
            }
            $scope.cities = regionService.query(province.id);
        });

        // 切换省时清空市
        $scope.$watch('cities.$resolved', function(resolved) {
            if(!resolved)
                return;

            if($scope.project && $scope.project.region[1] && $scope.cities.map(function(city){return city.id}).indexOf($scope.project.region[1].id) === -1) {
                $scope.project.region[1] = null;
            }
        })

        $scope.kpiNames = {pv:'PV', uv:'UV', 'shares': '分享数', 'registers': '获取用户数', registerRate:'获取用户率', stayingTime:'平均停留时间'};

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
            if($scope.query.endDateBefore) {
                $scope.query.endDate = '~' + $scope.query.endDateBefore;
            }
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
                $mdToast.show($mdToast.simple('项目概况已保存').position('top right'));
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
            
            $scope.queryCampaignRecords = {page: 1, limit: 10, id: $route.current.params.id};
            
            $scope.getCampaignRecords = function() {
                $scope.promiseCampaignRecords = projectService.getCampaignRecords($scope.queryCampaignRecords).$promise.then(function(campaignRecords) {
                    $scope.campaignRecords = campaignRecords;
                });
            };

            $scope.getCampaignRecords();

            $scope.pvByChannelsChart = {};
            $scope.uvByChannelsChart = {};
            $scope.sharesByChannelsChart = {};
            $scope.registersByChannelsChart = {};
            $scope.registerRateByChannelsChart = {};
            $scope.ordersByChannelsChart = {};
            $scope.paymentsByChannelsChart = {};
            $scope.paymentRateByChannelsChart = {};

            $scope.viewsByDateChart = {};
            $scope.stayingTimeByDateChart = {};
            $scope.registersByDateChart = {}
            $scope.registersByDeviceChart = {};
            $scope.registersByRegionChart = {};

            $scope.queryKpi = {};

            $scope.$watch('queryCampaignRecords', function (queryCampaignRecords) {
                var queryKpi = {};
                ['startDate', 'endDate'].forEach(function (key) {
                    if (queryCampaignRecords[key]) {
                        queryKpi[key] = queryCampaignRecords[key];
                    }
                    $scope.queryKpi = queryKpi;
                });
            }, true);

            $scope.chartColors = ['#2ec7c9','#b6a2de', '#5ab1ef', '#ffb980', '#6ed0ff', '#ffbfe0', '#e9f58a', '#67e8c5'];

            $scope.getKpiByChannels = function () {projectService.getKpiByChannels(angular.extend($scope.queryKpi, {id:$route.current.params.id})).$promise.then(function(kpiByChannels) {

                $scope.uvByChannelsChart.options = {
                    title : {
                        text: 'UV',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    itemStyle : {
                        normal : {
                            color:function(d){ return $scope.chartColors[d.dataIndex]; }
                        }
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left',
                        data: kpiByChannels.uv.map(function(channel) {
                            return channel._id.name;
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
                            data: kpiByChannels.uv.map(function(kpiPerChannel) {
                                return {
                                    name: kpiPerChannel._id.name,
                                    value: kpiPerChannel.count
                                };
                            })
                        }
                    ]
                };

                $scope.pvByPage = {};

                kpiByChannels.pv.forEach(function (channel) {
                    channel.pages.forEach(function (page) {
                        if (!$scope.pvByPage[page.name]) {
                            $scope.pvByPage[page.name] = [];
                        }
                        $scope.pvByPage[page.name].push({
                            channel:channel._id.name,
                            views: page.views
                        });
                    });
                });

                $scope.pvByChannelsChart.options = {
                    title : {
                        text: 'PV',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    itemStyle : {
                        normal : {
                            color:function(d){ return $scope.chartColors[d.seriesIndex]; }
                        }
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    yAxis : [
                        {
                            type : 'category',
                            data : kpiByChannels.pv.map(function(kpiPerChannel) {
                                return kpiPerChannel._id.name;
                            })
                        }
                    ],
                    xAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : Object.keys($scope.pvByPage).map(function (pageName) {
                        return {
                            name: pageName,
                            type: 'bar',
                            data: $scope.pvByPage[pageName].map(function (pvPerChannel) {
                                return pvPerChannel.views
                            }),
                            stack: 'PV'
                        }
                    })
                };

                $scope.registersByChannelsChart.options = {
                    title : {
                        text: '获取用户数',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    itemStyle : {
                        normal : {
                            color:function(d){ return $scope.chartColors[d.seriesIndex]; }
                        }
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left',
                        data: kpiByChannels.uv.map(function(channel) {
                            return channel._id.name;
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
                            data: kpiByChannels.register.map(function(kpiPerChannel) {
                                return {
                                    name: kpiPerChannel._id.name,
                                    value: kpiPerChannel.count
                                };
                            })
                        }
                    ]
                };

                $scope.sharesByPage = {};

                kpiByChannels.share.forEach(function (channel) {
                    channel.pages.forEach(function (page) {
                        if (!$scope.sharesByPage[page.name]) {
                            $scope.sharesByPage[page.name] = [];
                        }
                        $scope.sharesByPage[page.name].push({
                            channel:channel._id.name,
                            shares: page.shares
                        });
                    });
                });

                $scope.sharesByChannelsChart.options = {
                    title : {
                        text: '分享数',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    itemStyle : {
                        normal : {
                            color:function(d){ return $scope.chartColors[d.seriesIndex]; }
                        }
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    toolbox: {
                        show : true,
                        feature : {
                            restore : {show: true, title: "刷新"},
                            saveAsImage : {show: true, title: "保存为图片"}
                        }
                    },
                    calculable : true,
                    yAxis : [
                        {
                            type : 'category',
                            data : kpiByChannels.share.map(function(kpiPerChannel) {
                                return kpiPerChannel._id.name;
                            })
                        }
                    ],
                    xAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : Object.keys($scope.sharesByPage).map(function (pageName) {
                        return {
                            name: pageName,
                            type: 'bar',
                            data: $scope.sharesByPage[pageName].map(function (pvPerChannel) {
                                return pvPerChannel.shares
                            }),
                            stack: '分享'
                        }
                    })
                };

                $scope.registerRateByChannelsChart.options = {
                    title : {
                        text: '获取用户率',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    itemStyle : {
                        normal : {
                            color:function(d){ return $scope.chartColors[d.seriesIndex]; }
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
                            type : 'category',
                            data : kpiByChannels.register.map(function (registersPerChannel) {
                                return registersPerChannel._id.name;
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
                            name: '获取用户率',
                            type: 'bar',
                            data: kpiByChannels.register.map(function (registersPerChannel) {
                                var count = registersPerChannel.count;
                                var uv = kpiByChannels.uv.filter(function (uvPerChannel) {
                                    return uvPerChannel._id._id === registersPerChannel._id._id;
                                })[0].count;
                                return count/uv;
                            })
                        }
                    ]
                };

                $scope.ordersByChannelsChart.options = {
                    title : {
                        text: '下单用户数',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    itemStyle : {
                        normal : {
                            color:function(d){ return $scope.chartColors[d.dataIndex]; }
                        }
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left',
                        data: kpiByChannels.order.map(function(channel) {
                            return channel._id.name;
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
                            data: kpiByChannels.order.map(function(kpiPerChannel) {
                                return {
                                    name: kpiPerChannel._id.name,
                                    value: kpiPerChannel.count
                                };
                            })
                        }
                    ]
                };

                $scope.paymentsByChannelsChart.options = {
                    title : {
                        text: '付款用户数',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    itemStyle : {
                        normal : {
                            color:function(d){ return $scope.chartColors[d.dataIndex]; }
                        }
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left',
                        data: kpiByChannels.pay.map(function(channel) {
                            return channel._id.name;
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
                            data: kpiByChannels.pay.map(function(kpiPerChannel) {
                                return {
                                    name: kpiPerChannel._id.name,
                                    value: kpiPerChannel.count
                                };
                            })
                        }
                    ]
                };

                $scope.paymentRateByChannelsChart.options = {
                    title : {
                        text: '下单用户付款率',
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    itemStyle : {
                        normal : {
                            color:function(d){ return $scope.chartColors[d.seriesIndex]; }
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
                            type : 'category',
                            data : kpiByChannels.order.map(function (ordersPerChannel) {
                                return ordersPerChannel._id.name;
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
                            name: '下单用户付款率',
                            type: 'bar',
                            data: kpiByChannels.order.map(function (ordersPerChannel) {
                                var count = ordersPerChannel.count;
                                var payments = kpiByChannels.pay.filter(function (paymentsPerChannel) {
                                    return paymentsPerChannel._id._id === ordersPerChannel._id._id;
                                })[0].count;
                                return payments/count;
                            })
                        }
                    ]
                };
            })};

            $scope.getKpiByDate = function () {projectService.getKpiByDate(angular.extend($scope.queryKpi, {id:$route.current.params.id})).$promise.then(function(kpiByDate) {

                $scope.viewsByDateChart.options = {
                    title : {
                        text: '受访情况 - 日期分布',
                        x:'center'
                    },
                    legend: {
                        data: ['页面访问数', '独立访客数'],
                        x: 'left'
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
                            name:'页面访问数',
                            type:'line',
                            data:kpiByDate.map(function(kpiPerDate) {
                                return [kpiPerDate._id, kpiPerDate.pv]
                            }),
                            itemStyle: {normal: {areaStyle: {type: 'default'}}}
                        },
                        {
                            name:'独立访客数',
                            type:'line',
                            data:kpiByDate.map(function(kpiPerDate) {
                                return [kpiPerDate._id, kpiPerDate.uv]
                            }),
                            itemStyle: {normal: {areaStyle: {type: 'default'}}}
                        }
                    ]
                };

                $scope.stayingTimeByDateChart.options = {
                    title : {
                        text: '访问时长 - 日期分布',
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
                            name:'平均访问时长',
                            type:'line',
                            data:kpiByDate.map(function(kpiPerDate) {
                                return [kpiPerDate._id, kpiPerDate.stayingTime]
                            }),
                            itemStyle: {normal: {areaStyle: {type: 'default'}}}
                        }
                    ]
                };

                $scope.registersByDateChart.options = {
                    title : {
                        text: '获取用户数 - 日期分布',
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
                            name:'获取用户数',
                            type:'line',
                            data: kpiByDate.map(function(kpiPerDate) {
                                return [kpiPerDate._id, kpiPerDate.registers]
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
            })};

            $scope.getKpiByRegion = function () {projectService.getKpiByRegion(angular.extend($scope.queryKpi, {id:$route.current.params.id})).$promise.then(function(kpiByRegion) {

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
            })};
            
            $scope.getKpiByDevice = function () {projectService.getKpiByDevice(angular.extend($scope.queryKpi, {id:$route.current.params.id})).$promise.then(function(kpiByDevice) {

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
            })};

            $scope.getKpiByChannels(); $scope.getKpiByDate(); $scope.getKpiByRegion(); $scope.getKpiByDevice();          
        }
    }
})(); 



