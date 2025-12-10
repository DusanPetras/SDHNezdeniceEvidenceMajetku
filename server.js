
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Port je v Azure přidělen automaticky přes process.env.PORT
const port = process.env.PORT || 3000;

// Servírování statických souborů ze složky dist (kterou vytvoří vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Routing: Jakýkoliv jiný požadavek přesměruj na index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server běží na portu ${port}`);
});
