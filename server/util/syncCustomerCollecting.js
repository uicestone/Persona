const mysql    = require('mysql');
const mongoose = require('mongoose');
const env      = require('node-env-file');
const camelcaseKeys = require('camelcase-keys');

env(`${__dirname}/../../.env`);

mongoose.connect(process.env.MONGODB_URL);
mongoose.Promise = global.Promise;

const Customer  = require('../models/customer.js');

const connection = mysql.createConnection({
  host     : process.env.MYSQL_FACE_HOST,
  port     : process.env.MYSQL_FACE_PORT,
  user     : process.env.MYSQL_FACE_USER,
  password : process.env.MYSQL_FACE_PASSWORD,
  database : process.env.MYSQL_FACE_DATABASE
});

connection.connect();

connection.query(
    'SELECT `ZGID`, `Daily_Customer`.`MMID`, \
        `Daily_Customer`.`OpenID`, `Daily_Customer`.`Phone_Number`, \
        `Daily_Customer`.`Sex`, `Daily_Customer`.`Age`, \
        `Daily_Customer`.`Store_ID`, `Store_List`.`Store_Name`, \
        `Daily_Customer`.`Portrait_Url`, \
        MAX(`Daily_Customer`.`Visit_Time`) `last_visited_at`, \
        MAX(`Daily_Customer`.`Count`) `visited_times`, \
        GROUP_CONCAT(`Daily_Customer`.`Visit_Time`) `visited_at` \
    FROM `Daily_Customer` \
    INNER JOIN `Store_List` ON `Daily_Customer`.`Store_ID` = `Store_List`.`Store_ID` \
    WHERE `Daily_Customer`.`Is_touched` = \'N\' \
    GROUP BY `ZGID`',
    (err, results, fields) => {

        if(err) {
            throw err;
        }

        let querys = [];

        results.forEach(row => {
            row = camelcaseKeys(row);
            row.visitedAt = row.visitedAt.split(',').map(time => new Date(time));
            querys.push(Customer.findOneAndUpdate({zgid:row.zgid}, row, {upsert: true, strictMode: false}).exec());
        });

        Promise.all(querys)

        .then((results) => {
            console.log('Finished.');
            process.exit();
        })

        .catch(err => {
            console.error(new Date(), err);
            process.exit();
        });
    }
);
