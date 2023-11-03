const express = require('express');
const multer = require('multer')
const categoryService = require('../service/categoryService')
const router = express.Router();
const storage = multer.memoryStorage()
const authenticateService = require('../service/authenticateService');
const httpStatus = require('http-status-codes');
const message = require('../config/message');

// const upload = multer({ dest: "upload/" })
const upload = multer({
    storage: storage,
    limits: { fieldSize: 100 * 1024 * 1024, files: 1 }
})

router.post('/list', async function (req, res) {
    let result = await categoryService.list(req.body);
    res.send(result)
})

router.get('/admin/:categoryId', async function (req, res) {
    let apiResponse = {}
    let result = await categoryService.get(req.params.categoryId);
    if (!result) {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = "There is not any categorty like that";
    } else {
        apiResponse.data = result
        apiResponse.status = httpStatus.StatusCodes.OK
    }
    res.send(apiResponse)
})

router.get('/:categoryId', authenticateService.authenticate, async function (req, res) {
    let apiResponse = {}
    let result = await categoryService.getByUser(req.body, req.params.userId, req.params.categoryId)
    apiResponse.data = result
    apiResponse.status = httpStatus.StatusCodes.OK
    res.send(apiResponse)
})

router.post('/add', upload.single('file'), async function (req, res) {
    let result = await categoryService.add(req.body, req.file);
    res.send(result)
})

router.put('/update', upload.single('file'), async function (req, res) {
    let result = await categoryService.update(req.body, req.file);
    res.send(result)
})

router.delete('/:categoryId', async function (req, res) {
    let result = await categoryService.removeById(req.params.userId);
    res.send(result)
})

router.post('/delete', async function (req, res) {
    let apiResponse = {}
    let result = await categoryService.remove(req.body)
    if (result) {
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
    }
    res.send(apiResponse)
})

module.exports = router
