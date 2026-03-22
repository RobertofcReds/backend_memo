const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
// router.post('/forgot-password', authController.forgotPassword);
router.post("/forgot-password", authController.forgotPassword);
router.get("/reset-password/:token", authController.verifyToken);
router.post("/reset-password/:token", authController.resetPassword);
 
module.exports = router; 