const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uuid = require('node-uuid');
const modelName = 'category';

const categorySchema = new Schema({
    id: {
        type: String,
        required: true,
        index: true,
        default: uuid.v4()
    },
    name: String,
    img_url: String,
    status: {
        type: String,
        index: true,
        default: 'ACTIVE'
    },
    created_at: {
        type: String,
        index: true,
        default: new Date()
    },
    updated_at: {
        type: String,
        index: true,
        default: new Date()
    },
}, { versionKey: false });
const ApiSchema = mongoose.model(modelName, categorySchema, modelName);

module.exports = ApiSchema;
