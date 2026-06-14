const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'freshkartsecret';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

async function columnExists(table, column) {
  const rows = await query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  return rows.length > 0;
}

async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50),
      address TEXT,
      role VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price INT NOT NULL,
      quantity INT DEFAULT 0,
      image VARCHAR(255) NOT NULL,
      ownerId INT NULL
    )
  `);

  if (!(await columnExists('products', 'quantity'))) {
    await query('ALTER TABLE products ADD COLUMN quantity INT DEFAULT 0');
  }
  if (!(await columnExists('products', 'ownerId'))) {
    await query('ALTER TABLE products ADD COLUMN ownerId INT NULL');
  }

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      email VARCHAR(255) NOT NULL,
      items TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  const farmers = await query("SELECT id, email FROM users WHERE role = 'Farmer'");
  const farmerIds = {};
  for (const farmer of farmers) {
    farmerIds[farmer.email.toLowerCase()] = farmer.id;
  }

  const sampleFarmers = [
    { name: 'Ravi Sharma', email: 'ravi@freshkart.com', phone: '9876501234', address: 'North Village', role: 'Farmer', password: 'farmer123' },
    { name: 'Meera Singh', email: 'meera@freshkart.com', phone: '9876512345', address: 'East Orchard', role: 'Farmer', password: 'farmer123' },
    { name: 'Amit Patel', email: 'amit@freshkart.com', phone: '9876523456', address: 'Greenfield Farm', role: 'Farmer', password: 'farmer123' },
    { name: 'Sita Kumari', email: 'sita@freshkart.com', phone: '9876534567', address: 'Sunrise Acres', role: 'Farmer', password: 'farmer123' },
    { name: 'Vikram Reddy', email: 'vikram@freshkart.com', phone: '9876545678', address: 'Harvest Hills', role: 'Farmer', password: 'farmer123' },
    { name: 'Sree Kumar', email: 'sree@freshkart.com', phone: '9876556789', address: 'Riverbank Fields', role: 'Farmer', password: 'farmer123' },
    { name: 'Subha Rani', email: 'subha@freshkart.com', phone: '9876567890', address: 'Lotus Farm', role: 'Farmer', password: 'farmer123' }
  ];

  for (const farmer of sampleFarmers) {
    const email = farmer.email.toLowerCase();
    if (!farmerIds[email]) {
      const hashedPassword = bcrypt.hashSync(farmer.password, 10);
      const result = await query(
        'INSERT INTO users (name, email, phone, address, role, password) VALUES (?, ?, ?, ?, ?, ?)',
        [farmer.name, email, farmer.phone, farmer.address, farmer.role, hashedPassword]
      );
      farmerIds[email] = result.insertId;
    }
  }

  const customerIds = {};
  const customers = await query("SELECT id, email FROM users WHERE role = 'Customer'");
  for (const customer of customers) {
    customerIds[customer.email.toLowerCase()] = customer.id;
  }

  const sampleCustomers = [
    { name: 'Anjali Verma', email: 'anjali@freshkart.com', phone: '9876601234', address: 'West Park', role: 'Customer', password: 'customer123' },
    { name: 'Karan Joshi', email: 'karan@freshkart.com', phone: '9876612345', address: 'Central Avenue', role: 'Customer', password: 'customer123' },
    { name: 'Priya Nair', email: 'priya@freshkart.com', phone: '9876623456', address: 'Lakeview Colony', role: 'Customer', password: 'customer123' },
    { name: 'Rahul Iyer', email: 'rahul@freshkart.com', phone: '9876634567', address: 'Sunset Boulevard', role: 'Customer', password: 'customer123' },
    { name: 'Neha Gupta', email: 'neha@freshkart.com', phone: '9876645678', address: 'Maple Street', role: 'Customer', password: 'customer123' }
  ];

  for (const customer of sampleCustomers) {
    const email = customer.email.toLowerCase();
    if (!customerIds[email]) {
      const hashedPassword = bcrypt.hashSync(customer.password, 10);
      const result = await query(
        'INSERT INTO users (name, email, phone, address, role, password) VALUES (?, ?, ?, ?, ?, ?)',
        [customer.name, email, customer.phone, customer.address, customer.role, hashedPassword]
      );
      customerIds[email] = result.insertId;
    }
  }

  const adminIds = {};
  const admins = await query("SELECT id, email FROM users WHERE role = 'Admin'");
  for (const admin of admins) {
    adminIds[admin.email.toLowerCase()] = admin.id;
  }

  const sampleAdmins = [
    { name: 'Admin User', email: 'admin@freshkart.com', phone: '9876701234', address: 'Head Office', role: 'Admin', password: 'admin123' }
  ];

  for (const admin of sampleAdmins) {
    const email = admin.email.toLowerCase();
    if (!adminIds[email]) {
      const hashedPassword = bcrypt.hashSync(admin.password, 10);
      const result = await query(
        'INSERT INTO users (name, email, phone, address, role, password) VALUES (?, ?, ?, ?, ?, ?)',
        [admin.name, email, admin.phone, admin.address, admin.role, hashedPassword]
      );
      adminIds[email] = result.insertId;
    }
  }

  const existingProducts = await query('SELECT name, ownerId FROM products');
  const existingProductKeys = new Set(existingProducts.map(product => `${product.name}|${product.ownerId}`));

  const sampleProducts = [
    { name: 'Organic Tomatoes', price: 45, quantity: 100, image: 'Assests/Tomato.jpg', ownerEmail: 'ravi@freshkart.com' },
    { name: 'Fresh Beetroot', price: 55, quantity: 80, image: 'Assests/beetroot.jpg', ownerEmail: 'meera@freshkart.com' },
    { name: 'Purple Brinjal', price: 38, quantity: 60, image: 'Assests/Brinjal.webp', ownerEmail: 'amit@freshkart.com' },
    { name: 'Green Chillies', price: 120, quantity: 70, image: 'Assests/chilli.jpg', ownerEmail: 'sita@freshkart.com' },
    { name: 'Crisp Cucumbers', price: 30, quantity: 90, image: 'Assests/cucumber.jpg', ownerEmail: 'vikram@freshkart.com' },
    { name: 'Sweet Corn', price: 65, quantity: 50, image: 'Assests/corn.jpg', ownerEmail: 'ravi@freshkart.com' },
    { name: 'Fresh Carrots', price: 48, quantity: 75, image: 'Assests/carrots.jpg', ownerEmail: 'meera@freshkart.com' },
    { name: 'Round Radish', price: 35, quantity: 60, image: 'Assests/radish.jpg', ownerEmail: 'amit@freshkart.com' },
    { name: 'Local Spinach', price: 25, quantity: 100, image: 'Assests/spinach.jpg', ownerEmail: 'sita@freshkart.com' },
    { name: 'Farm Fresh Onions', price: 42, quantity: 95, image: 'Assests/onion.jpg', ownerEmail: 'vikram@freshkart.com' },
    { name: 'Sweet Mangoes', price: 90, quantity: 40, image: 'Assests/mango.jpg', ownerEmail: 'sree@freshkart.com' },
    { name: 'Sree Special Ginger', price: 80, quantity: 55, image: 'Assests/ginger.jpg', ownerEmail: 'sree@freshkart.com' },
    { name: 'Subha Premium Potatoes', price: 28, quantity: 120, image: 'Assests/potato.jpg', ownerEmail: 'subha@freshkart.com' },
    { name: 'Subha Fresh Beans', price: 70, quantity: 65, image: 'Assests/beans.jpg', ownerEmail: 'subha@freshkart.com' }
  ];

  for (const product of sampleProducts) {
    const ownerId = farmerIds[product.ownerEmail.toLowerCase()] || null;
    const key = `${product.name}|${ownerId}`;
    if (!existingProductKeys.has(key)) {
      await query(
        'INSERT INTO products (name, price, quantity, image, ownerId) VALUES (?, ?, ?, ?, ?)',
        [product.name, product.price, product.quantity, product.image, ownerId]
      );
      existingProductKeys.add(key);
    }
  }
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '6h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

app.get('/api/products', async (req, res) => {
  try {
    const products = await query(`
      SELECT p.id, p.name, p.price, p.quantity, p.image, p.ownerId,
             COALESCE(u.name, 'Marketplace') AS ownerName
      FROM products p
      LEFT JOIN users u ON p.ownerId = u.id
    `);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load products.' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'Farmer') {
      return res.status(403).json({ error: 'Only admins or farmers may add products.' });
    }

    const { name, price, image, quantity } = req.body;
    const qty = Number(quantity || 1);
    if (!name || !price || !image || qty < 1) {
      return res.status(400).json({ error: 'Name, price, image, and quantity are required.' });
    }

    const result = await query(
      'INSERT INTO products (name, price, quantity, image, ownerId) VALUES (?, ?, ?, ?, ?)',
      [name, price, qty, image, req.user.id]
    );

    res.status(201).json({ id: result.insertId, name, price, quantity: qty, image, ownerId: req.user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not add product.' });
  }
});

app.get('/api/products/mine', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Farmer' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only farmers or admins may view this data.' });
    }

    const products = await query('SELECT id, name, price, quantity, image FROM products WHERE ownerId = ?', [req.user.id]);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load your products.' });
  }
});

app.get('/api/orders/farmer', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Farmer') {
      return res.status(403).json({ error: 'Only farmers may view this data.' });
    }

    const owned = await query('SELECT id FROM products WHERE ownerId = ?', [req.user.id]);
    const ownedIds = new Set(owned.map(row => row.id));
    const rows = await query('SELECT id, email, items, createdAt FROM orders ORDER BY createdAt DESC');

    const orders = rows
      .map(row => ({
        id: row.id,
        email: row.email,
        createdAt: row.createdAt,
        items: JSON.parse(row.items)
      }))
      .filter(order => order.items.some(item => ownedIds.has(item.id)));

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load farmer orders.' });
  }
});

app.get('/api/farmer/metrics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Farmer') {
      return res.status(403).json({ error: 'Only farmers may view this data.' });
    }

    const productsRow = await query('SELECT COUNT(*) AS count, COALESCE(SUM(quantity), 0) AS stock FROM products WHERE ownerId = ?', [req.user.id]);
    const orders = await query('SELECT id, items FROM orders');
    const owned = await query('SELECT id FROM products WHERE ownerId = ?', [req.user.id]);
    const ownedIds = new Set(owned.map(row => row.id));
    const orderCount = orders
      .map(order => ({ items: JSON.parse(order.items) }))
      .filter(order => order.items.some(item => ownedIds.has(item.id))).length;

    res.json({
      products: productsRow[0].count,
      stock: productsRow[0].stock,
      orders: orderCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load farmer metrics.' });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone, address, role, password } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, role, and password are required.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, phone, address, role, password) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email.toLowerCase(), phone || '', address || '', role, hashedPassword]
    );

    const user = { id: result.insertId, name, email: email.toLowerCase(), phone, address, role };
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This email is already registered.' });
    }
    res.status(500).json({ error: 'Could not save user.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = users[0];
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

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Customer') {
      return res.status(403).json({ error: 'Only customers may place orders.' });
    }

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required.' });
    }

    const orderData = JSON.stringify(items);
    const createdAt = new Date();
    const result = await query(
      'INSERT INTO orders (userId, email, items, createdAt) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.email, orderData, createdAt]
    );

    res.status(201).json({ id: result.insertId, email: req.user.email, items, createdAt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not save order.' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'Admin') {
      rows = await query('SELECT id, email, items, createdAt FROM orders ORDER BY createdAt DESC');
    } else {
      rows = await query('SELECT id, email, items, createdAt FROM orders WHERE email = ? ORDER BY createdAt DESC', [req.user.email]);
    }

    const orders = rows.map(row => ({
      id: row.id,
      email: row.email,
      createdAt: row.createdAt,
      items: JSON.parse(row.items)
    }));
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

app.get('/api/admin/metrics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const customerRow = await query('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['Customer']);
    const farmerRow = await query('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['Farmer']);
    const orderRow = await query('SELECT COUNT(*) AS count FROM orders');
    const productRow = await query('SELECT COUNT(*) AS count FROM products');

    res.json({
      customers: customerRow[0].count,
      farmers: farmerRow[0].count,
      orders: orderRow[0].count,
      products: productRow[0].count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load metrics.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FreshKartFarm server running on http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });