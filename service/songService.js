const mongodb = require('../model/index')
const mongoose = require('mongoose');
const httpStatus = require('http-status-codes');
const message = require('../config/message');
var AWS = require('aws-sdk');
const clickService = require('../service/clickService')
const uuid = require('uuid').v4

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

const s3 = new AWS.S3();

const get = async (songId) => {
    let apiResponse = {}
    let result = await mongodb.Song.aggregate(
        [
            { $match: { id: songId, status: { $nin: ['REMOVED'] } } },
            { $unwind: "$category" },
            {
                $lookup: {
                    from: "category",
                    localField: "category",
                    foreignField: "id",
                    as: "category"
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    "_id": "$_id",
                    "name": { $first: '$name' },
                    "author": { $first: '$author' },
                    "image": { $first: '$image' },
                    "unit_price": { $first: '$unit_price' },
                    "duration": { $first: '$duration' },
                    "full_audio": { $first: '$full_audio' },
                    "short_audio": { $first: '$short_audio' },
                    "status": { $first: '$status' },
                    "created_at": { $first: '$created_at' },
                    category: { $push: "$category" }
                }
            }
        ]
    )
    if (result.length) {
        apiResponse.data = result[0];
    }

    apiResponse.status = httpStatus.StatusCodes.OK
    return apiResponse
}

const getByUser = async (userId, songId) => {
    let apiResponse = {}
    let sale = await mongodb.Sale.find({ customer_id: userId, song_id: songId }).lean()
    if (!sale.length) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = 'Bạn chưa mua bài hát này!';
        return apiResponse
    }

    let result = await mongodb.Song.aggregate(
        [
            { $match: { id: songId, status: { $nin: ['REMOVED'] } } },
            { $unwind: "$category" },
            {
                $lookup: {
                    from: "category",
                    localField: "category",
                    foreignField: "id",
                    as: "category"
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    "_id": "$_id",
                    "name": { $first: '$name' },
                    "author": { $first: '$author' },
                    "image": { $first: '$image' },
                    "unit_price": { $first: '$unit_price' },
                    "duration": { $first: '$duration' },
                    "full_audio": { $first: '$full_audio' },
                    "short_audio": { $first: '$short_audio' },
                    "status": { $first: '$status' },
                    "created_at": { $first: '$created_at' },
                    category: { $push: "$category" }
                }
            }
        ]
    )
    if (result.length) {
        await clickService.add({
            customerId: userId,
            songId: songId
        });
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
        const { limit, page, ...search } = body
        let result = await mongodb.Song.aggregate([
            { $match: { status: { $nin: ['REMOVED'] } } },
            { $limit: limit },
            { $skip: (page - 1) * limit },
            { $sort: { _id: - 1 } },
            { $unwind: "$category" },
            {
                $lookup: {
                    from: "category",
                    localField: "category",
                    foreignField: "id",
                    as: "category"
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    "_id": "$_id",
                    'id': { $first: '$id' },
                    "name": { $first: '$name' },
                    "author": { $first: '$author' },
                    "image": { $first: '$image' },
                    "unit_price": { $first: '$unit_price' },
                    "duration": { $first: '$duration' },
                    "full_audio": { $first: '$full_audio' },
                    "short_audio": { $first: '$short_audio' },
                    "status": { $first: '$status' },
                    "created_at": { $first: '$created_at' },
                    category: { $push: "$category" }
                }
            }
        ])

        const total_items = await mongodb.Song.count({
            ...search,
            status: { $nin: ['REMOVED'] }
        });
        apiResponse.data = {}
        apiResponse.data.items = result
        apiResponse.data.total_items = total_items
        apiResponse.status = httpStatus.StatusCodes.OK
        return apiResponse
    } catch (error) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
}

const listByUser = async (body, userId) => {
    let apiResponse = {}

    try {
        if (!body.limit) body.limit = 10
        if (!body.page) body.page = 0
        const { limit, page, ...search } = body
        let result = await mongodb.Song.aggregate([
            { $match: { status: { $nin: ['REMOVED'] } } },
            { $limit: limit },
            { $skip: (page - 1) * limit },
            { $sort: { _id: - 1 } },
            { $unwind: "$category" },
            {
                $lookup: {
                    from: "category",
                    localField: "category",
                    foreignField: "id",
                    as: "category"
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    "_id": "$_id",
                    'id': { $first: '$id' },
                    "name": { $first: '$name' },
                    "author": { $first: '$author' },
                    "image": { $first: '$image' },
                    "unit_price": { $first: '$unit_price' },
                    "duration": { $first: '$duration' },
                    "full_audio": { $first: '$full_audio' },
                    "short_audio": { $first: '$short_audio' },
                    "status": { $first: '$status' },
                    "created_at": { $first: '$created_at' },
                    category: { $push: "$category" }
                }
            }
        ])

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

        apiResponse.data.total_items = total_items
        apiResponse.status = httpStatus.StatusCodes.OK
        return apiResponse
    } catch (error) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
}


