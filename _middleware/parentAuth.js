const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/config'); // Replace this with your secret key
const db = require('../models');

module.exports = parentAuth =  (req, res, next) => {
  try {
  // Get the token from the request headers or query parameters
  let token = req.headers.authorization
  if (!token) {
    return res.status(419).json({ message: 'Authorization token not provided' });
  }
  //console.log(token)

  token = req.headers.authorization.split(' ')[1];
  //console.log(token)
  // Verify the token
  jwt.verify(token, SECRET_KEY, (err, decodedToken) => {
    if (err) {
      console.log(err);
      return res.status(419).json({ error: 'Invalid or expired token' });
    }

    // Extract the userId from the decoded token
    const parentId = decodedToken.id;
    const adminId = decodedToken.admin_id;

    // Attach the parentId,adminId to the request object for use in other parts of the application
    req.parentId = parentId;
    req.userId = adminId;
    
    console.log(req.body);
    // Proceed to the next middleware or route handler
    //console.log('proceeding to middleware');
    next();
    
  });
}catch(err){
  res.status(500).json({ code:"parent auth", error: err.message });

}
};
