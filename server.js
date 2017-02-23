'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var http        = require('http');
var cors        = require('cors');

var app         = express();
var router      = express.Router();
var portHttp    = process.env.PORT_HTTP || 8080;
var httpServer   = http.createServer(app);
var io          = require('socket.io')(httpServer);

mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost/persona');

app.use(bodyParser.json());
app.use(cors());

require('./server/apis')(app, router);

app.use(express.static('dist'));

app.use('/', function (req, res) {
    if (req.accepts(['html', 'json']) === 'html') {
        res.sendFile(__dirname + '/dist/index.html');
    }
    else {
        res.sendStatus(404);
    }
});

httpServer.listen(portHttp, function() {
    console.log('[' + new Date() + '] HTTP server listening port:', portHttp);
});
