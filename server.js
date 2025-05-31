require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const xmlparser = require('express-xml-bodyparser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// WebSocket setup
const handleSocketEvents = require('./websockets/SocketHandler');
const mSocket = require("socket.io");

// Middleware
const errorHandler = require('_middleware/error-handler');
const auth = require('_middleware/auth');
const payment = require('_middleware/payment');
const parentAuth = require('_middleware/parentAuth');
const superadmin = require('_middleware/superadmin');

// Routes
const routes = require('routes');

// Make uploads folder public
app.use(express.static(path.join(__dirname, 'uploads')));

// Global middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(xmlparser());

// ✅ PUBLIC ROUTE: Create default admin (only for first time setup)
app.get('/create-admin', async (req, res) => {
  const bcrypt = require("bcryptjs");
  const db = require("./config/db");

  try {
    const hashedPassword = await bcrypt.hash("123456", 10);
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin", "admin@clickfox.com", hashedPassword, "admin"]
    );
    res.json({ message: "✅ Admin created successfully" });
  } catch (error) {
    res.status(500).json({ message: "❌ Admin creation failed", error });
  }
});

// Public routes
const publicRoutes = ['/api/login', '/api/parentlogin', '/api/admin/login'];

// 🔐 Role-based Middleware Handler
app.use(async (req, res, next) => {
  const isPublic = publicRoutes.includes(req.path);
  if (!isPublic) {
    const pathParts = req.path.split('/');
    const apiPath = pathParts[2];

    if (apiPath === 'admin') {
      return superadmin(req, res, next);
    } else if (apiPath === 'parentapp') {
      return parentAuth(req, res, next);
    } else {
      return auth(req, res, next);
    }
  } else {
    next();
  }
});

// 💳 Payment Middleware (only for non-admin private routes)
app.use(async (req, res, next) => {
  const pathParts = req.path.split('/');
  const apiPath = pathParts[2];
  const isPublic = publicRoutes.includes(req.path);

  if (!(isPublic || apiPath === 'admin')) {
    return payment(req, res, next);
  } else {
    next();
  }
});

// API Routes
app.use('/api', routes);

// Global error handler
app.use(errorHandler);

// Start Server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 5000;
const server = app.listen(port, () => {
  console.log('🚀 Server listening on port ' + port);
});

// 🔌 Initialize WebSocket
const io = mSocket(server);
handleSocketEvents(io);