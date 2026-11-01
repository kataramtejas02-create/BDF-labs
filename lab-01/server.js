const express = require('express');

const app = express();
const PORT = 3000;


app.get('/', (req, res) => {
  res.status(200).send('Welcome to lab 1: node.js and express server');
});


app.get('/about', (req, res) => {
  res.status(200).json({
    name: 'Tejas',
    section: 'Gen -AI 2A 304 S-024'
  });
});


app.get('/time', (req, res) => {
  res.status(200).json({
    currentDateTime: new Date()
  });
});


app.use((req, res) => {
  res.status(404).send('404 - Route not found');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
