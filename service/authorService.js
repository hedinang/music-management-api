const mongodb = require('../model/index')
const mongoose = require('mongoose');
const httpStatus = require('http-status-codes');
const message = require('../config/message');
var AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

const s3 = new AWS.S3();

const get = async (authorId) => {
    let apiResponse = {}
    let result = await mongodb.Author.find({
        id: authorId,
        status: { $nin: ['REMOVED'] }
    }).lean();
    if (result.length) {
        apiResponse.data = result[0];
    }

    apiResponse.status = httpStatus.StatusCodes.OK
    return apiResponse
}

const list = async (body) => {
    let apiResponse = {}

    try {
        if (!body.limit) body.limit = 10
        if (!body.page) body.page = 0
        const { limit, page, search } = body
        const cleanSearch = { status: { $nin: ['REMOVED'] } }
        if (search) {
            Object.entries(search)?.forEach(([key, value]) => {
                switch (key) {
                    case 'name':
                        if (value !== null && value?.trim() !== '') {
                            cleanSearch[key] = {
                                $regex: value?.trim(),
                                $options: "i"
                            }
                        }
                        break;
                    default:
                        break;
                }
            })
        }
        let result = await mongodb.Author.find(cleanSearch).limit(limit).skip((page - 1) * limit).sort({ _id: -1 }).lean();

        const total_items = await mongodb.Author.count(cleanSearch)

        apiResponse.data = {}
        apiResponse.data.items = result?.map(e => ({
            id: e?.id,
            name: e?.name,
            img_url: e?.img_url,
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

const add = async (body, file) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    try {
        if (body.name) {

            let author = await mongodb.Author.find({ name: body.name, status: { $nin: ['REMOVED'] } }).lean();
            if (author.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Tên tác giả này đã tồn tại!";
            } else {
                if (file) {
                    const param = {
                        Bucket: 'music2023',
                        Key: `image/author/${uuidv4()}.${file.mimetype.split('/')[1]}`,
                        Body: file.buffer
                    }

                    const uploaded = await s3.upload(param).promise()
                    if (uploaded.Location) {
                        body.img_url = uploaded.Location
                    }
                }

                let result = await mongodb.Author.create(body);
                apiResponse.data = result;
                apiResponse.status = httpStatus.StatusCodes.OK
            }
        }

        return apiResponse
    } catch (e) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
}

const update = async (body, file) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    const { origin_url, name, ...data } = body
    if (name === null || name.trim() === '') {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }

    try {
        if (body.id) {
            let author = await mongodb.Author.find({ id: body.id }).lean();
            if (author.length) {


                let authorByName = await mongodb.Author.find({ name: name, id: { $ne: body.id } }).lean();
                if (authorByName.length) {
                    apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                    apiResponse.message = "Tên danh mục này đã tồn tại!";
                    return apiResponse
                }

                if (origin_url?.includes('https://music2023.s3')) {
                    data.img_url = origin_url
                } else {
                    if (file) {
                        const param = {
                            Bucket: 'music2023',
                            Key: `image/author/${uuidv4()}.${file.mimetype.split('/')[1]}`,
                            Body: file.buffer
                        }

                        const uploaded = await s3.upload(param).promise()
                        data.img_url = uploaded?.Location
                    } else {
                        data.img_url = null
                    }
                }

                await mongodb.Author.findOneAndUpdate({ id: body.id }, { ...data, name }, { new: true, session });
                apiResponse.status = httpStatus.StatusCodes.OK
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

const removeById = async (authorId) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!authorId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Author.findOneAndUpdate({ id: authorId }, { status: 'REMOVED' }, { new: true, session });
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

        let result = await mongodb.Author.updateMany({ id: { $in: idList } }, { $set: { status: 'REMOVED' } }, { new: true, session });
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


module.exports = {
    list,
    get,
    add,
    remove,
    update,
    removeById
}
