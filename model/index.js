'use strict';
const _ = require('lodash');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const config = require('../config/config.js').mongodbUrl;
const dbConfig = _.extend(config, {
    database: config.database,
    username: config.username,
    password: config.password,
    port: config.port,
    host: config.host
});
const REPLICATE_STRING = config.replicateString;
const CONNECTION_ATLAS = config.connectionAtlas;
const TIMEZONE = 480; // Singapore TimeZone
const TIMEFORMAT = 'YYYY-MM-DD HH:mm:ss.SSSZ';
const SIMPLE_DATE_FORMAT = 'YYYY-MM-DD';
const SIMPLE_DATE_TIME_FORMAT = 'YYYY-MM-DDT00:00:00.000Z';
const TIMEUSERFORMAT = 'D MMM YYYY, h:mma';
const TIMEUSERFORMAT_WH = 'D MMM YYYY';
const GROUPTIMEUSERFORMAT = 'dddd, DD-MMM-YYYY';
const REDEEMDATEFORMAT = 'DD-MMM-YY h:mmA';
const FILTERDATEFORMAT = 'DD/MM/YYYY';
const LOGCONFIG = 1;
const DEFAULT_CURRENCY_SYMBOL = '$';
const DEFAULT_CURRENCY = 'sgd';
const API_OUTLET = 'API';
const API_USER = 'API';
const MEMBERSHIP_GROUP = 'MEMBERSHIP GROUP';
const EXPIRED_TRANS = 'EXPIRED';
const ONE_TIME_OFFER = 'ONE TIME OFFER';
const BENEFIT_MEMBERSHIP = 'BENEFITS MEMBERSHIP';
const AUTO_UPGRADE_MEMBERSHIP = 'AUTO UPGRADE MEMBERSHIP';
const AUTO_DOWNGRADE_MEMBERSHIP = 'AUTO DOWNGRADE MEMBERSHIP';
const AUTO_RENEWAL_MEMBERSHIP = 'AUTO RENEWAL MEMBERSHIP';
const AUTOMATIC_ENROLLMENT = 'AUTOMATIC ENROLMENT';
const ADVOCADE = 'ADVOCADE';
const GIFT = 'GIFT';

/* For transaction history default date format accept: 2016-08-17T03:34:45.330Z
    file fixed routes/transaction.js  => POST : /search (line 334)
*/
const masterSecretPassKey = 'Zjc5LTQzM2EtODZmYy1mOTg5TljY2ExZZjc5LTQzM2EtODZmYy1mOTg5TljY2ExZ';

let dbName = process.env.MONGO_DBNAME || 'music';

let connectionString = `${dbConfig.prefix + dbConfig.host}:${dbConfig.port}/${dbName}`;
if (REPLICATE_STRING) {
    connectionString = REPLICATE_STRING;
}
// connectionString = 'mongodb+srv://zien_user:SPEJM0vEwnM1rI5Y@advocadocluster01.zhy6r.mongodb.net/test?retryWrites=true&w=majority';
if (CONNECTION_ATLAS) {
    connectionString = CONNECTION_ATLAS;
}

mongoose.connect(connectionString, {
    dbName: dbName,
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true,
    retryWrites: false

}).catch(function (e) {
    logger && logger.log('error', '-------> Fatal Error connection mongoose %s', e);
});

mongoose.connection.on('error', err => {
    logger && logger.log('error', '-------> Error connection mongoose %s', err);
});

// Fix issues deprecated use useFindAndModify deprecated
// mongoose.set('useFindAndModify', false);

console.log('connectionString', connectionString);

JSON.safeStringify = (obj, indent = 0) => {
    let cache = [];
    const retVal = JSON.stringify(
        obj,
        (key, value) =>
            typeof value === 'object' && value !== null
                ? cache.includes(value)
                    ? undefined // Duplicate reference found, discard key
                    : cache.push(value) && value // Store value in our collection
                : value,
        indent
    );
    cache = null;
    return retVal;
};

const db = {};

db.Types = mongoose.Types;
db.User = require('./user');
db.Category = require('./category');
db.Song = require('./song');
db.Sale = require('./sale');
db.Click = require('./click');
db.Author = require('./author');


module.exports = db;
