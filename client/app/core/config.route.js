(function () {
    'use strict';

    angular.module('app')
        .config(['$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider',
                function($stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {
                var routes, setRoutes;

                routes = [
                    'project/list', 'project/timing',
                    'customer/image',
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
                        url: url,
                        templateUrl: 'app/' + route + '.html'
                    };
                    $stateProvider.state(route, config);
                    return $stateProvider;
                };

                routes.forEach(function(route) {
                    return setRoutes(route);
                });


                $stateProvider
                    .state('dashboard', {
                        url: '/dashboard',
                        templateUrl: 'app/dashboard/dashboard.html'
                    })
                    .state('project/:id', {
                        url: '/project/:id',
                        templateUrl: 'app/project/detail.html'
                    })
                    .state('wizard/create-project', {
                        url: '/wizard/create-project/:id?',
                        templateUrl: 'app/wizard/create-project.html'
                    })
                    .state('wizard/set-kpi', {
                        url: '/wizard/set-kpi/:id?',
                        templateUrl: 'app/wizard/set-kpi.html'
                    })
                    .state('wizard/set-channel', {
                        url: '/wizard/set-channel/:id?',
                        templateUrl: 'app/wizard/set-channel.html'
                    })
                    .state('wizard/set-timing', {
                        url: '/wizard/set-timing/:id?',
                        templateUrl: 'app/wizard/set-timing.html'
                    })
                    .state('wizard/preview', {
                        url: '/wizard/preview/:id?',
                        templateUrl: 'app/wizard/preview.html'
                    })
                    .state('form/editor', {
                        url: '/form/editor',
                        templateUrl: "app/form/editor.html",
                        resolve: {
                            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                                return $ocLazyLoad.load([
                                    'textAngular'
                                ]);
                            }]
                        }
                    })
                    .state('form/wizard', {
                        url: '/form/wizard',
                        templateUrl: "app/form/wizard.html",
                        resolve: {
                            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                                return $ocLazyLoad.load([
                                    'angular-wizard'
                                ]);
                            }]
                        }
                    })
                    .state('map/maps', {
                        url: '/map/maps',
                        templateUrl: "app/map/maps.html",
                        resolve: {
                            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                                return $ocLazyLoad.load([
                                    'googlemap',
                                ]);
                            }]
                        }
                    });

                $urlRouterProvider
                    .when('', '/welcome')
                    .when('/', '/welcome')
                    .otherwise('/404');
            }
        ]);

})(); 