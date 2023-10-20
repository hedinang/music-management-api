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

const get = async (clickId) => {
    let apiResponse = {}
    let result = await mongodb.Click.find({
        id: clickId,
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
        if (!body.page) body.page = 1
        const { limit, page, ...search } = body
        const result = await mongodb.Click.aggregate([{
            $lookup:
            {
                from: "user",
                localField: "customer_id",
                foreignField: "id",
                as: "customer"
            }

        },
        { $unwind: "$customer" },
        {
            $lookup:
            {
                from: "song",
                localField: "song_id",
                foreignField: "id",
                as: "song"
            }
        },
        { $unwind: "$song" },
        {
            $project: {
                "customer.name": 1,
                "customer.id": 1,

                "song.id": 1,
                "song.name": 1,
                "song.author": 1,
                "song.unit_price": 1,
                "song.duration": 1,
                "song.status": 1,
                "song.created_at": 1,

                "id": 1,
                "created_at": 1,
                "status": 1
            }
        },
        { $limit: limit },
        { $skip: (page - 1) * limit },
        { $sort: { _id: -1 } }
        ])


        const total_items = await mongodb.User.count({
            ...search, status: { $nin: ['REMOVED'] }
        })
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

const add = async (songId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    try {
        if (userId && songId) {
            let song = await mongodb.Song.find({ id: songId }).lean();
            if (!song.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Bài hát này không tồn tại!";
                return apiResponse
            }
            let customer = await mongodb.User.find({ id: userId }).lean();
            if (!customer.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Không tồn tại tài khoản này!";
                return apiResponse
            }

            let result = await mongodb.Click.create({
                customer_id: userId,
                song_id: songId
            });

            await session.commitTransaction();
            apiResponse.data = result;
            apiResponse.status = httpStatus.StatusCodes.OK
            return apiResponse
        } else {
            apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
            apiResponse.message = message.BAD_REQUEST;
            return apiResponse
        }
    } catch (e) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        await session.commitTransaction();
        return apiResponse
    }
}

// const update = async (body, file) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();
//     let apiResponse = {}
//     const { origin_url, name, ...data } = body
//     if (name === null || name.trim() === '') {
//         apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
//         apiResponse.message = message.BAD_REQUEST;
//         return apiResponse
//     }

//     try {
//         if (body.id) {
//             let click = await mongodb.Click.find({ id: body.id }).lean();
//             if (click.length) {


//                 let clickByName = await mongodb.Click.find({ name: name, id: { $ne: body.id } }).lean();
//                 if (clickByName.length) {
//                     apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
//                     apiResponse.message = "Tên danh mục này đã tồn tại!";
//                     return apiResponse
//                 }

//                 if (origin_url.includes('https://music2023.s3')) {
//                     data.img_url = origin_url
//                 } else {
//                     if (file) {
//                         const param = {
//                             Bucket: 'music2023',
//                             Key: `image/click/${uuid()}.${file.mimetype.split('/')[1]}`,
//                             Body: file.buffer
//                         }

//                         const uploaded = await s3.upload(param).promise()
//                         data.img_url = uploaded?.Location
//                     }
//                 }

//                 await mongodb.Click.findOneAndUpdate({ id: body.id }, { ...data, name }, { new: true, session });
//                 // apiResponse.data = result;
//                 apiResponse.status = httpStatus.StatusCodes.OK
//                 await session.commitTransaction();
//             }
//         }
//         return apiResponse
//     } catch (e) {
//         apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
//         apiResponse.message = message.BAD_REQUEST;
//         return apiResponse
//     }
// }

const removeById = async (clickId) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!clickId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Click.findOneAndUpdate({ id: clickId }, { status: 'REMOVED' }, { new: true, session });
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
        if (!clickId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Click.findOneAndUpdate({ id: { $in: idList } }, { status: 'REMOVED' }, { new: true, session });
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

const getTop = async (body) => {
    let apiResponse = {}
    try {
        if (!body.top) body.top = 10
        const result = await mongodb.Click.aggregate([{
            $group: { _id: "$song_id", count: { $sum: 1 } }
        },
        { $sort: { "customer_id": -1 } },
        { $limit: body.top },
        {
            $lookup: {
                from: "song",
                localField: "_id",
                foreignField: "id",
                as: "song"
            }
        },
        { $unwind: "$song" },
        { $match: { 'song.status': { $nin: ['REMOVED'] } } },
        ])

        apiResponse.data = {}
        apiResponse.data.items = result
        apiResponse.status = httpStatus.StatusCodes.OK
        return apiResponse
    } catch (error) {
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
    removeById,
    getTop
}
