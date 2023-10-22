const mongodb = require('../model/index')

const summary = async () => {
    const userTotal = await mongodb.User.count({
        status: { $nin: ['REMOVED'] },
        type: 'CLIENT'
    })
    const songTotal = await mongodb.Song.count({ status: { $nin: ['REMOVED'] } })
    const turnover = await mongodb.Sale.count({ status: { $nin: ['REMOVED'] } })
    const revenue = await mongodb.Sale.aggregate([{ $group: { _id: null, sum: { $sum: "$price" } } }])
    return {
        user_total: userTotal,
        song_total: songTotal,
        turnover: turnover,
        revenue: revenue[0]?.sum
    }

}

module.exports = {
    summary
}
