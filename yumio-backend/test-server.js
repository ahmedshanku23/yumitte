
const express = require('express');

const app = express();

const server = app.listen(3001, '127.0.0.1', () => {
  console.log('TEST SERVER RUNNING ON PORT 3001');
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Express is working!'
  });
});
