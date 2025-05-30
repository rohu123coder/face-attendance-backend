require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('_middleware/error-handler');
const routes = require('routes');
var xmlparser = require('express-xml-bodyparser');
require('dotenv').config()
var path = require('path');

// Import the handleSocketEvents function from SocketHandler.js
const handleSocketEvents = require('./websockets/SocketHandler');
const mSocket = require("socket.io");

app.use(express.static(path.join(__dirname, 'uploads')));
//app.use(express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit:  '10mb'}));

// the middleware will parse any incoming requests where if the request’s Content-Type header is set to text/xml.
app.use(xmlparser()); 
app.use(cors());

// Import the checkAuth middleware
const auth = require('_middleware/auth');
const payment = require('_middleware/payment');
const parentAuth = require('_middleware/parentAuth');
const superadmin = require('_middleware/superadmin');


// Define routes that should skip the checkAuth middleware
const publicRoutes = ['/api/login', '/api/parentlogin','/api/admin/login'];


// Apply the auth middleware to all other routes
app.use(async(req, res, next) => {
  // let splittedPath = req.path.split('/');
  // let apiPath = splittedPath[2];
  // console.log(!publicRoutes.includes(req.path) && apiPath !== 'parentapp')
  // const adminPathCheck = !publicRoutes.includes(req.path) && apiPath !== 'parentapp'
  // const parentRoutesCheck = !publicRoutes.includes(req.path) && apiPath === 'parentapp'

  if(!publicRoutes.includes(req.path)){
    console.log('inside non public routes')
    console.log(req.path)
    let splittedPath = req.path.split('/');
    let apiPath = splittedPath[2];
    console.log('api path: ' + apiPath)

    if(apiPath === 'admin'){
      console.log('Checking for super middlewares')
      superadmin(req, res, next);
    }
    else if(apiPath === 'parentapp'){ // check for parent middlewares
      console.log('Checking for parent middlewares')
      parentAuth(req, res, next);
    }
    else if(apiPath !== 'parentapp'){ // check for admin middlewares
      console.log('Checking for admin middlewares')
       auth(req, res, next);
    } 
  }
  else {
    next();
  }
});

// Apply the payment to all other routes
app.use(async(req, res, next) => {
  const isPublicRoute = publicRoutes.includes(req.path);
  console.log(req.path)
  let splittedPath = req.path.split('/');
  let apiPath = splittedPath[2];
  console.log('api path: ' + apiPath)

  let isSuperAdminRoute = (apiPath === 'admin')

  console.log('isNotPublicRoute: ' + isPublicRoute)
  console.log('isNotsuperadmin: ' + isSuperAdminRoute)
  console.log('condition: ' +( isPublicRoute || isSuperAdminRoute))

  if(!(isPublicRoute || isSuperAdminRoute)){
    console.log('Checking for payment middlewares')
    await payment(req, res, next);
  } else {
    next();
  } 
});

// api routes
app.use('/api', routes);

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 5000;
const server = app.listen(port, () => console.log('Server listening on port ' + port));

// Socket.IO integration
const io = mSocket(server);
handleSocketEvents(io);