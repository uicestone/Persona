'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const compression = require('compression');
const mongoose    = require('mongoose');
const http        = require('http');

const app         = express();
const router      = express.Router();
const httpServer  = http.createServer(app);
const env         = require('node-env-file');
const WebSocket   = require('ws');

env(`${__dirname}/../.env`);

const portHttp    = process.env.PORT_HTTP;
const wss         = new WebSocket.Server({server: httpServer});
mongoose.connect(process.env.MONGODB_URL, {useMongoClient: true});
mongoose.Promise = global.Promise;

require('body-parser-xml')(bodyParser);

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.xml());

require('./apis')(app, router, wss);

app.use(express.static('dist'));

httpServer.listen(portHttp, () => {
    console.log(`HTTP server listening port:${portHttp}`);
});

wss.on('connection', (ws, req) => {
    
    console.log(`WebSocket connected.`, req.connection.remoteAddress, req.url);
    
    ws.send('Welcome to Persona!');

    ws.on('message', message => {
        console.log('received: %s', message);
        ws.send(`echo ${message}`);
    });

    ws.on('close', () => {
        console.log(`WebSocket disconnected.`, req.connection.remoteAddress, req.url);
    });
});
