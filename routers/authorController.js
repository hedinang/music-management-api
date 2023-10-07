const express = require('express');
const authorService = require('../service/authorService')
const router = express.Router();


router.post('/list', async function (req, res) {
    let result = await authorService.list(req.body);
    res.send(result)
})

router.get('/:authorId', async function (req, res) {
    let result = await authorService.get(req.params.authorId);
    res.send(result)
})

router.post('/add', async function (req, res) {
    let result = await authorService.add(req.body);
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
