const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uuid = require('node-uuid');
const modelName = 'song';

const songSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: true,
        default: uuid.v4()
    },
    name: String,
    author: String,
    category: [],
    unit_price: {
        type: Number,
        index: true,
        default: 0
    },
    img_url: String,
    audio_url: String,
    duration: Number,
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
const ApiSchema = mongoose.model(modelName, songSchema, modelName);

module.exports = ApiSchema;
