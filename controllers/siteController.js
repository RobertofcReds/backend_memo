const express = require('express');
const pool = require('../config/db');

const createSite = async (req, res) => {
    const { nom, description, region, budget, periode } = req.body;

    if (!nom || !description || !region || !budget || !periode) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO sites (nom, description, region, budget, periode) VALUES (?, ?, ?, ?, ?)',
            [nom, description, region, budget, periode]
        );

        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

const getSites = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT s.*, t.libele as libele_type, r.nom as libele_region FROM sites s left join type t on s.id_type = t.id_type left join regions r on s.id_region = r.id_region');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

const removeSite = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID du site requis' });
    }

    try {
        const [result] = await pool.execute('DELETE FROM sites WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Site non trouvé' });
        }

        res.json({ message: 'Site supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

module.exports = {
    createSite,
    getSites,
    removeSite
};