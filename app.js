const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'secreto'; 


app.use(cors());
app.use(express.json());


const db = new sqlite3.Database(':memory:');


db.serialize(() => {
  db.run(`CREATE TABLE incidents (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    leak TEXT,
    severity TEXT
  )`);
});


const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Falha na autenticação do token' });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }
};


app.post('/login', (req, res) => {
  const { username, password } = req.body;


  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign({ username }, SECRET_KEY);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});


app.get('/incidents', authenticateJWT, (req, res) => {

  db.all('SELECT * FROM incidents', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});


app.post('/incidents', authenticateJWT, (req, res) => {
  const { title, description, leak, severity } = req.body;
  const sql = 'INSERT INTO incidents (title, description, leak, severity) VALUES (?, ?, ?, ?)';
  const params = [title, description, leak, severity];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      id: this.lastID,
      title,
      description,
      leak,
      severity
    });
  });
});


app.put('/incidents/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { title, description, leak, severity } = req.body;
  const sql = 'UPDATE incidents SET title = ?, description = ?, leak = ?, severity = ? WHERE id = ?';
  const params = [title, description, leak, severity, id];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: parseInt(id),
      title,
      description,
      leak,
      severity
    });
  });
});

app.delete('/incidents/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM incidents WHERE id = ?';

  db.run(sql, id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Incident deleted successfully' });
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const os = require('os');


app.get('/server-info', (req, res) => {
  const serverInfo = {
    hostname: os.hostname(),
    uptime: os.uptime(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    loadAverage: os.loadavg(),
    cpus: os.cpus(),
    networkInterfaces: os.networkInterfaces()
   
  };

  res.json(serverInfo);
});