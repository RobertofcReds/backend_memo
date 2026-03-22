// server/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config()

const secret = process.env.JWT_SECRET

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];


    if (!token) {
      return res.status(401).json({ message: 'Authentification échouée - Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decoded.userId;
    req.userRole = decoded.role; // Ajout du rôle
    console.log(decoded.role);

    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentification échouée - Token invalide' });
  }
};

const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];


  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token invalide.' });
  }
};

module.exports = {
  verifyToken,
  isAdmin
};