const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authentication');

const { getTypes } = require('../controllers/typeController');

router.get('/', getTypes)

module.exports = router