(function () {
    'use strict';

    const api = 'http://localhost:8080/api/';

    angular.module('app')
        .service('brandService', ['$resource', brandService])
        .service('channelService', ['$resource', channelService])
        .service('clientService', ['$resource', clientService])
        .service('projectService', ['$resource', projectService])
        .service('userService', ['$resource', userService]);

    // add raw response as an attribute of resource,
    // so that we can get http status, header etc from resource in controllers
    const responseInterceptor = function (response) {
        response.resource.$response = response;
        return response.resource;
    };

    function brandService($resource) {

        let brand = $resource(api + 'brand/:id', {id: '@id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        brand.prototype.$save = function (a, b, c, d) {
            if (this.id && !a.restore) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return brand;

    }

    function channelService($resource) {

        let channel = $resource(api + 'channel/:id', {id: '@id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        channel.prototype.$save = function (a, b, c, d) {
            if (this.id && !a.restore) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return channel;

    }

    function clientService($resource) {

        let client = $resource(api + 'client/:id', {id: '@id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        client.prototype.$save = function (a, b, c, d) {
            if (this.id && !a.restore) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return client;

    }

    function projectService($resource) {

        let project = $resource(api + 'project/:id', {id: '@id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        project.prototype.$save = function (a, b, c, d) {
            if (this.id && !a.restore) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return project;

    }

    function userService($resource) {

        let user = $resource(api + 'user/:id', {id: '@id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        user.prototype.$save = function (a, b, c, d) {
            if (this.id && !a.restore) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }
        
        return user;

    }

})(); 