const mongodb = require('../model/index')
const mongoose = require('mongoose');
const httpStatus = require('http-status-codes');
const message = require('../config/message');
var AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const uuid = require('uuid').v4

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

const s3 = new AWS.S3();

const get = async (categoryId) => {
    let apiResponse = {}
    let result = await mongodb.Category.find({
        id: categoryId,
        status: { $nin: ['REMOVED'] }
    }).lean();
    if (result.length) {
        apiResponse.data = result[0];
    }

    apiResponse.status = httpStatus.StatusCodes.OK
    return apiResponse
}

const getByUser = async (body, userId, categoryId) => {
    if (!body.limit) body.limit = 10
    if (!body.page) body.page = 0
    const { limit, page, ...search } = body
    let apiResponse = {}
    apiResponse.data = {}
    apiResponse.data.items = []
    let result = await mongodb.Song.find({
        status: { $nin: ['REMOVED'] },
        category: { $elemMatch: { $eq: categoryId } }
    }).limit(limit).skip((page - 1) * limit).sort({ _id: -1 }).lean()


    for (const e of result) {
        const item = {
            id: e?.id,
            name: e?.name,
            author: e?.author,
            image: e?.image,
            unit_price: e?.unit_price,
            duration: e?.duration,
            short_audio: e?.short_audio,
            full_audio: e?.full_audio,
            status: e?.status,
            created_at: e?.created_at,
            category: e?.category
        }
        const saleList = await mongodb.Sale.find({
            customer_id: userId,
            song_id: e.id,
            status: { $nin: ['REMOVED'] }
        }).lean()

        if (saleList.length) {
            item.buy = true
        } else {
            item.buy = false
        }

        apiResponse.data.items.push(item)
    }

    const total_items = await mongodb.Song.count({
        status: { $nin: ['REMOVED'] },
        category: { $elemMatch: { $eq: categoryId } }
    });
    apiResponse.data.total_items = total_items
    apiResponse.status = httpStatus.StatusCodes.OK
    return apiResponse
}

const list = async (body) => {
    let apiResponse = {}

    try {
        if (!body.limit) body.limit = 10
        if (!body.page) body.page = 0
        const { limit, page, ...search } = body
        let result = await mongodb.Category.find({
            ...search,
            status: { $nin: ['REMOVED'] }
        }).limit(limit).skip((page - 1) * limit).sort({ _id: -1 }).lean();

        const total_items = await mongodb.Category.count({
            ...search,
            status: { $nin: ['REMOVED'] }
        });

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

            let category = await mongodb.Category.find({ name: body.name }).lean();
            if (category.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Tên danh mục này đã tồn tại!";
            } else {
                if (file) {
                    const param = {
                        Bucket: 'music2023',
                        Key: `image/category/${uuid()}.${file.mimetype.split('/')[1]}`,
                        Body: file.buffer
                    }

                    const uploaded = await s3.upload(param).promise()
                    if (uploaded.Location) {
                        body.img_url = uploaded.Location
                    }
                }

                let result = await mongodb.Category.create(body);
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
            let category = await mongodb.Category.find({ id: body.id }).lean();
            if (category.length) {


                let categoryByName = await mongodb.Category.find({ name: name, id: { $ne: body.id } }).lean();
                if (categoryByName.length) {
                    apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                    apiResponse.message = "Tên danh mục này đã tồn tại!";
                    return apiResponse
                }

                if (origin_url.includes('https://music2023.s3')) {
                    data.img_url = origin_url
                } else {
                    if (file) {
                        const param = {
                            Bucket: 'music2023',
                            Key: `image/category/${uuid()}.${file.mimetype.split('/')[1]}`,
                            Body: file.buffer
                        }

                        const uploaded = await s3.upload(param).promise()
                        data.img_url = uploaded?.Location
                    }
                }

                let result = await mongodb.Category.findOneAndUpdate({ id: body.id }, { name: name }, { ...data }, { new: true, session });
                // apiResponse.data = result;
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

const removeById = async (categoryId) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!categoryId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Category.findOneAndUpdate({ id: categoryId }, { status: 'REMOVED' }, { new: true, session });
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
        if (!categoryId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Category.findOneAndUpdate({ id: { $in: idList } }, { status: 'REMOVED' }, { new: true, session });
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
    removeById,
    getByUser
}
