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

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm", "video/ogg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens e vídeos são permitidos!"));
    }
  }
});

// Rota para upload de múltiplas imagens
app.post("/upload", upload.array("files", 100), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nenhum arquivo foi enviado!" });
  }

  try {
    res.status(200).redirect("/");
  } catch (error) {
    console.error("Erro ao salvar os arquivos:", error);
    res.status(500).json({ error: "Erro ao salvar os arquivos." });
  }
});

// Rota para obter as imagens já enviadas
app.get("/get-media", (req, res) => {
  try {
    const files = fs.readdirSync(uploadPath)
      .map((filename) => ({
        filename,
        url: `/uploads/${filename}`,
        time: fs.statSync(path.join(uploadPath, filename)).mtime.getTime(),
        type: filename.match(/\.(mp4|webm|ogg)$/) ? "video" : "image"
      }))
      .sort((a, b) => b.time - a.time) // Ordena por data (mais recente primeiro)
      .slice(0, 10); // Pega apenas os 10 últimos

    res.json({ media: files });
  } catch (error) {
    console.error("Erro ao listar os arquivos:", error);
    res.status(500).json({ error: "Erro ao listar os arquivos." });
  }
});

// Rota para servir arquivos da pasta 'uploads'
app.use("/uploads", express.static(uploadPath));

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});