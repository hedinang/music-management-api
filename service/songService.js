const mongodb = require('../model/index')
const mongoose = require('mongoose');
const httpStatus = require('http-status-codes');
const message = require('../config/message');
var AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const { forEach } = require('lodash');
const uuid = require('uuid').v4

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

const s3 = new AWS.S3();

const get = async (songId) => {
    let apiResponse = {}
    let result = await mongodb.Song.find({
        id: songId,
        status: { $nin: ['REMOVED'] }
    }).lean();
    if (result.length) {
        const song = result[0]
        if (song.category.length) {
            let categoryList = await mongodb.Category.find({
                id: { $in: song.category },
                status: { $nin: ['REMOVED'] }
            }).lean();
            song.category = categoryList.map(e => ({
                id: e.id,
                name: e.name
            }))
        }

        apiResponse.data = song;
    }

    apiResponse.status = httpStatus.StatusCodes.OK
    return apiResponse
}

const list = async (body) => {
    let apiResponse = {}

    try {
        if (!body.limit) body.limit = 10
        if (!body.page) body.page = 0
        const { limit, page, ...search } = body
        let result = await mongodb.Song.find({
            ...search,
            status: { $nin: ['REMOVED'] }
        }).limit(limit).skip((page - 1) * limit).sort({ _id: -1 }).lean();

        const total_items = await mongodb.Song.count({
            ...search,
            status: { $nin: ['REMOVED'] }
        });
        apiResponse.data = {}
        apiResponse.data.items = []
        for (const e of result) {
            const item = {
                id: e?.id,
                name: e?.name,
                author: e?.author,
                img_url: e?.img_url,
                unit_price: e?.unit_price,
                duration: e?.duration,
                audio_url: e?.audio_url,
                status: e?.status,
                createdAt: e?.created_at
            }
            const categoryList = await mongodb.Category.find({
                id: { $in: e?.category },
                status: { $nin: ['REMOVED'] }
            }).lean()
            item.category = categoryList.map(e => e.name)
            apiResponse.data.items.push(item)
        }

        apiResponse.data.total_items = total_items
        apiResponse.status = httpStatus.StatusCodes.OK
        return apiResponse
    } catch (error) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
}

const add = async (body, img, audio) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    try {
        if (body.name) {

            let song = await mongodb.Song.find({ name: body.name }).lean();
            if (song.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Tên danh mục này đã tồn tại!";
            } else {
                if (img) {
                    const param = {
                        Bucket: 'music2023',
                        Key: `image/song/${uuid()}.${img.mimetype.split('/')[1]}`,
                        Body: img.buffer
                    }

                    const uploadedImg = await s3.upload(param).promise()
                    if (uploadedImg.Location) {
                        body.img_url = uploadedImg.Location
                    }
                }

                if (audio) {
                    const param = {
                        Bucket: 'music2023',
                        Key: `song/${uuid()}.${audio.mimetype.split('/')[1]}`,
                        Body: audio.buffer
                    }

                    const uploadedAudio = await s3.upload(param).promise()
                    if (uploadedAudio.Location) {
                        body.audio_url = uploadedAudio.Location
                    }
                }

                let result = await mongodb.Song.create(body);
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
            let song = await mongodb.Song.find({ id: body.id }).lean();
            if (song.length) {


                let songByName = await mongodb.Song.find({ name: name, id: { $ne: body.id } }).lean();
                if (songByName.length) {
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
                            Key: `image/song/${uuid()}.${file.mimetype.split('/')[1]}`,
                            Body: file.buffer
                        }

                        const uploaded = await s3.upload(param).promise()
                        data.img_url = uploaded?.Location
                    }
                }

                let result = await mongodb.Song.findOneAndUpdate({ id: body.id }, { name: name }, { ...data }, { new: true, session });
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

removeById = async (songId) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!songId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Song.findOneAndUpdate({ id: songId }, { status: 'REMOVED' }, { new: true, session });
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

remove = async (idList) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!songId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Song.findOneAndUpdate({ id: { $in: idList } }, { status: 'REMOVED' }, { new: true, session });
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
