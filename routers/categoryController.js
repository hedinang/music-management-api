const express = require('express');
const multer = require('multer')
const categoryService = require('../service/categoryService')
const router = express.Router();
const storage = multer.memoryStorage()

// const upload = multer({ dest: "upload/" })
const upload = multer({
    storage: storage,
    limits: { fileSize: 100000, files: 1 }
})

router.post('/list', async function (req, res) {
    let result = await categoryService.list(req.body);
    res.send(result)
})

router.get('/:categoryId', async function (req, res) {
    let result = await categoryService.get(req.params.categoryId);
    res.send(result)
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
    let result = await categoryService.remove(req.params.userId);
    res.send(result)
})

module.exports = router