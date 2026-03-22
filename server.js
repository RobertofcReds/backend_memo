const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const userRoutes = require('./routes/userRoutes');
const siteRoute = require('./routes/siteRoute');
const adminRoutes = require('./routes/adminRoutes'); // Nouvelle ligne
const typeRoute = require('./routes/typeRoutes')
const provinceRoute = require('./routes/provinceRoutes')
require('dotenv').config()

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/uploads", express.static("uploads"));
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/user', userRoutes);
app.use('/api/site', siteRoute);
app.use('/api/admin', adminRoutes); // Nouvelle ligne
app.use('/api/type', typeRoute);
app.use('/api/provinces', provinceRoute);

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});