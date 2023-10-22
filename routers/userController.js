const express = require('express');
const userService = require('../service/userService')
const router = express.Router();
const multer = require('multer')
const storage = multer.memoryStorage()
const httpStatus = require('http-status-codes');
const message = require('../config/message');

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
    let result = await userService.get(req.params.userId);
    res.send(result)
})

router.get('/admin/:userId', async function (req, res) {
    let result = await userService.get(req.params.userId);
    res.send(result)
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

router.get('/logout', async function (req, res) {
    let result = await userService.logout(req.body);
    res.send(result)
})

router.get('/customer-list', async function (req, res) {
    let result = await userService.listCustomer(req.body);
    res.send(result)
})

module.exports = router
