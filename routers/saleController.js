const express = require('express');
const saleService = require('../service/saleService')
const router = express.Router();
const authenticateService = require('../service/authenticateService');


router.post('/list', async function (req, res) {
    let result = await saleService.list(req.body);
    res.send(result)
})

// router.get('/:saleId', async function (req, res) {
//     let result = await saleService.get(req.params.saleId);
//     res.send(result)
// })

router.post('/admin/add', async function (req, res) {
    let result = await saleService.add(req.body);
    res.send(result)
})

router.post('/add', authenticateService.authenticate, async function (req, res) {
    let result = await saleService.add({
        customerId: req?.params?.userId,
        songId: req?.body?.songId
    });
    res.send(result)
})

// router.put('/update', upload.single('file'), async function (req, res) {
//     let result = await saleService.update(req.body, req.file);
//     res.send(result)
// })

router.delete('/:saleId', async function (req, res) {
    let result = await saleService.removeById(req.params.userId);
    res.send(result)
})

router.post('/delete', async function (req, res) {
    let result = await saleService.remove(req.body);
    res.send(result)
})

router.post('/top', async function (req, res) {
    let result = await saleService.getTop(req.body);
    res.send(result)
})

module.exports = router
