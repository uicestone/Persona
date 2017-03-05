module.exports = function(app, router) {
    // register routes
    router = require('./brand.js')(router);
    router = require('./channel.js')(router);
    router = require('./customer.js')(router);
    router = require('./customerGroup.js')(router);
    router = require('./project.js')(router);
    router = require('./user.js')(router);
    app.use('/api', router);
};
