(function () {
    'use strict';

    var api = 'http://localhost:8080/api/';

    // add raw response as an attribute of resource,
    // so that we can get http status, header etc from resource in controllers
    var responseInterceptor = function (response) {
        response.resource.$response = response;
        return response.resource;
    };

    angular.module('app')
        .service('brandService', ['$resource', brandService])
        .service('channelService', ['$resource', channelService])
        .service('clientService', ['$resource', clientService])
        .service('projectService', ['$resource', projectService])
        .service('userService', ['$resource', userService]);

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

    function clientService($resource) {

        var client = $resource(api + 'client/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        client.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return client;

    }

    function projectService($resource) {

        var projectResponseIntercepter = function(response) {
            
            project = response.resource;

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

            return response.resource;
        }

        var project = $resource(api + 'project/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST', interceptor: {response: projectResponseIntercepter}},
            update: {method: 'PUT', interceptor: {response: projectResponseIntercepter}},
            get: {method: 'GET', interceptor: {response: projectResponseIntercepter}}
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

    function userService($resource) {

        var user = $resource(api + 'user/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
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
        
        return user;

    }

})(); 