var appRoot = require('app-root-path');
var winston = require('winston');
// const logdnaWinston = require('logdna-winston');

/*
=============== USING logger like these =======================
logger.log('info', 'test message %s', 'my string');
// info: test message my string

logger.log('info', 'test message %d', 123);
// info: test message 123

logger.log('info', 'test message %j', {number: 123}, {});
// info: test message {"number":123}
// meta = {}

logger.log('info', 'test message %s, %s', 'first', 'second', {number: 123});
// info: test message first, second
// meta = {number: 123}

logger.log('info', 'test message', 'first', 'second', {number: 123});
// info: test message first second
// meta = {number: 123}

logger.log('info', 'test message %s, %s', 'first', 'second', {number: 123}, function(){});
// info: test message first, second
// meta = {number: 123}
// callback = function(){}

logger.log('info', 'test message', 'first', 'second', {number: 123}, function(){});
// info: test message first second
// meta = {number: 123}
// callback = function(){}

logger.log('silly', "127.0.0.1 - there's no place like home");
logger.log('debug', "127.0.0.1 - there's no place like home");
logger.log('verbose', "127.0.0.1 - there's no place like home");
logger.log('info', "127.0.0.1 - there's no place like home");
logger.log('warn', "127.0.0.1 - there's no place like home");
logger.log('error', "127.0.0.1 - there's no place like home");
logger.info("127.0.0.1 - there's no place like home");
logger.warn("127.0.0.1 - there's no place like home");
logger.error("127.0.0.1 - there's no place like home");

*/
// define the custom settings for each transport (file, console)
var options = {
    file: {
        level: 'info',
        filename: `${appRoot}/logs/app.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
    }
};

function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }
  return '0.0.0.0';
}

const ipLocal = getIPAddress();

const logDNADOptions = {
    key: process.env.LOGDNA_KEY,
    hostname: ipLocal || 'localhost',
    mac: '',
    app: 'APIS-' + process.env.NODE_ENV + '-' + process.env.pm_id,
    env: process.env.NODE_ENV,
    level: 'info', // Default to debug, maximum level of log, doc: https://github.com/winstonjs/winston#logging-levels
    index_meta: true // Defaults to false, when true ensures meta object will be searchable
};

// Only add this line in order to track exceptions
options.handleExceptions = true;

// instantiate a new Winston Logger with the settings defined above
let logger = null;

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'preprod') {
    logger = new winston.Logger({
        transports: [
            new winston.transports.File(options.file),
            new winston.transports.Console(options.console),
            new winston.transports.Logdna(logDNADOptions)
        ],
        exitOnError: false // do not exit on handled exceptions
    });
} else {
    logger = winston.createLogger({
        transports: [
            new (winston.transports.Console)(options.console),
        ],
        exitOnError: false, // do not exit on handled exceptions
    });
    // logger = new winston.Logger({
    //     transports: [
    //         new winston.transports.Console(options.console)
    //     ],
    //     exitOnError: false // do not exit on handled exceptions
    // });
}
// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function (message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message);
    }
};

module.exports = logger;
