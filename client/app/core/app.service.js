(function () {
    'use strict';

    var api = 'http://localhost:8080/api/';

    // add raw response as an attribute of resource,
    // so that we can get http status, header etc from resource in controllers
    var responseInterceptor = function (response) {
        response.resource.$total = Number(response.headers('items-total'));
        response.resource.$start = Number(response.headers('items-start'));
        response.resource.$end = Number(response.headers('items-end'));
        return response.resource;
    };

    angular.module('app')
        .service('httpInterceptorService', ['$q', '$window', '$location', '$injector', httpInterceptorService])
        .service('authService', ['$window', '$location', 'userService', authService])
        .service('brandService', ['$resource', brandService])
        .service('channelService', ['$resource', channelService])
        .service('customerService', ['$resource', customerService])
        .service('customerFieldService', ['$resource', customerFieldService])
        .service('customerGroupService', ['$resource', customerGroupService])
        .service('customerReachingService', ['$resource', customerReachingService])
        .service('projectService', ['$resource', projectService])
        .service('userService', ['$resource', 'userRolesConstant', userService])
        .service('regionService', ['$http', '$sce', regionService])
        .service('wechatService', ['$http', '$mdToast', wechatService])
        .constant('userRolesConstant', [
            {name: 'admin', label: '平台管理者', abilities: ['edit-project', 'list-project', 'timing-project', 'image-customer', 'reach-customer', 'set-channel', 'set-data', 'set-user', 'edit-brand']},
            {name: 'brand_admin', label: '品牌管理者', abilities: ['edit-project', 'list-project', 'timing-project', 'image-customer', 'reach-customer', 'set-data', 'edit-brand']},
            {name: 'project_admin', label: '品牌执行者', abilities: ['list-project', 'timing-project', 'image-customer', 'set-data']}
        ]);

    function httpInterceptorService($q, $window, $location, $injector) {
        return {
            request: function(config) {

                if(config && config.cache === undefined){

                    var token = $window.localStorage.getItem('token');

                    if(token) {
                        config.headers['Authorization'] = token;
                    }

                    return config;
                }

                return config || $q.when(config);
            },
            requestError: function(rejection) {
                return $q.reject(rejection);
            },
            response: function(response) {
                return response || $q.when(response);
            },
            responseError: function(rejection) {

                if(rejection.status === 401){
                    $window.localStorage.removeItem('token');
                    $location.path('/signin');
                }

                var $mdToast = $injector.get('$mdToast');

                if(rejection.data && rejection.data.message) {
                    $mdToast.show($mdToast.simple(rejection.data.message).position('top right'));
                }
                else if (rejection.status >= 400 && rejection.status < 500) {
                    $mdToast.show($mdToast.simple('请求错误').position('top right'));
                }
                else if (rejection.status >= 500) {
                    $mdToast.show($mdToast.simple('服务器错误').position('top right'));
                }
                else {
                    $mdToast.show($mdToast.simple('网络错误').position('top right'));
                }

                return $q.reject(rejection);
            }
        };
    }

    function authService($window, $location, userService) {

        var user = new userService();

        this.login = function(username, password) {
            return userService.login({username: username, password: password}, function(user) {
                $window.localStorage.setItem('token', user.token);
            });
        };

        this.logout = function() {
            return userService.logout();
        };

        this.user = function() {

            if ($location.search().token) {
                $window.localStorage.setItem('token', $location.search().token);
            }

            if(!$window.localStorage.getItem('token')) {
                user.$resolved = true;
                return user;
            }

            return userService.auth();
        }
    }

    function brandService($resource) {

        var brand = $resource(api + 'brand/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        brand.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return brand;

    }

    function channelService($resource) {

        var channel = $resource(api + 'channel/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        channel.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return channel;

    }

    function customerService($resource) {

        var customers = $resource(api + 'customer/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'},
            getQrcode: {method: 'GET', url: api + 'customer/:id/qrcode/:scene'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        customers.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return customers;

    }

    function customerFieldService($resource) {

        var customerField = $resource(api + 'customer-field/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        customerField.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return customerField;

    }

    function customerGroupService($resource) {

        var customerGroups = $resource(api + 'customer-group/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        customerGroups.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return customerGroups;

    }

    function customerReachingService($resource) {

        var customerReachings = $resource(api + 'customer-reaching/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        customerReachings.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return customerReachings;

    }

    function projectService($resource) {

        var projectMutator = function(project) {

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

            return project;
        };

        var projectResponseInterceptor = function(response) {
            return projectMutator(response.resource);
        }

        var projectsResponseInterceptor = function(response) {
            responseInterceptor(response).forEach(function(project) {
                return projectMutator(project);
            });
            return response.resource;
        };

        var project = $resource(api + 'project/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: projectsResponseInterceptor}},
            create: {method: 'POST', interceptor: {response: projectResponseInterceptor}},
            update: {method: 'PUT', interceptor: {response: projectResponseInterceptor}},
            get: {method: 'GET', interceptor: {response: projectResponseInterceptor}},
            getKpiByChannels: {method: 'GET', url: api + 'project/:id/kpi-by-channels', isArray: false},
            getKpiByDate: {method: 'GET', url: api + 'project/:id/kpi-by-date', isArray: true},
            getKpiByDevice: {method: 'GET', url: api + 'project/:id/kpi-by-device', isArray: true},
            getKpiByRegion: {method: 'GET', url: api + 'project/:id/kpi-by-region', isArray: true},
            getCampaignRecords: {method: 'GET', url: api + 'project/:id/campaign-record', isArray: true, interceptor: {response: responseInterceptor}}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        project.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }

        return project;

    }

    function userService($resource, userRolesConstant) {

        var user = $resource(api + 'user/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'},
            auth: {method: 'GET', url: api + 'auth/user'},
            login: {method: 'POST', url: api + 'auth/login'},
            logout: {method: 'GET', 'url': api + 'auth/logout'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        user.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }

        var roles = userRolesConstant;

        user.prototype.can = function(ability) {
            
            var abilities;
            var _self = this;

            if(!this.roles) {
                return false;
            }

            abilities = roles.filter(function(role) {
                return _self.roles.indexOf(role.name) > -1;
            }).reduce(function(previous, current) {
                return previous.concat(current.abilities);
            }, []);

            return abilities.indexOf(ability) > -1;
        }
        
        return user;

    }

    function regionService($http, $sce) {
        return {
            query: function(parent) {

                var resource = [];

                var url = 'http://apis.map.qq.com/ws/district/v1/getchildren';

                url += '?key=4M2BZ-MY5WO-K7FWH-SV5SK-F4BG5-TKB6D&output=jsonp';

                if(parent) {
                    url += '&id=' + parent;
                }

                resource.$resolved = false;
                resource.$promise = $http.jsonp(
                    $sce.trustAsResourceUrl(url),
                    {jsonpCallbackParam: 'callback'}
                );

                resource.$promise.then(function(response) {
                    response.data.result[0].forEach(function(item) {
                        item.name = item.fullname;
                        delete item.fullname;
                        resource.push(item);
                        resource.$resolved = true;
                    });
                });

                return resource;
            }
        };
    }

    function wechatService ($http, $mdToast) {
        return {
            sync: function (wechat) {
                $mdToast.show($mdToast.simple('同步已开始').position('top right'));
                return $http.post(api + 'wechat/' + wechat.appId, {sync: true})
                .then(function (response) {
                    // response.data
                    $mdToast.show($mdToast.simple('同步已完成').position('top right'));
                });
            },
            get: function (appId) {
                return $http.get(api + 'wechat/' + appId);
            },
            saveQrScene: function (wechat, qrScene) {
                if (qrScene._id) {
                    return $http.put(api + 'wechat/' + wechat.appId + '/qrscene/' + qrScene._id, qrScene);
                }
                else {
                    return $http.post(api + 'wechat/' + wechat.appId + '/qrscene', qrScene);
                }
            },
            syncUserGroup: function (appId, group) {
                $http.post(api + 'wechat/' + appId + '/user-group/' + group._id);
            },
            massSend: function (appId, tagId, mediaId) {
                $http.post(api + 'wechat/' + appId + '/mass-send', {
                    tagId: tagId,
                    mediaId: mediaId
                });
            }
        }
    }

})(); 