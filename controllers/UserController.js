const db = require('../models');
const multer = require('multer');
const path = require('path');
var fs = require('fs');
const bcrypt = require('bcrypt');

// Create a new user
exports.createUser = async (req, res) => {
  console.log('Creating user')
  const transaction = await db.sequelize.transaction();
  try {

    const fileFilter = (req, file, cb) => {
      if (file.fieldname === "student_image") { // if uploading resume
        if (
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/jpg' ||
          file.mimetype === 'image/jpeg'
        ) { // check file type to be jpg, png, or jpeg
          cb(null, true);
        } else {
          cb(null, false); // else fails
        }
      } else { // else uploading image
        if (
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/jpg' ||
          file.mimetype === 'image/jpeg'
        ) { // check file type to be png, jpeg, or jpg
          cb(null, true);
        } else {
          cb(null, false); // else fails
        }
      }
    };

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {

        console.log(req.body.name);
        console.log("values", file);

        const uploadDir = path.join(`uploads`, `\profiles`);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        console.log("upload path", uploadDir)
        cb(null, uploadDir);
      },

      // By default, multer removes file extensions so let's add them back
      filename: function (req, file, cb) {
         const entityName = req.body.entity_name;
        // Extract the first word of entityName
        const entityNameWords = entityName.split(" ");
        const firstWord = entityNameWords[0];

        cb(null, firstWord + (Math.floor(Math.random() * 10000) + 1) + path.extname(file.originalname));
      }
    });

    let upload = multer({ storage: storage, fileFilter: fileFilter }).single('user_image');

    upload(req, res, async function (err) {

      const files = req.file
      console.log("files", files)

      if (req.fileValidationError) {
        return res.send(req.fileValidationError);
      }
      
      else if (err instanceof multer.MulterError) {
        console.log(err.message)
        return res.send(401, err);
      }
      else if (err) {
        return res.send(401, err);
      }

       // Check if the email or username already exists in the database
      const existingUser = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { email: req.body.email },
            // { username: req.body.username },
          ],
        },
      });

      if (existingUser) {
        await transaction.rollback();
        console.log("Email or username already exists");
          if (req.file && req.file.path) {
            fs.unlink(req.file.path, (unlinkErr) => {
              if (unlinkErr) console.error('Error while removing uploaded file:', unlinkErr);   
            });
          } 
        return res.status(400).json({ error: 'Email or username already exists' });
      }


      const userData = { ...req.body };
      if(req.file){
        userData.entity_logo = req.file.path;
      }

      const entityName = req.body.entity_name;
      const mobile = req.body.mobile;

      // Extract the first word of entityName
      const entityNameWords = entityName.split(" ");
      const firstWord = entityNameWords[0];

      // Extract the first 4 digits of the mobile number
      const first4Digits = mobile.slice(0, 4);

      // Create the password
      const password = `${firstWord}@${first4Digits}#`;

      console.log(password);

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
      userData.password = hashedPassword;
      userData.role = 'admin';
      userData.username = req.body.email;
    // // Create the new user
    // const newUser = await db.User.create({
    //   name: req.body.name,
    //   entity_name: req.body.entity_name,
    //   email: req.body.email,
    //   mobile: req.body.mobile,
    //   student_limit:req.body.student_limit,
    //   staff_limit:req.body.staff_limit,
    //   max_logins:req.body.max_logins,
    //   username: req.body.email,
    //   password: hashedPassword,
    //   status: req.body.status || true, // Default to true if not provided
    //   role: "admin",
    //   isLoggedIn: false, // Default to false for new user
    // }, { transaction: transaction });

    try{
      const user = await db.User.create(userData, { transaction });

      const subscription = await db.Subscription.create({
        start_date: req.body.start_subscription, // Set your desired start date
        end_date: req.body.end_subscription, // Set your desired end date
        admin_id: user.admin_id,
        payment_status:'paid'
      }, { transaction: transaction });
  
      // Create entry in 'sessions' table
      const session = await db.Session.create({
        start_date: req.body.start_session, // Set your desired start date
        end_date: req.body.end_session, // Set your desired end date
        admin_id: user.admin_id,
      }, { transaction: transaction });
  
      // Commit the transaction
      await transaction.commit();
  
      // Return the created user
      res.status(201).json(user);
    }catch(err){
      console.log("err",err.message);
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error while removing uploaded file:', unlinkErr);   
          });
        } 
      res.status(500).json({ error: err.message });
    }
    
    }); 
  } catch (err) {
    await transaction.rollback();
        // console.log("err",err.message);
        // if (req.file && req.file.path) {
        //   fs.unlink(req.file.path, (unlinkErr) => {
        //     if (unlinkErr) console.error('Error while removing uploaded file:', unlinkErr);   
        //   });
        // } 
    res.status(500).json({ error: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (user) {
      // Check if the email or username already exists in the database
      const existingUser = await db.User.findOne({
        where: {
          [db.Sequelize.Op.and]: [
            {
              [db.Sequelize.Op.or]: [
                { email: req.body.email },
                { username: req.body.username },
              ],
            },
            { id: { [db.Sequelize.Op.ne]: req.params.id } }, // Exclude the current user's ID
          ],
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email or username already exists' });
      }

      // Update the user data
      await user.update(req.body);
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.activateUsers = async (req, res) => {

  res.json({ message: 'User deleted successfully' });

}

exports.getUsersByFilter = async (req, res) => {
  res.json({ message: 'hello'});
}

// student counts
exports.getSchoolCounts = async (req, res) => {
  try {
    // Retrieve the adminId from the request (assuming it's available)
    const adminId = req.userId;

    // Use Sequelize's count method to count the number of students with the specified admin_id
    const studentCount = await db.Student.count({
      where: { admin_id: adminId, pass_status: null }
    });

    const staffCount = await db.Staff.count({
      where: { admin_id: adminId, status: 'active' }
    });

    // Send the count as a JSON response
    res.json({ studentCount: studentCount, staffCount: staffCount });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
