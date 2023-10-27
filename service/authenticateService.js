const jwt = require('jsonwebtoken');
const mongodb = require('../model/index')

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1]
            const baseUrl = req.baseUrl

            jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
                if (err) {
                    return res.sendStatus(403);
                }
                let result = await mongodb.User.find({
                    access_token: token,
                    status: { $nin: ['REMOVED'] },
                }).lean();
                if (result.length) {
                    const user = result[0]
                    switch (baseUrl) {
                        case '/song':

                            break;

                        default:
                            break;
                    }
                    req.params.userId = user.id
                    next()
                }
                else {
                    res.sendStatus(401)
                }
            })
        } else {
            res.sendStatus(401);
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    authenticate
}
