const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');
const modelName = 'song';

const songSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: true,
        default: () => uuidv4()
    },
    name: String,
    author: String,
    category: [],
    unit_price: {
        type: Number,
        index: true,
        default: 0
    },
    image: String,
    full_audio: String,
    short_audio: String,
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
