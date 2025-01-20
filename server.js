require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Configuração do multer para lidar com arquivos recebidos
const upload = multer({ storage: multer.memoryStorage() });

// Rota para upload de múltiplas imagens
app.post("/upload", upload.array("files", 100), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nenhum arquivo foi enviado!" });
  }

  try {
    const uploadedFiles = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload_stream(
        { folder: "wedding-day" },
        (error, result) => {
          if (error) {
            throw new Error("Erro ao fazer upload");
          }
          uploadedFiles.push({ url: result.secure_url, filename: result.public_id });
        }
      );
      result.end(file.buffer);
    }

    res.status(200).redirect("/");
  } catch (error) {
    res.status(500).json({ error: "Erro ao fazer upload das imagens." });
  }
});

// Rota para obter as imagens já enviadas
app.get("/get-images", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "wedding-day", 
      max_results: 100,
    });

    const imageUrls = result.resources.map((image) => ({
      url: image.secure_url,
      filename: image.public_id,
    }));

    res.json({ urls: imageUrls });
  } catch (error) {
    console.error("Erro ao obter as imagens:", error);
    res.status(500).json({ error: "Erro ao obter as imagens." });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
