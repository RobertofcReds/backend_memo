const pool = require('../config/db');
const fs = require("fs");
const path = require("path"); 

// Récupérer tous les utilisateurs
const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id_utilisateur, nom, email, role, actif, date_inscription FROM utilisateurs ORDER BY date_inscription DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Créer un site
const createSite = async (req, res) => {
    const { nom, description, id_type, id_region, cout_estime, duree_visite, latitude, longitude } = req.body;
    const imagePath = "/uploads/site/" + req.file.filename;

    try {
        const [insertResult] = await pool.query(
            `INSERT INTO sites(nom, id_type, description, image ,id_region, latitude, longitude, cout_estime, duree_visite) VALUES (?,?,?,?,?,?,?,?,?);`,
            [nom, id_type, description,imagePath , id_region, latitude, longitude, cout_estime, duree_visite]
        );

        // Récupérer l'id inséré :
        const newId = insertResult.insertId;
 
        // Puis sélectionner la ligne insérée si tu veux ses données :
        const [rows] = await pool.query("SELECT * FROM sites WHERE id_site = ?", [newId]);

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erreur création site:', error);
        res.status(500).json({ message: 'Erreur lors de la création du site' });
    }
};


const updateSite = async (req, res) => {
  const { id } = req.params;
  const { nom, description, type, id_region, cout_estime, duree_visite, latitude, longitude } = req.body;

  try {
    // 1️⃣ Récupérer le site actuel pour savoir si une image existe déjà
    const [rows] = await pool.query("SELECT * FROM sites WHERE id_site = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Site non trouvé" });
    }
    const oldSite = rows[0];

    // 2️⃣ Préparer la requête de mise à jour
    let query = `
      UPDATE sites 
      SET nom = ?, description = ?, id_type = ?, id_region = ?, 
          cout_estime = ?, duree_visite = ?, latitude = ?, longitude = ?
    `;
    let values = [nom, description, type, id_region, cout_estime, duree_visite, latitude, longitude];

    // 3️⃣ Si une nouvelle image est envoyée
    if (req.file) {
      const newImagePath = "/uploads/site/" + req.file.filename;

      // Supprimer l'ancienne image si elle existe
      if (oldSite.image && fs.existsSync(path.join(__dirname, "..", oldSite.image))) {
        fs.unlink(path.join(__dirname, "..", oldSite.image), (err) => {
          if (err) console.error("Erreur suppression ancienne image:", err);
        });
      }

      query += `, image = ?`;
      values.push(newImagePath);
    }

    query += ` WHERE id_site = ?`;
    values.push(id);

    // 4️⃣ Exécuter la requête
    await pool.query(query, values);

    // 5️⃣ Retourner le site mis à jour
    const [updatedRows] = await pool.query("SELECT * FROM sites WHERE id_site = ?", [id]);
    const site = updatedRows[0];
    site.image_url = site.image ? `http://localhost:5000/${site.image}` : null;

    res.json(site);
  } catch (error) {
    console.error("Erreur mise à jour site:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du site" });
  }
};

// Supprimer un site
const deleteSite = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Récupérer le site pour obtenir son image
    const [rows] = await pool.query("SELECT * FROM sites WHERE id_site = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Site non trouvé" });
    }

    const site = rows[0];

    // 2️⃣ Supprimer l'image si elle existe
    if (site.image) {
      const imagePath = path.join(__dirname, "..", site.image); // reconstruit le chemin absolu
      console.log(imagePath) ;
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Erreur suppression image:", err);
        });
      }
    }

    // 3️⃣ Supprimer le site de la base
    await pool.query("DELETE FROM sites WHERE id_site = ?", [id]);

    res.json({ message: "Site supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression site:", error);
    res.status(500).json({ message: "Erreur lors de la suppression du site" });
  }
};

module.exports = {
    getUsers,
    createSite,
    updateSite,
    deleteSite
};