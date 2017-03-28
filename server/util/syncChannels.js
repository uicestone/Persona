const mysql    = require('mysql');
const mongoose = require('mongoose');
const env      = require('node-env-file');

env(`${__dirname}/../../.env`);

mongoose.connect(process.env.MONGODB_URL);
mongoose.Promise = global.Promise;

const Channel  = require('../models/channel.js');

const connection = mysql.createConnection({
  host     : process.env.MYSQL_HOST,
  port     : process.env.MYSQL_PORT,
  user     : process.env.MYSQL_USER,
  password : process.env.MYSQL_PASSWORD,
  database : process.env.MYSQL_DATABASE
});

connection.connect();

connection.query('SELECT SPID spid, UUID uuid, Channel_Name name, \
    Channel_Plantform platform, Channel_WeID wechatId, Channel_Type topic, \
    Channel_Fans fans, Channel_Ranking rank, Channel_Score score, \
    Channel_WasIn500 wasIn500, Channel_UpdateTime updatedAt \
    FROM Channel_List', (err, results, fields) => {

    if(err) {
        throw err;
    }

    let querys = [];

    results.forEach(row => {
        row.fans = Number(row.fans.replace(/,/g, ''));
        row.wasIn500 = row.wasIn500 === 'Y';

        if(!row.uuid) {
            delete row.uuid;
        }

        ['rank', 'score'].forEach(field => {
            if(row[field] === '-') {
                delete row[field];
            }
            else {
                row[field] = Number(row[field]);
            }
        });

        querys.push(Channel.findOneAndUpdate({spid:row.spid}, row, {upsert: true}).exec());
    });

    Promise.all(querys).then(() => {
        console.log('Finished.');
        process.exit();
    });

});




