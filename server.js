require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('_middleware/error-handler');
const routes = require('routes');
var xmlparser = require('express-xml-bodyparser');
require('dotenv').config();
var path = require('path');

// Import the handleSocketEvents function from SocketHandler.js
const handleSocketEvents = require('./websockets/SocketHandler');
const mSocket = require("socket.io");

// Middleware files
const auth = require('_middleware/auth');
const payment = require('_middleware/payment');
const parentAuth = require('_middleware/parentAuth');
const superadmin = require('_middleware/superadmin');

// Make uploads public
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(xmlparser());
app.use(cors());

// ⬇️ Make /create-admin public BEFORE other middlewares
app.get('/create-admin', async (req, res) => {
  const bcrypt = require("bcryptjs");
  const db = require("./config/db");

  const hashedPassword = await bcrypt.hash("123456", 10);

  try {
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin", "admin@clickfox.com", hashedPassword, "admin"]
    );
    res.json({ message: "✅ Admin created successfully" });
  } catch (error) {
    res.status(500).json({ message: "❌ Admin creation failed", error });
  }
});

// ✅ Define public routes
const publicRoutes = ['/api/login', '/api/parentlogin', '/api/admin/login'];

// 🔒 Middleware logic
app.use(async (req, res, next) => {
  if (!publicRoutes.includes(req.path)) {
    console.log('inside non public routes');
    console.log(req.path);
    let splittedPath = req.path.split('/');
    let apiPath = splittedPath[2];
    console.log('api path: ' + apiPath);

    if (apiPath === 'admin') {
      console.log('Checking for super middlewares');
      superadmin(req, res, next);
    } else if (apiPath === 'parentapp') {
      console.log('Checking for parent middlewares');
      parentAuth(req, res, next);
    } else {
      console.log('Checking for admin middlewares');
      auth(req, res, next);
    }
  } else {
    next();
  }
});

// 💳 Payment middleware
app.use(async (req, res, next) => {
  const isPublicRoute = publicRoutes.includes(req.path);
  let splittedPath = req.path.split('/');
  let apiPath = splittedPath[2];
  let isSuperAdminRoute = (apiPath === 'admin');

  if (!(isPublicRoute || isSuperAdminRoute)) {
    console.log('Checking for payment middlewares');
    await payment(req, res, next);
  } else {
    next();
  }
});

// ⬇️ API Routes
app.use('/api', routes);

// Global error handler
app.use(errorHandler);

// Server Start
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 5000;
const server = app.listen(port, () => console.log('Server listening on port ' + port));

// ⬇️ WebSocket integration
const io = mSocket(server);
handleSocketEvents(io);
