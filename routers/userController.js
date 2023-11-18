const express = require('express');
const userService = require('../service/userService')
const router = express.Router();
const multer = require('multer')
const storage = multer.memoryStorage()
const httpStatus = require('http-status-codes');
const message = require('../config/message');
const authenticateService = require('../service/authenticateService');
const { CLIENT_TYPE } = require('../config/config');

const upload = multer({
    storage: storage,
    limits: { fieldSize: 100 * 1024 * 1024, files: 3 }
})

router.post('/register', async function (req, res) {
    let result = await userService.register(req.body);
    res.send(result)
})

router.post('/login', async function (req, res) {
    const apiResponse = {}
    const result = await userService.login(req.body);
    if (result) {
        apiResponse.data = { access_token: result }
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
    }
    res.send(apiResponse)
})

router.post('/list', async function (req, res) {
    let result = await userService.list(req.body);
    res.send(result)
})

router.get('/:userId', async function (req, res) {
    let apiResponse = {}
    let result = await userService.get(req.params.userId);
    if (result.length) {
        apiResponse.data = result[0];
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = "There is not any user like that";
    }
    res.send(apiResponse)
})

router.post('/me', authenticateService.authenticate, async function (req, res) {
    let apiResponse = {}
    let result = await userService.get(req.params.userId);
    if (result.length) {
        apiResponse.data = result[0];
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = "There is not any user like that";
    }
    res.send(apiResponse)
})

router.get('/admin/:userId', async function (req, res) {
    let apiResponse = {}
    let result = await userService.get(req.params.userId);
    if (result.length) {
        apiResponse.data = result[0];
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = "There is not any user like that";
    }
    res.send(apiResponse)
})

router.post('/add', upload.fields([
    { name: 'image', maxCount: 1 }]), async function (req, res) {
        let result = await userService.add(req?.body, req?.files?.image && req?.files?.image[0]);
        res.send(result)
    }
)

router.delete('/:songId', async function (req, res) {
    let result = await userService.removeById(req.params.userId);
    res.send(result)
})

router.post('/delete', async function (req, res) {
    let result = await userService.remove(req.body);
    res.send(result)
})

router.put('/update', upload.single('file'), async function (req, res) {
    let result = await userService.update(req.body, req.file);
    res.send(result)
})

router.post('/logout', authenticateService.authenticate, async function (req, res) {
    let apiResponse = {}
    let result = await userService.logout(req.params.userId)
    if (result) {
        apiResponse.status = httpStatus.StatusCodes.OK
        apiResponse.message = 'You logout successfully'
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST
    }
    res.send(apiResponse)
})

router.post('/customer-list', async function (req, res) {
    let apiResponse = {}
    let result = await userService.list(req.body, CLIENT_TYPE.CLIENT);
    if (result?.items?.length) {
        apiResponse.data = result
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
    }
    res.send(apiResponse)
})

router.post('/admin-list', async function (req, res) {
    let apiResponse = {}
    let result = await userService.list(req.body, CLIENT_TYPE.ADMIN);
    if (result?.items?.length) {
        apiResponse.data = result
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
    }
    res.send(apiResponse)
})
module.exports = router
