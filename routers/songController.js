const express = require('express');
const multer = require('multer')
const songService = require('../service/songService')
const router = express.Router();
const storage = multer.memoryStorage()

// const upload = multer({ dest: "upload/" })
const upload = multer({
    storage: storage,
    limits: { fieldSize: 100 * 1024 * 1024,  files: 2 }
})

router.post('/list', async function (req, res) {
    let result = await songService.list(req.body);
    res.send(result)
})

router.get('/:songId', async function (req, res) {
    let result = await songService.get(req.params.songId);
    res.send(result)
})

router.post('/add', upload.fields([{
    name: 'img', maxCount: 1
}, {
    name: 'audio', maxCount: 1
}]), async function (req, res) {
    let result = await songService.add(req.body, req.files.img[0], req.files.audio[0]);
    res.send(result)
})

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

module.exports = router