const add = async (body, image, shortAudio, fullAudio) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    try {
        if (body.name) {

            let song = await mongodb.Song.find({ name: body.name }).lean();
            if (song.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Bài hát này đã tồn tại!";
            } else {
                if (image) {
                    const imgPieces = image.originalname.split('.')
                    const param = {
                        Bucket: 'music2023',
                        Key: `image/song/${uuid()}.${imgPieces[imgPieces.length - 1]}`,
                        Body: image.buffer
                    }

                    const uploadedImg = await s3.upload(param).promise()
                    if (uploadedImg.Location) {
                        body.image = uploadedImg.Location
                    }
                }

                if (shortAudio) {
                    const shortaudioPieces = shortAudio.originalname.split('.')
                    const param = {
                        Bucket: 'music2023',
                        Key: `song/short/${uuid()}.${shortaudioPieces[shortaudioPieces.length - 1]}`,
                        Body: shortAudio.buffer
                    }

                    const uploadedShortAudio = await s3.upload(param).promise()
                    if (uploadedShortAudio.Location) {
                        body.short_audio = uploadedShortAudio.Location
                    }
                }

                if (fullAudio) {
                    const fullAudioPieces = fullAudio.originalname.split('.')
                    const param = {
                        Bucket: 'music2023',
                        Key: `song/full/${uuid()}.${fullAudioPieces[fullAudioPieces.length - 1]}`,
                        Body: fullAudio.buffer
                    }

                    const uploadedFullAudio = await s3.upload(param).promise()
                    if (uploadedFullAudio.Location) {
                        body.full_audio = uploadedFullAudio.Location
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

const update = async (body, image, shortAudio, fullAudio) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    const { image_url, short_audio_url, full_audio_url, name, ...data } = body
    if (name === null || name.trim() === '') {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
    try {
        if (name) {
            let song = await mongodb.Song.find({ name: name, id: { $nin: body.id } }).lean();
            if (song.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Bài hát này đã tồn tại!";

            } else {
                if (image_url?.includes('https://music2023.s3')) {
                    data.image = image_url
                } else {
                    if (image) {
                        const imgPieces = image.originalname.split('.')
                        const param = {
                            Bucket: 'music2023',
                            Key: `image/song/${uuid()}.${imgPieces[imgPieces.length - 1]}`,
                            Body: image.buffer
                        }

                        const uploadedImg = await s3.upload(param).promise()
                        if (uploadedImg.Location) {
                            data.image = uploadedImg.Location
                        }
                    }
                }

                if (short_audio_url?.includes('https://music2023.s3')) {
                    data.short_audio = short_audio_url
                } else {
                    if (shortAudio) {
                        const shortaudioPieces = shortAudio.originalname.split('.')
                        const param = {
                            Bucket: 'music2023',
                            Key: `song/short/${uuid()}.${shortaudioPieces[shortaudioPieces.length - 1]}`,
                            Body: shortAudio.buffer
                        }

                        const uploadedShortAudio = await s3.upload(param).promise()
                        if (uploadedShortAudio.Location) {
                            data.short_audio = uploadedShortAudio.Location
                        }
                    }
                }

                if (full_audio_url?.includes('https://music2023.s3')) {
                    data.full_audio = full_audio_url
                } else {
                    if (fullAudio) {
                        const fullAudioPieces = fullAudio.originalname.split('.')
                        const param = {
                            Bucket: 'music2023',
                            Key: `song/full/${uuid()}.${fullAudioPieces[fullAudioPieces.length - 1]}`,
                            Body: fullAudio.buffer
                        }

                        const uploadedFullAudio = await s3.upload(param).promise()
                        if (uploadedFullAudio.Location) {
                            data.fullAudio = uploadedFullAudio.Location
                        }
                    }
                }

                let result = await mongodb.Song.findOneAndUpdate({ id: body.id }, { ...data, name }, { new: true, session });
                apiResponse.data = result;
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
    removeById,
    listByUser,
    getByUser
}
