const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const os = require('os');

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
    severity TEXT,
    IdResolvedor INTEGER DEFAULT 'admin',
    NomeResolvedor TEXT DEFAULT 'admin'
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

// Middleware para registrar atividades e enviar logs para a API de monitoramento
app.use((req, res, next) => {
    const logMessage = `Request made: ${req.method} ${req.url}`;
    axios.post('https://api-monitoramento-1.onrender.com/log', { message: logMessage })
        .then(response => {
            console.log('Log sent to monitoring API:', response.data);
            next();
        })
        .catch(error => {
            console.error('Error sending log to monitoring API:', error.message);
            next();
        });
});

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
  const { title, description, leak, severity, IdResolvedor = 'admin', NomeResolvedor = 'admin' } = req.body;
  const sql = 'INSERT INTO incidents (title, description, leak, severity, IdResolvedor, NomeResolvedor) VALUES (?, ?, ?, ?, ?, ?)';
  const params = [title, description, leak, severity, IdResolvedor, NomeResolvedor];

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
      severity,
      IdResolvedor,
      NomeResolvedor
    });
  });
});

app.put('/incidents/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { title, description, leak, severity, IdResolvedor, NomeResolvedor } = req.body;
  const sql = 'UPDATE incidents SET title = ?, description = ?, leak = ?, severity = ?, IdResolvedor = COALESCE(?, IdResolvedor), NomeResolvedor = COALESCE(?, NomeResolvedor) WHERE id = ?';
  const params = [title, description, leak, severity, IdResolvedor, NomeResolvedor, id];

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
      severity,
      IdResolvedor,
      NomeResolvedor
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

app.get('/status', (req, res) => {
  const status = {
      serverStatus: 'Online'
  };
  res.json(status);
});

app.get('/cpu', (req, res) => {
  const cpuUsage = {
      cpuUsage: os.loadavg()[0]
  };
  res.json(cpuUsage);
});

app.get('/memory', (req, res) => {
  const memoryUsage = {
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
  };
  res.json(memoryUsage);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
