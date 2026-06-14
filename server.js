const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const dbFile = path.join(__dirname, 'freshkart.db');
const db = new sqlite3.Database(dbFile, err => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

const products = [
  { name: 'Tomato', price: 40, image: 'Assests/Tomato.jpg' },
  { name: 'Beetroot', price: 50, image: 'Assests/beetroot.jpg' },
  { name: 'Brinjal', price: 35, image: 'Assests/Brinjal.webp' }
];

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      role TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      items TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/signup', (req, res) => {
  const { name, email, phone, address, role, password } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, role, and password are required.' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`INSERT INTO users (name, email, phone, address, role, password) VALUES (?, ?, ?, ?, ?, ?)`);

  stmt.run(name, email.toLowerCase(), phone || '', address || '', role, hashed, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'This email is already registered.' });
      }
      return res.status(500).json({ error: 'Could not save user.' });
    }

    res.status(201).json({ id: this.lastID, name, email: email.toLowerCase(), phone, address, role });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Login failed.' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (user.role !== role) {
      return res.status(403).json({ error: 'Role mismatch. Please choose the correct role.' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });
});

app.post('/api/orders', (req, res) => {
  const { email, items } = req.body;
  if (!email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Email and items are required to place an order.' });
  }

  const orderData = JSON.stringify(items);
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO orders (email, items, createdAt) VALUES (?, ?, ?)`);

  stmt.run(email.toLowerCase(), orderData, createdAt, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Could not save order.' });
    }
    res.status(201).json({ id: this.lastID, email: email.toLowerCase(), items, createdAt });
  });
});

app.get('/api/orders', (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  db.all('SELECT id, items, createdAt FROM orders WHERE email = ? ORDER BY createdAt DESC', [email.toLowerCase()], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Could not load orders.' });
    }
    const orders = rows.map(row => ({
      id: row.id,
      createdAt: row.createdAt,
      items: JSON.parse(row.items)
    }));
    res.json(orders);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FreshKartFarm server running on http://localhost:${PORT}`);
});
