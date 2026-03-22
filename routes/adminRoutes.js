const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/authentication');
const { getUsers, createSite, updateSite, deleteSite } = require('../controllers/adminController');
const upload = require('../middleware/uploadFile');


// Routes protégées par authentification admin
router.get('/users', isAdmin, getUsers);
router.post('/sites', isAdmin,upload.single("image"), createSite);
router.put('/sites/:id', isAdmin, upload.single("image"), updateSite); 
router.delete('/sites/:id', isAdmin, deleteSite);

module.exports = router;