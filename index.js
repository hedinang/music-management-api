const express = require("express")
require('dotenv').config();
const winston = require('./config/winston');
const routerList = require('./routers/index');
const bodyParser = require('body-parser');
const _ = require('lodash');
var cors = require('cors')
var app = express()
app.set('port', process.env.PORT || 3100);
global.logger = winston;

app.use(cors())
// middleware or filter
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
        
    next()
})
// in order to format body req
// app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

_.each(routerList, function (routerConfig) {
    _.map(routerConfig, function (value, key) {
        app.use(key, require(value));
    });
});

let server = app.listen(app.get('port'), function () {
    logger.info('Express server listening on port ' + server.address().port);
});
