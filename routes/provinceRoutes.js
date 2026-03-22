const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authentication');

const { getProvinces } = require('../controllers/provinceController');

router.get('/', getProvinces)

module.exports = router