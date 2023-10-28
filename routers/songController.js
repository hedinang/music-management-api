const express = require('express');
const multer = require('multer')
const songService = require('../service/songService');
const authenticateService = require('../service/authenticateService');
const router = express.Router();
const storage = multer.memoryStorage()
const httpStatus = require('http-status-codes');
const message = require('../config/message');

// const upload = multer({ dest: "upload/" })
const upload = multer({
    storage: storage,
    limits: { fieldSize: 100 * 1024 * 1024, files: 3 }
})

router.post('/list', authenticateService.authenticate, async function (req, res) {
    let apiResponse = {}
    let result = await songService.listByUser(req.body, req.params.userId)
    if (result) {
        apiResponse.status = httpStatus.StatusCodes.OK
        apiResponse.data = result
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
    }
    res.send(apiResponse)
})

router.post('/admin/list', async function (req, res) {
    let apiResponse = {}
    let result = await songService.list(req.body, req.params.userId)
    if (result) {
        apiResponse.status = httpStatus.StatusCodes.OK
        apiResponse.data = result
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
        return apiResponse
    }
    res.send(apiResponse)
})

router.get('/admin/:songId', async function (req, res) {
    let result = await songService.get(req.params.songId);
    res.send(result)
})

router.get('/:songId', authenticateService.authenticate, async function (req, res) {
    let result = await songService.getByUser(req.params.userId, req.params.songId);
    res.send(result)
})

router.post('/add', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'short_audio', maxCount: 1 },
    { name: 'full_audio', maxCount: 1 }]), async function (req, res) {
        let result = await songService.add(req?.body, req?.files?.image && req?.files?.image[0], req?.files?.short_audio && req?.files?.short_audio[0], req?.files?.full_audio && req?.files?.full_audio[0]);
        res.send(result)
    }
)

router.put('/update', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'short_audio', maxCount: 1 },
    { name: 'full_audio', maxCount: 1 }]), async function (req, res) {
        let result = await songService.update(req?.body, req?.files?.image && req?.files?.image[0], req?.files?.short_audio && req?.files?.short_audio[0], req?.files?.full_audio && req?.files?.full_audio[0]);
        res.send(result)
    }
)

router.put('/update', upload.single('file'), async function (req, res) {
    let result = await songService.update(req.body, req.file);
    res.send(result)
})

router.delete('/:songId', async function (req, res) {
    let result = await songService.removeById(req.params.userId);
    res.send(result)
})

router.post('/delete', async function (req, res) {
    let result = await songService.remove(req.body);
    res.send(result)
})

router.post('/enjoy', authenticateService.authenticate, async function (req, res) {
    const apiResponse = {}
    const result = await songService.enjoy(req?.body?.songId, req?.params?.userId);
    if (result) {
        apiResponse.data = result
        apiResponse.status = httpStatus.StatusCodes.OK
    } else {
        apiResponse.status = httpStatus.StatusCodes.BAD_REQUEST
        apiResponse.message = message.BAD_REQUEST;
    }
    res.send(apiResponse)
})

module.exports = router
