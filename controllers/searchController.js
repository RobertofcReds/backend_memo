const pool = require('../config/db');

exports.search = async (req, res) => {
  try {
    const { query } = req.query;
    const [results] = await pool.execute(
      `SELECT * FROM sites 
       WHERE nom LIKE ? OR type LIKE ? OR description LIKE ?
       LIMIT 10`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};