const express = require("express");
const router = express.Router();
const { recommend } = require("../services/recommendationService");

router.get("/:id", (req, res) => {
    const results = recommend(req.params.id);
    res.json(results);
});

module.exports = router;