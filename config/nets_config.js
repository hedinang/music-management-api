const config = require('./config');

module.exports = {
    local: {
        QRUrl: 'https://uat-api.nets.com.sg:9065/uat/merchantservices/qr/dynamic/v1/order/request',
        RqsURL: 'https://uat-api.nets.com.sg:9065/uat/merchantservices/qr/dynamic/v1/transaction/query',
        reversalURL: 'https://uat-api.nets.com.sg:9065/uat/merchantservices/qr/dynamic/v1/transaction/reversal'
    },
    preprod: {
        QRUrl: 'https://uat-api.nets.com.sg:9065/uat/merchantservices/qr/dynamic/v1/order/request',
        RqsURL: 'https://uat-api.nets.com.sg:9065/uat/merchantservices/qr/dynamic/v1/transaction/query',
        reversalURL: 'https://uat-api.nets.com.sg:9065/uat/merchantservices/qr/dynamic/v1/transaction/reversal'
    },
    production: {
        QRUrl: 'https://api.nets.com.sg/merchantservices/qr/dynamic/v1/order/request',
        RqsURL: 'https://api.nets.com.sg/merchantservices/qr/dynamic/v1/transaction/query',
        reversalURL: 'https://api.nets.com.sg/merchantservices/qr/dynamic/v1/transaction/reversal'
    }
}[config.env];
// process.env.NODE_ENV || 'local'
