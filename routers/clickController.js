const express = require('express');
const clickService = require('../service/clickService')
const router = express.Router();
const authenticateService = require('../service/authenticateService');



router.post('/list', async function (req, res) {
    let result = await clickService.list(req.body);
    res.send(result)
})

// router.get('/:clickId', async function (req, res) {
//     let result = await clickService.get(req.params.clickId);
//     res.send(result)
// })

router.post('/add', authenticateService.authenticate, async function (req, res) {
    let result = await clickService.add(req.body.songId, req.params.userId);
    res.send(result)
})

// router.put('/update', upload.single('file'), async function (req, res) {
//     let result = await clickService.update(req.body, req.file);
//     res.send(result)
// })

// router.delete('/:clickId', async function (req, res) {
//     let result = await clickService.removeById(req.params.userId);
//     res.send(result)
// })

// router.post('/delete', async function (req, res) {
//     let result = await clickService.remove(req.body);
//     res.send(result)
// })

router.post('/top', async function (req, res) {
    let result = await clickService.getTop(req.body);
    res.send(result)
})

module.exports = router
