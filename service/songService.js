const mongodb = require('../model/index')
const mongoose = require('mongoose');
const httpStatus = require('http-status-codes');
const message = require('../config/message');
var AWS = require('aws-sdk');
const clickService = require('../service/clickService')
const userService = require('../service/userService')

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
            },
            {
                $lookup: {
                    from: "author",
                    localField: "author",
                    foreignField: "id",
                    as: "author"
                }
            },
            { $unwind: '$author' }
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
    } else {
        const buyDate = new Date(sale[0].created_at)
        const expiredDate = buyDate.setDate(buyDate.getDate() + process.env.EXPIRED_DAY)
        if (expiredDate <= new Date()) {
            apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
            apiResponse.message = 'Bạn chưa gia hạn bài hát này!';
            return apiResponse
        }
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
            },
            {
                $lookup: {
                    from: "author",
                    localField: "author",
                    foreignField: "id",
                    as: "author"
                }
            },
            { $unwind: '$author' },
            { $addFields: { author: '$author.name' } }
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
    const data = {}
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
                    case 'author':
                        if (value !== null && value?.trim() !== '') {
                            cleanSearch['author.name'] = {
                                $regex: value?.trim(),
                                $options: "i"
                            }
                        }
                        break;
                    case 'unit_price':
                    case 'duration':
                        if (value !== null && typeof (value) === 'number' && value !== 0) {
                            cleanSearch[key] = value
                        }
                        break
                    case 'total_price':
                        break
                    case 'category':
                        if (value !== null && value?.trim() !== '') {
                            cleanSearch['category'] = {
                                $elemMatch: {
                                    "name": {
                                        $regex: value?.trim(),
                                        $options: "i"
                                    }
                                }
                            }
                        }
                        break
                    default:
                        break;
                }
            })
        }
        let result = await mongodb.Song.aggregate([
            {
                $lookup: {
                    from: "category",
                    localField: "category",
                    foreignField: "id",
                    as: "category"
                }
            },
            {
                $lookup: {
                    from: "author",
                    localField: "author",
                    foreignField: "id",
                    as: "author"
                }
            },
            { $unwind: "$author" },
            { $match: cleanSearch },
            { $limit: limit },
            { $skip: (page - 1) * limit },
            { $sort: { _id: - 1 } },
        ])
        const total_items = await mongodb.Song.count(cleanSearch)
        data.items = result
        data.total_items = total_items
        return data
    } catch (error) {
        return false
    }
}

const listByUser = async (body, userId) => {
    let data = {}
    try {
        const result = await list(body)
        if (result) {
            let user = await userService.get(userId);
            if (!user.length) {
                return
            }
            let favoriteIdList = user[0]?.favorite?.map(e => e.id)

            data.total_items = result?.total_items
            data.items = []
            for (const e of result?.items) {
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
                    category: e?.category,
                    favorite: favoriteIdList.includes(e?.id)
                }
                const saleList = await mongodb.Sale.find({
                    customer_id: userId,
                    song_id: e.id,
                    status: { $nin: ['REMOVED'] }
                }).sort({ _id: -1 }).lean()

                item.expired = false
                if (saleList.length) {
                    item.buy = true
                    const buyDate = new Date(saleList[0].created_at)
                    const expiredDate = buyDate.setDate(buyDate.getDate() + process.env.EXPIRED_DAY)
                    if (expiredDate <= new Date()) {
                        item.expired = true
                    }
                } else {
                    item.buy = false
                }
                data.items.push(item)
            }
        }
        return data
    } catch (error) {
        return false
    }
}


const add = async (body, image, shortAudio, fullAudio) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    try {
        if (body.name) {

            let song = await mongodb.Song.find({ name: body.name, status: { $nin: ['REMOVED'] } }).lean();
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
                    } else {
                        data.image = null
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

const removeById = async (songId) => {
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

const remove = async (idList) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!idList.length) {
            apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
            apiResponse.message = "Cung cấp ít nhất một bài hát để xoá!"
            return apiResponse
        }

        let result = await mongodb.Song.updateMany({ id: { $in: idList } }, { $set: { status: 'REMOVED' } }, { new: true, session });
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

const enjoy = async (songId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!songId || !userId) {
            return false
        } else {
            let result = await mongodb.User.find({
                id: userId,
                status: { $nin: ['REMOVED'] }
            }).lean()
            if (!result.length) {
                return false
            }
            const favoriteList = result[0]?.favorite || []
            const index = favoriteList?.indexOf(songId)
            if (index > -1) {
                favoriteList.splice(index, 1)
            } else {
                favoriteList.push(songId)
            }
            await mongodb.User.findOneAndUpdate({ id: userId }, { favorite: favoriteList }, { new: true, session })
            await session.commitTransaction();
            return true
        }
    } catch (error) {
        await session.abortTransaction();
        return false
    }
}

module.exports = {
    list,
    get,
    add,
    remove,
    update,
    removeById,
    listByUser,
    getByUser,
    enjoy
}
