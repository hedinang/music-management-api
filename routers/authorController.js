const express = require('express');
const multer = require('multer')
const authorService = require('../service/authorService')
const router = express.Router();
const storage = multer.memoryStorage()

// const upload = multer({ dest: "upload/" })
const upload = multer({
    storage: storage,
    limits: { fieldSize: 100 * 1024 * 1024, files: 1 }
})

router.post('/list', async function (req, res) {
    let result = await authorService.list(req.body);
    res.send(result)
})

router.get('/:authorId', async function (req, res) {
    let result = await authorService.get(req.params.authorId);
    res.send(result)
})

router.post('/add', upload.single('file'), async function (req, res) {
    let result = await authorService.add(req.body, req.file);
    res.send(result)
})

router.put('/update', upload.single('file'), async function (req, res) {
    let result = await authorService.update(req.body, req.file);
    res.send(result)
})

router.delete('/:authorId', async function (req, res) {
    let result = await authorService.removeById(req.params.userId);
    res.send(result)
})

router.post('/delete', async function (req, res) {
    let result = await authorService.remove(req.body);
    res.send(result)
})

module.exports = router
