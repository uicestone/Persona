(function () {
    'use strict';

    angular.module('app')
        .config(['$routeProvider', '$ocLazyLoadProvider',
                function($routeProvider, $ocLazyLoadProvider) {
                var routes, setRoutes;

                routes = [
                    'customer/reaching',
                    'project/list', 'project/timing',
                    'setting/data', 'setting/user', 'setting/channel',
                    'welcome', 'get-sdk', '404', '500', 'forgot-password', 'lock-screen', 'profile', 'signin', 'signup',
                    
                    'ui/cards', 'ui/typography', 'ui/buttons', 'ui/icons', 'ui/grids', 'ui/widgets', 'ui/components', 'ui/timeline', 'ui/lists', 'ui/pricing-tables',
                    'table/static', 'table/responsive', 'table/data',
                    'form/elements', 'form/layouts', 'form/validation',
                    'chart/echarts', 'chart/echarts-line', 'chart/echarts-bar', 'chart/echarts-pie', 'chart/echarts-scatter', 'chart/echarts-more',
                    'page/blank', 'page/invoice',
                    'app/calendar'
                ]

                setRoutes = function(route) {
                    var config, url;
                    url = '/' + route;
                    config = {
                        templateUrl: 'app/' + route + '.html'
                    };
                    $routeProvider.when(url, config);
                    return $routeProvider;
                };

                routes.forEach(function(route) {
                    return setRoutes(route);
                });

                $routeProvider
                    .when('/dashboard', {
                        templateUrl: 'app/dashboard/dashboard.html'
                    })
                    .when('/project/:id', {
                        templateUrl: 'app/project/detail.html'
                    })
                    .when('/wizard/create-project/:id?', {
                        templateUrl: 'app/wizard/create-project.html'
                    })
                    .when('/wizard/set-kpi/:id?', {
                        templateUrl: 'app/wizard/set-kpi.html'
                    })
                    .when('/wizard/set-channel/:id?', {
                        templateUrl: 'app/wizard/set-channel.html'
                    })
                    .when('/wizard/set-timing/:id?', {
                        templateUrl: 'app/wizard/set-timing.html'
                    })
                    .when('/wizard/preview/:id?', {
                        templateUrl: 'app/wizard/preview.html'
                    })
                    .when('/customer/image', {
                        templateUrl: 'app/customer/image.html',
                        reloadOnSearch: false
                    })
                    .when('/form/editor', {
                        templateUrl: "app/form/editor.html",
                        resolve: {
                            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                                return $ocLazyLoad.load([
                                    'textAngular'
                                ]);
                            }]
                        }
                    })
                    .when('/form/wizard', {
                        templateUrl: "app/form/wizard.html",
                        resolve: {
                            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                                return $ocLazyLoad.load([
                                    'angular-wizard'
                                ]);
                            }]
                        }
                    })
                    .when('/map/maps', {
                        templateUrl: "app/map/maps.html",
                        resolve: {
                            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                                return $ocLazyLoad.load([
                                    'googlemap',
                                ]);
                            }]
                        }
                    })
                    .when('/', {redirectTo: '/welcome'})
                    .otherwise('/404');
                    
            }
        ]);

})(); 