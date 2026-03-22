const express = require('express')
const pool = require('../config/db');


const getTypes = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM type');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

module.exports = {getTypes}