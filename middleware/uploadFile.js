const multer = require("multer");
const fs = require("fs");
const path = require("path");
// config stockage images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname,'..' , "uploads/site/");
    console.log("uploadPath:", uploadPath); 

    // Vérifie si le dossier existe, sinon le crée
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // recursive = crée aussi les sous-dossiers
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  } 
});

const upload = multer({ storage });

module.exports = upload;