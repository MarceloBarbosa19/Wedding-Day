require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Configuração do multer para salvar arquivos na pasta local
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath); // Cria a pasta 'uploads' se ela não existir
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // Salva os arquivos na pasta 'uploads'
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`); // Define um nome único para cada arquivo
  },
});

const upload = multer({ storage });

// Rota para upload de múltiplas imagens
app.post("/upload", upload.array("files", 100), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nenhum arquivo foi enviado!" });
  }

  try {
    const uploadedFiles = req.files.map((file) => ({
      url: `/uploads/${file.filename}`, 
      filename: file.filename,
    }));

    res.status(200).redirect("/");
  } catch (error) {
    console.error("Erro ao salvar as imagens:", error);
    res.status(500).json({ error: "Erro ao salvar as imagens." });
  }
});

// Rota para obter as imagens já enviadas
app.get("/get-images", (req, res) => {
  try {
    const files = fs.readdirSync(uploadPath);

    const imageUrls = files.map((filename) => ({
      url: `/uploads/${filename}`,
      filename,
    }));

    res.json({ urls: imageUrls });
  } catch (error) {
    console.error("Erro ao listar as imagens:", error);
    res.status(500).json({ error: "Erro ao listar as imagens." });
  }
});

// Rota para servir arquivos da pasta 'uploads'
app.use("/uploads", express.static(uploadPath));

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});