/* eslint-disable no-undef */
/* eslint-disable handle-callback-err */

let kue = require('kue');
let helper = require('../jobs/helper');
let queue = kue.createQueue({
    prefix: 'api',
    redis: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
        db: process.env.REDIS_DB,
        options: {
            // see https://github.com/mranney/node_redis#rediscreateclient
        }
    }
});

global.countQueueError = 0;

queue.on('error', function (err) {
    logger.log('error', '----> Fatal Error with kue occurs %s %s', countQueueError++, err);
});

queue.watchStuckJobs(1000);
queue.setMaxListeners(0); // 0 to turn off the limit
// As soon as whenever application is up, clean up all stuck active jobs, safe to force user trigger job again.
queue.active(function (err, ids) {
    ids.forEach(helper.deleteStuckedJob);
});

global.queue = queue;

const OVERVIEW_REPORT_PARALLELTASK = 1;
let queueService = require('../jobs/queue-service');
let queueHandler = require('../jobs/queue-handler');
let Type = require('../jobs/type');

// Define jobs and handlers
queueService.register(Type.CSD_OVERVIEW_JOB_TYPE, OVERVIEW_REPORT_PARALLELTASK, queueHandler.createCSDOverviewData);

queueService.register(Type.CSD_MERCHANTS_JOB_TYPE, OVERVIEW_REPORT_PARALLELTASK, queueHandler.createCSDMerchantsData);

queueService.register(Type.CSD_MERCHANT_JOB_TYPE, OVERVIEW_REPORT_PARALLELTASK, queueHandler.createCSDMerchantData);

// Handle failed count
queue.failedCount(Type.CSD_MERCHANT_JOB_TYPE, function (err, total) {
    if (total > 500) {
        logger && logger.error('error', 'Fatal error merchant job > 500');
    }
});
