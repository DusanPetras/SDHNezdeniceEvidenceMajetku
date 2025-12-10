
const express = require('express');
const path = require('path');
const app = express();

// Port je v Azure přidělen automaticky přes process.env.PORT
const port = process.env.PORT || 3000;

// Servírování statických souborů ze složky dist (kterou vytvoří vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Routing: Jakýkoliv jiný požadavek přesměruj na index.html
// To zajistí, že funguje obnovení stránky (F5) na podstránkách
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server běží na portu ${port}`);
});
