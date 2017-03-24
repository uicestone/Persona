'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const mongoose    = require('mongoose');
const http        = require('http');

const app         = express();
const router      = express.Router();
const portHttp    = process.env.PORT_HTTP || 8080;
const httpServer  = http.createServer(app);
const io          = require('socket.io')(httpServer);

const env 		  = require('node-env-file');

env(`${__dirname}/.env`);

mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost/persona');
mongoose.Promise = global.Promise;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

require('./server/apis')(app, router);

app.use(express.static('dist'));

app.use('/', (req, res) => {
    if (req.accepts(['html', 'json']) === 'html') {
        res.sendFile(`${__dirname}/dist/index.html`);
    }
    else {
        res.sendStatus(404);
    }
});

httpServer.listen(portHttp, () => {
    console.log(`[${new Date()}] HTTP server listening port:${portHttp}`);
});
