const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const axios = require('axios');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'secreto';

app.use(cors());
app.use(express.json());


// Conexão com o banco de dados PostgreSQL
const client = new Client({
  connectionString: 'postgres://pipeguard:kg2od1Ym78w8PXgr4XAjF6CEMosPfe47@dpg-cp0op4njbltc73e12nqg-a.oregon-postgres.render.com/monitoramento_a2ud',
  ssl: {
    rejectUnauthorized: false
  }
});
client.connect()
  .then(() => {
    console.log('Conectado ao banco de dados PostgreSQL');
  })
  .catch(err => {
    console.error('Erro na conexão com o banco de dados PostgreSQL', err);
  });

  const createTableIfNotExists = async (client) => {
    try {
      if (!client._connected) {
        await client.connect();
      }
      await client.query(`
        CREATE TABLE IF NOT EXISTS incidents (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          leak BOOLEAN,
          severity VARCHAR(50),
          IdResolvedor VARCHAR(50),
          NomeResolvedor VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabela incidents verificada/criada com sucesso.');
    } catch (error) {
      console.error('Erro ao verificar/criar a tabela incidents:', error.message);
    }
  };

createTableIfNotExists(client);

client.connect()
  .then(() => console.log('Conectado ao PostgreSQL com sucesso'))
  .catch(err => console.error('Erro na conexão com PostgreSQL', err));

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
  client.query('SELECT * FROM incidents', (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(result.rows);
  });
});

app.post('/incidents', authenticateJWT, (req, res) => {
  const { title, description, leak, severity, IdResolvedor = 'admin', NomeResolvedor = 'admin' } = req.body;
  const sql = 'INSERT INTO incidents (title, description, leak, severity, IdResolvedor, NomeResolvedor) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
  const params = [title, description, leak, severity, IdResolvedor, NomeResolvedor];

  client.query(sql, params, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json(result.rows[0]);
  });
});

app.put('/incidents/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { title, description, leak, severity, IdResolvedor, NomeResolvedor } = req.body;
  const sql = 'UPDATE incidents SET title = $1, description = $2, leak = $3, severity = $4, IdResolvedor = COALESCE($5, IdResolvedor), NomeResolvedor = COALESCE($6, NomeResolvedor) WHERE id = $7 RETURNING *';
  const params = [title, description, leak, severity, IdResolvedor, NomeResolvedor, id];

  client.query(sql, params, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(result.rows[0]);
  });
});

app.delete('/incidents/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM incidents WHERE id = $1 RETURNING *';

  client.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Incident deleted successfully', deleted: result.rows[0] });
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
