const express = require('express');
const dashboardService = require('../service/dashboardService')
const httpStatus = require('http-status-codes');
const router = express.Router();

router.get('/summary', async function (req, res) {
    let apiResponse = {}
    let result = await dashboardService.summary(req.params.authorId);
    apiResponse.data = result
    apiResponse.status = httpStatus.StatusCodes.OK
    res.send(apiResponse)
})

module.exports = router
