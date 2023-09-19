require('dotenv').config();

module.exports = {

    /** Default timeout is 7000 */
    ckoTimeout: process.env.CKO_TIMEOUT || 7000,

    /** Support emails */
    ckoSupportEmails: process.env.CKO_SUPPORT_EMAILS
};
