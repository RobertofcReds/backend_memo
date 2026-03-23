const express = require('express');
const router = express.Router();
// const { verifyToken } = require('../middleware/auth');
const pool = require('../config/db');

// Récupérer les régions 
router.get('/regions', (req, res, next) => {
    pool.execute(`SELECT r.*, t.libele as type FROM regions r left join type t on t.id_type = r.id_type`)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Récupérer les données utilisateur
router.get('/:id', (req, res, next) => {
    const { id } = req.params;

    pool.execute('SELECT nom, email, derniere_connexion, role FROM utilisateurs WHERE id_utilisateur = ?', [id])
        .then(([rows]) => {
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            res.json({
                name: rows[0].nom,
                email: rows[0].email,
                lastLogin: rows[0].derniere_connexion,
                role: rows[0].role
            });
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Récupérer les préférences
router.get('/preferences/:id', (req, res, next) => {
    const { id } = req.params;

    pool.execute('SELECT type_site, budget_max, periode_preferee, id_region FROM preferences WHERE id_utilisateur = ?', [id])
        .then(([rows]) => {
            res.json(rows[0] || {});
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur', id });
        });
});

// Mettre à jour les préférences (nouvelle route)
router.put('/preferences/:id', (req, res, next) => {
    const { id } = req.params;
    const { type_site, budget_max, periode_preferee, id_region } = req.body;

    console.log('📝 Mise à jour des préférences pour l\'utilisateur:', id, req.body);

    // Vérifier si l'utilisateur a déjà des préférences
    pool.execute('SELECT * FROM preferences WHERE id_utilisateur = ?', [id])
        .then(([rows]) => {
            if (rows.length > 0) {
                // Mettre à jour les préférences existantes
                return pool.execute(
                    'UPDATE preferences SET type_site = ?, budget_max = ?, periode_preferee = ?, id_region = ? WHERE id_utilisateur = ?',
                    [type_site, budget_max, periode_preferee, id_region || null, id]
                );
            } else {
                // Créer de nouvelles préférences
                return pool.execute(
                    'INSERT INTO preferences (id_utilisateur, type_site, budget_max, periode_preferee, id_region) VALUES (?, ?, ?, ?, ?)',
                    [id, type_site, budget_max, periode_preferee, id_region || null]
                );
            }
        })
        .then(([result]) => {
            console.log('✅ Préférences enregistrées:', result);
            res.json({
                message: 'Préférences enregistrées avec succès',
                success: true
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de l\'enregistrement des préférences:', error);
            res.status(500).json({
                message: 'Erreur serveur lors de l\'enregistrement des préférences',
                error: error.message
            });
        });
});

// Récupérer les favoris - AMÉLIORÉ POUR AVOIR LE NOM DE LA RÉGION
router.get('/favorites/:id', (req, res, next) => {
    const { id } = req.params;

    pool.execute(
        `SELECT f.id, f.entite_id, s.nom, t.libele as type, s.description, s.image, 
                s.id_region, r.nom as nom_region, s.cout_estime, s.latitude, s.longitude, s.duree_visite
         FROM favoris f
         JOIN sites s ON f.entite_id = s.id_site 
         LEFT JOIN type t ON s.id_type = t.id_type
         LEFT JOIN regions r ON s.id_region = r.id_region
         WHERE f.id_utilisateur = ? AND f.entite_type = 'site'`,
        [id]
    )
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

router.get('/all-favorites', (req, res, next) => {

    pool.execute(
        `SELECT f.id, f.entite_id, s.nom, t.libele as type, s.description, s.image, 
                s.id_region, r.nom as nom_region, s.cout_estime, s.latitude, s.longitude, s.duree_visite
         FROM favoris f
         JOIN sites s ON f.entite_id = s.id_site 
         LEFT JOIN type t ON s.id_type = t.id_type
         LEFT JOIN regions r ON s.id_region = r.id_region
         WHERE f.entite_type = 'site'`
    )
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Récupérer les avis - MODIFIÉ POUR INCLURE id_site ET NOTE
router.get('/reviews/:id', (req, res, next) => {
    const { id } = req.params;

    pool.execute(
        `SELECT a.id_avis, a.id_site, a.commentaire, a.note, a.date_avis, a.source, 
                s.nom as site_nom, s.image 
         FROM avis a 
         LEFT JOIN sites s on a.id_site = s.id_site 
         WHERE a.id_utilisateur = ?`,
        [id]
    )
        .then(([rows]) => {
            console.log('📝 Avis récupérés:', rows);
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

router.get('/all-reviews', (req, res, next) => {

    pool.execute(
        `SELECT a.id_avis, a.id_site, a.commentaire, a.note, a.date_avis, a.source, 
                s.nom as site_nom, s.image 
         FROM avis a 
         LEFT JOIN sites s on a.id_site = s.id_site`
    )
        .then(([rows]) => {
            console.log('📝 Avis récupérés:', rows);
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Récupérer les avis - MODIFIÉ POUR INCLURE id_site ET NOTE
router.get('/popular/:id', (req, res, next) => {
    const { id } = req.params;

    pool.execute(
        `SELECT a.id_avis, a.id_site, t.libele as type, a.commentaire, a.note, a.date_avis, a.source,s.nom as site_nom, s.image FROM avis a LEFT JOIN sites s on a.id_site = s.id_site LEFT JOIN type t on s.id_type = t.id_type order by a.note desc limit 10`
    )
        .then(([rows]) => {
            console.log('📝 Avis récupérés:', rows);
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

router.delete('/review/:id', (req, res) => {
    const { id } = req.params;

    pool.execute(
        'DELETE FROM avis WHERE id_avis = ?',
        [id]
    )
        .then(() => {
            res.json({ message: 'Avis supprimé' });
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

router.get('/likedFavorites/:id', (req, res, next) => {
    const { id } = req.params;

    pool.execute(
        `SELECT * FROM favoris where id_utilisateur = ? AND entite_type = 'site'`,
        [id]
    )
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// NOUVELLE ROUTE SIMPLIFIÉE POUR SUPPRIMER UN FAVORI
router.delete('/favorites/:userId/:siteId', (req, res) => {
    const { userId, siteId } = req.params;

    console.log('🗑️  Suppression - userId:', userId, 'siteId:', siteId);

    const numUserId = parseInt(userId);
    const numSiteId = parseInt(siteId);

    if (!numSiteId || isNaN(numSiteId)) {
        return res.status(400).json({ message: 'siteId invalide' });
    }

    if (!numUserId || isNaN(numUserId)) {
        return res.status(400).json({ message: 'userId invalide' });
    }

    pool.execute(
        'DELETE FROM favoris WHERE id_utilisateur = ? AND entite_id = ? AND entite_type = "site"',
        [numUserId, numSiteId]
    )
        .then(([result]) => {
            console.log('✅ Lignes supprimées:', result.affectedRows);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'Favori non trouvé',
                    details: `userId: ${numUserId}, siteId: ${numSiteId}`
                });
            }
            res.json({
                message: 'Site retiré des favoris avec succès',
                deleted: result.affectedRows
            });
        })
        .catch(error => {
            console.error('❌ Erreur DB:', error);
            res.status(500).json({
                message: 'Erreur serveur lors de la suppression',
                error: error.message
            });
        });
});

// ANCIENNE ROUTE POUR LA COMPATIBILITÉ (optionnelle)
router.delete('/favorites/:id', (req, res) => {
    const userId = req.params.id;
    const { entite_id, type } = req.query;

    console.log('🗑️  Ancienne route - userId:', userId, 'entite_id:', entite_id);

    const entiteId = parseInt(entite_id);
    const numUserId = parseInt(userId);

    if (!entiteId || isNaN(entiteId)) {
        return res.status(400).json({ message: 'entite_id invalide' });
    }

    pool.execute(
        'DELETE FROM favoris WHERE id_utilisateur = ? AND entite_id = ? AND entite_type = ?',
        [numUserId, entiteId, type || 'site']
    )
        .then(([result]) => {
            console.log('✅ Lignes supprimées:', result.affectedRows);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Favori non trouvé' });
            }
            res.json({ message: 'Site retiré des favoris avec succès' });
        })
        .catch(error => {
            console.error('❌ Erreur DB:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
        });
});

// Ajouter un site aux favoris
router.post('/favorites/:id', (req, res) => {
    const { userId, entite_id, type } = req.body.updatedFavorites;

    pool.execute(
        'INSERT INTO favoris (id_utilisateur, entite_id, entite_type) VALUES (?, ?, ?)',
        [userId, entite_id, type]
    )
        .then(() => {
            res.json({ message: 'Site ajouté aux favoris' });
        })
        .catch(error => {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Ce site est déjà dans vos favoris' });
            }
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// ROUTE POUR AJOUTER UN FAVORI (site ou région)
router.post('/favorites/:id', (req, res) => {
    const { id } = req.params;
    const { entite_id, type = 'site' } = req.body;

    console.log('❤️ Ajout favori - userId:', id, 'entite_id:', entite_id, 'type:', type);

    // Vérifier si le favori existe déjà
    pool.execute(
        'SELECT * FROM favoris WHERE id_utilisateur = ? AND entite_id = ? AND entite_type = ?',
        [id, entite_id, type]
    )
        .then(([rows]) => {
            if (rows.length > 0) {
                return res.status(400).json({
                    message: 'Cet élément est déjà dans vos favoris',
                    success: false
                });
            }

            // Ajouter aux favoris
            return pool.execute(
                'INSERT INTO favoris (id_utilisateur, entite_id, entite_type, date_ajout) VALUES (?, ?, ?, CURDATE())',
                [id, entite_id, type]
            );
        })
        .then(([result]) => {
            console.log('✅ Favori ajouté, ID:', result.insertId);
            res.json({
                message: 'Élément ajouté aux favoris avec succès',
                success: true,
                favoriteId: result.insertId
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de l\'ajout aux favoris:', error);
            res.status(500).json({
                message: 'Erreur serveur lors de l\'ajout aux favoris',
                error: error.message,
                success: false
            });
        });
});

// Ajouter un avis - CORRIGÉ POUR TOUTES LES COLONNES REQUISES
router.post('/review', (req, res) => {
    const { userId, entite_id, review, note } = req.body;

    console.log('📝 Ajout avis - userId:', userId, 'entite_id:', entite_id, 'review:', review, 'note:', note);

    if (!userId || !entite_id || !review) {
        return res.status(400).json({
            message: 'Données manquantes',
            required: ['userId', 'entite_id', 'review']
        });
    }

    // Validation de la note (doit être entre 1 et 5)
    const noteValue = note ? Math.min(Math.max(parseInt(note), 1), 5) : 3;

    // Source par défaut
    const source = 'site_web';

    pool.execute(
        'INSERT INTO `avis` (`id_site`, `id_utilisateur`, `commentaire`, `note`, `date_avis`, `source`) VALUES (?, ?, ?, ?, NOW(), ?)',
        [parseInt(entite_id), parseInt(userId), review, noteValue, source]
    )
        .then(() => {
            console.log('✅ Avis ajouté avec succès');
            res.json({
                message: 'Avis ajouté avec succès',
                success: true
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de l\'ajout de l\'avis:', error);

            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    message: 'Utilisateur ou site non trouvé'
                });
            }

            if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
                return res.status(400).json({
                    message: 'Données invalides'
                });
            }

            res.status(500).json({
                message: 'Erreur serveur lors de l\'ajout de l\'avis',
                error: error.message,
                code: error.code
            });
        });
});

// ============ NOUVELLES ROUTES POUR L'HISTORIQUE ============

// Récupérer l'historique complet de l'utilisateur
router.get('/history/:id', (req, res) => {
    const { id } = req.params;

    pool.execute(
        `SELECT h.*, t.libele AS type_activite FROM historique_recherches h LEFT JOIN sites s ON h.entity_id = s.id_site LEFT JOIN type t ON s.id_type = t.id_type 
         WHERE id_utilisateur = ? 
         ORDER BY date_recherche DESC`,
        [id]
    )
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Effacer tout l'historique
router.delete('/history/:id', (req, res) => {
    const { id } = req.params;

    pool.execute(
        'DELETE FROM historique_recherches WHERE id_utilisateur = ?',
        [id]
    )
        .then(() => {
            res.json({ message: 'Historique effacé' });
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Effacer un élément spécifique de l'historique
router.delete('/history/item/:itemId', (req, res) => {
    const { itemId } = req.params;

    pool.execute(
        'DELETE FROM historique_recherches WHERE id_historique = ?',
        [itemId]
    )
        .then(() => {
            res.json({ message: 'Élément supprimé' });
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Nouvelle route pour enregistrer une action dans l'historique
router.post('/history/log', (req, res) => {
    const { userId, type, criteres, resultats, entityId, entityName, actionDetails } = req.body;

    console.log('📝 Enregistrement historique - userId:', userId, 'type:', type, 'entity:', entityName);

    // Formater les critères et résultats selon le type d'action
    let formattedCriteres = criteres;
    let formattedResultats = resultats;

    switch (type) {
        case 'like':
            formattedCriteres = `Like du site: ${entityName}`;
            formattedResultats = `Site ajouté aux favoris`;
            break;
        case 'unlike':
            formattedCriteres = `Retrait du like: ${entityName}`;
            formattedResultats = `Site retiré des favoris`;
            break;
        case 'comment':
            formattedCriteres = `Avis sur le site: ${entityName}`;
            const note = actionDetails?.note ? `Note: ${actionDetails.note}/5` : '';
            const preview = actionDetails?.commentPreview ? `"${actionDetails.commentPreview}"` : '';
            formattedResultats = `Avis publié ${note} ${preview}`.trim();
            break;
        case 'share':
            formattedCriteres = `Partage du site: ${entityName}`;
            formattedResultats = `Partagé via: ${actionDetails?.platform || 'MadaTour'}`;
            break;
        case 'add_to_trip':
            formattedCriteres = `Ajout au voyage: ${entityName}`;
            formattedResultats = `Site ajouté à "Mon Voyage"`;
            break;
        case 'remove_from_trip':
            formattedCriteres = `Retrait du voyage: ${entityName}`;
            formattedResultats = `Site retiré de "Mon Voyage"`;
            break;
        case 'search':
            // Déjà formaté par le frontend
            break;
        case 'visit':
            formattedCriteres = `Visite du site: ${entityName}`;
            formattedResultats = `Consultation de la page détail`;
            break;
        default:
            formattedCriteres = criteres || `Action: ${type}`;
            formattedResultats = resultats || `Site: ${entityName}`;
    }

    pool.execute(
        'INSERT INTO historique_recherches (id_utilisateur, type, criteres, resultats, date_recherche, entity_id, entity_name) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
        [userId, type, formattedCriteres, formattedResultats, entityId || 0, entityName || '']
    )
        .then(() => {
            console.log('✅ Historique enregistré avec succès');
            res.json({
                message: 'Action enregistrée dans l\'historique',
                success: true
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de l\'enregistrement:', error);
            res.status(500).json({
                message: 'Erreur serveur lors de l\'enregistrement',
                error: error.message
            });
        });
});

// ============ ROUTES POUR LES ITINERAIRES ============

// Récupérer tous les itinéraires d'un utilisateur
router.get('/itineraires/:userId', (req, res) => {
    const { userId } = req.params;

    pool.execute(
        `SELECT i.*, 
                COUNT(isite.id_site) as nombre_sites
         FROM itineraire i
         LEFT JOIN itineraire_sites isite ON i.id_itineraire = isite.id_itineraire
         WHERE i.id_utilisateur = ?
         GROUP BY i.id_itineraire
         ORDER BY i.date_modification DESC`,
        [userId]
    )
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(error => {
            console.error('❌ Erreur lors de la récupération des itinéraires:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Récupérer un itinéraire spécifique avec tous ses sites
router.get('/itineraire/:id', (req, res) => {
    const { id } = req.params;

    pool.execute(
        `SELECT i.*, 
                isite.*,
                s.nom as site_nom,
                s.description as site_description,
                s.image as site_image,
                s.cout_estime as site_cout,
                s.latitude as site_latitude,
                s.longitude as site_longitude,
                s.duree_visite as site_duree_visite,
                r.nom as region_nom,
                t.libele as type_site
         FROM itineraire i
         LEFT JOIN itineraire_sites isite ON i.id_itineraire = isite.id_itineraire
         LEFT JOIN sites s ON isite.id_site = s.id_site
         LEFT JOIN regions r ON s.id_region = r.id_region
         LEFT JOIN type t ON s.id_type = t.id_type
         WHERE i.id_itineraire = ?
         ORDER BY isite.ordre ASC, isite.date_debut ASC`,
        [id]
    )
        .then(([rows]) => {
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Itinéraire non trouvé' });
            }

            // Structurer la réponse
            const itineraire = {
                id_itineraire: rows[0].id_itineraire,
                id_utilisateur: rows[0].id_utilisateur,
                nom: rows[0].nom,
                description: rows[0].description,
                duree_total: rows[0].duree_total,
                cout_total: rows[0].cout_total,
                devise: rows[0].devise,
                status: rows[0].status,
                date_creation: rows[0].date_creation,
                date_modification: rows[0].date_modification,
                notes: rows[0].notes,
                sites: rows[0].id_site ? rows.map(row => ({
                    id_itineraire_site: row.id_itineraire_site,
                    id_site: row.id_site,
                    ordre: row.ordre,
                    date_debut: row.date_debut,
                    date_fin: row.date_fin,
                    duree_jours: row.duree_jours,
                    notes: row.notes,
                    cout_estime: row.cout_estime,
                    site: {
                        nom: row.site_nom,
                        description: row.site_description,
                        image: row.site_image,
                        cout_estime: row.site_cout,
                        latitude: row.site_latitude,
                        longitude: row.site_longitude,
                        duree_visite: row.site_duree_visite,
                        region_nom: row.region_nom,
                        type: row.type_site
                    }
                })) : []
            };

            res.json(itineraire);
        })
        .catch(error => {
            console.error('❌ Erreur lors de la récupération de l\'itinéraire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Créer un nouvel itinéraire
router.post('/itineraire', (req, res) => {
    const { userId, nom, description, devise } = req.body;

    pool.execute(
        `INSERT INTO itineraire 
         (id_utilisateur, nom, description, devise, status) 
         VALUES (?, ?, ?, ?, 'brouillon')`,
        [userId, nom || 'Mon voyage à Madagascar', description || '', devise || 'EUR']
    )
        .then(([result]) => {
            res.json({
                message: 'Itinéraire créé avec succès',
                id_itineraire: result.insertId,
                success: true
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la création de l\'itinéraire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Mettre à jour un itinéraire
router.put('/itineraire/:id', (req, res) => {
    const { id } = req.params;
    const { nom, description, duree_total, cout_total, status, notes } = req.body;

    pool.execute(
        `UPDATE itineraire 
         SET nom = ?, description = ?, duree_total = ?, cout_total = ?, status = ?, notes = ?
         WHERE id_itineraire = ?`,
        [nom, description, duree_total, cout_total, status, notes, id]
    )
        .then(() => {
            res.json({ message: 'Itinéraire mis à jour', success: true });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la mise à jour de l\'itinéraire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Supprimer un itinéraire
router.delete('/itineraire/:id', (req, res) => {
    const { id } = req.params;

    pool.execute(
        'DELETE FROM itineraire WHERE id_itineraire = ?',
        [id]
    )
        .then(() => {
            res.json({ message: 'Itinéraire supprimé', success: true });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la suppression de l\'itinéraire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Ajouter un site à un itinéraire
router.post('/itineraire/:id/sites', (req, res) => {
    const { id } = req.params;
    const { id_site, ordre, date_debut, date_fin, duree_jours, notes, cout_estime } = req.body;

    // Vérifier si le site n'est pas déjà dans l'itinéraire
    pool.execute(
        'SELECT * FROM itineraire_sites WHERE id_itineraire = ? AND id_site = ?',
        [id, id_site]
    )
        .then(([rows]) => {
            if (rows.length > 0) {
                return res.status(400).json({ message: 'Ce site est déjà dans l\'itinéraire' });
            }

            // Calculer l'ordre si non fourni
            let finalOrdre = ordre;
            if (!finalOrdre) {
                return pool.execute(
                    'SELECT COALESCE(MAX(ordre), 0) as max_ordre FROM itineraire_sites WHERE id_itineraire = ?',
                    [id]
                )
                    .then(([orderRows]) => {
                        finalOrdre = (orderRows[0].max_ordre || 0) + 1;
                        return addSite();
                    });
            } else {
                return addSite();
            }

            function addSite() {
                return pool.execute(
                    `INSERT INTO itineraire_sites 
                     (id_itineraire, id_site, ordre, date_debut, date_fin, duree_jours, notes, cout_estime)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, id_site, finalOrdre, date_debut, date_fin, duree_jours || 1, notes || '', cout_estime]
                )
                    .then(() => {
                        // Mettre à jour les statistiques de l'itinéraire
                        return updateItineraireStats(id);
                    })
                    .then(() => {
                        res.json({ message: 'Site ajouté à l\'itinéraire', success: true });
                    });
            }
        })
        .catch(error => {
            console.error('❌ Erreur lors de l\'ajout du site:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Mettre à jour un site dans un itinéraire
router.put('/itineraire/:id/sites/:siteId', (req, res) => {
    const { id, siteId } = req.params;
    const { ordre, date_debut, date_fin, duree_jours, notes, cout_estime } = req.body;

    pool.execute(
        `UPDATE itineraire_sites 
         SET ordre = ?, date_debut = ?, date_fin = ?, duree_jours = ?, notes = ?, cout_estime = ?
         WHERE id_itineraire = ? AND id_site = ?`,
        [ordre, date_debut, date_fin, duree_jours, notes, cout_estime, id, siteId]
    )
        .then(() => {
            // Mettre à jour les statistiques de l'itinéraire
            return updateItineraireStats(id);
        })
        .then(() => {
            res.json({ message: 'Site mis à jour', success: true });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la mise à jour du site:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Supprimer un site d'un itinéraire
router.delete('/itineraire/:id/sites/:siteId', (req, res) => {
    const { id, siteId } = req.params;

    pool.execute(
        'DELETE FROM itineraire_sites WHERE id_itineraire = ? AND id_site = ?',
        [id, siteId]
    )
        .then(() => {
            // Réorganiser les ordres
            return reorganizeOrders(id);
        })
        .then(() => {
            // Mettre à jour les statistiques de l'itinéraire
            return updateItineraireStats(id);
        })
        .then(() => {
            res.json({ message: 'Site retiré de l\'itinéraire', success: true });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la suppression du site:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Fonction pour réorganiser les ordres
function reorganizeOrders(itineraireId) {
    return pool.execute(
        'SELECT id_site FROM itineraire_sites WHERE id_itineraire = ? ORDER BY ordre ASC',
        [itineraireId]
    )
        .then(([rows]) => {
            const updates = rows.map((row, index) => {
                return pool.execute(
                    'UPDATE itineraire_sites SET ordre = ? WHERE id_itineraire = ? AND id_site = ?',
                    [index + 1, itineraireId, row.id_site]
                );
            });
            return Promise.all(updates);
        });
}

// Fonction pour mettre à jour les statistiques de l'itinéraire
function updateItineraireStats(itineraireId) {
    return pool.execute(
        `SELECT 
            COUNT(*) as nombre_sites,
            SUM(duree_jours) as total_duree,
            SUM(cout_estime) as total_cout
         FROM itineraire_sites 
         WHERE id_itineraire = ?`,
        [itineraireId]
    )
        .then(([rows]) => {
            const stats = rows[0];
            return pool.execute(
                `UPDATE itineraire 
                 SET duree_total = ?, cout_total = ?, date_modification = NOW()
                 WHERE id_itineraire = ?`,
                [stats.total_duree || 0, stats.total_cout || 0, itineraireId]
            );
        });
}

// Sauvegarder l'itinéraire actuel du localStorage
router.post('/itineraire/save-current', (req, res) => {
    const { userId, items, nom, description, selectedDates } = req.body;

    // Vérifier si un itinéraire actuel existe
    pool.execute(
        `SELECT id_itineraire FROM itineraire 
         WHERE id_utilisateur = ? AND status = 'brouillon' 
         ORDER BY date_modification DESC LIMIT 1`,
        [userId]
    )
        .then(([rows]) => {
            if (rows.length > 0) {
                // Mettre à jour l'itinéraire existant
                return updateExistingItineraire(rows[0].id_itineraire, userId, items, nom, description, selectedDates);
            } else {
                // Créer un nouvel itinéraire
                return createNewItineraire(userId, items, nom, description, selectedDates);
            }
        })
        .then((result) => {
            res.json({
                message: 'Itinéraire sauvegardé avec succès',
                id_itineraire: result.id_itineraire,
                success: true
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });

    function createNewItineraire(userId, items, nom, description, selectedDates) {
        return new Promise((resolve, reject) => {
            pool.execute(
                `INSERT INTO itineraire 
                 (id_utilisateur, nom, description, status) 
                 VALUES (?, ?, ?, 'brouillon')`,
                [userId, nom || 'Mon voyage à Madagascar', description || '']
            )
                .then(([result]) => {
                    const itineraireId = result.insertId;
                    return addSitesToItineraire(itineraireId, items, selectedDates)
                        .then(() => resolve({ id_itineraire: itineraireId }));
                })
                .catch(reject);
        });
    }

    function updateExistingItineraire(itineraireId, userId, items, nom, description, selectedDates) {
        return new Promise((resolve, reject) => {
            // Supprimer les sites existants
            pool.execute(
                'DELETE FROM itineraire_sites WHERE id_itineraire = ?',
                [itineraireId]
            )
                .then(() => {
                    // Mettre à jour les infos de l'itinéraire
                    return pool.execute(
                        'UPDATE itineraire SET nom = ?, description = ? WHERE id_itineraire = ?',
                        [nom || 'Mon voyage à Madagascar', description || '', itineraireId]
                    );
                })
                .then(() => {
                    // Ajouter les nouveaux sites
                    return addSitesToItineraire(itineraireId, items, selectedDates);
                })
                .then(() => resolve({ id_itineraire: itineraireId }))
                .catch(reject);
        });
    }

    function addSitesToItineraire(itineraireId, items, selectedDates) {
        if (!items || items.length === 0) {
            return Promise.resolve();
        }

        const promises = items.map((item, index) => {
            const dates = selectedDates && selectedDates[item.id_site];
            const duree = item.duration || 1;

            return pool.execute(
                `INSERT INTO itineraire_sites 
                 (id_itineraire, id_site, ordre, date_debut, date_fin, duree_jours, cout_estime, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    itineraireId,
                    item.id_site,
                    index + 1,
                    dates?.startDate || null,
                    dates?.endDate || null,
                    duree,
                    item.cout_estime || 0,
                    item.notes || ''
                ]
            );
        });

        return Promise.all(promises)
            .then(() => updateItineraireStats(itineraireId));
    }
});

// Synchroniser le localStorage avec la BDD
router.post('/itineraire/sync', (req, res) => {
    const { userId, tripData } = req.body;

    // Vérifier si l'utilisateur a un itinéraire en cours
    pool.execute(
        `SELECT id_itineraire FROM itineraire 
         WHERE id_utilisateur = ? AND status = 'brouillon' 
         ORDER BY date_modification DESC LIMIT 1`,
        [userId]
    )
        .then(([rows]) => {
            if (rows.length > 0) {
                // Fusionner avec l'existant
                return mergeItineraire(rows[0].id_itineraire, userId, tripData);
            } else {
                // Créer un nouveau
                return createNewFromLocalStorage(userId, tripData);
            }
        })
        .then((result) => {
            res.json({
                message: 'Synchronisation réussie',
                id_itineraire: result.id_itineraire,
                items: result.items,
                success: true
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la synchronisation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

async function mergeItineraire(itineraireId, userId, tripData) {
    // Récupérer les sites existants
    const [existingSites] = await pool.execute(
        'SELECT id_site FROM itineraire_sites WHERE id_itineraire = ?',
        [itineraireId]
    );

    const existingIds = existingSites.map(s => s.id_site);
    const newItems = tripData.items || [];

    // Ajouter les nouveaux sites
    const promises = newItems
        .filter(item => !existingIds.includes(item.id_site))
        .map((item, index) => {
            return pool.execute(
                `INSERT INTO itineraire_sites 
                 (id_itineraire, id_site, ordre, cout_estime, notes)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    itineraireId,
                    item.id_site,
                    existingIds.length + index + 1,
                    item.cout_estime || 0,
                    item.notes || ''
                ]
            );
        });

    await Promise.all(promises);
    await updateItineraireStats(itineraireId);

    // Récupérer tous les sites mis à jour
    const [updatedSites] = await pool.execute(
        `SELECT isite.*, s.* 
         FROM itineraire_sites isite
         JOIN sites s ON isite.id_site = s.id_site
         WHERE isite.id_itineraire = ?
         ORDER BY isite.ordre ASC`,
        [itineraireId]
    );

    return {
        id_itineraire: itineraireId,
        items: updatedSites.map(row => ({
            id_site: row.id_site,
            nom: row.nom,
            description: row.description,
            image: row.image,
            cout_estime: row.cout_estime,
            duration: row.duree_jours,
            notes: row.notes,
            id_region: row.id_region,
            id_type: row.id_type
        }))
    };
}

async function createNewFromLocalStorage(userId, tripData) {
    const [result] = await pool.execute(
        `INSERT INTO itineraire 
         (id_utilisateur, nom, status) 
         VALUES (?, ?, 'brouillon')`,
        [userId, 'Mon voyage à Madagascar']
    );

    const itineraireId = result.insertId;

    if (tripData.items && tripData.items.length > 0) {
        const promises = tripData.items.map((item, index) => {
            return pool.execute(
                `INSERT INTO itineraire_sites 
                 (id_itineraire, id_site, ordre, cout_estime, notes)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    itineraireId,
                    item.id_site,
                    index + 1,
                    item.cout_estime || 0,
                    item.notes || ''
                ]
            );
        });

        await Promise.all(promises);
        await updateItineraireStats(itineraireId);
    }

    return {
        id_itineraire: itineraireId,
        items: tripData.items || []
    };
}

// Récupérer les statistiques de l'utilisateur
router.get('/stats/:userId', (req, res) => {
    const { userId } = req.params;

    pool.execute(
        `SELECT 
            (SELECT COUNT(*) FROM favoris WHERE id_utilisateur = ? AND entite_type = 'site') as favorites_count,
            (SELECT COUNT(*) FROM avis WHERE id_utilisateur = ?) as reviews_count,
            (SELECT COUNT(*) FROM historique_recherches WHERE id_utilisateur = ? AND type IN ('view', 'visit')) as visited_count,
            (SELECT COUNT(*) FROM itineraire WHERE id_utilisateur = ?) as trips_count`,
        [userId, userId, userId, userId]
    )
        .then(([rows]) => {
            res.json(rows[0] || {
                favorites_count: 0,
                reviews_count: 0,
                visited_count: 0,
                trips_count: 0
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la récupération des stats:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});


// ============ ROUTES POUR LES FAVORIS DE RÉGIONS ============

// Route temporaire pour tester l'ajout de région aux favoris
router.post('/favorites-region-test', (req, res) => {
    const { userId, regionId } = req.body;

    console.log('Test ajout région:', { userId, regionId });

    pool.execute(
        'INSERT INTO favoris (id_utilisateur, entite_id, entite_type, date_ajout) VALUES (?, ?, "region", CURDATE())',
        [userId, regionId]
    )
        .then(() => {
            res.json({ success: true, message: 'Région ajoutée (test)' });
        })
        .catch(error => {
            console.error('Erreur test:', error);
            res.status(500).json({ success: false, error: error.message });
        });
});

// Route test simple pour les favoris de régions
router.get('/favorites-test/:userId', (req, res) => {
    const { userId } = req.params;

    pool.execute(
        `SELECT f.id, f.entite_id as regionId, r.nom, r.image
     FROM favoris f
     JOIN regions r ON f.entite_id = r.id_region
     WHERE f.id_utilisateur = ? AND f.entite_type = 'region'`,
        [userId]
    )
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur test:', error);
            res.status(500).json({ message: 'Erreur test' });
        });
});

// Récupérer les régions favorites
router.get('/favorites-regions/:id', (req, res, next) => {
    const { id } = req.params;

    pool.execute(
        `SELECT f.id, f.entite_id, r.nom, r.image, r.description,
            r.latitude, r.longitude, r.climat_general, r.meilleure_periode,
            r.total_site, r.id_province, p.nom as nom_province,
            t.libele as type_region, 
            f.date_ajout
     FROM favoris f
     JOIN regions r ON f.entite_id = r.id_region
     LEFT JOIN provinces p ON r.id_province = p.id_province
     LEFT JOIN type t ON r.id_type = t.id_type
     WHERE f.id_utilisateur = ? AND f.entite_type = 'region'
     ORDER BY f.date_ajout DESC`,
        [id]
    )
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Récupérer tous les favoris (sites + régions)
router.get('/favorites-all/:id', (req, res, next) => {
    const { id } = req.params;

    // Récupérer les sites favoris
    const sitesPromise = pool.execute(
        `SELECT f.id, f.entite_id, s.nom, t.libele as type, s.description, s.image, 
            s.id_region, r.nom as nom_region, s.cout_estime, s.latitude, s.longitude, s.duree_visite,
            f.date_ajout, 'site' as entite_type
     FROM favoris f
     JOIN sites s ON f.entite_id = s.id_site 
     LEFT JOIN type t ON s.id_type = t.id_type
     LEFT JOIN regions r ON s.id_region = r.id_region
     WHERE f.id_utilisateur = ? AND f.entite_type = 'site'
     ORDER BY f.date_ajout DESC`,
        [id]
    );

    // Récupérer les régions favorites
    const regionsPromise = pool.execute(
        `SELECT f.id, f.entite_id, r.nom, r.image, r.description,
        r.latitude, r.longitude, r.climat_general, r.meilleure_periode,
        r.total_site, r.id_province, p.nom as nom_province,
        t.libele as type,  
        f.date_ajout, 'region' as entite_type
     FROM favoris f
     JOIN regions r ON f.entite_id = r.id_region
     LEFT JOIN provinces p ON r.id_province = p.id_province
     LEFT JOIN type t ON r.id_type = t.id_type
     WHERE f.id_utilisateur = ? AND f.entite_type = 'region'
     ORDER BY f.date_ajout DESC`,
        [id]
    );

    Promise.all([sitesPromise, regionsPromise])
        .then(([[sites], [regions]]) => {
            // Combiner les résultats
            const allFavorites = [...sites, ...regions];
            // Trier par date d'ajout (plus récent d'abord)
            allFavorites.sort((a, b) => new Date(b.date_ajout) - new Date(a.date_ajout));

            res.json(allFavorites);
        })
        .catch(error => {
            console.error('Erreur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        });
});

// Ajouter une région aux favoris
router.post('/favorites-regions/:id', (req, res) => {
    const { id } = req.params;
    const { regionId } = req.body;

    console.log('❤️ Ajout région aux favoris - userId:', id, 'regionId:', regionId);

    // Vérifier si la région existe déjà dans les favoris
    pool.execute(
        'SELECT * FROM favoris WHERE id_utilisateur = ? AND entite_id = ? AND entite_type = "region"',
        [id, regionId]
    )
        .then(([rows]) => {
            if (rows.length > 0) {
                return res.status(400).json({
                    message: 'Cette région est déjà dans vos favoris',
                    success: false
                });
            }

            // Ajouter la région aux favoris
            return pool.execute(
                'INSERT INTO favoris (id_utilisateur, entite_id, entite_type, date_ajout) VALUES (?, ?, "region", CURDATE())',
                [id, regionId]
            );
        })
        .then(([result]) => {
            console.log('✅ Région ajoutée aux favoris, ID:', result.insertId);
            res.json({
                message: 'Région ajoutée aux favoris avec succès',
                success: true,
                favoriteId: result.insertId
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de l\'ajout de la région aux favoris:', error);
            res.status(500).json({
                message: 'Erreur serveur lors de l\'ajout aux favoris',
                error: error.message,
                success: false
            });
        });
});

// Supprimer une région des favoris
router.delete('/favorites-regions/:userId/:regionId', (req, res) => {
    const { userId, regionId } = req.params;

    console.log('🗑️ Suppression région des favoris - userId:', userId, 'regionId:', regionId);

    pool.execute(
        'DELETE FROM favoris WHERE id_utilisateur = ? AND entite_id = ? AND entite_type = "region"',
        [userId, regionId]
    )
        .then(([result]) => {
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'Région non trouvée dans vos favoris',
                    success: false
                });
            }

            res.json({
                message: 'Région retirée des favoris avec succès',
                success: true
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la suppression de la région des favoris:', error);
            res.status(500).json({
                message: 'Erreur serveur lors de la suppression',
                error: error.message,
                success: false
            });
        });
});

// Supprimer un favori (site ou région)
router.delete('/favorite/:userId/:favoriteId', (req, res) => {
    const { userId, favoriteId } = req.params;

    console.log('🗑️ Suppression favori - userId:', userId, 'favoriteId:', favoriteId);

    pool.execute(
        'DELETE FROM favoris WHERE id_utilisateur = ? AND id = ?',
        [userId, favoriteId]
    )
        .then(([result]) => {
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'Favori non trouvé',
                    success: false
                });
            }

            res.json({
                message: 'Favori retiré avec succès',
                success: true
            });
        })
        .catch(error => {
            console.error('❌ Erreur lors de la suppression du favori:', error);
            res.status(500).json({
                message: 'Erreur serveur lors de la suppression',
                error: error.message,
                success: false
            });
        });
});


module.exports = router;