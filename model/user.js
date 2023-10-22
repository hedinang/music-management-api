const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');

const modelName = 'user';

const userSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: true,
        default: () => uuidv4()
    },
    image: String,
    name: String,
    email: String,
    username: String,
    password: String,
    balance: Number,
    phone: String,
    type: String,
    access_token: String,
    favorite: [],
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
const ApiSchema = mongoose.model(modelName, userSchema, modelName);

module.exports = ApiSchema;
