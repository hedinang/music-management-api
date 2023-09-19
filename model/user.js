const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uuid = require('node-uuid');
const modelName = 'user';

const userSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: true,
        default: uuid.v4()
    },
    name: String,
    username: String,
    password: String,
    balance: Number,
    type: String,
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
}, { timestamps: true }, { versionKey: false });
const ApiSchema = mongoose.model(modelName, userSchema, modelName);

module.exports = ApiSchema;
