const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const { sseHandler } = require('../utils/events')

const router = express.Router()

router.get('/', authMiddleware, sseHandler)

module.exports = router
