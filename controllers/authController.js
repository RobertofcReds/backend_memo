const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

require('dotenv').config()

const register = async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;

    console.log(req.body);

    // Validation supplémentaire
    if (!/^[a-zA-Z0-9]{4,}$/.test(password)) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 4 caractères alphanumériques' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Récupérer la date actuelle au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // CORRECTION : Ajout de date_inscription dans la requête
    const [result] = await pool.execute(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, currency, date_inscription) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'user', currency, today] // Ajout de today pour date_inscription
    );

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Cet email est déjà utilisé', error: error.message });
    }
    console.error('Erreur register:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Modification de la requête pour inclure le rôle
    const [users] = await pool.execute(
      'SELECT * FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.mot_de_passe);

    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour la colonne derniere_connexion avec la date actuelle
    await pool.execute(
      'UPDATE utilisateurs SET derniere_connexion = ? WHERE id_utilisateur = ?',
      [new Date(), user.id_utilisateur]
    );

    // Modification du token pour inclure le rôle utilisateur
    const token = jwt.sign(
      {
        userId: user.id_utilisateur,
        userName: user.nom,
        currency: user.currency,
        role: user.role || 'user' // Ajout du rôle dans le token
      },
      process.env.JWT_KEY,
      { expiresIn: '24h' } // Augmentation de la durée du token
    );

    res.json({
      token,
      userId: user.id_utilisateur,
      userName: user.nom,
      userCurrency: user.currency,
      role: user.role || 'user' // Ajout du rôle dans la réponse
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour créer un administrateur (optionnel)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur qui fait la requête est admin
    // (vous devrez implémenter cette vérification)

    const hashedPassword = await bcrypt.hash(password, 10);

    // Récupérer la date actuelle au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // CORRECTION : Ajout de date_inscription pour l'admin aussi
    const [result] = await pool.execute(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, date_inscription) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'admin', today]
    );

    res.status(201).json({ message: 'Administrateur créé avec succès' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    console.error('Erreur createAdmin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Transporter pour envoyer les emails
const transporter = nodemailer.createTransport({
  service: "gmail", // ou ton SMTP (ex: SendGrid, Mailtrap)
  port: 465,
  secure: true, // true pour 465, false pour 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  logger: true,   // active logs
  debug: true,    // affiche communication SMTP
});

// 1️⃣ Demande de réinitialisation
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM utilisateurs WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString("hex");
    const expireTime = new Date(Date.now() + 3600000); // expire dans 1h

    // Sauvegarder dans la BDD
    await pool.query(
      "UPDATE utilisateurs SET reset_token = ?, reset_token_expire = ? WHERE email = ?",
      [token, expireTime, email]
    );

    // Envoyer l’email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      text: `Copier ce token pour réinitialiser votre compte : ${token}`
    });

    res.json({ token, message: "Email de réinitialisation envoyé" });
  } catch (error) {
    console.error("Erreur forgotPassword:", error);
    res.status(500).json({ message: "Erreur interne" });
  }
};

// 2️⃣ Vérification du token
const verifyToken = async (req, res) => {
  const { token } = req.params;
  console.log('Verify token : ', token);

  try {
    const [rows] = await pool.query(
      "SELECT * FROM utilisateurs WHERE reset_token = ? AND reset_token_expire > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    res.json({ message: "Token valide" });
  } catch (error) {
    console.error("Erreur verifyToken:", error);
    res.status(500).json({ message: "Erreur interne" });
  }
};

// 3️⃣ Réinitialisation du mot de passe
const resetPassword = async (req, res) => {
  const { token } = req.params;
  console.log(token);

  const { password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM utilisateurs WHERE reset_token = ? AND reset_token_expire > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE utilisateurs SET mot_de_passe = ?, reset_token = NULL, reset_token_expire = NULL WHERE id_utilisateur = ?",
      [hashedPassword, rows[0].id_utilisateur]
    );

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    res.status(500).json({ message: "Erreur interne" });
  }
};

module.exports = { forgotPassword, verifyToken, resetPassword, register, login, createAdmin };