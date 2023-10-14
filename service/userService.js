const mongodb = require('../model/index')
const mongoose = require('mongoose');
const httpStatus = require('http-status-codes');
const message = require('../config/message');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid').v4
var AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});
const s3 = new AWS.S3();

const login = async (body) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    try {
        if (body.username && body.password) {
            let userList = await mongodb.User.find({ username: body.username, status: { $nin: ['REMOVED'] } }, { _id: 0, __v: 0 }).lean();
            if (userList) {
                const user = userList[0]
                const result = bcrypt.compareSync(body.password, user.password); // true
                if (result) {
                    const accessToken = jwt.sign({ username: body.username }, process.env.TOKEN_SECRET, { expiresIn: '30d' });
                    await mongodb.User.findOneAndUpdate({ id: user.id }, { access_token: accessToken }, { new: true, session });
                    apiResponse.data = {
                        access_token: accessToken
                    };
                    apiResponse.status = httpStatus.StatusCodes.OK
                    await session.commitTransaction();

                } else {
                    apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                    apiResponse.message = message.BAD_REQUEST;
                    await session.abortTransaction();
                }

            } else {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = message.BAD_REQUEST;
                await session.abortTransaction();
            }

        } else {
            apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
            apiResponse.message = message.BAD_REQUEST;
            await session.abortTransaction();
        }
    } catch (e) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        await session.abortTransaction();
    }
    return apiResponse;
}

const get = async (userId) => {
    let apiResponse = {}
    let result = await mongodb.User.find({
        id: userId,
        status: { $nin: ['REMOVED'] }
    }).lean();
    if (result.length) {
        apiResponse.data = result[0];
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = "There is not any user like that";
    }
    return apiResponse
}

const list = async (body) => {
    let apiResponse = {}

    try {

        if (!body.limit) body.limit = 10
        if (!body.page) body.page = 0
        const { limit, page, ...search } = body
        let result = await mongodb.User.find({
            ...search,
            status: { $nin: ['REMOVED'] }
        }).limit(limit).skip((page - 1) * limit).sort({ _id: -1 }).lean();

        const total_items = await mongodb.User.count({
            ...search,
            status: { $nin: ['REMOVED'] }
        })
        apiResponse.data = {}
        apiResponse.data.items = []

        apiResponse.data.items = result?.map(e => ({
            id: e?.id,
            name: e?.name,
            email: e?.email,
            username: e?.username,
            balance: e?.balance,
            status: e?.status,
            createdAt: e?.created_at
        }))
        apiResponse.data.total_items = total_items
        apiResponse.status = httpStatus.StatusCodes.OK
        return apiResponse
    } catch (error) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
}

const add = async (body, image) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    try {
        if (body.username && body.password) {
            let user = await mongodb.User.find({ username: body.username }).lean();
            if (user.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Tên đăng nhập này đã tồn tại!";
            } else {
                if (image) {
                    const imgPieces = image.originalname.split('.')
                    const param = {
                        Bucket: 'music2023',
                        Key: `image/user/${uuid()}.${imgPieces[imgPieces.length - 1]}`,
                        Body: image.buffer
                    }

                    const uploadedImg = await s3.upload(param).promise()
                    if (uploadedImg.Location) {
                        body.image = uploadedImg.Location
                    }
                }

                const hash = bcrypt.hashSync(body.password, Number(process.env.SALT_ROUNDS));
                body.password = hash
                let result = await mongodb.User.create(body);
                apiResponse.data = result;
                apiResponse.status = httpStatus.StatusCodes.OK
                apiResponse.message = "Tạo khách hàng thành công"
            }
            return apiResponse
        }
    } catch (e) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
}

const removeById = async (userId) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!userId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.User.findOneAndUpdate({ id: userId }, { status: 'REMOVED' }, { new: true, session });
        apiResponse.data = result;
        apiResponse.status = httpStatus.StatusCodes.OK
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
    }
    return apiResponse
}

const register = async (body) => {
    let apiResponse = {}
    try {
        if (body.username && body.password) {
            let user = await mongodb.User.find({ username: body.username }).lean();
            if (user.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "This username was existed!";

            } else {
                const hash = bcrypt.hashSync(body.password, Number(process.env.SALT_ROUNDS));
                body.password = hash
                body.balance = 0
                body.type = 'CLIENT'
                let result = await mongodb.User.create(body);
                apiResponse.data = result;
                apiResponse.status = httpStatus.StatusCodes.OK
            }

        } else {

            apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
            apiResponse.message = 'Lack username or password!';
        }
    } catch (e) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = e;
        return apiResponse
    }

    return apiResponse
}
const remove = async (idList) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!idList.length) {
            apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
            apiResponse.message = "Have to contain at least 1 id!"
            return apiResponse
        }

        let result = await mongodb.User.updateMany({ id: { $in: idList } }, { $set: { status: 'REMOVED' } }, { new: true, session });
        apiResponse.data = result;
        apiResponse.status = httpStatus.StatusCodes.OK
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
    }
    return apiResponse
}

const update = async (body, image) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    const { image_url, short_audio_url, full_audio_url, username, password, change_password, ...data } = body
    if (username === null || username.trim() === '') {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
    try {
        if (username) {
            let user = await mongodb.User.find({ name: username, id: { $nin: body.id } }).lean();
            if (user.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Tên đăng nhập này đã tồn tại!";

            } else {
                if (image_url?.includes('https://music2023.s3')) {
                    data.image = image_url
                } else {
                    if (image) {
                        const imgPieces = image.originalname.split('.')
                        const param = {
                            Bucket: 'music2023',
                            Key: `image/user/${uuid()}.${imgPieces[imgPieces.length - 1]}`,
                            Body: image.buffer
                        }

                        const uploadedImg = await s3.upload(param).promise()
                        if (uploadedImg.Location) {
                            data.image = uploadedImg.Location
                        }
                    }
                }
                if (change_password === 'true') {
                    data.password = password
                }

                let result = await mongodb.User.findOneAndUpdate({ id: body.id }, { ...data, username }, { new: true, session });
                apiResponse.data = result;
                apiResponse.status = httpStatus.StatusCodes.OK
                apiResponse.message = "Thay đổi thông tin khách hàng thành công"
                await session.commitTransaction();
            }
        }

        return apiResponse
    } catch (e) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
}


module.exports = {
    list,
    get,
    add,
    remove,
    login,
    register,
    removeById,
    update
}
