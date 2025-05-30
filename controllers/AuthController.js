// controllers/AuthController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../models');
const { SECRET_KEY } = require('../config/config'); // Replace this with your secret key
var fs = require('fs');
const sharp = require('sharp');

class AuthController {

  static generateSessionIdentifier() {
    // You can use any method to generate a unique session identifier, such as UUID or random string generation.
    // For simplicity, we'll use a random 6-digit number in this example.
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async adminLogin(req, res) {
    console.log("authorizing superadmin")
    const { username, password, type } = req.body;

    if(!username || !password || !type) {
        return res.status(401).json({ error: 'Invalid params' });
    }

    let transaction = await db.sequelize.transaction();
    try {
      const user = await db.SuperAdmin.findOne({ where: { username } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
        const tokenExpiration = '1d';
        const tokenPayload = {
            id: user.id,
            role: user.role,
            type: 'superadmin',
            };
         // Create a JWT token with user ID and role as payload
        const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: tokenExpiration });
        // Store the token in the 'token' field of the Users table
        await user.update({ token });
        await transaction.commit();

        res.json({ type: 'superadmin', token});
    
    }catch(err) {
        await transaction.rollback();
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }

  }

  static async login(req, res) {
    console.log("authorizing")
    const { username, password, type } = req.body;
    // const type = req.query.type; // Get the 'type' query parameter

    if(!username || !password || !type) {
        return res.status(401).json({ error: 'Invalid params' });
    }


    let transaction = await db.sequelize.transaction();
    try {
    
      const user = await db.User.findOne({ where: { username } });
      console.log(user?.entity_logo)

      var logo_string = null;

      if(user.entity_logo && fs.existsSync(user.entity_logo)){
        var imageData = fs.readFileSync(user.entity_logo)
        if(imageData){
          const thumbnailData = await sharp(imageData,{ failOnError: false }).resize({ width: 100, height: 100 }).toBuffer();
          logo_string = Buffer.from(thumbnailData).toString('base64');
        }
      }

      if (!user) {
        console.log('No user')
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log('Invalid Password')
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate a new session identifier for this login
      const sessionIdentifier = AuthController.generateSessionIdentifier();

      // Check the 'type' query parameter and store the token accordingly
      if (type === 'admin') {
        const tokenExpiration = '1y';
        const tokenPayload = {
            id: user.admin_id,
            role: user.role,
            type: 'admin',
            };
         // Create a JWT token with user ID and role as payload
        const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: tokenExpiration });
        // Store the token in the 'token' field of the Users table
        await user.update({ token });
        await transaction.commit();

        res.json({ type: 'admin', token ,user:{ name: user.name, email: user.email, username: user.username , entity: user.entity_name, logo: logo_string} });

      } else if (type === 'device') {

        const sessionCount = await db.UserSession.count({
            where: { admin_id: user.admin_id },
        });
        
        if (sessionCount >= user.max_logins) {
          console.log('Maximum allowed logins reached')
            return res.status(401).json({ error: 'Maximum allowed logins reached' });
        }

        // Create a JWT token with user ID and session identifier as payload
        const tokenPayload = {
          id: user.admin_id,
          sessionId: sessionIdentifier,
          role: user.role,
          type:'device'
        };

        const tokenExpiration = '1y';
        const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: tokenExpiration });

        await user.update({ auth_token_socket: token },{transaction});

        // Create a new session record in the UserSessions table
        await db.UserSession.create({ session_identifier: sessionIdentifier, admin_id: user.admin_id },{transaction});
        
        const data = {
          admin_id: user.id,
          email: user.email,
          mobile: user.mobile,
          name: user.name,
          role: user.role,
          status: user.status,
          entity: user.entity_name,
          logo: logo_string,
          token: user.auth_token_socket,
          username: user.username,
        };
  
        await transaction.commit();
        res.status(200).json({data});

      } else {
        console.log('Invalid type parameter')
        return res.status(400).json({  error: 'Invalid type parameter' });
      }

    } catch (error) {
        await transaction.rollback();
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  }


  static async logout(req, res) {

    const userId   = req.userId;
    const type = req.type;

    
    try {
      const user = await db.User.findOne({ where: { admin_id: userId } });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if(type == 'device'){
        const sessionId = req.sessionId;
        // Find the session record in the UserSessions table
        const session = await db.UserSessions.findOne({ where: { admin_id:userId, session_identifier:sessionId } });
        if (!session) {
          return res.status(404).json({  error: 'Session not found' });
        }
        // Delete the session record from the UserSessions table
        await session.destroy();
      }

      res.json({ message: 'Logout successful' });

    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }


  // static async parentLogin(req, res) {
  //   console.log('parent login')
  //   const { username, password } = req.body;

  //   if(!username || !password ) {
  //       return res.status(401).json({ error: 'Invalid params' });
  //   }

  //   const transaction = await db.sequelize.transaction();

  //   try {
  //     const parent = await db.Parent.findOne({ where: { username } });

  //     if (!parent) {
  //       return res.status(401).json({ error: 'Invalid credentials' });
  //     }

  //     const isPasswordValid = await bcrypt.compare(password, parent.password);

  //     if (!isPasswordValid) {
  //       return res.status(401).json({ error: 'Invalid credentials' });
  //     }

  //       const tokenExpiration = '1y';
  //       const tokenPayload = {
  //           id: parent.id,
  //           admin_id:parent.admin_id
  //         };

  //        // Create a JWT token with parent ID and role as payload
  //       const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: tokenExpiration });
  //       // Store the token in the 'token' field of the Users table
  //       await parent.update({ auth_token:token });

  //       res.json({  token });
      
  //   } catch (error) {
  //       await transaction.rollback();
  //       console.error('Error during login:', error);
  //       res.status(500).json({ error: 'Internal server error' });
  //   }
  // }

  static async parentLogin(req, res) {
    console.log('parent login')
    const { username, password } = req.body;

    console.log(username)

    if(!username || !password ) {
        return res.status(401).json({ error: 'Invalid params' });
    }

    const transaction = await db.sequelize.transaction();

    try {
      const parent = await db.Parent.findOne({ where: { username } });
      //const parent = await db.Parent.findAll({ where: { username : username } });
      //return res.status(401).json({ error: 'Invalid credentials' });

      console.log(parent)
      if (!parent) {
        console.log("Couldn't find'")
        return res.status(401).json({ error: 'Invalid credentials' });
      }
     

      const isPasswordValid = await bcrypt.compare(password, parent.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

        const tokenExpiration = '1y';
        const tokenPayload = {
            id: parent.id,
            admin_id:parent.admin_id
          };

         // Create a JWT token with parent ID and role as payload
        const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: tokenExpiration });
        // Store the token in the 'token' field of the Users table
        await parent.update({ auth_token:token });

        let parentData = {
          name: parent.name,
          phone: parent.phone,
          email: parent.email,
          username: parent.username
        }

        const user = await db.User.findByPk(parent.admin_id);
        if (!user) {
          return res.status(404).json({ error: 'user not found' });
        }
  
        console.log(user?.entity_logo)
        let logo_string = null
        if (user.entity_logo) {
          fs.readFile(user.entity_logo, async (err, imageData) => {
            if (!err && imageData) {
              const thumbnailData = await sharp(imageData,{ failOnError: false }).resize({ width: 100, height: 100 }).toBuffer();
              logo_string = Buffer.from(thumbnailData).toString('base64');
        
              const adminData = {
                entity: user.entity_name,
                logo: logo_string,
              };
        
              console.log("adminData", adminData);
        
              res.json({ token, data: { user: parentData, admin: adminData } });
            } else {
              console.error("Error reading image:", err);
            }
          });
        } else {
          const adminData = {
            entity: user.entity_name,
            logo: logo_string,
          };
          console.log("adminData", adminData);
          res.json({ token, data: { user: parentData, admin: adminData } });
        }
              
    } catch (error) {
        await transaction.rollback();
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  }

}

module.exports = AuthController;
