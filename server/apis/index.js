var authenticate = require('../middlewares/authenticate');
var cors = require('cors');

module.exports = function(app, router) {
    // register routes
    router = require('./brand.js')(router);
    router = require('./channel.js')(router);
    router = require('./customer.js')(router);
    router = require('./customerField.js')(router);
    router = require('./customerGroup.js')(router);
    router = require('./customerReaching.js')(router);
    router = require('./project.js')(router);
    router = require('./user.js')(router);
    router = require('./auth.js')(router);
    app.use('/api', cors({exposedHeaders:['items-total', 'items-start', 'items-end']}), authenticate, router);
};
