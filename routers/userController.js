const express = require('express');
const userService = require('../service/userService')
const router = express.Router();

router.post('/register', async function (req, res) {
    let result = await userService.register(req.body);
    res.send(result)
})

router.post('/login', async function (req, res) {
    let result = await userService.login(req.body);
    res.send(result)
})

router.get('/', async function (req, res) {
    let result = await userService.list(req.body);
    res.send(result)
})

router.get('/:userId', async function (req, res) {
    let result = await userService.get(req.params.userId);
    res.send(result)
})

router.post('/', async function (req, res) {
    let result = await userService.add(req.body);
    res.send(result)
})

router.delete('/:userId', async function (req, res) {
    let result = await userService.remove(req.params.userId);
    res.send(result)
})

module.exports = router
