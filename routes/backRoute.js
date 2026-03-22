const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authentication'); // Changé ici
const pool = require('../config/db');

// Récupérer les régions
router.get('/regions', verifyToken, async (req, res) => { // Changé authMiddleware -> verifyToken
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM regions`
        );

        res.json(rows);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les données utilisateur
router.get('/:id', verifyToken, async (req, res) => { // Changé authMiddleware -> verifyToken
    const { id } = req.params;
    try {
        const [rows] = await pool.execute(
            'SELECT nom, email, derniere_connexion, role FROM utilisateurs WHERE id_utilisateur = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({
            name: rows[0].nom,
            email: rows[0].email,
            lastLogin: rows[0].derniere_connexion,
            role: rows[0].role
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les préférences
router.get('/preferences/:id', verifyToken, async (req, res) => { // Changé authMiddleware -> verifyToken
    const { id } = req.params;

    try {
        const [rows] = await pool.execute(
            'SELECT type_site, budget_max, periode_preferee FROM preferences WHERE id_utilisateur = ?',
            [id]
        );

        res.json(rows[0] || {});
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur', id });
    }
});

// Récupérer les favoris
router.get('/favorites/:id', verifyToken, async (req, res) => { // Changé authMiddleware -> verifyToken
    const { id } = req.params;
    try {
        const [rows] = await pool.execute(
            `SELECT f.id, s.nom, s.type, s.description 
             FROM favoris f
             JOIN sites s ON f.entite_id = s.id_site
             WHERE f.id_utilisateur = ? AND f.entite_type = 'site'`,
            [id]
        );

        res.json(rows);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Ajouter un site aux favoris
router.post('/favorites/:id', verifyToken, async (req, res) => { // Changé authMiddleware -> verifyToken
    const { id } = req.params;
    const { siteId } = req.body;

    try {
        await pool.execute(
            'INSERT INTO favoris (id_utilisateur, entite_id, entite_type) VALUES (?, ?, ?)',
            [id, siteId, 'site']
        );

        res.json({ message: 'Site ajouté aux favoris' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ce site est déjà dans vos favoris' });
        }
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Supprimer un site des favoris
router.delete('/favorites/:id/:siteId', verifyToken, async (req, res) => { // Changé authMiddleware -> verifyToken
    const { id, siteId } = req.params;

    try {
        await pool.execute(
            'DELETE FROM favoris WHERE id_utilisateur = ? AND entite_id = ? AND entite_type = ?',
            [id, siteId, 'site']
        );

        res.json({ message: 'Site retiré des favoris' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


module.exports = router;