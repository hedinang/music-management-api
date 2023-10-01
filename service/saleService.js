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

const get = async (saleId) => {
    let apiResponse = {}
    let result = await mongodb.Sale.find({
        id: saleId,
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
        const result = await mongodb.Sale.aggregate([{
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

                "created_at": 1,
                "status": 1
            }
        },
        { $limit: limit },
        { $skip: (page - 1) * limit },
        { $sort: { _id: -1 } }
        ])


        const total_items = await mongodb.User.count({
            ...search
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

const add = async (body) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let apiResponse = {}
    try {
        if (body.customerId && body.songId) {
            let song = await mongodb.Song.find({ id: body.songId }).lean();
            if (!song.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Bài hát này không tồn tại!";
                return apiResponse
            }
            let customer = await mongodb.User.find({ id: body.customerId }).lean();
            if (!customer.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Không tồn tại tài khoản này!";
                return apiResponse
            }

            let sale = await mongodb.Sale.find({ customer_id: body.customerId, song_id: body.songId }).lean();
            const retention = customer[0]?.balance || 0 - song[0]?.unit_price || 0 * song[0]?.duration || 0
            if (retention < 0) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Bạn không đủ tiền để mua bài hát này!";
                return apiResponse
            }

            if (sale.length) {
                apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
                apiResponse.message = "Bạn đã mua bài hát này!";
                return apiResponse
            }


            let result = await mongodb.Sale.create({
                customer_id: body.customerId,
                song_id: body.songId
            });

            await mongodb.Song.findOneAndUpdate({ id: body.customer_id }, { balance: retention }, { new: true, session });
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
            let sale = await mongodb.Sale.find({ id: body.id }).lean();
            if (sale.length) {


                let saleByName = await mongodb.Sale.find({ name: name, id: { $ne: body.id } }).lean();
                if (saleByName.length) {
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
                            Key: `image/sale/${uuid()}.${file.mimetype.split('/')[1]}`,
                            Body: file.buffer
                        }

                        const uploaded = await s3.upload(param).promise()
                        data.img_url = uploaded?.Location
                    }
                }

                let result = await mongodb.Sale.findOneAndUpdate({ id: body.id }, { name: name }, { ...data }, { new: true, session });
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

removeById = async (saleId) => {
    let apiResponse = {}
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!saleId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Sale.findOneAndUpdate({ id: saleId }, { status: 'REMOVED' }, { new: true, session });
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
        if (!saleId) {
            throw Error("id hasn't existed !")
        }

        let result = await mongodb.Sale.findOneAndUpdate({ id: { $in: idList } }, { status: 'REMOVED' }, { new: true, session });
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
