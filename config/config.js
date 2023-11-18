
require('dotenv').config();

const env = process.env.NODE_ENV || 'local';

module.exports = {
    env: env,
    isProduction: env === 'production',
    host: process.env.API_HOST || 'localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    masterOpsKey: process.env.MASTER_OPS_KEY || 'REPLACE_ME',
    searchServer: process.env.SEARCH_SERVER,
    userAppUrl: process.env.CONSUMER_URL || 'http://localhost',
    userAppV3Url: process.env.CONSUMER_V3_URL,
    urls: {
        masterBackend: process.env.BACKEND_URL || 'https://backend.advostaging.com',
        merchantBackend: process.env.MERCHANT_URL || 'https://app.advostaging.com',
        storeFront: process.env.STORE_URL || 'https://store.advostaging.com',
        consumer: process.env.CONSUMER_URL || 'https://user.advostaging.com'
    },
    storefrontDomain: process.env.STORE_DOMAIN || 'localhost',
    queueServer: process.env.QUEUE_SERVER || 'http://172.31.29.52', // Public: 54.254.187.35 - Private: 172.31.29.52
    utilsServer: process.env.UTIL_SERVER || 'http://172.31.14.250', // Public: 52.221.191.112 - Private: 172.31.14.250
    mongodbUrl: {
        connectionAtlas: process.env.CONNECTION_ATLAS || null,
        prefix: 'mongodb://',
        username: process.env.MONGO_USER || '',
        password: process.env.MONGO_PASS || '',
        host: process.env.MONGO_HOST || 'localhost',
        port: 27017,
        database: 'music',
        replicateString: process.env.MONGO_REPL || null
    },
    // elasticUrl: {
    //     host: process.env.ELASTIC_URL || 'http://172.31.14.250',
    //     port: '9200',
    //     index: 'advocado_live',
    //     op_timeout: '5s',
    //     request_timeout: 6000
    // },
    // newRelic: {
    //     appName: process.env.NEW_RELIC_APP || 'Advocado',
    //     licenseKey: process.env.NEW_RELIC_API_KEY || '',
    //     logLevel: process.env.NEW_RELIC_LOG_LEVEL || 'info'
    // },
    aiMazingAPIKey: process.env.AIMAZING_API_KEY,

    braintreeMerchantId: process.env.BRAINTREE_MERCHANT_ID,
    braintreePublicKey: process.env.BRAINTREE_PUBLIC_KEY,
    braintreePrivateKey: process.env.BRAINTREE_PRIVATE_KEY,
    grecaptchaSecretKey: process.env.GCAPTCHA_SECRET_KEY,
    consumerGiftingUniqueLink: process.env.CONSUMER_GIFTING_UNIQUE_LINK,
    GCAPTCHA_CHECK_POINT: process.env.GCAPTCHA_CHECK_POINT,
    aws: {
        key: process.env.AWS_ACCESS_KEY,
        secret: process.env.AWS_ACCESS_SECRET_KEY,
        report_bucket: process.env.S3_REPORT_BUCKET,
        photo_bucket: process.env.S3_PHOTO_BUCKET,
        exportQueueUrl: process.env.AWS_EXPORT_QUEUE_URL,
        region: process.env.AWS_REGION
    },
    GCAPTCHA_CHECK_POINT_ADJUST: {
        '65': 0.2,
        '66': 0.2,
        '60': 0.2
    },
    grecaptchaSecretV2Key: process.env.GCAPTCHA_SECRET_V2_KEY,
    grecaptchaversion: process.env.GCAPTCHA_VERSION,
    advocadoNOVOCHATKEY: process.env.ADVO_NOVOCHAT_KEY,
    enableNovochatForSystem: process.env.ADVO_USE_NOVOCHAT == 'true',
    enableNovochatForConsumer: process.env.ADVO_USE_NOVOCHAT_FOR_CONSUMER == 'true',
    enableSmsThresholdCheck: process.env.ENABLE_SMS_THRESHOLD_CHECK == 'true',
    devEmailAddress: process.env.EMAIL_DEV_ENV || 'dev@advocado.me',
    lineAdvocadoMessageChannelId: process.env.ADVO_LINE_ADVOCADO_MESSAGE_CHANNEL_ID,
    lineAdvocadoMessageChannelSecret: process.env.ADVO_LINE_ADVOCADO_MESSAGE_CHANNEL_SECRET,
    lineMessageApiUrl: 'https://api.line.me/v2/bot/message',
    line: {
        profileApiUrl: 'https://api.line.me/v2/bot/profile',
        enableLineMessageSendingForSystem: process.env.ADVO_LINE_ENABLE_LINE_MESSAGE_SENDING || 'true'
    },
    phantomServer: process.env.PHANTOM_URL,
    unSubDomain: process.env.UNSUB_DOMAIN,
    zeoniqSecretKey: process.env.ZEONIG_SECRET_KEY,
    twilioAccountSID: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioServiceSID: process.env.TWILIO_SERVICE_SID,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    twilioCountry: process.env.TWILIO_COUNTRY ? process.env.TWILIO_COUNTRY.split(',') : [],
    CASH_BACK_MATRIX: [
        {
            'categoryGroup': 'A',
            'tier': 'Starter',
            'promotion': 5
        },
        {
            'categoryGroup': 'A',
            'tier': 'Basic',
            'promotion': 10
        },
        {
            'categoryGroup': 'A',
            'tier': 'Premium',
            'promotion': 15
        },
        {
            'categoryGroup': 'B',
            'tier': 'Bronze',
            'promotion': 6
        },
        {
            'categoryGroup': 'B',
            'tier': 'Basic',
            'promotion': 12
        },
        {
            'categoryGroup': 'B',
            'tier': 'Premium',
            'promotion': 18
        },
        {
            'categoryGroup': 'C',
            'tier': 'Starter',
            'promotion': 0
        },
        {
            'categoryGroup': 'C',
            'tier': 'Basic',
            'promotion': 0
        },
        {
            'categoryGroup': 'C',
            'tier': 'Premium',
            'promotion': 0
        }
    ],
    CLIENT_TYPE: {
        CLIENT: 'CLIENT',
        ADMIN: 'ADMIN'
    }
};
