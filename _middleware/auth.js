const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/config'); // Replace this with your secret key

const db = require('../models');

module.exports = auth =  (req, res, next) => {
  console.log("inside admin middleware")
  // Get the token from the request headers or query parameters
  let btoken = req.headers.authorization
  if (!btoken) {
    return res.status(419).json({ message: 'Authorization token not provided' });
  }
  console.log("token ",btoken)

  let token = req.headers.authorization.split(' ')[1];
  console.log("splitted token" ,token)

  if(!token)
    token = btoken

    console.log("formateed token" ,token)
  // Verify the token

  jwt.verify(token, SECRET_KEY, async (err, decodedToken) => {
    if (err) {
      return res.status(419).json({ message: 'Invalid or expired token' });
    }

    console.log(decodedToken?.id)
    console.log(decodedToken?.role)
    console.log(decodedToken?.type)

    // Extract the userId from the decoded token
    const userId = decodedToken.id;

    let currentDate = new Date();
    const session = await db.Session.findOne({
      attributes: ['id'],
      where: {
        admin_id: userId,
        start_date: { [db.Sequelize.Op.lte]: currentDate },
        end_date: { [db.Sequelize.Op.gte]: currentDate },
      },
    });

    if (session) {
     console.log(session.id)
     req.sessionId = session.id
    } else {
      return res.status(419).json({ message: 'no session data found' });
    }

    //const userId = 1
    // Attach the userId to the request object for use in other parts of the application
    req.userId = userId;

    // write a code to 
    // Proceed to the next middleware or route handler
    next();
  });

  
};
