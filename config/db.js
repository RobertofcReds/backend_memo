const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'sql3.freesqldatabase.com',
  user: 'sql3820909', // à remplacer par mon utilisateur MySQL
  password: 'lYVrMnat6C', // à remplacer par mon mot de passe MySQL
  database: 'sql3820909', // Ma base de données
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;