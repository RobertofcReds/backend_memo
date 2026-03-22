const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authentication');

const { createSite, getSites, removeSite } = require('../controllers/siteController');

router.get('/', verifyToken, getSites);
router.post('/', verifyToken, createSite);

module.exports = router;