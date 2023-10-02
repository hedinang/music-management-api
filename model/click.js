const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');
const modelName = 'click';

const clickSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: true,
        default: () => uuidv4()
    },
    customer_id: String,
    song_id: String,
    created_at: {
        type: String,
        index: true,
        default: new Date()
    }
}, { versionKey: false });
const ApiSchema = mongoose.model(modelName, clickSchema, modelName);

module.exports = ApiSchema;
